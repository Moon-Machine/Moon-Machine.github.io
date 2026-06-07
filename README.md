# Moon Machine — Landing Page

Marketing/landing page for Moon Machine. Static site (plain HTML/CSS/JS), no build step.

## Structure

```
index.html      markup — header, hero, estimator, early-access
styles.css      SDS design tokens + layout/components/responsive
script.js       hero royalty-row → donut rotate/recolor/blurb interaction
assets/         hero-chrome.jpg, logo.svg
CNAME           custom domain (moonmachine.co)
```

## Local preview

No tooling required — open `index.html`, or serve it:

```sh
python3 -m http.server 8000
# http://localhost:8000
```

## Deploy (GitHub Pages)

Deploys straight from `main` — no build, no Actions.

1. Repo **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.
2. Custom domain is set via the `CNAME` file (`moonmachine.co`). Enable **Enforce HTTPS** in Settings → Pages once the cert provisions.
3. DNS:
   - Apex `moonmachine.co` → GitHub Pages A/ALIAS records (`185.199.108–111.153`).
   - `www.moonmachine.co` → CNAME → `moon-machine.github.io`.

## Notes

- Visual-only: estimator, email, and CTAs are styled but inert.
- Donut chart is rebuilt as inline SVG (Figma exported it as a flat PNG); hover/focus on the four hero royalty rows rotates it, recolors the active slice, and swaps the blurb. Honors `prefers-reduced-motion`.
- Royalty descriptions for Digital Radio / Performance / Digital Mechanical are placeholder copy pending review; only Streaming's is from the design.
