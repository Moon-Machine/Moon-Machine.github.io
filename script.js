// Hero royalty rows drive the donut chart. Each of the four slices is a fixed
// size/position and permanently belongs to one royalty type. Hovering (or
// focusing) a row rotates the donut the SHORTEST way to bring that type's slice
// up to the highlight position, fills it with the type color, cross-fades the
// background photo, and swaps the glass blurb. Everything else stays gray.
(function () {
  "use strict";

  var list = document.getElementById("royalty-list");
  var donut = document.getElementById("donut");
  var spin = document.getElementById("donut-spin");
  var blurb = document.getElementById("hero-blurb");
  var media = document.getElementById("hero-media");
  if (!list || !donut || !spin || !blurb) return;

  var rows = Array.prototype.slice.call(list.querySelectorAll(".royalty-row"));
  var defaultRow = list.querySelector(".royalty-row.is-active") || rows[0];
  var bgLayers = media ? Array.prototype.slice.call(media.querySelectorAll(".hero-bg")) : [];
  var segs = Array.prototype.slice.call(donut.querySelectorAll(".donut__seg"));

  // Accumulated rotation in degrees, so we can always take the shortest path.
  var currentRot = parseFloat(defaultRow.getAttribute("data-rot")) || 0;

  function shortestTo(target) {
    var delta = ((target - currentRot + 180) % 360 + 360) % 360 - 180;
    currentRot += delta;
    return currentRot;
  }

  function activate(row) {
    if (!row) return;

    rows.forEach(function (r) { r.classList.toggle("is-active", r === row); });

    var key = row.getAttribute("data-bg");
    var color = row.getAttribute("data-color");
    var target = parseFloat(row.getAttribute("data-rot")) || 0;

    row.style.setProperty("--row-color", color);
    row.style.setProperty("--row-tint", row.getAttribute("data-tint"));

    // Rotate the donut the shortest way; color only this type's slice.
    spin.style.setProperty("--donut-rot", shortestTo(target) + "deg");
    segs.forEach(function (seg) {
      var on = seg.getAttribute("data-type") === key;
      seg.classList.toggle("is-on", on);
      if (on) seg.style.setProperty("--seg-color", color);
    });

    // Cross-fade the background photo.
    bgLayers.forEach(function (layer) {
      layer.classList.toggle("is-active", layer.getAttribute("data-key") === key);
    });

    // Swap the glass blurb.
    var text = row.getAttribute("data-blurb");
    if (text && blurb.textContent !== text) {
      blurb.style.opacity = "0";
      window.setTimeout(function () {
        blurb.textContent = text;
        blurb.style.opacity = "1";
      }, 180);
    }
  }

  rows.forEach(function (row) {
    row.addEventListener("mouseenter", function () { activate(row); });
    row.addEventListener("focus", function () { activate(row); });
  });

  // Leaving the group keeps the last selected type — no revert.
  activate(defaultRow);
})();

// Royalty estimator: a logarithmic Monthly Listeners slider drives a big
// listener count and four royalty figures, all count-animated up/down.
(function () {
  "use strict";

  var slider = document.getElementById("est-slider");
  var countEl = document.getElementById("est-count");
  if (!slider || !countEl) return;

  var amounts = Array.prototype.slice.call(
    document.querySelectorAll(".estimate-row__amount")
  );

  var L_MIN = 1000, L_MAX = 2000000;
  var LN_MIN = Math.log(L_MIN), LN_SPAN = Math.log(L_MAX) - LN_MIN;
  var MAX_POS = parseFloat(slider.max) || 1000;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  var usdCents = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  // log position (0..MAX_POS) → listeners, snapped to 3 significant figures
  function posToListeners(pos) {
    var raw = Math.exp(LN_MIN + (pos / MAX_POS) * LN_SPAN);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)) - 2);
    return Math.max(L_MIN, Math.round(raw / mag) * mag);
  }

  function fmtCount(n) { return Math.round(n).toLocaleString("en-US"); }
  function fmtMoney(n) { return n < 100 ? usdCents.format(n) : usd.format(Math.round(n)); }

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

  function updateAmounts(listeners) {
    amounts.forEach(function (el) {
      var rate = parseFloat(el.getAttribute("data-rate")) || 0;
      animate(el, listeners * rate, fmtMoney);
    });
  }

  function listenersToPos(listeners) {
    return (Math.log(listeners) - LN_MIN) / LN_SPAN * MAX_POS;
  }

  function parseTyped() {
    var n = parseInt((countEl.textContent || "").replace(/[^\d]/g, ""), 10);
    return isNaN(n) ? null : Math.min(L_MAX, Math.max(L_MIN, n));
  }

  // Count digits before the caret (commas ignored), so we can restore the
  // caret to the same logical spot after reformatting.
  function caretDigits() {
    var sel = window.getSelection();
    if (!sel.rangeCount) return null;
    var r = sel.getRangeAt(0).cloneRange();
    var pre = document.createRange();
    pre.selectNodeContents(countEl);
    pre.setEnd(r.endContainer, r.endOffset);
    return (pre.toString().match(/\d/g) || []).length;
  }
  function setCaretAfterDigits(n) {
    var node = countEl.firstChild;
    if (!node) return;
    var text = node.textContent, count = 0, pos = text.length;
    if (n <= 0) pos = 0;
    else for (var i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) >= 48 && text.charCodeAt(i) <= 57 && ++count === n) { pos = i + 1; break; }
    }
    var r = document.createRange();
    r.setStart(node, Math.min(pos, text.length));
    r.collapse(true);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }

  // Slider drives the count (1:1, no tween) and the animated amounts.
  function fromSlider() {
    var pos = parseFloat(slider.value);
    var listeners = posToListeners(pos);
    setPct(pos);
    if (document.activeElement !== countEl) countEl.textContent = fmtCount(listeners);
    updateAmounts(listeners);
  }

  // Typing in the count reformats with commas live (caret preserved), and moves
  // the slider + amounts. Min isn't enforced until blur so partial entries work.
  function fromTyped() {
    var digits = (countEl.textContent || "").replace(/[^\d]/g, "");
    var n = parseInt(digits, 10);
    if (!isNaN(n) && n > L_MAX) n = L_MAX;

    var formatted = isNaN(n) ? "" : n.toLocaleString("en-US");
    if (countEl.textContent !== formatted) {
      var di = caretDigits();
      countEl.textContent = formatted;
      if (di !== null) setCaretAfterDigits(di);
    }
    if (isNaN(n)) return;

    var pos = listenersToPos(Math.max(1, n));
    slider.value = pos;
    setPct(pos);
    updateAmounts(n);
  }

  slider.addEventListener("input", fromSlider);
  countEl.addEventListener("input", fromTyped);
  countEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); countEl.blur(); }
  });
  countEl.addEventListener("focus", function () {
    // select all so a fresh number replaces the current one
    var r = document.createRange();
    r.selectNodeContents(countEl);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  });
  countEl.addEventListener("blur", function () {
    var listeners = parseTyped();
    if (listeners === null) listeners = posToListeners(parseFloat(slider.value));
    countEl.textContent = fmtCount(listeners); // reformat with commas, clamped
    var pos = listenersToPos(listeners);
    slider.value = pos;
    setPct(pos);
    updateAmounts(listeners);
  });

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
