# Unit Converter — Firefox Extension

Select any text on a webpage containing a measurement and instantly see it converted in a tooltip. No clicking, no copy-pasting into a converter site.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Firefox](https://img.shields.io/badge/Firefox-142%2B-orange.svg)

## Features

- **Weights** — `kg`, `g`, `mg`, `lb`, `lbs`, `oz`, `stone`, `ton`, `tonne`
- **Distances** — `km`, `m`, `cm`, `mm`, `miles`, `yards`, `feet`/`ft`/`'`, `inches`/`in`/`"` (including compound `5'10"` notation)
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

## Releasing

Releases are automated via GitHub Actions. To ship a new version:

1. Go to **Actions → Tag & Release → Run workflow**
2. Enter the version number (e.g. `1.2.0`) and optional release notes
3. The workflow will:
   - Bump `manifest.json`
   - Create a git tag and GitHub Release
   - Submit the new version to AMO for review

To retrigger a publish for an existing tag: **Actions → Publish to AMO → Run workflow**, enter the tag name.

## Project structure

```
├── manifest.json       # Extension manifest (MV2)
├── converter.js        # Unit conversion engine
├── content.js          # Text selection listener + tooltip
├── tooltip.css         # Tooltip styles
├── background.js       # Currency rate fetching (auto-refreshes every 6h)
├── amo-metadata.json   # AMO submission metadata (license, category)
├── popup/
│   ├── popup.html      # Settings UI
│   └── popup.js        # Settings logic
├── icons/              # PNG + SVG icons at 16/32/48/96px
└── .github/workflows/
    ├── build.yml        # Lint + build on every push/PR
    ├── tag-release.yml  # Manual workflow: bump version, tag, release
    └── publish-amo.yml  # Publish to AMO on release
```

## License

[MIT](LICENSE) © Moshi Bin
