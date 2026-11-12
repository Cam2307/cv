"""Recapture certifications (and assembled hero) with better framing."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent
BASE = "http://127.0.0.1:8790"

async def shot(page, name):
    path = OUT / name
    await page.screenshot(path=str(path), type="jpeg", quality=80)
    print(f"wrote {path.name} {path.stat().st_size}")

async def settle(page, ms=800):
    await page.wait_for_timeout(ms)

async def goto_home(page):
    await page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
    await page.wait_for_selector("section.hero", timeout=30000)
    await settle(page, 1000)

async def scroll_el(page, selector, offset=80):
    await page.evaluate(
        """([sel, off]) => {
          const el = document.querySelector(sel);
          if (!el) throw new Error('missing ' + sel);
          const y = el.getBoundingClientRect().top + window.scrollY - off;
          window.scrollTo(0, Math.max(0, y));
        }""",
        [selector, offset],
    )
    await settle(page, 1000)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = await ctx.new_page()
        await goto_home(page)
        # assembled hero: scroll a little to trigger assemble, then back to top
        await page.evaluate("window.scrollTo(0, Math.min(900, document.body.scrollHeight * 0.15))")
        await settle(page, 1500)
        await page.evaluate("window.scrollTo(0, 0)")
        await settle(page, 800)
        await shot(page, "desktop-1b-assembled.jpg")

        await scroll_el(page, ".certs-group", 90)
        await shot(page, "desktop-4-certifications.jpg")
        await scroll_el(page, ".certs-group:nth-of-type(2)", 90)
        await shot(page, "desktop-4b-certs-aiml.jpg")
        await scroll_el(page, ".certs-group:nth-of-type(3)", 90)
        await shot(page, "desktop-4c-certs-quant.jpg")
        await scroll_el(page, ".certs-group:nth-of-type(4)", 90)
        await shot(page, "desktop-4d-certs-cx.jpg")
        await ctx.close()

        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = await ctx.new_page()
        await goto_home(page)
        # assembled mobile hero
        await page.evaluate("window.scrollTo(0, 600)")
        await settle(page, 1500)
        await page.evaluate("window.scrollTo(0, 0)")
        await settle(page, 800)
        await shot(page, "mobile-1b-assembled.jpg")
        await scroll_el(page, "#certifications", 70)
        await shot(page, "mobile-3-certifications.jpg")
        await scroll_el(page, ".certs-group:nth-of-type(2)", 70)
        await shot(page, "mobile-3b-certs-aiml.jpg")
        await ctx.close()
        await browser.close()

asyncio.run(main())
