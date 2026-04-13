// Unit Converter Engine
// Parses text for measurements and returns converted values.

const UnitConverter = (() => {
  // --- Conversion tables ---
  // All conversions go through a canonical "base" unit per category,
  // then out to the target. Base units: grams, meters, kelvin.

  const WEIGHT = {
    // unit -> grams
    toBase: {
      mg: 0.001,
      g: 1,
      gram: 1,
      grams: 1,
      kg: 1000,
      kilogram: 1000,
      kilograms: 1000,
      oz: 28.3495,
      ounce: 28.3495,
      ounces: 28.3495,
      lb: 453.592,
      lbs: 453.592,
      pound: 453.592,
      pounds: 453.592,
      st: 6350.29,
      stone: 6350.29,
      stones: 6350.29,
      ton: 907185,          // US short ton
      tons: 907185,
      tonne: 1000000,       // metric tonne
      tonnes: 1000000,
    },
    // grams -> unit
    fromBase: {
      mg: 1000,
      g: 1,
      kg: 0.001,
      oz: 1 / 28.3495,
      lb: 1 / 453.592,
      st: 1 / 6350.29,
      ton: 1 / 907185,
      tonne: 1 / 1000000,
    },
    labels: {
      mg: "mg",
      g: "g",
      kg: "kg",
      oz: "oz",
      lb: "lb",
      st: "st",
      ton: "ton",
      tonne: "tonne",
    },
  };

  const DISTANCE = {
    // unit -> meters
    toBase: {
      mm: 0.001,
      millimeter: 0.001,
      millimeters: 0.001,
      millimetre: 0.001,
      millimetres: 0.001,
      cm: 0.01,
      centimeter: 0.01,
      centimeters: 0.01,
      centimetre: 0.01,
      centimetres: 0.01,
      m: 1,
      meter: 1,
      meters: 1,
      metre: 1,
      metres: 1,
      km: 1000,
      kilometer: 1000,
      kilometers: 1000,
      kilometre: 1000,
      kilometres: 1000,
      in: 0.0254,
      inch: 0.0254,
      inches: 0.0254,
      '"': 0.0254,
      ft: 0.3048,
      foot: 0.3048,
      feet: 0.3048,
      "'": 0.3048,
      yd: 0.9144,
      yard: 0.9144,
      yards: 0.9144,
      mi: 1609.34,
      mile: 1609.34,
      miles: 1609.34,
    },
    fromBase: {
      mm: 1000,
      cm: 100,
      m: 1,
      km: 0.001,
      in: 1 / 0.0254,
      ft: 1 / 0.3048,
      yd: 1 / 0.9144,
      mi: 1 / 1609.34,
    },
    labels: {
      mm: "mm",
      cm: "cm",
      m: "m",
      km: "km",
      in: "in",
      ft: "ft",
      yd: "yd",
      mi: "mi",
    },
  };

  // Mapping from parsed unit string to canonical key
  function canonicalWeight(unit) {
    const u = unit.toLowerCase();
    if (WEIGHT.toBase[u] !== undefined) {
      // Map to canonical key
      const canon = {
        mg: "mg", g: "g", gram: "g", grams: "g",
        kg: "kg", kilogram: "kg", kilograms: "kg",
        oz: "oz", ounce: "oz", ounces: "oz",
        lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
        st: "st", stone: "st", stones: "st",
        ton: "ton", tons: "ton",
        tonne: "tonne", tonnes: "tonne",
      };
      return canon[u] || null;
    }
    return null;
  }

  function canonicalDistance(unit) {
    const u = unit.toLowerCase();
    if (DISTANCE.toBase[u] !== undefined) {
      const canon = {
        mm: "mm", millimeter: "mm", millimeters: "mm", millimetre: "mm", millimetres: "mm",
        cm: "cm", centimeter: "cm", centimeters: "cm", centimetre: "cm", centimetres: "cm",
        m: "m", meter: "m", meters: "m", metre: "m", metres: "m",
        km: "km", kilometer: "km", kilometers: "km", kilometre: "km", kilometres: "km",
        in: "in", inch: "in", inches: "in", '"': "in",
        ft: "ft", foot: "ft", feet: "ft", "'": "ft",
        yd: "yd", yard: "yd", yards: "yd",
        mi: "mi", mile: "mi", miles: "mi",
      };
      return canon[u] || null;
    }
    return null;
  }

  // --- Preferred conversion targets ---
  // Imperial -> metric, metric -> imperial
  const WEIGHT_TARGETS = {
    mg: ["oz"],
    g: ["oz"],
    kg: ["lb"],
    oz: ["g"],
    lb: ["kg"],
    st: ["kg"],
    ton: ["tonne"],
    tonne: ["ton"],
  };

  const DISTANCE_TARGETS = {
    mm: ["in"],
    cm: ["in"],
    m: ["ft"],
    km: ["mi"],
    in: ["cm"],
    ft: ["m"],
    yd: ["m"],
    mi: ["km"],
  };

  // --- Temperature ---
  function convertTemp(value, fromUnit) {
    const u = fromUnit.toLowerCase().replace("°", "").trim();
    const results = [];

    if (u === "f" || u === "fahrenheit") {
      const c = (value - 32) * 5 / 9;
      const k = c + 273.15;
      results.push({ value: c, unit: "°C" });
      results.push({ value: k, unit: "K" });
    } else if (u === "c" || u === "celsius" || u === "centigrade") {
      const f = value * 9 / 5 + 32;
      const k = value + 273.15;
      results.push({ value: f, unit: "°F" });
      results.push({ value: k, unit: "K" });
    } else if (u === "k" || u === "kelvin") {
      const c = value - 273.15;
      const f = c * 9 / 5 + 32;
      results.push({ value: c, unit: "°C" });
      results.push({ value: f, unit: "°F" });
    }
    return results;
  }

  function isTempUnit(unit) {
    const u = unit.toLowerCase().replace("°", "").trim();
    return ["f", "c", "k", "fahrenheit", "celsius", "centigrade", "kelvin"].includes(u);
  }

  // --- Currency ---
  const CURRENCY_SYMBOLS = {
    "$": "USD",
    "£": "GBP",
    "€": "EUR",
    "¥": "JPY",
    "₹": "INR",
    "₩": "KRW",
    "₪": "ILS",
    "₫": "VND",
    "₱": "PHP",
    "฿": "THB",
    "₴": "UAH",
    "₸": "KZT",
    "₺": "TRY",
    "₼": "AZN",
    "₽": "RUB",
    "R$": "BRL",
    "kr": "SEK",     // also NOK, DKK — we default to SEK
    "zł": "PLN",
    "Kč": "CZK",
    "Ft": "HUF",
    "RM": "MYR",
    "лв": "BGN",
    "lei": "RON",
  };

  const CURRENCY_CODES = [
    "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "KRW",
    "SEK", "NOK", "DKK", "NZD", "SGD", "HKD", "MXN", "BRL", "ZAR", "TRY",
    "RUB", "PLN", "CZK", "HUF", "ILS", "THB", "MYR", "PHP", "IDR", "TWD",
    "ARS", "CLP", "COP", "PEN", "VND", "UAH", "KZT", "AZN", "GEL", "BGN",
    "RON", "HRK", "ISK", "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "EGP",
    "NGN", "KES", "GHS", "PKR", "BDT", "LKR",
  ];

  // --- Number parsing ---
  function parseNumber(str) {
    // Handle comma as thousands separator: "1,234.56" or "1,234"
    // Handle period as thousands separator: "1.234,56" (European)
    let s = str.trim();

    // European style: 1.234,56
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
      s = s.replace(/\./g, "").replace(",", ".");
    }
    // Standard: 1,234.56 or 1,234
    else if (/,/.test(s)) {
      s = s.replace(/,/g, "");
    }

    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  // --- Formatting ---
  function formatNumber(n) {
    if (Math.abs(n) >= 1000) {
      return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    }
    if (Math.abs(n) >= 100) return parseFloat(n.toFixed(2)).toString();
    if (Math.abs(n) >= 1) return parseFloat(n.toFixed(3)).toString();
    if (Math.abs(n) >= 0.01) return parseFloat(n.toFixed(4)).toString();
    return n.toExponential(2);
  }

  // --- Main parse function ---
  // Returns array of { original, conversions: [{ value, unit }] }
  function parse(text, currencyRates, targetCurrency) {
    const results = [];
    if (!text || text.trim().length === 0) return results;

    // Normalize whitespace
    const t = text.trim();

    // 1. Temperature patterns
    //    "72°F", "72 °F", "72 F", "72 fahrenheit", "-40°C"
    const tempRegex = /(-?\d[\d,.]*)[\s]*°?\s*(fahrenheit|celsius|centigrade|kelvin|[fckFCK])(?:\b|$)/gi;
    let match;
    while ((match = tempRegex.exec(t)) !== null) {
      const num = parseNumber(match[1]);
      if (num === null) continue;
      const unit = match[2];
      if (!isTempUnit(unit)) continue;
      const conversions = convertTemp(num, unit);
      if (conversions.length > 0) {
        results.push({
          original: match[0].trim(),
          conversions: conversions.map(c => ({
            value: formatNumber(c.value),
            unit: c.unit,
          })),
        });
      }
    }

    // 2. Distance with quote/double-quote: 5'10", 12", 6'
    //    Feet-inches combo: 5'10" or 5' 10"
    const feetInchRegex = /(\d[\d,.]*)\s*['′]\s*(\d[\d,.]*)\s*["″]?/g;
    while ((match = feetInchRegex.exec(t)) !== null) {
      const feet = parseNumber(match[1]);
      const inches = parseNumber(match[2]);
      if (feet === null || inches === null) continue;
      const totalMeters = feet * 0.3048 + inches * 0.0254;
      const cm = totalMeters * 100;
      results.push({
        original: match[0].trim(),
        conversions: [
          { value: formatNumber(cm), unit: "cm" },
          { value: formatNumber(totalMeters), unit: "m" },
        ],
      });
    }

    // Standalone inches with double quote: 12"
    const inchQuoteRegex = /(\d[\d,.]*)\s*["″]/g;
    while ((match = inchQuoteRegex.exec(t)) !== null) {
      // Skip if already matched as feet-inches combo
      const alreadyCovered = results.some(r => {
        const pos = t.indexOf(r.original);
        return pos !== -1 && match.index >= pos && match.index < pos + r.original.length;
      });
      if (alreadyCovered) continue;
      const num = parseNumber(match[1]);
      if (num === null) continue;
      const cm = num * 2.54;
      results.push({
        original: match[0].trim(),
        conversions: [{ value: formatNumber(cm), unit: "cm" }],
      });
    }

    // Standalone feet with single quote: 6'
    const feetQuoteRegex = /(\d[\d,.]*)\s*['′](?!\s*\d)/g;
    while ((match = feetQuoteRegex.exec(t)) !== null) {
      const alreadyCovered = results.some(r => {
        const pos = t.indexOf(r.original);
        return pos !== -1 && match.index >= pos && match.index < pos + r.original.length;
      });
      if (alreadyCovered) continue;
      const num = parseNumber(match[1]);
      if (num === null) continue;
      const m = num * 0.3048;
      results.push({
        original: match[0].trim(),
        conversions: [{ value: formatNumber(m), unit: "m" }],
      });
    }

    // 3. Weight and distance with word units
    //    "12 inches", "5.5 kg", "100 lbs"
    const unitWords = [
      // weights
      "mg", "g", "gram", "grams", "kg", "kilogram", "kilograms",
      "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds",
      "st", "stone", "stones", "ton", "tons", "tonne", "tonnes",
      // distances
      "mm", "millimeter", "millimeters", "millimetre", "millimetres",
      "cm", "centimeter", "centimeters", "centimetre", "centimetres",
      "m", "meter", "meters", "metre", "metres",
      "km", "kilometer", "kilometers", "kilometre", "kilometres",
      "in", "inch", "inches",
      "ft", "foot", "feet",
      "yd", "yard", "yards",
      "mi", "mile", "miles",
    ];
    const unitPattern = unitWords.join("|");
    const measureRegex = new RegExp(
      `(-?\\d[\\d,.]*)\\s*(${unitPattern})(?:\\b|$)`, "gi"
    );
    while ((match = measureRegex.exec(t)) !== null) {
      const num = parseNumber(match[1]);
      if (num === null) continue;
      const unitStr = match[2].toLowerCase();

      // Check weight
      const cw = canonicalWeight(unitStr);
      if (cw) {
        const baseVal = num * WEIGHT.toBase[unitStr];
        const targets = WEIGHT_TARGETS[cw] || [];
        const conversions = targets.map(tgt => ({
          value: formatNumber(baseVal * WEIGHT.fromBase[tgt]),
          unit: WEIGHT.labels[tgt],
        }));
        if (conversions.length > 0) {
          results.push({ original: match[0].trim(), conversions });
        }
        continue;
      }

      // Check distance
      const cd = canonicalDistance(unitStr);
      if (cd) {
        // Skip if already covered by quote patterns
        const alreadyCovered = results.some(r => {
          const pos = t.indexOf(r.original);
          return pos !== -1 && match.index >= pos && match.index < pos + r.original.length;
        });
        if (alreadyCovered) continue;

        const baseVal = num * DISTANCE.toBase[unitStr];
        const targets = DISTANCE_TARGETS[cd] || [];
        const conversions = targets.map(tgt => ({
          value: formatNumber(baseVal * DISTANCE.fromBase[tgt]),
          unit: DISTANCE.labels[tgt],
        }));
        if (conversions.length > 0) {
          results.push({ original: match[0].trim(), conversions });
        }
      }
    }

    // 4. Currency: "$12.50", "€100", "50 USD", "£1,234.56"
    if (currencyRates && targetCurrency) {
      // Symbol prefix: $12.50
      const symbolPrefixRegex = /([€£$¥₹₩₪₫₱฿₴₸₺₼₽]|R\$|kr|zł|Kč|Ft|RM|лв|lei)\s*(-?\d[\d,.]*)/g;
      while ((match = symbolPrefixRegex.exec(t)) !== null) {
        const symbol = match[1];
        const num = parseNumber(match[2]);
        if (num === null) continue;
        const fromCurrency = CURRENCY_SYMBOLS[symbol];
        if (!fromCurrency || fromCurrency === targetCurrency) continue;
        const converted = convertCurrency(num, fromCurrency, targetCurrency, currencyRates);
        if (converted !== null) {
          results.push({
            original: match[0].trim(),
            conversions: [{ value: formatNumber(converted), unit: targetCurrency }],
          });
        }
      }

      // Code suffix: "50 USD", "100 EUR"
      const codeSuffixRegex = new RegExp(
        `(-?\\d[\\d,.]*)\\s*(${CURRENCY_CODES.join("|")})(?:\\b|$)`, "g"
      );
      while ((match = codeSuffixRegex.exec(t)) !== null) {
        const num = parseNumber(match[1]);
        const fromCurrency = match[2].toUpperCase();
        if (num === null) continue;
        if (fromCurrency === targetCurrency) continue;
        const converted = convertCurrency(num, fromCurrency, targetCurrency, currencyRates);
        if (converted !== null) {
          results.push({
            original: match[0].trim(),
            conversions: [{ value: formatNumber(converted), unit: targetCurrency }],
          });
        }
      }
    }

    return results;
  }

  function convertCurrency(amount, from, to, rates) {
    // rates are relative to a base (e.g. USD)
    if (!rates[from] || !rates[to]) return null;
    const inBase = amount / rates[from];
    return inBase * rates[to];
  }

  return { parse, CURRENCY_CODES };
})();
