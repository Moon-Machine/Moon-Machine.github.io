# Moon Machine — Landing Page

Marketing/landing page for Moon Machine. Static site (plain HTML/CSS/JS), no build step.

## Local preview

Open `index.html`, or serve it:

```sh
python3 -m http.server 8000   # http://localhost:8000
```

## Deploy (GitHub Pages)

Deploys from `main` — no build, no Actions. Pushing to `main` publishes. Custom domain is set by the `CNAME` file (`moonmachine.co`); enable **Enforce HTTPS** in Settings → Pages once the cert provisions.

DNS:
- Apex `moonmachine.co` → GitHub Pages A records (`185.199.108–111.153`).
- `www` → CNAME → `moon-machine.github.io`.

## Notes

- Estimator, CTAs, and email are styled but inert (no backend).
- Royalty copy for Digital Radio / Performance / Digital Mechanical is placeholder pending review; only Streaming's is final.
