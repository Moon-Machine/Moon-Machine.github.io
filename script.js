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

  // --- Donut geometry -------------------------------------------------------
  // Four fixed wedges (angles measured clockwise from 3 o'clock; the group's
  // -90deg base rotation puts 0deg at the top). Each type owns one wedge.
  var CX = 100, CY = 100, R_OUT = 90, R_IN = 54;
  var SLICES = {
    streaming:   [0, 130],
    radio:       [139, 195],
    performance: [204, 270],
    mechanical:  [279, 351]
  };
  function polar(r, deg) {
    var a = deg * Math.PI / 180;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  }
  function wedge(a0, a1) {
    var o0 = polar(R_OUT, a0), o1 = polar(R_OUT, a1);
    var i1 = polar(R_IN, a1), i0 = polar(R_IN, a0);
    var large = (a1 - a0) > 180 ? 1 : 0;
    return "M" + o0[0].toFixed(2) + " " + o0[1].toFixed(2) +
      "A" + R_OUT + " " + R_OUT + " 0 " + large + " 1 " + o1[0].toFixed(2) + " " + o1[1].toFixed(2) +
      "L" + i1[0].toFixed(2) + " " + i1[1].toFixed(2) +
      "A" + R_IN + " " + R_IN + " 0 " + large + " 0 " + i0[0].toFixed(2) + " " + i0[1].toFixed(2) + "Z";
  }
  segs.forEach(function (seg) {
    var slice = SLICES[seg.getAttribute("data-type")];
    if (slice) seg.setAttribute("d", wedge(slice[0], slice[1]));
  });

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
