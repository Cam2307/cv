"""Recapture CV landing screenshots from the correct local server."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8790"
JPEG = {"type": "jpeg", "quality": 72}

async def shot(page, name, full_page=False):
    path = OUT / name
    await page.screenshot(path=str(path), type="jpeg", quality=72, full_page=full_page)
    print(f"wrote {path.name} {path.stat().st_size}")

async def settle(page, ms=800):
    await page.wait_for_timeout(ms)

async def goto_home(page, reduced=False):
    await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
    await page.wait_for_selector("section.hero", timeout=30000)
    await settle(page, 1200)

async def scroll_to(page, selector):
    await page.locator(selector).first.scroll_into_view_if_needed()
    await settle(page, 900)

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Desktop
        ctx = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
        )
        page = await ctx.new_page()
        await goto_home(page)
        await shot(page, "desktop-1-hero.jpg")
        # mid: intro / start of experience
        await scroll_to(page, "section.intro")
        await shot(page, "desktop-2-mid.jpg")
        await scroll_to(page, "#experience")
        await shot(page, "desktop-3-experience.jpg")
        await scroll_to(page, "#certifications")
        await shot(page, "desktop-4-certifications.jpg")
        await ctx.close()

        # About and projects pages (desktop)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(BASE + "/about/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("main", timeout=20000)
        await settle(page, 600)
        await shot(page, "desktop-5-about.jpg")
        await page.goto(BASE + "/projects/", wait_until="networkidle", timeout=60000)
        await page.wait_for_selector("main", timeout=20000)
        await settle(page, 600)
        await shot(page, "desktop-6-projects.jpg")
        await ctx.close()

        # Finale
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = await ctx.new_page()
        await goto_home(page)
        await scroll_to(page, "section.finale")
        await shot(page, "desktop-7-finale.jpg")
        await ctx.close()

        # Reduced motion desktop: hero + jump to certs in one context, then hero shot + note
        ctx = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
            reduced_motion="reduce",
        )
        page = await ctx.new_page()
        await goto_home(page)
        await shot(page, "reduced-motion-desktop.jpg")
        await ctx.close()

        # Mobile
        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = await ctx.new_page()
        await goto_home(page)
        await shot(page, "mobile-1-hero.jpg")
        await scroll_to(page, "#experience")
        await shot(page, "mobile-2-experience.jpg")
        await scroll_to(page, "#certifications")
        await shot(page, "mobile-3-certifications.jpg")
        await ctx.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture())
