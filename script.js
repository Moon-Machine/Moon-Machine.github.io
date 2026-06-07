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
