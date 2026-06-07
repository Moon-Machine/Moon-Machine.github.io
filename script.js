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
