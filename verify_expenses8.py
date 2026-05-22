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

        # Click Sign up
        try:
            print("Clicking Sign up...")
            await page.click("text=Sign up", timeout=5000)
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(1000)

            # Fill in sign up details
            print("Filling registration form...")
            await page.fill('input[type="email"]', "test8@example.com")
            await page.fill('input[type="password"]', "password123")

            # Submit
            print("Submitting registration...")
            await page.click('button:has-text("Sign up")')

            # Wait for dashboard
            print("Waiting for dashboard...")
            await page.wait_for_selector('text=Dashboard', timeout=10000)
            await page.wait_for_timeout(2000)

        except Exception as e:
            print(f"Error during registration: {e}")
            await page.screenshot(path="/home/jules/verification/reg_error.png")

            # Try logging in if sign up failed
            print("Trying to login instead...")
            try:
                await page.goto("http://localhost:4200/auth/login")
                await page.wait_for_load_state("networkidle")
                await page.fill('input[type="email"]', "test8@example.com")
                await page.fill('input[type="password"]', "password123")
                await page.click('button:has-text("Sign in")')
                await page.wait_for_selector('text=Dashboard', timeout=10000)
                await page.wait_for_timeout(2000)
            except Exception as e2:
                print(f"Error during login: {e2}")
                await page.screenshot(path="/home/jules/verification/login_error.png")

        print("Navigating to add expense...")
        await page.goto("http://localhost:4200/expenses/new")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)

        try:
            print("Filling expense form...")
            await page.fill('input[formcontrolname="amount"]', "150.00")
            await page.select_option('select[formcontrolname="categoryId"]', index=1)
            await page.fill('input[formcontrolname="date"]', "2023-10-25")
            await page.fill('textarea[formcontrolname="notes"]', "Groceries test")

            print("Submitting expense...")
            await page.click('button:has-text("Save Expense")')
            await page.wait_for_timeout(2000)
        except Exception as e:
            print(f"Error adding expense: {e}")
            await page.screenshot(path="/home/jules/verification/add_expense_error.png")

        print("Navigating to expenses list...")
        await page.goto("http://localhost:4200/expenses")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)

        print("Taking screenshot of expenses list...")
        await page.screenshot(path="/home/jules/verification/expenses_list.png")

        # Test Grid view
        try:
            print("Clicking grid view...")
            # We have two buttons with SVG, the second one is grid. Let's find it.
            # Grid view button: The one with path d="M10 3H3V10H10V3Z M21 3H14V10H21V3Z M10 14H3V21H10V14Z M21 14H14V21H21V14Z"
            await page.click('button[title="Grid View"]')
            await page.wait_for_timeout(1000)
            await page.screenshot(path="/home/jules/verification/expenses_grid.png")
        except Exception as e:
            print(f"Error clicking grid: {e}")

        await browser.close()

asyncio.run(run())
