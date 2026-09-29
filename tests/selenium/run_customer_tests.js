const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const { createDriver } = require('./helpers/driver');
const { startStaticServer } = require('./helpers/static_server');
const { runCustomerTestSuite } = require('./customer_portal.test');

function checkHttp(url, timeoutMs = 2000) {
    return new Promise((resolve) => {
        const u = new URL(url);
        const req = http.request({
            hostname: u.hostname,
            port: u.port,
            path: u.pathname,
            method: 'GET',
            timeout: timeoutMs
        }, (res) => {
            resolve(true);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

async function waitForServer(url, name, maxWaitMs = 30000) {
    const start = Date.now();
    process.stdout.write(`⏳ Waiting for ${name} at ${url}... `);
    while (Date.now() - start < maxWaitMs) {
        const isUp = await checkHttp(url);
        if (isUp) {
            console.log('Online! ✅');
            return true;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log('Timed out! ❌');
    return false;
}

async function main() {
    console.log('================================================================');
    console.log('🧪 PRINTIT CUSTOMER PORTAL SELENIUM TEST RUNNER');
    console.log('================================================================\n');

    const spawnedProcesses = [];
    let customerStaticServer = null;
    const isWin = process.platform === 'win32';

    try {
        // 1. Check & start Backend if needed
        const backendUrl = 'http://127.0.0.1:3000/api/health';
        let backendRunning = await checkHttp(backendUrl);

        if (!backendRunning) {
            console.log('📦 Starting Backend server on port 3000...');
            const backendProc = spawn(isWin ? 'node.exe' : 'node', ['src/app.js'], {
                cwd: path.resolve(__dirname, '../../backend'),
                stdio: 'inherit',
                shell: false
            });
            spawnedProcesses.push(backendProc);
            const isReady = await waitForServer(backendUrl, 'Backend Server', 25000);
            if (!isReady) {
                throw new Error('Backend failed to start on port 3000');
            }
        } else {
            console.log('✅ Backend server is already running on port 3000.');
        }

        // 2. Check & start Customer Web Static Server on port 8080 if needed
        const customerUrl = 'http://127.0.0.1:8080/';
        let customerRunning = await checkHttp(customerUrl);

        if (!customerRunning) {
            console.log('📦 Starting Customer Web static server on port 8080...');
            const customerWebDir = path.resolve(__dirname, '../../customer_web');
            customerStaticServer = await startStaticServer(customerWebDir, 8080);
            console.log('✅ Customer Web static server running on port 8080.');
        } else {
            console.log('✅ Customer Web server is already running on port 8080.');
        }

        // 3. Initialize Headless Chrome WebDriver
        console.log('\n🌐 Initializing Headless Chrome WebDriver (412x915 mobile viewport)...');
        const driver = await createDriver({ headless: true, windowSize: '412,915' });
        console.log('✅ Chrome WebDriver initialized successfully.');

        // 4. Run Test Suite
        try {
            const results = await runCustomerTestSuite(driver, 'http://127.0.0.1:8080', 'http://127.0.0.1:3000');
            await driver.quit();

            if (results.failed > 0) {
                process.exit(1);
            } else {
                process.exit(0);
            }
        } catch (testError) {
            console.error('Fatal error during test execution:', testError);
            try { await driver.quit(); } catch (_) {}
            process.exit(1);
        }

    } catch (err) {
        console.error('Test runner setup error:', err.message);
        process.exit(1);
    } finally {
        if (customerStaticServer) {
            try {
                customerStaticServer.close();
            } catch (_) {}
        }
        for (const proc of spawnedProcesses) {
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
                } else {
                    proc.kill('SIGTERM');
                }
            } catch (_) {}
        }
    }
}

main();
