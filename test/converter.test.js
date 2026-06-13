"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const UnitConverter = require("../converter.js");

// --- Helpers ---------------------------------------------------------------

// Parse with no currency support unless a test opts in.
function parse(text, rates, target) {
  return UnitConverter.parse(text, rates || null, target || "EUR");
}

// Find the result whose matched source text equals `original`.
function find(results, original) {
  return results.find((r) => r.original === original);
}

// Strip thousands separators so we can compare formatted output numerically.
function num(value) {
  return parseFloat(String(value).replace(/,/g, ""));
}

// Assert that `text` produces a result matching `original`, whose first
// conversion is `unit` with a value within tolerance of `expected`.
function assertConversion(text, original, unit, expected, tol = 0.01) {
  const r = find(parse(text), original);
  assert.ok(r, `expected ${JSON.stringify(text)} to match "${original}"`);
  const c = r.conversions.find((c) => c.unit === unit);
  assert.ok(c, `expected a conversion to ${unit} for "${original}"`);
  assert.ok(
    Math.abs(num(c.value) - expected) <= tol,
    `expected ${original} -> ~${expected} ${unit}, got ${c.value} ${unit}`
  );
}

// --- Existing behavior (regression guards) ---------------------------------

test("weight: word unit with space", () => {
  assertConversion("5 kg", "5 kg", "lb", 11.0231);
});

test("weight: pounds abbreviation", () => {
  assertConversion("100 lbs", "100 lbs", "kg", 45.3592);
});

test("distance: word unit with space", () => {
  assertConversion("10 miles", "10 miles", "km", 16.0934, 0.01);
});

test("distance: standalone inches via double-quote", () => {
  assertConversion('12"', '12"', "cm", 30.48);
});

test("distance: feet-and-inches via quotes", () => {
  assertConversion(`5'10"`, `5'10"`, "cm", 177.8, 0.1);
});

test("distance: thousands separator", () => {
  assertConversion("1,234.56 km", "1,234.56 km", "mi", 767.12, 0.1);
});

test("temperature: fahrenheit to celsius", () => {
  const r = find(parse("72°F"), "72°F");
  assert.ok(r);
  assert.equal(r.conversions[0].unit, "°C");
  assert.ok(Math.abs(num(r.conversions[0].value) - 22.222) < 0.01);
});

test("currency: symbol prefix uses target rate", () => {
  const rates = { USD: 1, EUR: 0.9 };
  const r = find(parse("$10", rates, "EUR"), "$10");
  assert.ok(r);
  assert.equal(r.conversions[0].unit, "EUR");
  assert.ok(Math.abs(num(r.conversions[0].value) - 9) < 0.001);
});

// --- New behavior: hyphenated notation -------------------------------------

test("hyphenated unit: 8-ft", () => {
  assertConversion("8-ft", "8-ft", "m", 2.4384);
});

test("hyphenated unit: 3/16-in (fraction + hyphen)", () => {
  assertConversion("3/16-in", "3/16-in", "cm", 0.476, 0.001);
});

test("user report: '8-ft, 3/16-in' converts both", () => {
  const results = parse("8-ft, 3/16-in");
  const ft = find(results, "8-ft");
  const inch = find(results, "3/16-in");
  assert.ok(ft, "should match 8-ft");
  assert.ok(inch, "should match 3/16-in");
  assert.ok(Math.abs(num(ft.conversions.find((c) => c.unit === "m").value) - 2.4384) < 0.01);
  assert.ok(Math.abs(num(inch.conversions.find((c) => c.unit === "cm").value) - 0.476) < 0.001);
});

// --- New behavior: fractions and mixed numbers -----------------------------

test("simple fraction with word unit: 3/16 in", () => {
  assertConversion("3/16 in", "3/16 in", "cm", 0.476, 0.001);
});

test("mixed number with space: 1 1/2 in", () => {
  assertConversion("1 1/2 in", "1 1/2 in", "cm", 3.81);
});

test("mixed number with hyphen: 2-3/8 in", () => {
  assertConversion("2-3/8 in", "2-3/8 in", "cm", 6.0325);
});

test("fractional inches via double-quote: 3/16\"", () => {
  assertConversion('3/16"', '3/16"', "cm", 0.476, 0.001);
});

test("feet with fractional inches: 5'10 1/2\"", () => {
  // 5 ft + 10.5 in = 70.5 in = 179.07 cm
  assertConversion(`5'10 1/2"`, `5'10 1/2"`, "cm", 179.07, 0.1);
});

// --- Guards against false positives ----------------------------------------

test("compound like '3-in-1' is NOT treated as inches", () => {
  const results = parse("3-in-1 shampoo");
  assert.equal(results.length, 0, "should not convert 3-in-1");
});

test("hyphenated adjective '8-ft-long' still converts 8-ft", () => {
  assertConversion("8-ft-long board", "8-ft", "m", 2.4384);
});

test("range '5-10 ft' reads 10 ft (positive, not -10)", () => {
  const r = find(parse("5-10 ft"), "10 ft");
  assert.ok(r, "should match the '10 ft' end of the range");
  const m = r.conversions.find((c) => c.unit === "m");
  assert.ok(m && num(m.value) > 0, "value should be positive");
  assert.ok(Math.abs(num(m.value) - 3.048) < 0.01);
});

test("genuine negative still works: -40 m", () => {
  const r = find(parse("-40 m"), "-40 m");
  assert.ok(r);
  const ft = r.conversions.find((c) => c.unit === "ft");
  assert.ok(ft && num(ft.value) < 0);
});
