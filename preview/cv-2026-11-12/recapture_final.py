"""Recapture hero (with scroll cue), phone closeups, and experience/clients."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8790"

async def settle(page, ms=1000):
    await page.wait_for_timeout(ms)

async def shot(page, name):
    path = OUT / name
    await page.screenshot(path=str(path), type="jpeg", quality=85)
    print(f"wrote {path.name} {path.stat().st_size}")

async def closeup(page, name, selector="figure.phone-hero"):
    loc = page.locator(selector).first
    await loc.wait_for(state="visible")
    await loc.screenshot(path=str(OUT / name), type="jpeg", quality=90)
    print(f"wrote {name} {(OUT / name).stat().st_size}")

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
    await settle(page, 900)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("figure.phone-hero", timeout=30000)
        await settle(page, 1500)
        await shot(page, "desktop-1-hero.jpg")
        await closeup(page, "desktop-1c-phone-closeup.jpg")
        await scroll_el(page, "#experience .xp-card:nth-of-type(2)", 100)
        await shot(page, "desktop-3-experience.jpg")
        await page.goto(BASE + "/experience/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("main", timeout=20000)
        await settle(page, 600)
        await scroll_el(page, "article.role-block.role-block--highlight, article.role-block", 90)
        await shot(page, "desktop-experience-page-pivotal.jpg")
        await ctx.close()

        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = await ctx.new_page()
        await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("figure.phone-hero", timeout=30000)
        await settle(page, 1500)
        await shot(page, "mobile-1-hero.jpg")
        await closeup(page, "mobile-1c-phone-closeup.jpg")
        await scroll_el(page, "#experience .xp-card:nth-of-type(2)", 80)
        await shot(page, "mobile-2-experience.jpg")
        await ctx.close()
        await browser.close()

asyncio.run(main())
