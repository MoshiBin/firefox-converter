# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-06-14

### Added

- Convert **fractional values**, e.g. `3/16"`, `1 1/2 in`, `2-3/8 in`, and `5'10 1/2"`.
- Convert **hyphenated notation** where a number and unit are joined by a hyphen, e.g. `8-ft` and `3/16-in`.
- Unit-test suite for the conversion engine, runnable with `npm test` (Node's built-in test runner, no dependencies) and on every push/PR.

### Fixed

- Ranges such as `5-10 ft` now read the trailing value as `10 ft` instead of `-10 ft`.

### Notes

- Compounds like `3-in-1` are intentionally **not** treated as a measurement.

## [1.0.1] - 2026-05-02

- First public release on [Firefox Add-ons](https://addons.mozilla.org/en-US/developers/addon/unit-converter4/).
- In-line tooltip conversions for weights, distances, temperatures, and currency (with live exchange rates).

[1.0.2]: https://github.com/MoshiBin/firefox-converter/releases/tag/v1.0.2
[1.0.1]: https://github.com/MoshiBin/firefox-converter/releases/tag/v1.0.1
