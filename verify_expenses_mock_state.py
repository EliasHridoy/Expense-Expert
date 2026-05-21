import asyncio
from playwright.async_api import async_playwright
import json

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Try to set local storage directly before navigating
        await page.goto("http://localhost:4200/")

        # We might need to mock auth state by executing JS
        await page.evaluate('''() => {
            localStorage.setItem('firebase:authUser:YOUR_API_KEY:[DEFAULT]', JSON.stringify({
                uid: "mock-user-123",
                email: "test@example.com",
                displayName: "Mock User",
                stsTokenManager: {
                    accessToken: "mock-token",
                    expirationTime: Date.now() + 3600000,
                    refreshToken: "mock-refresh"
                }
            }));
        }''')

        print("Navigating to expenses...")
        await page.goto("http://localhost:4200/expenses")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(3000)

        await page.screenshot(path="/home/jules/verification/expenses_mocked_state.png")
        await browser.close()

asyncio.run(run())
