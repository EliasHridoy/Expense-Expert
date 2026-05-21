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

        # We know we are on login page based on previous dump
        # Fill in sign in details
        print("Filling login form...")
        await page.fill('input[type="email"]', "test8@example.com")
        await page.fill('input[type="password"]', "password123")

        # Check if login button is enabled. The previous dump showed disabled.
        login_btn = page.locator('button:has-text("Sign in")')
        is_disabled = await login_btn.is_disabled()
        print(f"Login button disabled: {is_disabled}")

        if is_disabled:
            print("Button disabled, maybe try to sign up...")
            await page.click('text="Sign up"')
            await page.wait_for_load_state("networkidle")

            await page.fill('input[name="displayName"]', "Test User")
            await page.fill('input[name="email"]', "test8@example.com")
            await page.fill('input[name="password"]', "password123")

            signup_btn = page.locator('button:has-text("Sign up")')
            print(f"Signup button disabled: {await signup_btn.is_disabled()}")
            await signup_btn.click()
            await page.wait_for_timeout(3000)

        else:
            await login_btn.click()
            await page.wait_for_timeout(3000)

        print("Navigating to expenses...")
        await page.goto("http://localhost:4200/expenses")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)

        # Just screenshot the empty state to verify the controls are there
        await page.screenshot(path="/home/jules/verification/expenses_empty.png")

        await browser.close()

asyncio.run(run())
