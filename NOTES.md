# Notes: v2 (26 Oct 2026)

> **Moved 11 Nov 2026:** this Expert Advisors page now lives at `mql5/index.html` (its asset paths are now `../assets/...`), and the site root is Cameron's CV landing page. The notes below describe the MQL5 page. For the landing page, see `README.md` and `preview/cv/REPORT.md`.

Cameron resumed the site on 26 Oct 2026 at 20:27 SAST and asked for v2: "in full detail ... make it phenomenal". Nothing is deployed yet.

## What v2 is
- **Stack:** one static page. `index.html`, `assets/styles.css` (~18 KB), `assets/site.js` (~9 KB of hand-written vanilla JS). No frameworks or CDNs. One self-hosted variable font (Fraunces, OFL, subset to ~40 KB) for display type, plus the system sans for body text.
- **Look:** a dark, gold-tinted palette, a refined fluid type scale and subtle grain (an SVG noise overlay with soft-light blend).
- **Motion:**
  - **Hero:** a canvas "flowing field" of gold lines. It's trendless on purpose, so it can't be read as an equity curve. It pauses when off-screen or when the tab is hidden, and the lines tilt with the cursor.
  - **Headline:** reveals word by word.
  - **Scroll-driven, native:** a scroll progress bar, a gold trace that draws itself between the hero and the products, parallax on the screenshots and a hero lift-out. These use CSS `animation-timeline` (`scroll()` / `view()`), with a requestAnimationFrame scroll fallback where that's unsupported.
  - **Section reveals:** an IntersectionObserver (blur-up and translate).
  - **"On the chart" steps:** light up as you read, next to a sticky heading with a progress meter.
- **Micro-interactions:** card tilt with a cursor-aware light, a gradient border, magnetic buttons with a shine sweep, animated underline links, floating-label form fields and a mobile menu (Escape closes it). Tilt and magnetic effects only run on fine pointers, so nothing is hover-only.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, all animation and transition is off and all content is visible. The canvas draws one static frame, the trace is drawn in full and the grain is hidden. Checked in Playwright: 0 hidden elements, 0 running animations.
- **Images:** one on-chart **Controls tab** screenshot per EA, as WebP at 720 and 1280 wide with a JPG fallback, lazy-loaded. No backtest, equity, results or balance images: the other on-chart shots show balance figures, so I didn't use them.
- **Accessibility:** skip link, landmarks, one h1, focus-visible rings and AA contrast on the dark theme (muted text is about 7:1, dimmed steps stay above 4.5:1). The form note uses `role=status`, and alt text describes each screenshot.

## Content decisions
- **Products:** Tidewell XAU Trend (203591, v1.305) and Embercrest XAU Breakout (203661, v1.906). Prices were re-checked on both MQL5 pages on 26 Oct 2026 at about 20:30 SAST: Tidewell is 199 USD or 30 USD for 1 month; Embercrest is 99 USD or 30 USD for 1 month. Both pages show the seller as Cameron Reece Allcock.
- **"No grid / No martingale / No averaging down":** shown on Embercrest only. There's an HTML TODO on Tidewell.
- **Forward test section:** labelled "Forward test on a demo account". Tidewell links to the Myfxbook page; every figure reads "Report pending" and nothing from Myfxbook is shown. The words live, real and verified aren't used for results.
- **EA Generator:** neutral "coming soon" copy with no dates. The Name and Email form is wired to nothing (it shows a note on submit), with an HTML TODO.
- **Broker:** the Exness / "Broker I use" line and affiliate slot are removed, leaving an HTML comment because that decision is pending.
- **Previews:** in `preview/`: `v2-desktop.png`, `v2-desktop-scroll.png` (mid-scroll motion state with a card tilted), `v2-mobile.png` (390 wide at 1.5x, because 2x passes Chrome's 16k-pixel capture limit) and `v2-reduced-motion.png`.
- **Lighthouse:** skipped. It isn't installed, and installing it would be a heavy download.

## Open questions for Cameron
1. **Tidewell no-grid claim:** confirm Tidewell has no grid, no martingale and no averaging down before it's added (TODO in `index.html`).
2. **Broker line:** keep Exness and add an affiliate link, or leave it out? It's removed for now.
3. **Form provider:** the interest form isn't connected yet.
4. **Embercrest forward test:** send a public Myfxbook (or MQL5 Signals) link when it's ready.
5. **Myfxbook link:** couldn't be checked from the box (Myfxbook returns 403 to automated requests). Please open it once to confirm it's public.
6. **Host and domain:** GitLab Pages, Netlify or Cloudflare Pages, and a custom domain or not.
7. **EA Generator copy:** approve the neutral wording ("A tool for building and testing MetaTrader 5 Expert Advisors. There's more to share soon.").
8. **Prices:** they're hard-coded from 26 Oct 2026. Update them if MQL5 prices change.
