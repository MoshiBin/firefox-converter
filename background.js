// Background script: fetches and caches currency exchange rates

(function () {
  "use strict";

  // Free API: https://open.er-api.com/v6/latest/USD
  const RATE_API = "https://open.er-api.com/v6/latest/USD";

  async function fetchRates() {
    try {
      const response = await fetch(RATE_API);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.result === "success" && data.rates) {
        await browser.storage.local.set({
          currencyRates: data.rates,
          ratesLastUpdated: Date.now(),
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Unit Converter: Failed to fetch rates", err);
      return false;
    }
  }

  // Fetch rates on install and every 6 hours
  browser.runtime.onInstalled.addListener(() => {
    fetchRates();
  });

  browser.alarms.create("refreshRates", { periodInMinutes: 360 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "refreshRates") {
      fetchRates();
    }
  });

  // Also fetch on startup if stale (older than 6 hours)
  browser.storage.local.get("ratesLastUpdated").then((data) => {
    const sixHours = 6 * 60 * 60 * 1000;
    if (!data.ratesLastUpdated || Date.now() - data.ratesLastUpdated > sixHours) {
      fetchRates();
    }
  });

  // Listen for manual refresh from popup
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "fetchRates") {
      return fetchRates().then((success) => ({ success }));
    }
  });
})();
