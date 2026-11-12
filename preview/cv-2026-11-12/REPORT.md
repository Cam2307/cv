# CV landing content pass — 12 Nov 2026 (SAST)

**Branch:** `cv-landing` (local only) · **Commit after work:** `bac7a0999fa0506c37c22f0d33a37277df37cf2d` · **Base:** `827986b184153b16a60d4fedb4c71581741a790a`  
**Backup:** git bundle `C:\Users\camdw\Desktop\EA_Generator\ea-site-local-backup-827986b-2026-11-12.bundle` · `preview/cv-2026-11-12/BACKUP_COMMIT.txt`

## What changed

- **Portrait:** `assets/img/cameron-enhanced.jpg` (800×800) on the hero and finale; larger board sizing; radial CSS mask for soft feathered edges; `assets/cv/portrait.js` crop updated for the hi-res source.
- **Home:** Intro, experience timeline (FuelU2 until recently; Pivotal/Connect detail; Betway; ReLeaf dates), education extras (UCT 2022, St Albans), skills copy, prominent grouped **Certifications** section with UCT scan slot.
- **Subpages:** `experience/`, `about/`, `projects/` are full content pages (`assets/cv/pages.css`), no longer “Coming soon”.
- **Cert PDF:** Udemy certificate copied to `assets/cv/certs/udemy-advanced-crypto-algorithmic-trading-2025.pdf` and linked from the landing page (local PDF + Udemy verify URL).

## Certificate PDFs

| Status | Certificate |
|--------|-------------|
| **Linked (local file)** | Advanced Crypto strategies for Algorithmic trading 2024 (Udemy, issued 16 June 2025) → `assets/cv/certs/udemy-advanced-crypto-algorithmic-trading-2025.pdf` |
| **Listed, no PDF on laptop** | UCT Future of Money: Blockchain and Cryptocurrency (2022) — scan slot on site |
| **Listed, no PDF on laptop** | All LinkedIn/NASBA ML courses, quant courses (except Udemy crypto above), Genesys/Five9 certs per March 2026 resume + extra Five9 admin courses from Feb 2025 CV |

## Cameron must supply

1. **UCT physical certificate scan** — place at `assets/cv/certs/uct-future-of-money-blockchain-2022.pdf` (or image) and add a download link on the UCT card.
2. **Optional:** PDFs for LinkedIn/NASBA/Genesys/Five9/derivatives courses if available (copy into `assets/cv/certs/` and link cards).
3. **FuelU2 end date** when he is ready to publish a specific month (currently “until recently” by instruction).
4. **Confirm** any additional cert PDFs found later on the laptop.

## Screenshots

Saved under `preview/cv-2026-11-12/`:

- `desktop-1-hero.jpg`, `desktop-2-mid.jpg`, `desktop-3-experience.jpg`, `desktop-4-certifications.jpg`, `desktop-5-about.jpg`, `desktop-6-projects.jpg`, `desktop-7-finale.jpg`
- `mobile-1-hero.jpg`, `mobile-2-experience.jpg`, `mobile-3-certifications.jpg`
- `reduced-motion-desktop.jpg`

## Local preview

- **URL:** http://127.0.0.1:8877/
- **Port:** 8877 (`python -m http.server 8877` from repo root)

## Leftover issues

- Zip tree backup under `preview/cv-2026-11-12/` failed (file lock); git bundle backup succeeded.
- Hero jigsaw still depends on HTTP (not `file://`) for canvas/halftone; feathered `<img>` fallback remains.
- Cert grid is long on mobile; acceptable for readability.
- Not pushed, not deployed (per brief).
