# ea-site

Single-page static landing site for Cameron Reece Allcock's MetaTrader 5 Expert Advisors (v2).

- `index.html`, `assets/styles.css`, `assets/site.js`: vanilla HTML, CSS and JS with no build step, frameworks or CDNs.
- `assets/fonts/`: self-hosted Fraunces variable font (SIL OFL 1.1, see LICENSE.txt).
- `assets/img/`: EA logos and on-chart Controls screenshots (WebP plus JPG fallback).
- `preview/`: Playwright screenshots (desktop, mid-scroll, mobile, reduced motion).

Run locally with `python3 -m http.server`, then open the printed URL. Nothing is deployed. See `NOTES.md` for decisions and open questions.
