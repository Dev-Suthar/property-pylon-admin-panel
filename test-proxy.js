/**
 * Test script for the API Proxy Server
 * This script tests if the proxy server is working correctly
 */

import http from 'http';

const PROXY_PORT = process.env.PROXY_PORT || 3002;
const PROXY_URL = `http://localhost:${PROXY_PORT}`;

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, PROXY_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, headers: res.headers, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function runTests() {
    log('\n═══════════════════════════════════════════════════════════', 'blue');
    log('🧪 Testing API Proxy Server', 'blue');
    log('═══════════════════════════════════════════════════════════\n', 'blue');

    let passed = 0;
    let failed = 0;

    // Test 1: Health check
    log('Test 1: Health Check Endpoint', 'yellow');
    try {
        const response = await makeRequest('/health');
        if (response.status === 200 && response.data.status === 'ok') {
            log('  ✅ Health check passed', 'green');
            log(`     Status: ${response.data.status}`, 'green');
            log(`     Backend URL: ${response.data.backend_url}`, 'green');
            passed++;
        } else {
            log('  ❌ Health check failed', 'red');
            log(`     Expected status 200, got ${response.status}`, 'red');
            failed++;
        }
    } catch (error) {
        log('  ❌ Health check failed', 'red');
        log(`     Error: ${error.message}`, 'red');
        log('     Make sure the proxy server is running: npm run proxy', 'yellow');
        failed++;
    }

    // Test 2: Debug endpoint
    log('\nTest 2: Debug Endpoint', 'yellow');
    try {
        const response = await makeRequest('/debug');
        if (response.status === 200 && response.data.proxy_status === 'active') {
            log('  ✅ Debug endpoint passed', 'green');
            log(`     Proxy Status: ${response.data.proxy_status}`, 'green');
            log(`     Backend URL: ${response.data.backend_url}`, 'green');
            passed++;
        } else {
            log('  ❌ Debug endpoint failed', 'red');
            failed++;
        }
    } catch (error) {
        log('  ❌ Debug endpoint failed', 'red');
        log(`     Error: ${error.message}`, 'red');
        failed++;
    }

    // Summary
    log('\n═══════════════════════════════════════════════════════════', 'blue');
    log('📊 Test Results', 'blue');
    log('═══════════════════════════════════════════════════════════', 'blue');
    log(`✅ Passed: ${passed}`, 'green');
    log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    log('═══════════════════════════════════════════════════════════\n', 'blue');

    if (failed === 0) {
        log('🎉 All tests passed! The proxy server is working correctly.', 'green');
        process.exit(0);
    } else {
        log('⚠️  Some tests failed. Please check the proxy server configuration.', 'yellow');
        process.exit(1);
    }
}

// Run tests
runTests().catch((error) => {
    log(`\n❌ Test runner error: ${error.message}`, 'red');
    process.exit(1);
});

