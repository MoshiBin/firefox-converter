# Unit Converter — Firefox Extension

Select any text on a webpage containing a measurement and instantly see it converted in a tooltip. No clicking, no copy-pasting into a converter site.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Firefox](https://img.shields.io/badge/Firefox-142%2B-orange.svg)

## Features

- **Weights** — `kg`, `g`, `mg`, `lb`, `lbs`, `oz`, `stone`, `ton`, `tonne`
- **Distances** — `km`, `m`, `cm`, `mm`, `miles`, `yards`, `feet`/`ft`/`'`, `inches`/`in`/`"` — including compound `5'10"` notation, **fractional values** (`3/16"`, `1 1/2 in`, `2-3/8 in`), and **hyphenated notation** (`8-ft`, `3/16-in`)
- **Temperatures** — `°F`, `°C`, `K` — shows both other scales simultaneously
- **Currency** — symbol prefixes (`$`, `£`, `€`, `¥`, …) and ISO codes (`USD`, `EUR`, `GBP`, …) — converts to your chosen target currency using live exchange rates

Just select text and the tooltip appears above the selection automatically.

## Installation

Install from the [Firefox Add-ons store](https://addons.mozilla.org/en-US/developers/addon/unit-converter4/).

Or load it manually for development — see [Development](#development) below.

## Usage

1. Select any text on a webpage that contains a measurement, e.g.:
   - `72°F` → **22.222 °C | 295.372 K**
   - `6'2"` → **187.96 cm | 1.88 m**
   - `180 lbs` → **81.647 kg**
   - `8-ft` → **2.438 m**
   - `3/16-in` → **0.476 cm**
   - `$49.99` → **46.23 EUR** *(using live rates)*

2. A tooltip appears above the selection with the converted value(s).

3. Click the toolbar icon to choose your **target currency** and refresh exchange rates.

## Settings

Click the extension icon in the Firefox toolbar to open the settings popup:

- **Target Currency** — choose from 35+ currencies; conversions update immediately
- **Refresh Exchange Rates** — fetches the latest rates from [open.er-api.com](https://open.er-api.com). Rates are also refreshed automatically every 6 hours.

## Development

### Prerequisites

- Firefox 142+
- Node.js (for `web-ext`)

```bash
npm install -g web-ext
```

### Load as a temporary extension

```bash
git clone https://github.com/MoshiBin/firefox-converter.git
cd firefox-converter
```

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` from the cloned folder

### Lint & build

```bash
web-ext lint --warnings-as-errors
web-ext build
```

The built `.zip` is written to `web-ext-artifacts/`.

### Tests

The conversion engine has a unit-test suite that runs on Node's built-in test runner (no dependencies):

```bash
npm test
```

Tests live in `test/converter.test.js` and cover the supported notations and their edge cases.

## Releasing

As you work, jot user-facing changes under the `## [Unreleased]` heading in [`CHANGELOG.md`](CHANGELOG.md). When it's time to ship, pick **whichever** path fits — both tag `vX.Y.Z`, create a GitHub Release whose body is the `[Unreleased]` + `[X.Y.Z]` changelog sections, and submit to AMO for review (you pick the semver number; nothing is inferred for you):

**Manual — "release current main as X.Y.Z":**

1. **Actions → Release → Run workflow**, enter the version.

   It bumps `manifest.json`/`package.json` to that version, folds `[Unreleased]` into a dated `## [X.Y.Z]` changelog section (committing the result to `main`), then tags and releases. No need to touch the version by hand first.

**Automatic — on merge:**

1. Bump `version` in [`manifest.json`](manifest.json) and add a `## [X.Y.Z] - YYYY-MM-DD` changelog section in your PR.
2. Merge to `main` — the release fires automatically.

Both paths are idempotent (a no-op if the tag already exists) and refuse to release a version that isn't greater than the latest tag.

Once Mozilla approves the listed version, the scheduled **Attach approved XPIs** workflow downloads the signed `.xpi` and attaches it to the GitHub Release automatically (it polls hourly; you can also trigger it manually). To attach a specific older build by hand, use **Actions → Attach signed XPI to release**.

To retrigger a publish for an existing tag: **Actions → Publish to AMO → Run workflow**, enter the tag name.

> **Note:** The user-facing "What's New" notes on the Add-ons listing are set
> separately in the AMO Developer Hub when the new version is submitted.

## Project structure

```
├── manifest.json       # Extension manifest (MV2)
├── converter.js        # Unit conversion engine
├── content.js          # Text selection listener + tooltip
├── tooltip.css         # Tooltip styles
├── background.js       # Currency rate fetching (auto-refreshes every 6h)
├── amo-metadata.json   # AMO submission metadata (license, category)
├── package.json        # npm metadata + `npm test` script
├── CHANGELOG.md        # Notable changes per release ([Unreleased] feeds release notes)
├── test/
│   └── converter.test.js  # Unit tests for the conversion engine
├── popup/
│   ├── popup.html      # Settings UI
│   └── popup.js        # Settings logic
├── icons/              # PNG + SVG icons at 16/32/48/96px
└── .github/
    ├── scripts/
    │   └── changelog.py          # Builds release notes / stamps [Unreleased] on release
    └── workflows/
        ├── build.yml             # Lint + build on every push/PR
        ├── release.yml           # Tag + release (manual dispatch, or auto on manifest bump)
        ├── publish-amo.yml       # Build, sign, and submit the release to AMO
        ├── poll-amo-approval.yml # Hourly: attach signed XPI once Mozilla approves
        ├── attach-xpi.yml        # Manual fallback: attach a signed XPI by tag + AMO id
        └── sign-unlisted.yml     # Manual: sign an unlisted build for local install
```

## License

[MIT](LICENSE) © Moshi Bin
