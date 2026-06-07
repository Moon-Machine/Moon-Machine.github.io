// Hero royalty rows drive the donut chart: hover/focus rotates the chart,
// recolors the active slice, swaps the glass blurb, and highlights the row.
(function () {
  "use strict";

  var list = document.getElementById("royalty-list");
  var donut = document.getElementById("donut");
  var spin = document.getElementById("donut-spin");
  var blurb = document.getElementById("hero-blurb");
  if (!list || !donut || !spin || !blurb) return;

  var rows = Array.prototype.slice.call(list.querySelectorAll(".royalty-row"));
  var defaultRow = list.querySelector(".royalty-row.is-active") || rows[0];

  function activate(row) {
    if (!row) return;

    rows.forEach(function (r) { r.classList.toggle("is-active", r === row); });

    var color = row.getAttribute("data-color");
    var tint = row.getAttribute("data-tint");
    var rot = row.getAttribute("data-rot");

    row.style.setProperty("--row-color", color);
    row.style.setProperty("--row-tint", tint);

    donut.style.setProperty("--donut-active", color);
    spin.style.setProperty("--donut-rot", rot + "deg");

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

  // Revert to the default (Streaming) when the pointer leaves the group.
  list.addEventListener("mouseleave", function () { activate(defaultRow); });

  // Initialise from the default row.
  activate(defaultRow);
})();
