import asyncio
from playwright.async_api import async_playwright, Route
import json

async def handle_route(route: Route):
    request = route.request
    print(f"Intercepted: {request.url}")
    # Mock firebase auth and API
    if "googleapis.com" in request.url or "firebase" in request.url:
        if "identitytoolkit/v3/relyingparty/verifyPassword" in request.url:
             await route.fulfill(
                 status=200,
                 content_type="application/json",
                 body=json.dumps({
                     "idToken": "fake-token",
                     "email": "test@example.com",
                     "refreshToken": "fake-refresh",
                     "expiresIn": "3600",
                     "localId": "fake-user-id",
                     "registered": True
                 })
             )
        else:
            await route.continue_()
    else:
        await route.continue_()

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()

        # Override geolocation/permissions if needed
        await context.grant_permissions([])

        page = await context.new_page()
        # Mock API calls to bypass Auth
        await context.route("**/*", handle_route)

        print("Navigating to app...")
        await page.goto("http://localhost:4200/auth/login")
        await page.wait_for_load_state("networkidle")

        print("Filling login form...")
        await page.fill('input[type="email"]', "test8@example.com")
        await page.fill('input[type="password"]', "password123")

        login_btn = page.locator('button:has-text("Sign in")')
        await login_btn.click()
        await page.wait_for_timeout(3000)

        print("Navigating to expenses...")
        await page.goto("http://localhost:4200/expenses")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)

        await page.screenshot(path="/home/jules/verification/expenses_mocked.png")
        await browser.close()

asyncio.run(run())
