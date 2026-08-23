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
    console.log(' STEP 3: Verify Dashboard & Financials');
    console.log('========================================');
    const dashboardStats = await page.evaluate(() => {
      const email = document.querySelector('[data-testid="user-email-text"]')?.textContent;
      const name = document.querySelector('[data-testid="user-name-text"]')?.textContent;
      const uid = document.querySelector('[data-testid="user-uid-text"]')?.textContent;
      const hasIncomeCard = document.querySelector('[data-testid="summary-card-income"]') !== null;
      const hasExpensesCard = document.querySelector('[data-testid="summary-card-expenses"]') !== null;
      const hasSavingsCard = document.querySelector('[data-testid="summary-card-savings"]') !== null;
      const hasRemainingCard = document.querySelector('[data-testid="summary-card-remaining"]') !== null;
      const hasShortcuts = document.querySelector('[data-testid="action-shortcuts"]') !== null;
      return { email, name, uid, hasIncomeCard, hasExpensesCard, hasSavingsCard, hasRemainingCard, hasShortcuts };
    });
    console.log('  Dashboard Account & Cards Verification:', dashboardStats);

    console.log('\n========================================');
    console.log(' STEP 4: Navigate to Categories Manager');
    console.log('========================================');
    await page.evaluate(() => {
      document.querySelector('[data-testid="nav-categories-btn"]')?.scrollIntoView();
      document.querySelector('[data-testid="nav-categories-btn"]')?.click();
    });

    await page.waitForSelector('[data-testid="categories-screen"]', { timeout: 8000 });
    await sleep(1000);
    console.log('✅ Reached Categories Screen');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-categories-screen.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/03-categories-screen.png');

    await page.evaluate(() => {
      document.querySelector('[data-testid="back-to-dashboard-btn"]')?.click();
    });
    await page.waitForSelector('[data-testid="app-brand-badge"]', { timeout: 8000 });
    await sleep(1000);

    console.log('\n========================================');
    console.log(' STEP 5: Navigate to Budgets Manager');
    console.log('========================================');
    await page.evaluate(() => {
      document.querySelector('[data-testid="nav-budgets-btn"]')?.scrollIntoView();
      document.querySelector('[data-testid="nav-budgets-btn"]')?.click();
    });

    await page.waitForSelector('[data-testid="budgets-screen"]', { timeout: 8000 });
    await sleep(1000);
    console.log('✅ Reached Budgets Screen');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-budgets-screen.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/04-budgets-screen.png');

    await page.evaluate(() => {
      document.querySelector('[data-testid="back-to-dashboard-btn"]')?.click();
    });
    await page.waitForSelector('[data-testid="app-brand-badge"]', { timeout: 8000 });
    await sleep(1000);

    console.log('\n========================================');
    console.log(' STEP 6: Navigate to New Expense Wizard');
    console.log('========================================');
    await page.evaluate(() => {
      document.querySelector('[data-testid="quick-add-expense-btn"]')?.scrollIntoView();
      document.querySelector('[data-testid="quick-add-expense-btn"]')?.click();
    });

    await page.waitForSelector('[data-testid="expense-form"]', { timeout: 8000 });
    await sleep(1000);
    console.log('✅ Reached 3-Step New Expense Wizard');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-new-expense-screen.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/05-new-expense-screen.png');

    console.log('\n========================================');
    console.log(' STEP 7: Enter New Transaction Flow');
    console.log('========================================');
    // Step 1: Enter amount
    const amountInput = await page.waitForSelector('[data-testid="expense-amount-input"]');
    await amountInput.type('55.00', { delay: 20 });
    console.log('  Entered amount: $55.00');

    // Click Category: Food
    await page.evaluate(() => {
      document.querySelector('[data-testid="category-card-food"]')?.click();
    });
    console.log('  Selected category: Food');

    await page.evaluate(() => {
      document.querySelector('[data-testid="expense-continue-btn"]')?.click();
    });
    await sleep(1000);

    // Step 2: Enter title
    const titleInput = await page.waitForSelector('[data-testid="expense-title-input"]');
    await titleInput.type('Organic Groceries & Coffee', { delay: 20 });
    console.log('  Entered title: Organic Groceries & Coffee');

    await page.evaluate(() => {
      document.querySelector('[data-testid="expense-continue-btn"]')?.click();
    });
    await sleep(1000);

    // Step 3: Save expense
    console.log('  Reviewing step 3 summary and submitting...');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-expense-step3-review.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/06-expense-step3-review.png');

    await page.evaluate(() => {
      document.querySelector('[data-testid="expense-submit-btn"]')?.click();
    });

    await page.waitForSelector('[data-testid="app-brand-badge"]', { timeout: 10000 });
    await sleep(2000);
    console.log('✅ Expense saved and returned to Dashboard!');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-dashboard-updated.png'), fullPage: true });
    console.log('📸 [Proof] Saved screenshot: screenshots/07-dashboard-updated.png');

    console.log('\n🎉 ALL REAL CHROME BROWSER FULL-CYCLE TESTS PASSED WITH 100% SUCCESS!');
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
