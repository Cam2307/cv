"""Recapture simplified phone profile card."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8790"

async def shot(page, name):
    path = OUT / name
    await page.screenshot(path=str(path), type="jpeg", quality=85)
    print(f"wrote {path.name} {path.stat().st_size}")

async def settle(page, ms=900):
    await page.wait_for_timeout(ms)

async def closeup(page, name):
    loc = page.locator("figure.phone-hero")
    await loc.wait_for(state="visible")
    await loc.screenshot(path=str(OUT / name), type="jpeg", quality=90)
    print(f"wrote {name} {(OUT / name).stat().st_size}")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("figure.phone-hero", timeout=30000)
        await settle(page, 1200)
        await shot(page, "desktop-1-hero.jpg")
        await shot(page, "desktop-1b-assembled.jpg")
        await closeup(page, "desktop-1c-phone-closeup.jpg")
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
        await settle(page, 1200)
        await shot(page, "mobile-1-hero.jpg")
        await shot(page, "mobile-1b-assembled.jpg")
        await closeup(page, "mobile-1c-phone-closeup.jpg")
        await ctx.close()
        await browser.close()

asyncio.run(main())
