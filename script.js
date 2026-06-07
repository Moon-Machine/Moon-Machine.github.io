// Royalty estimator: a logarithmic Monthly Listeners slider drives the big
// "$X /mo left behind" stat, a small listener readout, and the two royalty
// figures — all count-animated up/down as the slider moves.
(function () {
  "use strict";

  var slider = document.getElementById("est-slider");
  var listenersEl = document.getElementById("est-listeners");
  var totalEl = document.getElementById("est-total");
  if (!slider || !listenersEl || !totalEl) return;

  var amounts = Array.prototype.slice.call(
    document.querySelectorAll(".estimate-row__amount")
  );
  // The big stat mirrors whichever row is flagged data-total (Global Royalties).
  var totalRate = 0;
  amounts.forEach(function (el) {
    if (el.hasAttribute("data-total")) totalRate = parseFloat(el.getAttribute("data-rate")) || 0;
  });

  var L_MIN = 1000, L_MAX = 2000000;
  var LN_MIN = Math.log(L_MIN), LN_SPAN = Math.log(L_MAX) - LN_MIN;
  var MAX_POS = parseFloat(slider.max) || 1000;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var usd = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0
  });

  // log position (0..MAX_POS) → listeners, snapped to 3 significant figures
  function posToListeners(pos) {
    var raw = Math.exp(LN_MIN + (pos / MAX_POS) * LN_SPAN);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)) - 2);
    return Math.max(L_MIN, Math.round(raw / mag) * mag);
  }

  function fmtCount(n) { return Math.round(n).toLocaleString("en-US"); }
  // Whole dollars — cents read weak on a headline stat.
  function fmtMoney(n) { return usd.format(Math.round(n)); }

  // Each animated element tracks its own current value + frame handle so a new
  // drag mid-tween simply retargets from where it is.
  function animate(el, to, render) {
    var from = el._cur != null ? el._cur : to;
    if (el._raf) cancelAnimationFrame(el._raf);
    if (reduce) { el._cur = to; el.textContent = render(to); return; }
    var dur = 400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      var val = from + (to - from) * eased;
      el._cur = val;
      el.textContent = render(val);
      if (t < 1) el._raf = requestAnimationFrame(step);
    }
    el._raf = requestAnimationFrame(step);
  }

  function setPct(pos) { slider.style.setProperty("--pct", (pos / MAX_POS) * 100 + "%"); }

  // The "/mo" stat is rendered as two nodes (number + muted unit). Animate only
  // the number node so the unit styling stays intact.
  function renderTotal(n) {
    totalEl.textContent = "";
    totalEl.appendChild(document.createTextNode(fmtMoney(n) + " "));
    var unit = document.createElement("span");
    unit.className = "est-total__unit";
    unit.textContent = "/mo";
    totalEl.appendChild(unit);
  }
  function animateTotal(to) {
    if (totalEl._raf) cancelAnimationFrame(totalEl._raf);
    var from = totalEl._cur != null ? totalEl._cur : to;
    if (reduce) { totalEl._cur = to; renderTotal(to); return; }
    var dur = 400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = from + (to - from) * eased;
      totalEl._cur = val;
      renderTotal(val);
      if (t < 1) totalEl._raf = requestAnimationFrame(step);
    }
    totalEl._raf = requestAnimationFrame(step);
  }

  function fromSlider() {
    var pos = parseFloat(slider.value);
    var listeners = posToListeners(pos);
    setPct(pos);
    listenersEl.textContent = fmtCount(listeners);
    amounts.forEach(function (el) {
      var rate = parseFloat(el.getAttribute("data-rate")) || 0;
      animate(el, listeners * rate, fmtMoney);
    });
    animateTotal(listeners * totalRate);
  }

  slider.addEventListener("input", fromSlider);
  fromSlider();
})();

// Waitlist signup → Google Apps Script web app (appends to a Google Sheet).
// Paste the deployed web-app URL between the quotes below.
var WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbwPXaAlWNYMLcSE2u-B-xljxBWc9QZsTb_mWHidOZv7pxmQAtXlIfZM33hXozgYfOxj/exec";

(function () {
  "use strict";

  var form = document.getElementById("waitlist-form");
  if (!form) return;
  var input = document.getElementById("waitlist-email");
  var status = document.getElementById("waitlist-status");
  var button = form.querySelector("button[type=submit]");

  function setStatus(msg, kind) {
    status.textContent = msg;
    status.className = "early__status" + (kind ? " is-" + kind : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = (input.value || "").trim();

    if (!email || !input.checkValidity()) {
      setStatus("Please enter a valid email address.", "error");
      input.focus();
      return;
    }

    if (!WAITLIST_ENDPOINT) {
      setStatus("Thanks! (Waitlist isn't connected yet.)", "ok");
      return;
    }

    button.disabled = true;
    setStatus("Joining…", "");

    // Plain XHR with form-urlencoded keeps this a "simple" request: Apps
    // Script follows its redirect and returns a CORS-readable 200, so we can
    // report real success/failure (fetch + no-cors returns an opaque 403).
    var xhr = new XMLHttpRequest();
    xhr.open("POST", WAITLIST_ENDPOINT);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        form.reset();
        setStatus("You're on the list — we'll be in touch.", "ok");
      } else {
        setStatus("Something went wrong. Please try again.", "error");
      }
      button.disabled = false;
    };
    xhr.send("email=" + encodeURIComponent(email) + "&source=landing");
  });
})();

// Theme toggle. Default follows the OS (prefers-color-scheme); a click stores an
// explicit choice in localStorage and pins it via <html data-theme>. The saved
// value is applied pre-paint by the inline script in <head>.
(function () {
  "use strict";

  var root = document.documentElement;
  var btn = document.querySelector(".theme-toggle");
  if (!btn) return;

  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function effectiveDark() {
    var pinned = root.dataset.theme;
    if (pinned === "dark") return true;
    if (pinned === "light") return false;
    return media.matches;
  }

  function syncAria() {
    btn.setAttribute("aria-pressed", effectiveDark() ? "true" : "false");
  }

  btn.addEventListener("click", function () {
    var next = effectiveDark() ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("mm-theme", next); } catch (e) {}
    syncAria();
  });

  // Keep aria in sync with the OS while following it (no saved choice).
  media.addEventListener("change", function () {
    if (!root.dataset.theme) syncAria();
  });

  syncAria();
})();
