import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        print("Navigating to app...")
        await page.goto("http://localhost:4200")

        print("Waiting for page load...")
        await page.wait_for_load_state("networkidle")

        html = await page.content()
        with open("/home/jules/verification/login_page.html", "w") as f:
            f.write(html)

        print("Done.")
        await browser.close()

asyncio.run(run())
