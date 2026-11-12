# CV landing content pass — 12 Nov 2026 (SAST)

**Branch:** `cv-landing` (local only, not pushed, not deployed)
**Content commit:** `bac7a0999fa0506c37c22f0d33a37277df37cf2d`
**Follow-up commit:** screenshots recaptured from the correct server, stronger portrait feather, UCT slot wording, projects lede (see git log)
**Base:** `827986b184153b16a60d4fedb4c71581741a790a`
**Backups:** git bundle `C:\Users\camdw\Desktop\EA_Generator\ea-site-local-backup-2026-11-12-pre-cv-content\cv-landing.bundle` and `C:\Users\camdw\Desktop\EA_Generator\ea-site-local-backup-827986b-2026-11-12.bundle`

## What changed

- **Portrait:** `assets/img/cameron-enhanced.jpg` (800×800) on the hero and finale, larger than the old 200px LinkedIn crop. Soft radial CSS mask feathers the edges into the page background (strengthened after the first pass so the light window behind the photo no longer reads as a hard square).
- **Home:** Intro, experience timeline (FuelU2 until recently; Pivotal Data / Connect with Quest Diagnostics, King Price, CCBA and Bupa; ReLeaf; Betway), education (honest incomplete BCom, UCT 2022, St Albans), skills, and a prominent grouped **Certifications** section with a UCT scan slot.
- **Subpages:** `experience/`, `about/`, and `projects/` are full content pages, no longer "Coming soon".
- **Cert PDF:** Udemy certificate copied to `assets/cv/certs/udemy-advanced-crypto-algorithmic-trading-2025.pdf` and linked (local PDF + Udemy verify URL).

## Certificate PDFs

| Status | Certificate |
|--------|-------------|
| **Linked (local file)** | Advanced Crypto strategies for Algorithmic trading 2024 (Udemy, issued 16 June 2025) — `assets/cv/certs/udemy-advanced-crypto-algorithmic-trading-2025.pdf` and https://ude.my/UC-058c1e8a-5141-4096-9cb1-e494a4d061df |
| **Listed, no PDF — scan slot on the page** | UCT Future of Money: Blockchain and Cryptocurrency (2022) |
| **Listed, no PDF found on the laptop** | LinkedIn/NASBA machine-learning and deep-learning courses (2024); Financial Derivatives: Quantitative Finance (Udemy, 2024); Algorithmic Trading & Finance Models (LinkedIn, 2024); Python Statistics (NASBA, 2024); Genesys Accredited Partner Presales Professional (2024); Five9 Sales Certified: Trade Center Prospect (2023); Five9 Inbound Administration, Outbound Administration, and Contact Center Essentials |

Searched Desktop, Documents, Downloads, Pictures and OneDrive. Tax, IRP5, medical aid, ID and recovery-code PDFs were ignored and not copied. Three short pdfmake PDFs in Downloads from 27 Mar 2025 looked like generated documents from the same day as EA user guides, not professional certificates.

## Cameron must supply

1. **UCT physical certificate scan** — drop it at `assets/cv/certs/uct-future-of-money-blockchain-2022.pdf` (or .jpg) so the featured card can be linked.
2. Optional PDFs for the LinkedIn, NASBA, Genesys, Five9 and remaining Udemy courses, into `assets/cv/certs/`.
3. **FuelU2 end date** when he is ready to publish a specific month (the site currently says "until recently").
4. A yes to push / deploy; nothing has been published.

## Screenshots

An earlier capture on port 8877 was wrong: that port was already serving another folder (a directory listing). Screenshots were recaptured from `http://127.0.0.1:8790/` (the ea-site-local server). Copies also live in `/workspace/cv-review/`.

Saved under `preview/cv-2026-11-12/`:

- `desktop-1-hero.jpg` (start, puzzle empty), `desktop-1b-assembled.jpg` (portrait assembled with faded edges)
- `desktop-2-mid.jpg`, `desktop-3-experience.jpg`, `desktop-4-certifications.jpg`, `desktop-5-about.jpg`, `desktop-6-projects.jpg`, `desktop-7-finale.jpg`
- `mobile-1-hero.jpg`, `mobile-2-experience.jpg`, `mobile-3-certifications.jpg`
- `reduced-motion-desktop.jpg`

## Local preview

- **URL:** http://127.0.0.1:8790/
- **Port:** 8790 (`py -3.11 -m http.server 8790 --bind 127.0.0.1` from the repo root). Do not use 8877; that port already belongs to another long-running server.

## Leftover issues

- Hero jigsaw still needs HTTP (not `file://`) for the canvas/halftone; the feathered `<img>` fallback remains.
- The certifications grid is long on mobile.
- Sticky nav can overlap the top of a section mid-scroll (visible in some screenshots).
- Not pushed, not deployed.