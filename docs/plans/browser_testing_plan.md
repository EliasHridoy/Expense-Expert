# Implementation Plan - Browser Testing with Test User

## Goal Description
Launch the Angular development server (`ng serve`) and perform browser-based end-to-end testing of the newly built **Shopping & Grocery Lists** feature using the test credentials defined in [`.env`](file:///mnt/5cf2a800-97fa-463a-878d-37bb8b42ecdb/Pet%20Project/Expense%20Expert/expense-expert/.env) (`EMAIL=test-user-7@yopmail.com`, `PASSWORD=Test@123`).

Testing will validate:
1. Successful authentication with the test user account.
2. Navigation to the Expenses page and launching the Shopping Lists feature via the new **"🛒 Shopping"** button.
3. Creation of an unplanned in-store shopping trip with line items, quantities, and prices.
4. Live total price auto-calculation.
5. Conversion to an expense via **"Save as Expense"**.
6. Appearance of the expense in `/expenses` with the 🛒 Shopping badge.
7. Expense Detail view inspection showing the **"View Shopping List"** button and navigation back to the itemized breakdown.
8. Creation and completion of a planned shopping checklist.

Visual screenshots will be captured at each stage and embedded into the final walkthrough.

---

## User Review Required

> [!NOTE]
> - **Active Desktop Environment Detected:** Your environment has active display (`DISPLAY=:0`, `WAYLAND_DISPLAY=wayland-0`). In addition to running automated screenshot verification, we will launch Google Chrome directly on your screen pointed to `http://localhost:4200` so you can test interactively.

---

## Proposed Execution Steps

### 1. Dev Server Startup
* Run `npm start` (`ng serve`) in the background.
* Wait for the local server to be ready and responding at `http://localhost:4200`.

### 2. Automated Browser Verification Script
* Create a lightweight test runner script using `puppeteer-core` connected to the local `/usr/bin/google-chrome` binary.
* The script will execute the following automated steps:
  1. **Login:** Navigate to `http://localhost:4200/auth/login`, enter credentials from `.env`, and submit.
  2. **Dashboard / Navigation:** Wait for redirection after login; navigate to `http://localhost:4200/expenses`.
  3. **Shopping Overview:** Click **"🛒 Shopping"**; verify the Shopping Lists view loads with tabs (`All`, `Planned`, `Completed`).
  4. **Create Shopping Trip (In-Store Flow):**
     * Click **"New Shopping List"**.
     * Fill List Name: *"Supermarket Test Run"*.
     * Add Item 1: *"Organic Apples"*, Qty: *"1 kg"*, Price: `4.50`.
     * Add Item 2: *"Whole Milk"*, Qty: *"2L"*, Price: `3.50`.
     * Verify the dynamic total displays `$8.00`.
     * Click **"Save as Expense"**.
  5. **Verify Expense & Linking:**
     * Confirm redirect to `/expenses`.
     * Verify the `$8.00` expense appears with the 🛒 badge.
     * Click into the expense to inspect the Detail view; confirm the **"View Shopping List"** button is present.
     * Click **"View Shopping List"**; confirm it navigates back to the itemized breakdown.
  6. **Planned Mode Test:**
     * Create a new plan *"Weekend Prep"* with items and $0 prices, click **"Save as Plan"**.
     * Verify it appears under the **"Planned"** filter tab.

### 3. Interactive Browser Launch
* Open Google Chrome on the user's desktop display (`google-chrome http://localhost:4200`) so the user can freely explore and test the interface.

---

## Verification Plan

### Automated Test Execution
```bash
# Start server and run automated browser verification script
node scratch/test-browser-flow.js
```
* Captures screenshots at every milestone:
  * `01-login-screen.png`
  * `02-expenses-page-with-shopping-btn.png`
  * `03-shopping-overview.png`
  * `04-shopping-form-with-items.png`
  * `05-expense-list-with-badge.png`
  * `06-expense-detail-with-link.png`

### Manual Verification
* User can interact with the open Chrome window at `http://localhost:4200` to test any additional edge cases.
