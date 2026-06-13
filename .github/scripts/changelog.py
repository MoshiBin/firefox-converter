#!/usr/bin/env python3
"""CHANGELOG.md helpers for the release workflow.

Usage:
  changelog.py notes <version>
      Print release notes for <version>: the body of the [Unreleased] section
      followed by the body of the [<version>] section (either may be empty).

  changelog.py stamp <version> <date> <repo>
      Fold the [Unreleased] section into a "## [<version>] - <date>" section,
      leaving [Unreleased] empty, and ensure a link reference for <version>.
      <repo> is "owner/name". Rewrites CHANGELOG.md in place.

The changelog is expected to follow Keep a Changelog conventions: an intro
preamble, "## [label]" section headings (Unreleased and X.Y.Z versions), and an
optional trailing block of "[label]: url" link-reference definitions.
"""
import re
import sys

PATH = "CHANGELOG.md"
LINKREF = re.compile(r"^\[([^\]]+)\]:\s*(.+)$")
HEADING = re.compile(r"^##\s+\[([^\]]+)\]")


def load():
    with open(PATH, encoding="utf-8") as f:
        return f.read()


def parse(text):
    """Split into (preamble_lines, sections, linkrefs).

    sections: list of [label, heading_line, body_lines] in file order.
    linkrefs: list of (label, raw_line) in file order.
    """
    body_lines, linkrefs = [], []
    for line in text.split("\n"):
        m = LINKREF.match(line)
        if m:
            linkrefs.append((m.group(1), line))
        else:
            body_lines.append(line)

    preamble, sections, cur = [], [], None
    for line in body_lines:
        m = HEADING.match(line)
        if m:
            cur = [m.group(1), line, []]
            sections.append(cur)
        elif cur is None:
            preamble.append(line)
        else:
            cur[2].append(line)
    return preamble, sections, linkrefs


def body_of(sections, label):
    for lbl, _, body in sections:
        if lbl.lower() == label.lower():
            return "\n".join(body).strip("\n")
    return ""


def cmd_notes(version):
    _, sections, _ = parse(load())
    parts = [body_of(sections, "Unreleased"), body_of(sections, version)]
    combined = "\n\n".join(p for p in parts if p.strip()).strip()
    sys.stdout.write(combined + "\n")


def cmd_stamp(version, date, repo):
    preamble, sections, linkrefs = parse(load())
    combined = "\n\n".join(
        p for p in (body_of(sections, "Unreleased"), body_of(sections, version))
        if p.strip()
    ).strip()

    out = ["\n".join(preamble).rstrip("\n"), "", "## [Unreleased]", "",
           f"## [{version}] - {date}", ""]
    if combined:
        out += [combined, ""]
    # Keep the remaining sections in order, dropping the two we just merged.
    for lbl, heading, body in sections:
        if lbl.lower() in ("unreleased", version.lower()):
            continue
        out.append(heading)
        b = "\n".join(body).strip("\n")
        if b:
            out += ["", b]
        out.append("")
    # Link references: add ours (newest-first) if missing, then the rest.
    refs = []
    if not any(lbl == version for lbl, _ in linkrefs):
        refs.append(f"[{version}]: https://github.com/{repo}/releases/tag/v{version}")
    refs += [line for _, line in linkrefs]
    if refs:
        out += ["\n".join(refs), ""]

    with open(PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(out).rstrip("\n") + "\n")


def main(argv):
    if len(argv) >= 3 and argv[1] == "notes":
        cmd_notes(argv[2])
    elif len(argv) >= 5 and argv[1] == "stamp":
        cmd_stamp(argv[2], argv[3], argv[4])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
