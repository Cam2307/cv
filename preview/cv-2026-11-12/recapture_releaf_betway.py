import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8790"

async def settle(page, ms=900):
    await page.wait_for_timeout(ms)

async def shot(page, name):
    path = OUT / name
    await page.screenshot(path=str(path), type="jpeg", quality=85)
    print(f"wrote {path.name} {path.stat().st_size}")

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
        # 4th card ReLeaf, 5th Betway
        await scroll_el(page, ".xp-card:nth-of-type(4)", 110)
        await shot(page, "desktop-3b-releaf.jpg")
        await scroll_el(page, ".xp-card:nth-of-type(5)", 110)
        await shot(page, "desktop-3c-betway.jpg")
        await page.goto(BASE + "/experience/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("main", timeout=20000)
        await settle(page, 500)
        await scroll_el(page, "article.role-block:nth-of-type(4)", 90)
        await shot(page, "desktop-experience-page-releaf.jpg")
        await scroll_el(page, "article.role-block:nth-of-type(5)", 90)
        await shot(page, "desktop-experience-page-betway.jpg")
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
        await scroll_el(page, ".xp-card:nth-of-type(4)", 80)
        await shot(page, "mobile-2b-releaf.jpg")
        await scroll_el(page, ".xp-card:nth-of-type(5)", 80)
        await shot(page, "mobile-2c-betway.jpg")
        await ctx.close()
        await browser.close()

asyncio.run(main())
