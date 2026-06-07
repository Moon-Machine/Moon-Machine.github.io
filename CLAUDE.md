# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Single-page marketing/landing site for Moon Machine (royalty-collection product). Static site — plain HTML/CSS/JS, **no build step, no framework, no dependencies, no package.json**. Three source files at repo root: `index.html`, `styles.css`, `script.js`. Custom domain `moonmachine.co` via `CNAME`.

## Commands

```sh
python3 -m http.server 8000   # serve, then open http://localhost:8000
```

There is no build, lint, or test tooling. Editing a file and reloading the browser is the full loop. Deploy is automatic: GitHub Pages serves `main` at root — pushing to `main` publishes. No Actions, no build.

## Architecture

**`script.js`** is four independent IIFEs, each self-guarding on its DOM nodes (returns early if absent) so sections are decoupled:

1. **Hero donut interaction** — The donut is inline SVG with four fixed slices (`.donut__seg[data-type]`), one per royalty type. Hovering/focusing a `.royalty-row` rotates the whole donut the *shortest angular path* (`shortestTo` accumulates rotation so it never spins the long way) to bring that slice to the highlight position, colors only that slice, cross-fades the background photo (`.hero-bg` layers), and swaps the glass blurb. State is data-driven entirely through `data-*` attributes on each row (`data-bg`, `data-color`, `data-tint`, `data-rot`, `data-blurb`). Leaving the group keeps the last selection — no revert.
2. **Estimator** — Logarithmic slider (`posToListeners`/`listenersToPos` map between slider position and 1k–2M listeners). Slider and a `contenteditable` count field drive each other; royalty amounts are `listeners * data-rate` per `.estimate-row__amount`, count-animated via per-element rAF tweens (`animate`, which retargets mid-flight). The contenteditable does live comma-formatting with manual caret preservation (`caretDigits`/`setCaretAfterDigits`).
3. **Waitlist form** — POSTs form-urlencoded to a Google Apps Script web app (`WAITLIST_ENDPOINT` const). Uses raw `XMLHttpRequest` deliberately: keeps it a CORS-"simple" request so Apps Script's redirect returns a readable 200 (a `fetch` + `no-cors` would yield an opaque/403 response and hide real success/failure).
4. **Theme toggle** — Default follows OS `prefers-color-scheme`; a click pins an explicit choice in `localStorage` (`mm-theme`) via `<html data-theme>`. The saved value is applied **pre-paint by an inline script in `index.html`'s `<head>`** to avoid a flash; the IIFE only handles clicks and keeps `aria-pressed` synced.

**`styles.css`** — design tokens in `:root` mirror the app's SDS design system (brand/accent colors, spacing, type). Dark mode is defined **twice and must be kept in sync**: `:root[data-theme="dark"]` (pinned choice) and `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` (following OS). When changing a dark-mode token, edit both blocks.

**Font-flash guard** — `index.html`'s `<head>` adds `fonts-loading` to `<html>`, waits for the above-the-fold webfaces to decode (with a 2.5s safety timeout), then removes it to release `.reveal` entrance animations.

## Conventions

- Respect `prefers-reduced-motion` — the estimator and reveals already gate on it; keep new motion gated too.
- Royalty data lives in HTML `data-*` attributes, not JS — to add/edit a royalty type or its copy, edit the markup, not `script.js`.
- Estimator, CTAs, and (until the endpoint is wired) parts of the form are visual; the donut PNG from Figma was rebuilt as inline SVG by hand.
