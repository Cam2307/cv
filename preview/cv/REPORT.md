# CV landing page: report

**Built:** a single-page CV landing page for Cameron Reece Allcock at the site root (`index.html`). It's a very dark, strictly monochrome "puzzle that builds itself" as you scroll. The portrait, name, role, experience timeline, skills and certifications are each cut into jigsaw pieces that fly in, rotate, snap and lock. The six-piece mark in the header fills as each section locks, and the finale assembles all six into "The full picture". The Expert Advisors page moved intact to `/mql5/` (MQL5 in the nav), and Experience, About and Projects are "Coming soon" pages.

**Status:** committed locally on `cv-landing`. Not pushed, not deployed.

## Screenshots (this folder)

| File | What it shows |
|------|---------------|
| `desktop-1-start.jpg` | 1440 x 900, on load: portrait pieces waiting either side of the empty board, name unlit |
| `desktop-2-mid-assembly.jpg` | 1440, hero pinned at 45%: 7 of 16 pieces locked, the rest converging on the board |
| `desktop-3-assembled.jpg` | 1440, hero complete: halftone portrait assembled, name lit, header mark at 3/6 |
| `desktop-4-experience.jpg` | 1440, experience timeline locked (pinned on desktop) |
| `desktop-5-skills.jpg` | 1440, skills grid locked |
| `desktop-6-finale.jpg` | 1440, finale: the six pieces assembled, header mark 6/6 |
| `mobile-1-start.jpg` ... `mobile-4-experience.jpg` | 390 wide, WebKit with an iPhone 13 profile (Safari's 390 x 664 viewport): start, mid-assembly, assembled, experience |
| `reduced-motion-1-desktop.jpg`, `-2-experience.jpg`, `-3-mobile.jpg` | `prefers-reduced-motion: reduce`: the static, fully assembled layout |

The screenshots are JPEG (quality 88) to keep the repo light. The desktop shots are at 1x, and the mobile shots at 2x (780 px wide).

## Tech used

- **Static site:** HTML, CSS and vanilla JS. There's no build step, framework, CDN or backend. Run it with `python -m http.server` from the repo root.
- **GSAP 3.15.1 and ScrollTrigger:** scroll-scrubbed timelines, pinning and `gsap.matchMedia` breakpoints. **Lenis 1.3.27:** smooth scrolling for mouse and trackpad only, so touch devices keep native scrolling. All three are self-hosted in `assets/vendor/` (licences in `assets/vendor/LICENSES.md`).
- **Hand-written modules in `assets/cv/`:**
  - `jigsaw.js`: procedural jigsaw geometry. Each piece is a symmetric Bezier tab or blank, generated from a seeded random generator so neighbouring edges always mate and the shapes are the same on every visit. It's mounted behind real DOM cards (the text stays real, selectable HTML).
  - `portrait.js`: renders the portrait as a halftone line screen on a canvas at device resolution, then cuts it into 16 SVG-clipped pieces.
  - `gl.js`: a small raw-WebGL fragment shader for the background light. It's lazy-loaded.
  - `home.js`: the choreography.
  - `site.js`: shared code for the Motion switch, the menu dialog and the magnetic cursor.
- **Fonts:** Geist and Geist Mono (variable), plus Instrument Serif italic for two accent passages. All are self-hosted woff2 under the SIL OFL.

## How the motion works

1. **Progressive enhancement.** The HTML is the finished, assembled CV. A tiny inline script in the `<head>` adds a `motion` class only if the visitor hasn't asked for reduced motion (or has turned the Motion switch on). Without that class, or without JS, or if the scripts fail to arrive within 4 s, the page is the static layout. Nothing is hidden in a way that depends on JS to undo.
2. **Hero (pinned):** pinned for 1.55 screen heights (1.15 on phones).
   - **Pieces:** the 16 portrait pieces start in zones beside the board. The zones are measured from the live layout, so pieces never cover the name, role line or location. They fly in corners first, then edges, then the middle, rotating and overshooting slightly (`back.out`) so they "snap".
   - **Locks:** each lock fires a glint along the piece outline, a small pop and the 00/16 counter. The seams fade once the portrait is whole.
   - **Role and name:** the role labels slide in along their own line. The name's three offset slices align, then a light sweep "lights" it.
3. **Through the page:**
   - **Introduction:** the statement's words brighten as you read.
   - **Experience:** pinned on desktop. The spine draws down, cards swing in on a 3D hinge and lock with a glint, and the outlined year counter rolls from 2024 to "Earlier". Phones get per-card scrubbed triggers instead of the pin.
   - **Education:** the card assembles from six shards.
   - **Skills:** the grid assembles piece by piece.
   - **Certifications:** the cards flip down into place.
   - **Finale:** pinned. Six pieces of the page (Name, portrait, Role, Experience, Skills, Certifications) converge into one board.
4. **Depth and light:**
   - **Drift and parallax:** while waiting, the scattered pieces drift and follow the mouse (parallax depth per piece).
   - **Shader:** the WebGL background is a slow fbm haze, an overhead cone of light and a soft torch that follows the cursor. It brightens as the page assembles and pulses when a section locks. Its brightness is clamped low and dithered, so it never competes with the text.
   - **Cursor:** on mouse and trackpad, the cursor becomes a ring with magnetic buttons, and the skill cards tilt.
5. **Performance:**
   - **Animation:** only transforms, opacity and clip-path are animated, via GSAP quick setters. The hero drift pauses off-screen.
   - **Shader:** it renders at reduced resolution with adaptive quality, stops when the tab is hidden, and is fetched on idle after first paint (never with reduced motion).
   - **Halftone:** it's drawn once per size and cached as a blob URL.
6. **Reduced motion and the Motion switch:** with `prefers-reduced-motion: reduce` or Motion switched off, there are no pins, scrubbing, smooth scrolling, shader or custom cursor, and the page shows the static layout. The switch (WCAG 2.2.2 pause/stop) is a real `role="switch"` toggle stored in `localStorage`, and toggling it keeps the reader in the same place.
7. **Accessibility:**
   - **Structure:** landmarks, one `h1`, a skip link and a `<dialog>` menu (Escape closes it and returns focus).
   - **Screen readers:** decorative duplicates (name slices, the split statement) are `aria-hidden`, with a screen-reader copy of the statement.
   - **Contrast** on `#050505`:
     - Body text `#bdbdbd` is about 10.9:1, and muted text `#939393` about 6.6:1.
     - The "unlit" grey `#6b6b6b` (about 3.8:1) is only used for large display text (29 px and up) while it's still assembling.
     - `prefers-contrast: more` raises the greys.
   - **Print:** a print stylesheet gives a clean black-on-white CV.

## Monochrome rule

- **Source scan:** every colour literal in the landing page's HTML, CSS, JS and SVG (and the Coming-soon pages) is a grey with equal R, G and B. That covers hex values, `rgba(255,255,255,a)`, `rgba(5,5,5,a)` and `rgba(0,0,0,a)`. The shader only outputs luminance.
- **Pixel check:** in all 13 screenshots, the largest difference between any pixel's R, G and B channels is 0.
- **Portrait:** the photo is shown as a greyscale halftone, or as `grayscale(1)` in the plain fallback.
- **MQL5 page:** it keeps its own gold design, since the monochrome rule is scoped to the landing page.

## Image sources

- `assets/img/cameron.jpg`: Cameron's own photo, 200 x 200, 7.2 kB. It's never shown as an enlarged bitmap. The hero renders it as a coarse line-screen halftone, drawn crisply at device resolution from a 150 px head-and-shoulders crop. The plain photo only appears at 200 CSS px or smaller (the finale, the `file://` fallback and the no-JS layout). It's marked as a **placeholder for a high-resolution portrait** in `index.html` and `assets/cv/portrait.js`.
- **Everything else is generated in code:** the jigsaw pieces (SVG), the halftone (canvas), the background light (WebGL), the film grain (inline SVG `feTurbulence`), the icons (inline SVG) and the favicon (`assets/img/favicon-cv.svg`, drawn for this site). There are no stock, third-party or CC0 images.

## Page weight (landing page, first visit, measured in Chromium)

| Group | Uncompressed | Gzipped |
|-------|-------------:|--------:|
| HTML | 25.7 kB | 6.6 kB |
| CSS (`base.css`, `home.css`) | 28.5 kB | 8.6 kB |
| GSAP, ScrollTrigger and Lenis | 136.9 kB | 52.0 kB |
| Own JS (`jigsaw`, `portrait`, `site`, `home`, `gl`) | 61.7 kB | 21.2 kB |
| Fonts (3 woff2, already compressed) | 74.7 kB | 74.7 kB |
| Portrait JPEG and favicon | 10.6 kB | 8.3 kB |
| **Total (16 requests)** | **337.9 kB** | **171.4 kB** |

`gl.js` (6 kB) loads on idle about 3 s after load, and only when motion is on. With reduced motion, it's 15 requests. Static hosts usually serve gzip or brotli. The local `python -m http.server` doesn't compress, so the gzipped column is computed from the files.

## Verification

- **Chromium** (Playwright 1.65, headless, SwiftShader WebGL) at 1440 x 900, 1280 x 720 and 390 x 844 (reduced motion). **WebKit** (Playwright's Safari engine) with an iPhone 13 profile, scrolled top to bottom.
- **Errors:** no console errors or warnings, failed requests or HTTP errors on the landing page, `experience/`, `about/`, `projects/` or `mql5/`.
- **Behaviour:**
  - The Motion switch removes all 13 scroll triggers when off and restores them when on.
  - Reduced motion builds no triggers and no WebGL.
  - The first Tab focuses "Skip to content", which moves focus to `<main>`.
  - The menu dialog opens and closes with Escape, and focus returns to the Menu button.
- **Fixed in this pass:**
  - **Short phones rendered no motion.** On a 390 x 664 phone (Safari with its toolbars), the choreography never started: `gsap.matchMedia` only runs when one of its queries matches, and neither "wide" nor "tall" did, which left a half-styled, unanimated hero. An always-true query now guarantees it runs. The height test only applies to wide screens, so a phone's collapsing address bar can't rebuild the timelines mid-scroll. On WebKit/iPhone 13, 29 triggers now build and the hero assembles.
  - **The hero name was crossed by pieces mid-assembly.** Pieces now wait and travel only in measured zones beside the board, and the role labels slide in horizontally (outward first, so they never cross).
  - **Puzzle pieces rendered at about 60% size** and left gaps. A global `max-width: 100%` on SVGs was shrinking the oversized piece outlines.

## Not done / limits

- **Real devices:** not tested on a physical iPhone or Android phone, or on a real GPU. WebKit on Windows and SwiftShader approximate Safari and hardware WebGL, but don't match them exactly.
- **Audits:** no Lighthouse or axe run. Neither is installed, and I didn't add tooling to the repo. Contrast was checked by calculation, and keyboard and dialog behaviour by script.
- **Portrait:** no high-resolution photo yet. The hero halftone is designed around the 200 px placeholder, and a larger source can be dropped in later (adjust `CROP` in `portrait.js`).
- **Subpages:** Experience, About and Projects are deliberately "Coming soon" pages. Projects is where the Chrome extensions will go.
- **`file://`:** opened straight from disk, the hero shows the plain greyscale photo instead of the halftone, because browsers block canvas reads of local files. Served over HTTP, it's the halftone.
- **Lenis:** it's still downloaded (19 kB) when reduced motion is on, though it isn't started.
