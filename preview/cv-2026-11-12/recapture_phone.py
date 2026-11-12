"""Recapture hero + phone closeups after phone profile declutter."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8790"


async def settle(page, ms=700):
    await page.wait_for_timeout(ms)


async def shot(page, name, **kwargs):
    path = OUT / name
    await page.screenshot(path=str(path), type="jpeg", quality=76, **kwargs)
    print(f"wrote {path.name} {path.stat().st_size}")


async def goto_home(page):
    await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
    await page.wait_for_selector("section.hero", timeout=30000)
    await settle(page, 1000)


async def scroll_hero_assembled(page):
    await goto_home(page)
    for _ in range(24):
        await page.mouse.wheel(0, 220)
        await settle(page, 180)
    await settle(page, 500)


async def phone_closeup(page, name):
    loc = page.locator(".phone-hero")
    await loc.scroll_into_view_if_needed()
    await settle(page, 400)
    box = await loc.bounding_box()
    if not box:
        await shot(page, name)
        return
    pad = 12
    clip = {
        "x": max(0, box["x"] - pad),
        "y": max(0, box["y"] - pad),
        "width": box["width"] + pad * 2,
        "height": box["height"] + pad * 2,
    }
    await shot(page, name, clip=clip)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        ctx = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
        )
        page = await ctx.new_page()
        await goto_home(page)
        await shot(page, "desktop-1-hero.jpg")
        await scroll_hero_assembled(page)
        await shot(page, "desktop-1b-assembled.jpg")
        await phone_closeup(page, "desktop-1c-phone-closeup.jpg")
        await ctx.close()

        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = await ctx.new_page()
        await goto_home(page)
        await shot(page, "mobile-1-hero.jpg")
        await scroll_hero_assembled(page)
        await shot(page, "mobile-1b-assembled.jpg")
        await phone_closeup(page, "mobile-1c-phone-closeup.jpg")
        await ctx.close()

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
