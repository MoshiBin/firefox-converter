// Content script: listens for text selection and shows conversion tooltip

(function () {
  "use strict";

  let tooltip = null;
  let currencyRates = null;
  let targetCurrency = "EUR"; // default

  // Load settings
  browser.storage.local.get(["targetCurrency", "currencyRates"]).then((data) => {
    if (data.targetCurrency) targetCurrency = data.targetCurrency;
    if (data.currencyRates) currencyRates = data.currencyRates;
  });

  // Listen for settings changes
  browser.storage.onChanged.addListener((changes) => {
    if (changes.targetCurrency) targetCurrency = changes.targetCurrency.newValue;
    if (changes.currencyRates) currencyRates = changes.currencyRates.newValue;
  });

  function createTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement("div");
    tooltip.id = "unit-converter-tooltip";
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.classList.remove("visible");
    }
  }

  function showTooltip(x, y, results) {
    const el = createTooltip();

    // Build HTML
    const html = results
      .map((r) => {
        const convText = r.conversions
          .map((c) => `<span class="uc-result">${c.value} ${c.unit}</span>`)
          .join(`<span class="uc-sep">|</span>`);
        return `<div class="uc-row"><span class="uc-original">${escapeHtml(r.original)}</span> → ${convText}</div>`;
      })
      .join("");

    el.innerHTML = html;

    // Position: above the selection, centered
    document.body.appendChild(el); // ensure in DOM
    el.style.left = "0px";
    el.style.top = "0px";
    el.classList.add("visible");

    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let left = x - rect.width / 2 + scrollX;
    let top = y - rect.height - 10 + scrollY;

    // Keep on screen
    if (left < scrollX + 4) left = scrollX + 4;
    if (left + rect.width > scrollX + window.innerWidth - 4) {
      left = scrollX + window.innerWidth - rect.width - 4;
    }
    if (top < scrollY + 4) {
      top = y + 20 + scrollY; // show below instead
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Listen for mouseup to detect selection
  document.addEventListener("mouseup", (e) => {
    // Small delay to let selection finalize
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";

      if (!text || text.length > 500) {
        hideTooltip();
        return;
      }

      const results = UnitConverter.parse(text, currencyRates, targetCurrency);

      if (results.length === 0) {
        hideTooltip();
        return;
      }

      // Get position from selection range
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      showTooltip(x, y, results);
    }, 10);
  });

  // Hide on click elsewhere or scroll
  document.addEventListener("mousedown", (e) => {
    if (tooltip && !tooltip.contains(e.target)) {
      hideTooltip();
    }
  });

  document.addEventListener("keydown", () => {
    hideTooltip();
  });
})();
