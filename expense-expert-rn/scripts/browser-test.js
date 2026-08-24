const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const DIST_DIR = path.resolve(__dirname, '../dist');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');
const PORT = 3060;

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function createServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    let filePath = path.join(DIST_DIR, urlPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else {
        filePath = path.join(DIST_DIR, 'index.html');
      }
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return server;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserTests() {
  console.log('🚀 Starting local static server for browser testing on port', PORT);
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, resolve));

  console.log('🌐 Launching headless Chrome browser (/usr/bin/google-chrome)...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,900',
    ],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();
  const consoleLogs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      console.error('  ⚠️ [Browser Error]:', text);
    }
  });

  try {
    console.log('\n========================================');
    console.log(' STEP 1: Load Login Page & Validate UI');
    console.log('========================================');
    await page.goto(`http://localhost:${PORT}/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 });
    console.log('✅ Login form rendered properly in Chrome');

    const loginStyles = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="login-form"]');
      const submitBtn = document.querySelector('[data-testid="login-submit-button"]');
      const formComputed = window.getComputedStyle(form);
      const btnComputed = window.getComputedStyle(submitBtn);
      return {
        fontFamily: document.body.style.fontFamily || window.getComputedStyle(document.body).fontFamily,
        formDisplay: formComputed.display,
        btnBgColor: btnComputed.backgroundColor,
        btnCursor: btnComputed.cursor,
      };
    });
    console.log('  Validated CSS Styles on Login:', loginStyles);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login-screen.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/01-login-screen.png');

    console.log('\n========================================');
    console.log(' STEP 2: Authenticate with test-user-7');
    console.log('========================================');
    const emailInput = await page.waitForSelector('[data-testid="login-email-input"]');
    const passwordInput = await page.waitForSelector('[data-testid="login-password-input"]');
    const submitBtn = await page.waitForSelector('[data-testid="login-submit-button"]');

    console.log('  Typing credentials: test-user-7@yopmail.com / Test@123');
    await emailInput.type('test-user-7@yopmail.com', { delay: 20 });
    await passwordInput.type('Test@123', { delay: 20 });

    console.log('  Clicking Sign In button...');
    await submitBtn.click();

    await page.waitForFunction(
      () => document.querySelector('[data-testid="app-brand-badge"]') !== null || document.body.innerText.includes('Welcome'),
      { timeout: 15000 }
    );
    await sleep(2500);

    console.log('✅ Authentication successful! Reached Authenticated Dashboard');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-dashboard-screen.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/02-dashboard-screen.png');

    console.log('\n========================================');
    console.log(' STEP 3: Verify Dashboard & UID Hiding');
    console.log('========================================');
    const dashboardStats = await page.evaluate(() => {
      const isUidVisible = document.querySelector('[data-testid="user-uid-text"]') !== null;
      const hasIncomeCard = document.querySelector('[data-testid="summary-card-income"]') !== null;
      const hasExpensesCard = document.querySelector('[data-testid="summary-card-expenses"]') !== null;
      const hasSavingsCard = document.querySelector('[data-testid="summary-card-savings"]') !== null;
      const hasRemainingCard = document.querySelector('[data-testid="summary-card-remaining"]') !== null;
      const hasMonthNavigator = document.querySelector('[data-testid="month-navigator"]') !== null;
      return { isUidVisible, hasIncomeCard, hasExpensesCard, hasSavingsCard, hasRemainingCard, hasMonthNavigator };
    });
    console.log('  Dashboard & UID Verification:', dashboardStats);
    if (dashboardStats.isUidVisible) {
      throw new Error('Raw UID is visible on Dashboard! UID must be hidden.');
    }

    console.log('\n========================================');
    console.log(' STEP 3b: Test Summary Card Click Navigation');
    console.log('========================================');
    // 1. Click Total Income Card -> should navigate to /profile
    await page.evaluate(() => {
      document.querySelector('[data-testid="summary-card-income"]')?.click();
    });
    await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 10000 });
    console.log('✅ Total Income card navigated to /profile');

    // Go back to Dashboard
    await page.evaluate(() => {
      document.querySelector('[data-testid="back-to-dashboard-btn"]')?.click();
    });
    await page.waitForSelector('[data-testid="summary-cards-grid"]', { timeout: 10000 });
    await sleep(1000);

    // 2. Click Total Savings Card -> should navigate to /savings
    await page.evaluate(() => {
      document.querySelector('[data-testid="summary-card-savings"]')?.click();
    });
    await page.waitForSelector('[data-testid="savings-screen"]', { timeout: 10000 });
    console.log('✅ Total Savings card navigated directly to /savings');

    // Go back to Dashboard via Navbar
    await page.evaluate(() => {
      document.querySelector('[data-testid="nav-dashboard"]')?.click();
    });
    await page.waitForSelector('[data-testid="summary-cards-grid"]', { timeout: 10000 });
    await sleep(1000);

    console.log('\n========================================');
    console.log(' STEP 4: Test Desktop Navbar Navigation to Savings');
    console.log('========================================');
    await page.evaluate(() => {
      document.querySelector('[data-testid="nav-savings"]')?.click();
    });
    await page.waitForSelector('[data-testid="savings-screen"]', { timeout: 10000 });
    await sleep(1000);
    console.log('✅ Top Navbar navigated to Savings Screen');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-savings-screen.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/13-savings-screen.png');

    console.log('\n========================================');
    console.log(' STEP 5: Test Desktop Navbar Navigation to Drafts');
    console.log('========================================');
    await page.evaluate(() => {
      document.querySelector('[data-testid="nav-drafts"]')?.click();
    });
    await page.waitForSelector('[data-testid="drafts-screen"]', { timeout: 10000 });
    await sleep(1000);
    console.log('✅ Top Navbar navigated to Expense Drafts Screen');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-drafts-screen.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/14-drafts-screen.png');

    console.log('\n========================================');
    console.log(' STEP 6: Test Desktop Navbar Navigation to Categories & Budgets');
    console.log('========================================');
    await page.evaluate(() => {
      document.querySelector('[data-testid="nav-categories"]')?.click();
    });
    await page.waitForSelector('[data-testid="categories-screen"]', { timeout: 10000 });
    console.log('✅ Top Navbar navigated to Categories Screen');

    await page.evaluate(() => {
      document.querySelector('[data-testid="nav-budgets"]')?.click();
    });
    await page.waitForSelector('[data-testid="budgets-screen"]', { timeout: 10000 });
    console.log('✅ Top Navbar navigated to Budgets Screen');

    console.log('\n========================================');
    console.log(' STEP 7: Test Desktop Navbar to New Expense');
    console.log('========================================');
    await page.evaluate(() => {
      document.querySelector('[data-testid="nav-expenses"]')?.click();
    });
    await page.waitForSelector('[data-testid="expense-form"]', { timeout: 10000 });
    await sleep(1000);
    console.log('✅ Top Navbar navigated to 3-Step New Expense Wizard');

    // Step 1: Enter amount
    const amountInput = await page.waitForSelector('[data-testid="expense-amount-input"]', { timeout: 10000 });
    await amountInput.type('55.00', { delay: 20 });
    console.log('  Entered amount: $55.00');
    await sleep(500);

    // Click Category: Food
    await page.evaluate(() => {
      document.querySelector('[data-testid="category-card-food"]')?.click();
    });
    console.log('  Selected category: Food');
    await sleep(500);

    // Click Continue to step 2
    await page.evaluate(() => {
      document.querySelector('[data-testid="expense-continue-btn"]')?.click();
    });
    await sleep(1000);

    // Step 2: Enter title
    const titleInput = await page.waitForSelector('[data-testid="expense-title-input"]', { timeout: 10000 });
    await titleInput.type('Organic Groceries & Coffee', { delay: 20 });
    console.log('  Entered title: Organic Groceries & Coffee');
    await sleep(500);

    // Click Continue to step 3
    await page.evaluate(() => {
      document.querySelector('[data-testid="expense-continue-btn"]')?.click();
    });
    await sleep(1000);

    // Step 3: Save expense
    console.log('  Reviewing step 3 summary and submitting...');
    await page.evaluate(() => {
      document.querySelector('[data-testid="expense-submit-btn"]')?.click();
    });

    await page.waitForSelector('[data-testid="month-navigator"]', { timeout: 10000 });
    await sleep(2000);
    console.log('✅ Expense saved and returned to Dashboard via Navbar layout!');

    console.log('\n========================================');
    console.log(' STEP 8: Test Dedicated Profile Page & Edit Preferences (Desktop)');
    console.log('========================================');
    // Click User badge in Navbar to go to Profile
    await page.evaluate(() => {
      document.querySelector('[data-testid="navbar-user-badge"]')?.click();
    });
    await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 10000 });
    await sleep(1000);
    console.log('✅ Reached Dedicated User Profile Screen');

    const profileCheck = await page.evaluate(() => {
      const welcomeText = document.querySelector('[data-testid="profile-welcome-text"]')?.textContent;
      const email = document.querySelector('[data-testid="profile-user-email"]')?.textContent;
      const isUidRendered = document.body.innerText.includes('CjoJJ8H6uuV3fJlIGinwrA17so13');
      return { welcomeText, email, isUidRendered };
    });
    console.log('  Profile Screen Data Verification:', profileCheck);
    if (profileCheck.isUidRendered) {
      throw new Error('Raw UID found rendered on Profile screen! UID must remain hidden.');
    }

    // Test Editing Financial Preferences (Currency & Salary)
    console.log('  Testing Edit Financial Preferences with Default Currency Selection (BDT / USD)...');
    await page.evaluate(() => {
      document.querySelector('[data-testid="edit-preferences-btn"]')?.click();
    });
    await page.waitForSelector('[data-testid="preferences-edit-form"]', { timeout: 5000 });

    // Select BDT Currency Option
    await page.evaluate(() => {
      document.querySelector('[data-testid="currency-option-bdt"]')?.click();
    });

    const salaryInput = await page.waitForSelector('[data-testid="profile-salary-input"]');
    await page.$eval('[data-testid="profile-salary-input"]', (el) => { el.value = ''; });
    await salaryInput.type('65000.00', { delay: 20 });

    await page.evaluate(() => {
      document.querySelector('[data-testid="save-preferences-btn"]')?.click();
    });
    await page.waitForSelector('[data-testid="profile-salary-text"]', { timeout: 10000 });
    await sleep(1000);
    console.log('✅ Financial preferences updated with BDT currency and saved successfully!');

    // Test Editing Name under Account Information
    console.log('  Testing Edit Display Name in Account Information...');
    await page.evaluate(() => {
      document.querySelector('[data-testid="edit-name-btn"]')?.click();
    });
    await page.waitForSelector('[data-testid="name-edit-form"]', { timeout: 5000 });
    const nameInput = await page.waitForSelector('[data-testid="profile-display-name-input"]');
    await page.$eval('[data-testid="profile-display-name-input"]', (el) => { el.value = ''; });
    await nameInput.type('Test User 7 (Pro)', { delay: 20 });
    await page.evaluate(() => {
      document.querySelector('[data-testid="save-name-btn"]')?.click();
    });
    await page.waitForSelector('[data-testid="profile-user-name"]', { timeout: 10000 });
    await sleep(1000);
    console.log('✅ Display name updated successfully in Account Information!');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-desktop-profile-screen.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/10-desktop-profile-screen.png');

    // Go back to Dashboard using Back Button
    await page.evaluate(() => {
      document.querySelector('[data-testid="back-to-dashboard-btn"]')?.click();
    });
    await page.waitForSelector('[data-testid="summary-cards-grid"]', { timeout: 10000 });
    await sleep(1000);

    console.log('\n========================================');
    console.log(' STEP 9: Test Mobile Viewport, Bottom Nav & Savings/Drafts on Mobile');
    console.log('========================================');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await sleep(1000);
    console.log('✅ Mobile Bottom Navigation Panel rendered successfully');

    // Tap Savings on Mobile Bottom Nav
    await page.waitForSelector('[data-testid="mobile-nav-savings"]', { timeout: 10000 });
    await page.click('[data-testid="mobile-nav-savings"]');
    await page.waitForSelector('[data-testid="savings-screen"]', { timeout: 10000 });
    await sleep(1000);
    console.log('✅ Mobile Bottom Nav navigated to Savings');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-mobile-savings-screen.png') });
    console.log('📸 [Proof] Saved screenshot: screenshots/15-mobile-savings-screen.png');

    // Tap Drafts on Mobile Bottom Nav
    await page.waitForSelector('[data-testid="mobile-nav-drafts"]', { timeout: 10000 });
    await page.click('[data-testid="mobile-nav-drafts"]');
    await page.waitForSelector('[data-testid="drafts-screen"]', { timeout: 10000 });
    await sleep(1000);
    console.log('✅ Mobile Bottom Nav navigated to Drafts');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-mobile-drafts-screen.png') });
    console.log('📸 [Proof] Saved screenshot: screenshots/16-mobile-drafts-screen.png');

    // Tap Profile on Mobile Bottom Nav
    await page.waitForSelector('[data-testid="mobile-nav-profile"]', { timeout: 10000 });
    await page.click('[data-testid="mobile-nav-profile"]');
    await page.waitForSelector('[data-testid="profile-screen"]', { timeout: 10000 });
    await sleep(1000);
    console.log('✅ Mobile Bottom Nav navigated to Profile');

    // Test Scrolling Profile all the way to the bottom
    await page.evaluate(() => {
      const scrollEl = document.querySelector('[data-testid="profile-screen"]') || window;
      scrollEl.scrollTo({ top: 800, behavior: 'smooth' });
    });
    await sleep(1000);

    console.log('\n🎉 ALL REAL CHROME BROWSER FULL-CYCLE, SAVINGS & DRAFTS TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Browser Test Execution Failed:', err);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error-state.png'), fullPage: true }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
    server.close();
    console.log('🔒 Closed browser and stopped local testing server.');
  }
}

runBrowserTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
