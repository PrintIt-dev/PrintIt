const { By, until } = require('selenium-webdriver');
const { takeScreenshot } = require('./helpers/driver');

/**
 * Execute the Customer Web Portal Selenium Test Suite
 */
async function runCustomerTestSuite(driver, baseUrl, backendUrl = 'http://127.0.0.1:3000') {
    console.log('\n================================================================');
    console.log('🚀 RUNNING SELENIUM SUITE: CUSTOMER WEB PORTAL');
    console.log(`🌐 Target Base URL: ${baseUrl}`);
    console.log(`📦 Backend API URL: ${backendUrl}`);
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        process.stdout.write(`• Testing: ${name}... `);
        try {
            await fn();
            console.log('✅ PASS');
            passed++;
        } catch (err) {
            console.log(`❌ FAIL\n  Error: ${err.message}`);
            failed++;
            await takeScreenshot(driver, `FAILURE_${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
        }
    }

    // -------------------------------------------------------------
    // Test 1: Customer Web Shell Loads with Branding & Scripts
    // -------------------------------------------------------------
    await test('01. Customer Web Shell loads with branding and Flutter scripts', async () => {
        await driver.get(baseUrl + '/');
        await driver.wait(until.elementLocated(By.tagName('body')), 10000);

        const title = await driver.getTitle();
        if (!title.toLowerCase().includes('printit') && !title.toLowerCase().includes('print it')) {
            throw new Error(`Expected page title to include 'PrintIt', got: '${title}'`);
        }

        const hasFlutterScript = await driver.executeScript(() => {
            return (
                typeof window._flutter !== 'undefined' ||
                document.querySelector('script[src*="flutter"]') !== null ||
                document.querySelector('script[src*="main.dart.js"]') !== null
            );
        });

        if (!hasFlutterScript) {
            throw new Error('Flutter bootstrap or application script not found in DOM');
        }

        await takeScreenshot(driver, 'customer_01_shell.png');
    });

    // -------------------------------------------------------------
    // Test 2: Login and Register Screens Navigation
    // -------------------------------------------------------------
    await test('02. Customer Login and Register Screen Navigation', async () => {
        // Navigate to Login screen
        await driver.get(baseUrl + '/#/login');
        await driver.sleep(2500);

        let currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes('/login')) {
            throw new Error(`Expected URL to contain /login, got: ${currentUrl}`);
        }
        await takeScreenshot(driver, 'customer_02_login.png');

        // Navigate to Register screen
        await driver.get(baseUrl + '/#/register');
        await driver.sleep(2500);

        currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes('/register')) {
            throw new Error(`Expected URL to contain /register, got: ${currentUrl}`);
        }
        await takeScreenshot(driver, 'customer_02_register.png');
    });

    // -------------------------------------------------------------
    // Test 3: Customer Authentication & Session Setup
    // -------------------------------------------------------------
    let authToken = null;
    await test('03. Customer Authentication & Session State Setup', async () => {
        // Authenticate via backend API to obtain a valid JWT
        const authRes = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'user1@printit.com',
                password: 'password123'
            })
        });

        if (!authRes.ok) {
            throw new Error(`Auth API returned status ${authRes.status}: ${await authRes.text()}`);
        }

        const authData = await authRes.json();
        authToken = authData.token;
        if (!authToken) {
            throw new Error('No authentication token returned from login API');
        }

        // Navigate to login page and inject credentials into localStorage
        await driver.get(baseUrl + '/#/login');
        await driver.sleep(1500);

        await driver.executeScript((jwtToken, apiBase) => {
            window.localStorage.setItem('flutter.token', JSON.stringify(jwtToken));
            window.localStorage.setItem('flutter.saved_server_url', JSON.stringify(apiBase));
        }, authToken, `${backendUrl}/api`);

        const storedToken = await driver.executeScript(() => {
            return window.localStorage.getItem('flutter.token');
        });

        if (!storedToken || !storedToken.includes(authToken)) {
            throw new Error('Failed to set authenticated session token in localStorage');
        }
    });

    // -------------------------------------------------------------
    // Test 4: Authenticated Customer Home Screen, Categories & Marketplace
    // -------------------------------------------------------------
    await test('04. Authenticated Home Screen, Categories, and Marketplace Navigation', async () => {
        // Home Screen
        await driver.get(baseUrl + '/#/home');
        await driver.sleep(3500);
        let url = await driver.getCurrentUrl();
        if (!url.includes('/home')) {
            throw new Error(`Expected URL to contain /home, got: ${url}`);
        }
        await takeScreenshot(driver, 'customer_03_home.png');

        // Browse Categories
        await driver.get(baseUrl + '/#/browse-categories');
        await driver.sleep(2500);
        await takeScreenshot(driver, 'customer_03_categories.png');

        // Shop List
        await driver.get(baseUrl + '/#/shop-list/all?name=All%20Shops');
        await driver.sleep(3000);
        await takeScreenshot(driver, 'customer_03_shop_list.png');

        // Stationery / Manuals Marketplace
        await driver.get(baseUrl + '/#/browse-manuals');
        await driver.sleep(3000);
        await takeScreenshot(driver, 'customer_03_marketplace.png');
    });

    // -------------------------------------------------------------
    // Test 5: Customer Order History Navigation
    // -------------------------------------------------------------
    await test('05. Customer Orders History Screen Navigation', async () => {
        await driver.get(baseUrl + '/#/orders');
        await driver.sleep(3000);

        const url = await driver.getCurrentUrl();
        if (!url.includes('/orders')) {
            throw new Error(`Expected URL to contain /orders, got: ${url}`);
        }
        await takeScreenshot(driver, 'customer_04_orders.png');
    });

    // -------------------------------------------------------------
    // Test 6: Customer Wallet Screen Navigation
    // -------------------------------------------------------------
    await test('06. Customer Wallet and Transactions Navigation', async () => {
        await driver.get(baseUrl + '/#/wallet');
        await driver.sleep(3000);

        const url = await driver.getCurrentUrl();
        if (!url.includes('/wallet')) {
            throw new Error(`Expected URL to contain /wallet, got: ${url}`);
        }
        await takeScreenshot(driver, 'customer_04_wallet.png');
    });

    // -------------------------------------------------------------
    // Test 7: Customer Profile & Help Screen Navigation
    // -------------------------------------------------------------
    await test('07. Customer Profile and Help Support Screens Navigation', async () => {
        // Profile
        await driver.get(baseUrl + '/#/profile');
        await driver.sleep(2500);
        let url = await driver.getCurrentUrl();
        if (!url.includes('/profile')) {
            throw new Error(`Expected URL to contain /profile, got: ${url}`);
        }
        await takeScreenshot(driver, 'customer_04_profile.png');

        // Help & Support
        await driver.get(baseUrl + '/#/help');
        await driver.sleep(2500);
        url = await driver.getCurrentUrl();
        if (!url.includes('/help')) {
            throw new Error(`Expected URL to contain /help, got: ${url}`);
        }
        await takeScreenshot(driver, 'customer_04_help.png');
    });

    // -------------------------------------------------------------
    // Test 8: Store Screen Navigation
    // -------------------------------------------------------------
    await test('08. Customer Store Marketplace Screen Navigation', async () => {
        await driver.get(baseUrl + '/#/store');
        await driver.sleep(3500);
        const url = await driver.getCurrentUrl();
        if (!url.includes('/store')) {
            throw new Error(`Expected URL to contain /store, got: ${url}`);
        }
        await takeScreenshot(driver, 'customer_05_store.png');
    });

    console.log('\n================================================================');
    console.log(`CUSTOMER PORTAL SELENIUM SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    return { passed, failed };
}

module.exports = {
    runCustomerTestSuite
};
