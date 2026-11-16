# Mobile motion system

How the CV landing page moves on phones, and where to tune it.

**Scope.** Everything in this document applies only below the `960px` breakpoint
(`narrow`). Desktop is deliberately excluded: it takes the `!narrow` path in
[`assets/cv/home.js`](../assets/cv/home.js) and is unchanged. If you are editing
desktop motion, this file does not describe it.

## Guarantees

The system is built on four rules. Break one and the 60fps / accessibility
promises stop holding.

1. **Transform and opacity only.** Every scroll-scrubbed tween animates `x`, `y`,
   `scale`, `rotation*`, `z` or `opacity`. Nothing reads back layout, so no
   tween can trigger reflow.
2. **`filter: blur()` is one-shot only.** Blur is expensive to re-rasterise, so it
   appears exclusively on non-scrubbed entrances that fire once (`once: true`).
   Never add blur to a `scrub` tween.
3. **Everything is revertible.** All tweens and ScrollTriggers are created inside
   the `gsap.matchMedia()` context. `mm.revert()` tears the whole system down and
   leaves the static layout exactly as the HTML/CSS describes it. That static
   layout *is* the `prefers-reduced-motion` experience — there is no separate
   reduced-motion stylesheet to maintain.
4. **Progressive enhancement.** The page is complete and readable with JavaScript
   disabled or unreachable. Motion layers on top and is never required to reveal
   content, except for the deliberate entrance states that `mm.revert()` clears.

## Motion tokens

Defined once at
[`home.js` lines 212–238](../assets/cv/home.js#L212-L238). This is the single
place to retune phone motion.

| Token | Property | Value | Meaning |
|---|---|---|---|
| `MOTION.text` | `lift` | `26px` | vertical travel for headings |
| | `blur` | `8px` | base de-blur (scaled per element) |
| | `dur` | `0.82s` | |
| | `ease` | `expo.out` | fast settle, long tail |
| `MOTION.media` | `scale` | `1.12` | images start 12% oversized |
| | `lift` | `30px` | |
| | `dur` | `1.2s` | slowest token — media should feel weighty |
| | `ease` | `power4.out` | |
| `MOTION.card` | `dist` | `36px` | base travel; `+ r.a * 20` jitter |
| | `rot` | `5deg` | base tilt; `+ r.b * 3` jitter |
| | `dur` | `1s` | |
| | `ease` | `back.out(1.28)` | default; overridden per card |
| `MOTION.rail` | `dur` | `0.95s` | |
| | `ease` | `expo.out` | |

## Direction and easing recipes

Consecutive cards must never repeat a move, so both the approach vector and the
settle curve cycle by element index `k`.

```js
var CARD_DIRS = [
  { x: -1,   y: 0.6, rot: -1 },              // from the left
  { x: 1,    y: 0.6, rot: 1 },               // from the right
  { x: 0,    y: 1,   rot: 0, flat: true },   // straight up — scale instead of tilt
  { x: -0.7, y: 0.7, rot: -0.6 }             // diagonal
];
var CARD_EASES = ['back.out(1.28)', 'back.out(1.7)', 'expo.out'];
```

- Direction is `CARD_DIRS[k % 4]`, easing is `CARD_EASES[k % 3]`. Because 4 and 3
  are coprime, the **combined period is 12** — a card only repeats an identical
  *direction + easing* pair after twelve siblings.
- `flat: true` swaps the tilt for a `0.955` scale, so the straight-up card reads
  as arriving from further away rather than just lower.
- Per-element jitter comes from the element's own random triple `r`, seeded
  deterministically by `randoms(n, seed)` so the page scatters identically on
  every visit.

`mobileCardFrom(k, r)` builds the start state; `cardEase(k)` picks the curve.

## Per-element-type gestures

Each element type gets a distinct gesture so the scroll has a vocabulary rather
than one repeating fade.

| Type | Gesture | Where |
|---|---|---|
| **Section dividers** | `.label` clip-path wipes left→right. Because the label's `::before` is the 22×1px hairline rule, the wipe reads as a rule being drawn, then the text. | `buildHeads` |
| **Text blocks** (headings) | lift `26px` + de-blur from `6.4–9.6px`, fading in | `buildHeads` |
| **Image containers** | scale-down push: `1.12 → 1`, `y 30 → 0`, scrubbed | `.fin-portrait img`, intro phone shell |
| **Card components** | cycling 4-direction entrance with `transformPerspective` and a per-card tilt origin | `buildExperience`, `buildSkills`, `buildCerts`, `buildFinale` |
| **Certificate cards** | 3D flip: `rotationX -58…-84`, `rotationZ ±(5–15)`, `y 78–124`, `z -150…-240` — each hinge leans a different way | `buildCerts` |
| **Education cards** | swing in from alternating sides (`±1.5deg`, origin flips `0%/100% 50%`) plus a `12px` listing parallax on the group | `buildSlideIns` |
| **Skills cells** | entrance **plus** a scroll-driven depth tilt (`rotationY ±7`, `rotationX ∓5`, `z 0–16`) | `buildSkills` → `scrollTilt` |

## ScrollTrigger map (mobile)

| Element | `start` | `end` | `scrub` | Once? |
|---|---|---|---|---|
| `.xp-card` (experience) | `top 96%` | `top 64%` | `0.6` | no |
| `.skill` cells | `top 98%` | `top 66%` | `0.6` | no |
| `.cert` cards | `top 98%` | `top 68%` | `0.7` | no |
| `.label` (wipe) | `top 92%` | — | — | **yes** |
| heading (lift + de-blur) | `top 90%` | — | — | **yes** |
| `.fin-portrait img` | `top 98%` | `top 72%` | `0.6` | no |
| `.edu-more--card` | `top 90%` | — | — | **yes** |

Scrubbed entrances use `invalidateOnRefresh: true`, so a resize or an orientation
change recomputes their start/end rather than leaving stale pixel positions.

Stagger is expressed as an **index offset, not a fixed delay**: label wipes use
`(i % 3) * 0.05`, skill entrances use a rank-ordered `idx * 0.075`, card duration
varies by `MOTION.card.dur * (0.9 + r.c * 0.22)`. This keeps the rhythm from
becoming a metronome.

## Accessibility

- **`prefers-reduced-motion: reduce`** — the `.motion` class is never added, so
  `gsap.matchMedia()` never instantiates and the static layout renders. Verified:
  zero transformed cards, no clip-paths, all content visible.
- **User switch** — the header Motion toggle calls `CV.setMotion(on)` and
  persists to `localStorage['cv-motion']`. Toggling off calls `mm.revert()`,
  which returns every animated element to its static state.
- **Fail-safe** — if the scripts never start, a 4s timer in `index.html` removes
  `.motion` so nothing stays hidden behind an entrance state that never plays.
- Reduced motion is a *content* guarantee, not a cosmetic one: nothing decorative
  is required to read the page.

## Touch interaction patterns

In [`assets/cv/home.css`](../assets/cv/home.css), scoped to `max-width: 959.98px`
and `hover: none`.

- `touch-action: manipulation` on every button and link — removes the ~300ms
  double-tap-zoom delay.
- `:active` press feedback: `transform: scale(.965)` on buttons, with a `0.16s`
  `cubic-bezier(.2,.7,.1,1)` transition so the press reads instantly and releases
  softly. Solid buttons also darken to `#e2e2e2`.
- Tap targets: `.btn` `min-height: 52px`, `.hero-connect-btn` `46px`, close/menu
  buttons `44px`; inline text links get vertical padding to widen their hit area.
- **Sticky-hover neutralised.** Under `@media (hover: none)` the hover states are
  reset, so a tap cannot leave a control stuck in its hovered appearance — a
  common mobile bug class.
- A fine-pointer magnetic cursor exists in `site.js` but is gated behind
  `(pointer: fine)`, so it never runs on touch.

## Measured performance

Scroll probe using `requestAnimationFrame` deltas over a full-page down-then-up
sweep, after a warm-up pass to absorb image decode. Chrome, no CPU throttling.

| Viewport | Frames | median | p90 | p99 | frames > 33ms |
|---|---|---|---|---|---|
| `390×844` @ dpr 3 (mobile emulation) | 132 | 16.7ms | 16.8ms | 16.8ms | **0** |
| `768×949` | 149 | 16.7ms | 16.8ms | 16.9ms | 1 |
| `1440×900` (desktop) | — | untouched | | | |

Other verified properties:

- **No layout shift.** Document height across a full down/up scroll cycle:
  `14634 → 14634 → 14634`. Section heights are identical at `t0`, `t600`,
  `t2000` and `t4500`.
- **No horizontal overflow.** `scrollWidth === innerWidth` (`390`), with
  `overflow-x: clip` on `html` clipping elements mid-entrance.
- **Not the bottleneck.** Stopping the WebGL backdrop changes p99 from `16.8ms`
  to `16.7ms`, i.e. within noise — the shader is not a cost on mobile.
- **Mobile scroll is native.** Lenis is initialised on desktop but *not* on
  mobile, so the smooth-scroll layer never competes with the compositor or with
  the browser's own touch scrolling.
- **Desktop unaffected.** At `1440px`: `narrow: false`, Lenis on, card
  `transform-origin: 0% 50%` with `tx ≈ 545`, no clip wipe on headings,
  `touch-action: auto`, `.btn` `min-height: 50px`.

Note on first paint: the first scroll after a cold load shows a single long
frame. That is image decode, not animation — it disappears on the second pass and
is unchanged with the animation system disabled.

## Retuning

- **Change the feel of everything on mobile** → edit `MOTION`. It is the only
  tuning surface; all builders read from it.
- **Add a fifth approach direction** → append to `CARD_DIRS`. Keep its length
  coprime with `CARD_EASES.length` so the combined period stays long. Prefer 5
  if you want a 5-card list to show five different directions.
- **Give one element a unique move** → call `slideIn(el, { ... })` directly.
  It accepts `direction`, `distance`, `duration`, `ease`, `start`, `once`,
  `opacity`, `scale`, `delay`, `blur`, `rotation` and `transformOrigin`; pass
  `blur` and `rotation` only on one-shot (non-scrubbed) entrances.
- **Add a new element type** → add a token group to `MOTION` and a builder branch
  behind `if (narrow)`. Never add a mobile gesture outside a `narrow` guard.

After any edit, bump the `?v=` query string on `home.css` / `home.js` in
[`index.html`](../index.html) — the site is served without a build step, so
cache-busting is manual.
