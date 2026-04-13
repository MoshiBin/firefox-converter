// Popup script: manages settings UI

(function () {
  "use strict";

  const CURRENCIES = [
    { code: "USD", name: "US Dollar" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British Pound" },
    { code: "JPY", name: "Japanese Yen" },
    { code: "AUD", name: "Australian Dollar" },
    { code: "CAD", name: "Canadian Dollar" },
    { code: "CHF", name: "Swiss Franc" },
    { code: "CNY", name: "Chinese Yuan" },
    { code: "INR", name: "Indian Rupee" },
    { code: "KRW", name: "South Korean Won" },
    { code: "SEK", name: "Swedish Krona" },
    { code: "NOK", name: "Norwegian Krone" },
    { code: "DKK", name: "Danish Krone" },
    { code: "NZD", name: "New Zealand Dollar" },
    { code: "SGD", name: "Singapore Dollar" },
    { code: "HKD", name: "Hong Kong Dollar" },
    { code: "MXN", name: "Mexican Peso" },
    { code: "BRL", name: "Brazilian Real" },
    { code: "ZAR", name: "South African Rand" },
    { code: "TRY", name: "Turkish Lira" },
    { code: "RUB", name: "Russian Ruble" },
    { code: "PLN", name: "Polish Złoty" },
    { code: "CZK", name: "Czech Koruna" },
    { code: "HUF", name: "Hungarian Forint" },
    { code: "ILS", name: "Israeli Shekel" },
    { code: "THB", name: "Thai Baht" },
    { code: "MYR", name: "Malaysian Ringgit" },
    { code: "PHP", name: "Philippine Peso" },
    { code: "IDR", name: "Indonesian Rupiah" },
    { code: "TWD", name: "Taiwan Dollar" },
    { code: "AED", name: "UAE Dirham" },
    { code: "SAR", name: "Saudi Riyal" },
    { code: "EGP", name: "Egyptian Pound" },
    { code: "NGN", name: "Nigerian Naira" },
    { code: "PKR", name: "Pakistani Rupee" },
  ];

  const currencySelect = document.getElementById("currency");
  const statusEl = document.getElementById("status");
  const rateInfoEl = document.getElementById("rate-info");
  const refreshBtn = document.getElementById("refresh");

  // Populate currency dropdown
  CURRENCIES.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.code;
    opt.textContent = `${c.code} — ${c.name}`;
    currencySelect.appendChild(opt);
  });

  // Load saved settings
  browser.storage.local.get(["targetCurrency", "ratesLastUpdated"]).then((data) => {
    if (data.targetCurrency) {
      currencySelect.value = data.targetCurrency;
    }
    if (data.ratesLastUpdated) {
      const date = new Date(data.ratesLastUpdated);
      rateInfoEl.textContent = `Rates last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } else {
      rateInfoEl.textContent = "No exchange rates loaded yet. Click refresh.";
    }
  });

  // Save on change
  currencySelect.addEventListener("change", () => {
    const value = currencySelect.value;
    browser.storage.local.set({ targetCurrency: value }).then(() => {
      statusEl.textContent = `Saved: ${value}`;
      setTimeout(() => { statusEl.textContent = ""; }, 2000);
    });
  });

  // Refresh rates
  refreshBtn.addEventListener("click", () => {
    statusEl.textContent = "Fetching rates…";
    browser.runtime.sendMessage({ action: "fetchRates" }).then((response) => {
      if (response && response.success) {
        statusEl.textContent = "Rates updated!";
        const date = new Date();
        rateInfoEl.textContent = `Rates last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      } else {
        statusEl.textContent = "Failed to fetch rates.";
      }
      setTimeout(() => { statusEl.textContent = ""; }, 3000);
    }).catch(() => {
      statusEl.textContent = "Error fetching rates.";
      setTimeout(() => { statusEl.textContent = ""; }, 3000);
    });
  });
})();
