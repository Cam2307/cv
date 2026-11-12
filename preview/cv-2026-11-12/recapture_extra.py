import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8790"

async def shot(page, name):
    path = OUT / name
    await page.screenshot(path=str(path), type="jpeg", quality=72)
    print(f"wrote {path.name} {path.stat().st_size}")

async def settle(page, ms=800):
    await page.wait_for_timeout(ms)

async def assemble_hero(page):
    await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
    await page.wait_for_selector("section.hero", timeout=30000)
    await settle(page, 800)
    for _ in range(30):
        txt = await page.locator("body").inner_text()
        if "16/16" in txt.replace(" ", "") or "16 / 16" in txt:
            break
        await page.mouse.wheel(0, 180)
        await settle(page, 220)
    await settle(page, 600)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = await ctx.new_page()
        await assemble_hero(page)
        await shot(page, "desktop-1b-assembled.jpg")

        await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        await settle(page, 600)
        await page.locator("#certs-title").scroll_into_view_if_needed()
        await page.evaluate("window.scrollBy(0, -90)")
        await settle(page, 800)
        await shot(page, "desktop-4-certifications.jpg")

        await page.locator("section.finale").scroll_into_view_if_needed()
        await page.evaluate("window.scrollBy(0, -40)")
        await settle(page, 800)
        await shot(page, "desktop-7-finale.jpg")
        await ctx.close()

        ctx = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
            reduced_motion="reduce",
        )
        page = await ctx.new_page()
        await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("section.hero", timeout=30000)
        await settle(page, 1000)
        await shot(page, "reduced-motion-desktop.jpg")
        await ctx.close()

        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = await ctx.new_page()
        await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        await settle(page, 800)
        await page.locator("#xp-title").scroll_into_view_if_needed()
        await page.evaluate("window.scrollBy(0, -70)")
        await settle(page, 900)
        await shot(page, "mobile-2-experience.jpg")
        await page.locator("#certs-title").scroll_into_view_if_needed()
        await page.evaluate("window.scrollBy(0, -70)")
        await settle(page, 900)
        await shot(page, "mobile-3-certifications.jpg")
        await ctx.close()

        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(BASE + "/projects/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("main", timeout=20000)
        await settle(page, 600)
        await shot(page, "desktop-6-projects.jpg")
        await ctx.close()
        await browser.close()

asyncio.run(main())
