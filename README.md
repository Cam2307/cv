# ea-site

Static site for Cameron Reece Allcock: a CV landing page at the root, and the MetaTrader 5 Expert Advisors page under `/mql5/`.

- `index.html`: the CV landing page. It's a monochrome, scroll-driven "puzzle that builds itself": the portrait, name, role, experience, skills and certifications assemble as you scroll. It uses `assets/cv/` (CSS and hand-written JS), plus GSAP, ScrollTrigger and Lenis self-hosted in `assets/vendor/` (licences in `assets/vendor/LICENSES.md`).
- `mql5/index.html`: the Expert Advisors page (the former home page, moved intact). It still uses `assets/styles.css`, `assets/site.js` and `assets/img/`.
- `experience/`, `about/`, `projects/`: "Coming soon" pages linked from the landing page's nav (they use `assets/cv/soon.css`).
- `assets/fonts/`: self-hosted fonts. Geist and Geist Mono (landing), Instrument Serif italic (the accent phrase in the introduction and the education note) and Fraunces (MQL5 page). All are SIL OFL 1.1; licence files sit next to them.
- `preview/`: Playwright screenshots. The CV landing page is in `preview/cv/`, including `REPORT.md` (tech, how the motion works, page weight and known limits).

No build step, frameworks, CDNs or backend. Run it locally with `python -m http.server` from this folder, then open the printed URL. The landing page also opens straight from disk (`file://`), but the portrait then falls back to a plain greyscale photo, because browsers block canvas reads of local files.

## Images and art

- `assets/img/cameron.jpg`: Cameron's own photo (200 x 200), shown at or below its native size. It's a placeholder until a high-resolution portrait is supplied (see the comment in `index.html` and `assets/cv/portrait.js`).
- Every other visual on the landing page is generated in code: the puzzle pieces (SVG paths from `assets/cv/jigsaw.js`), the halftone portrait (canvas), the background light (a WebGL shader in `assets/cv/gl.js`) and the film grain (inline SVG noise). No third-party or stock images are used.

See `NOTES.md` for the MQL5 page's decisions and open questions.
