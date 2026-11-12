# CV LinkedIn sync — 12 Nov 2026 (SAST)

**Branch:** `cv-landing` (local only, not pushed, not deployed)

## What changed

- **Licenses:** All 15 LinkedIn licences on the home certifications section with canonical names, issuers, issue month/year, and `View credential` links (14 URLs; Genesys has thumbnail only). Featured: UCT **Blockchain and Digital Currency: The Future of Money** (2022 only) with scan slot; Udemy crypto PDF + ude.my verify link.
- **Thumbnails:** Five9 Triple Crown, Genesys Presales, Udemy Financial Derivatives (linked to credential URLs where applicable).
- **Removed:** Wrong Five9 admin/Trade Center certs, wrong UCT title, 2024 issue dates on 2025 certs, course durations (`6 hours`, instructor line).
- **Hero:** Monochrome phone mockup with stylised profile card (no LinkedIn branding): banner, jigsaw avatar, exact headline, Ballito, **500+ connections**, **549 followers**, abbreviated experience and licences.
- **Skills strip:** Top LinkedIn skills plus TypeScript, Flutter, CCaaS, presales, TensorFlow/NLP, deep learning, derivatives.
- **Experience / education:** Betway dates fixed (Sep–Dec 2019, Event Promotions); UCT title; St Alban's College; Lab27→FuelU2 and Genesys Seller note on experience page; quant wording on projects.
- **`source/`:** LinkedIn extracts committed-friendly; `source/index.html` blocks directory listing.

## Verify (http://127.0.0.1:8790/)

- 15 licence cards + UCT featured course
- Phone mockup fields present
- No course `hours` / `weeks` in HTML
- Crypto PDF opens from home

## Screenshots (`preview/cv-2026-11-12/`)

- `desktop-1-hero.jpg`, `desktop-1b-assembled.jpg`
- `desktop-2-mid.jpg`, `desktop-3-experience.jpg`, `desktop-4-certifications.jpg`
- `desktop-5-about.jpg`, `desktop-6-projects.jpg`, `desktop-7-finale.jpg`
- `mobile-1-hero.jpg`, `mobile-2-experience.jpg`, `mobile-3-certifications.jpg`
- `reduced-motion-desktop.jpg`

## Cameron must supply

1. UCT physical scan at `assets/cv/certs/uct-future-of-money-blockchain-2022.pdf` or `.jpg`
2. Optional PDFs for remaining LinkedIn/NASBA certs
3. FuelU2 end month if he wants a fixed date instead of “until recently”
4. Explicit go-ahead to push / deploy

## Local preview

`py -3.11 -m http.server 8790 --bind 127.0.0.1` from repo root → http://127.0.0.1:8790/
