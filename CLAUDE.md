# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Firefox extension (Manifest V2, WebExtensions API). Selecting text on any page that
contains a measurement shows a tooltip with the converted value(s). Supports weight,
distance, temperature, and live-rate currency conversion. No build step — the source
files are loaded directly by Firefox.

## Commands

```bash
npm test                            # run the converter unit tests (Node built-in test runner, no deps)
node --test test/converter.test.js  # run a single test file
web-ext lint --warnings-as-errors   # lint the extension (matches CI)
web-ext build                       # build the .zip into web-ext-artifacts/
```

To run a single test by name, use the runner's filter: `node --test --test-name-pattern="feet-inches" `.

Load for manual testing: Firefox → `about:debugging#/runtime/this-firefox` → **Load Temporary
Add-on…** → pick `manifest.json`.

## Architecture

Four scripts, loaded independently by the manifest (no bundler, no imports between browser files):

- **converter.js** — the conversion engine, the heart of the project. A single IIFE exposing
  `UnitConverter.parse(text, currencyRates, targetCurrency)`. It is **dual-target**: a CommonJS
  `module.exports` at the bottom lets the test suite `require` it under Node, while the same file
  runs untouched in the browser (where `module` is undefined). It has no DOM or `browser.*`
  dependencies — keep it that way so it stays unit-testable.
- **content.js** — injected into all pages. Listens for `mouseup`, runs the selected text through
  `UnitConverter.parse`, and renders/positions the tooltip. Reads `targetCurrency` and
  `currencyRates` from `browser.storage.local` and watches `storage.onChanged` for updates.
  Builds tooltip DOM node-by-node (no `innerHTML` — avoids a web-ext lint warning).
- **background.js** — fetches USD-based exchange rates from open.er-api.com, caches them in
  `storage.local` (`currencyRates`, `ratesLastUpdated`), refreshes via a 6-hour `alarms` timer
  and on stale startup, and answers the popup's `{action:"fetchRates"}` message.
- **popup/** — settings UI. Writes `targetCurrency` to `storage.local` and triggers manual rate
  refreshes via a message to the background script.

`storage.local` is the only channel between the three contexts. Keys: `targetCurrency`,
`currencyRates`, `ratesLastUpdated`.

### How parsing works (converter.js)

`parse` runs a sequence of independent regex passes over the text, each pushing
`{ original, conversions: [{ value, unit }] }` results:

1. Temperature (shows both other scales at once).
2. Feet-inches compound (`5'10"`), then standalone inches (`12"`), then standalone feet (`6'`).
3. Word/abbreviation units for weight and distance (`5 kg`, `8-ft`, `100 lbs`).
4. Currency: symbol prefix (`$12.50`) and ISO-code suffix (`50 USD`).

Key conventions to preserve when editing:

- **De-duplication is positional.** Later passes (standalone inches/feet, word distances) skip a
  match if its index falls inside an `original` already captured by an earlier pass — this is how
  `5'10"` avoids also matching as `10"`. If you add or reorder passes, keep this `alreadyCovered`
  check intact.
- **`NUM`** is the shared numeric-token regex source string. It matches plain integers/decimals,
  thousands separators (both `1,234.56` and European `1.234,56`), simple fractions (`3/16`), and
  mixed numbers (`1 1/2`, `2-3/8`). `parseNumber` is the matching parser — change them together.
- All conversions route through a canonical base unit (grams / meters / kelvin) via the per-
  category `toBase`/`fromBase`/`labels` tables and the `canonicalWeight`/`canonicalDistance` maps.
  Adding a unit means touching `toBase`, the canonical map, and (if it's a new canonical target)
  `fromBase`, `labels`, and the `*_TARGETS` table.
- The `measureRegex` lookarounds (`(?<!\d)` … `(?!-\d)`) deliberately exclude ranges like
  `5-10 ft` and compounds like `3-in-1` from being misread.

When you change parsing or formatting behavior, add/adjust cases in `test/converter.test.js`.

## Releasing

Version lives in **both** `manifest.json` and `package.json` — keep them in sync. Releases are
driven by GitHub Actions (`.github/workflows/tag-release.yml` bumps + tags + releases;
`publish-amo.yml` submits to AMO). The release workflow's version bump is idempotent, so bumping
in a PR is fine. Update `CHANGELOG.md` for each release.
