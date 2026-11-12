"""Recapture experience section after ReLeaf Johannesburg addition."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8790"

async def shot(page, name):
    path = OUT / name
    await page.screenshot(path=str(path), type="jpeg", quality=80)
    print(f"wrote {path.name} {path.stat().st_size}")

async def settle(page, ms=900):
    await page.wait_for_timeout(ms)

async def scroll_el(page, selector, offset=90):
    await page.evaluate(
        """([sel, off]) => {
          const el = document.querySelector(sel);
          if (!el) throw new Error('missing ' + sel);
          const y = el.getBoundingClientRect().top + window.scrollY - off;
          window.scrollTo(0, Math.max(0, y));
        }""",
        [selector, offset],
    )
    await settle(page)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("#experience", timeout=30000)
        await settle(page, 800)
        await scroll_el(page, "#experience", 90)
        await shot(page, "desktop-3-experience.jpg")
        # scroll so ReLeaf card is in frame
        await scroll_el(page, ".xp-card:nth-of-type(4)", 120)
        await shot(page, "desktop-3b-releaf.jpg")
        await page.goto(BASE + "/experience/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("main", timeout=20000)
        # scroll to ReLeaf block
        await scroll_el(page, "article.role-block:nth-of-type(4)", 100)
        await shot(page, "desktop-experience-page-releaf.jpg")
        await ctx.close()

        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = await ctx.new_page()
        await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("#experience", timeout=30000)
        await settle(page, 800)
        await scroll_el(page, "#experience", 70)
        await shot(page, "mobile-2-experience.jpg")
        await scroll_el(page, ".xp-card:nth-of-type(4)", 90)
        await shot(page, "mobile-2b-releaf.jpg")
        await ctx.close()
        await browser.close()

asyncio.run(main())
