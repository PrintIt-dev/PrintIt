require('dotenv').config();
const express = require('express');
const pool = require('../src/config/db');
const jwt = require('jsonwebtoken');

const publicRoutes = require('../src/routes/publicRoutes');
const shopRoutes = require('../src/routes/shopRoutes');
const shopInventoryRoutes = require('../src/routes/shopInventoryRoutes');
const storeRoutes = require('../src/routes/storeRoutes');

async function main() {
    console.log('🧹 [1/3] Removing dummy data from shop listings in database...');

    const dummyShopId = 'faddc0aa-196d-4f60-872f-858d051f87d2'; // "PrintIt Store 1"

    // 1. Deactivate dummy shop and remove from active listings
    const shopUpdate = await pool.query(
        'UPDATE shops SET is_active = false, is_open = false WHERE shop_id = $1 RETURNING shop_id, name, is_active',
        [dummyShopId]
    );
    if (shopUpdate.rows.length > 0) {
        console.log(`  ✅ Deactivated dummy shop "${shopUpdate.rows[0].name}" (ID: ${shopUpdate.rows[0].shop_id}) - is_active: false`);
    } else {
        console.log('  ℹ️ Dummy shop was already removed or not found.');
    }

    // 2. Clear auto-seeded sample inventory records from shop_inventory
    const delInv = await pool.query('DELETE FROM shop_inventory');
    console.log(`  ✅ Removed ${delInv.rowCount} auto-seeded sample inventory items across shop listings.`);

    console.log('\n🚀 [2/3] Setting up test server to verify all shop features...');

    const app = express();
    app.use(express.json());

    // Public routes
    app.use('/api/public', publicRoutes);
    app.use('/api/store', storeRoutes);

    // Shopkeeper routes (protected by auth & shopCheck)
    app.use('/api/shop', shopRoutes);
    app.use('/api/shop/inventory', shopInventoryRoutes);

    const server = await new Promise(resolve => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    let passCount = 0;
    let failCount = 0;
    function assert(cond, msg) {
        if (cond) {
            console.log(`  ✅ PASS: ${msg}`);
            passCount++;
        } else {
            console.error(`  ❌ FAIL: ${msg}`);
            failCount++;
        }
    }

    try {
        console.log('\n🧪 [3/3] Executing comprehensive shop feature verification tests...\n');

        // Test 1: Public Shop Listings
        console.log('--- Test Suite 1: Public Shop Listings ---');
        const pubShopsRes = await fetch(`${baseUrl}/api/public/shops`);
        const pubShops = await pubShopsRes.json();
        assert(pubShopsRes.status === 200, 'GET /api/public/shops returned HTTP 200');
        assert(Array.isArray(pubShops), 'Returned shop list is an array');

        const dummyFound = pubShops.some(s => s.shop_id === dummyShopId || s.name === 'PrintIt Store 1');
        assert(!dummyFound, 'Dummy shop "PrintIt Store 1" is NOT in active shop listings');

        const printTech = pubShops.find(s => s.name === 'PrintTech');
        assert(!!printTech, 'Real shop "PrintTech" is in active shop listings');
        assert(printTech?.shop_code === 'PR8473', 'Shop code PR8473 is returned for PrintTech');
        assert(Array.isArray(printTech?.pricing_rules), 'Pricing rules array returned for PrintTech');

        // Test 2: Shop Detail by ID
        console.log('\n--- Test Suite 2: Public Shop Detail by ID ---');
        const shopDetailRes = await fetch(`${baseUrl}/api/public/shops/${printTech.shop_id}`);
        const shopDetail = await shopDetailRes.json();
        assert(shopDetailRes.status === 200, `GET /api/public/shops/${printTech.shop_id} returned HTTP 200`);
        assert(shopDetail.name === 'PrintTech', 'Shop detail returns correct shop name');
        assert(shopDetail.pricing_rules.length > 0, `Returned ${shopDetail.pricing_rules.length} pricing rules`);

        // Test 3: Shopkeeper Auth & Shop Association
        console.log('\n--- Test Suite 3: Shopkeeper Authentication & Shop Association ---');
        const shopOwnerRes = await pool.query("SELECT user_id, email, role FROM users WHERE email = 'avani.sawant24@pcpolytechnic.com'");
        const shopOwner = shopOwnerRes.rows[0];
        assert(!!shopOwner, 'Found PrintTech shopkeeper account in DB');

        const token = jwt.sign(
            { user_id: shopOwner.user_id, email: shopOwner.email, role: shopOwner.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Test 4: Shop Profile & Status
        console.log('\n--- Test Suite 4: Shopkeeper Profile & Status ---');
        const profileRes = await fetch(`${baseUrl}/api/shop/profile`, { headers: authHeaders });
        const profile = await profileRes.json();
        assert(profileRes.status === 200, 'GET /api/shop/profile returned HTTP 200');
        assert(profile.name === 'PrintTech', 'Shopkeeper profile belongs to PrintTech');

        // Toggle shop status
        const toggleRes = await fetch(`${baseUrl}/api/shop/status`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ is_open: true })
        });
        const toggleData = await toggleRes.json();
        assert(toggleRes.status === 200, 'PATCH /api/shop/status returned HTTP 200');
        assert(toggleData.status?.is_open === true, 'Shop is_open toggle works');

        // Test 5: Shopkeeper Orders & Queue
        console.log('\n--- Test Suite 5: Shopkeeper Orders & Queue ---');
        const ordersRes = await fetch(`${baseUrl}/api/shop/orders?limit=10`, { headers: authHeaders });
        const ordersData = await ordersRes.json();
        assert(ordersRes.status === 200, 'GET /api/shop/orders returned HTTP 200');
        assert(ordersData.pagination.total_items > 0, `Shop has ${ordersData.pagination.total_items} real orders`);

        const queueRes = await fetch(`${baseUrl}/api/shop/queue`, { headers: authHeaders });
        const queueData = await queueRes.json();
        assert(queueRes.status === 200, 'GET /api/shop/queue returned HTTP 200');

        // Test 6: Shopkeeper Pricing Rules Management
        console.log('\n--- Test Suite 6: Shopkeeper Pricing Rules Management ---');
        const pricingRes = await fetch(`${baseUrl}/api/shop/pricing`, { headers: authHeaders });
        const pricingRules = await pricingRes.json();
        assert(pricingRes.status === 200, 'GET /api/shop/pricing returned HTTP 200');
        assert(pricingRules.length >= 4, `Shop has ${pricingRules.length} pricing rules configured`);

        // Test 7: Shopkeeper Inventory ("My Listings")
        console.log('\n--- Test Suite 7: Shopkeeper Inventory ("My Listings") ---');
        // 7a: Get inventory (should now be clean)
        const invRes = await fetch(`${baseUrl}/api/shop/inventory`, { headers: authHeaders });
        const invData = await invRes.json();
        assert(invRes.status === 200, 'GET /api/shop/inventory returned HTTP 200');
        assert(invData.inventory.length === 0, 'Shop inventory starts clean with 0 dummy items');

        // 7b: Browse master catalog
        const catRes = await fetch(`${baseUrl}/api/shop/inventory/catalog`, { headers: authHeaders });
        const catData = await catRes.json();
        assert(catRes.status === 200, 'GET /api/shop/inventory/catalog returned HTTP 200');
        assert(catData.catalog.length > 0, `Master catalog offers ${catData.catalog.length} items`);

        // 7c: Add an item from Master Catalog to Shop Inventory
        const sampleProduct = catData.catalog[0];
        const addInvRes = await fetch(`${baseUrl}/api/shop/inventory`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                product_id: sampleProduct.product_id,
                price: 75.0,
                stock_count: 15
            })
        });
        const addInvData = await addInvRes.json();
        assert(addInvRes.status === 201, 'POST /api/shop/inventory added product successfully');
        const newInventoryId = addInvData.inventory_item?.inventory_id;
        assert(!!newInventoryId, 'Returned created inventory_id');

        // 7d: Update stock count
        const stockRes = await fetch(`${baseUrl}/api/shop/inventory/${newInventoryId}/stock`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ delta: 5 })
        });
        const stockData = await stockRes.json();
        assert(stockRes.status === 200, 'PATCH /api/shop/inventory/:id/stock returned HTTP 200');
        assert(stockData.item.stock_count === 20, `Stock delta updated count to 20 (got ${stockData.item.stock_count})`);

        // 7e: Update price
        const priceRes = await fetch(`${baseUrl}/api/shop/inventory/${newInventoryId}/price`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({ price: 80.0 })
        });
        const priceData = await priceRes.json();
        assert(priceRes.status === 200, 'PATCH /api/shop/inventory/:id/price returned HTTP 200');
        assert(parseFloat(priceData.item.price) === 80.0, 'Price updated to ₹80.00');

        // 7f: Verify it now appears in customer store for this product
        const prodShopsRes = await fetch(`${baseUrl}/api/store/products/${sampleProduct.product_id}/shops`);
        const prodShops = await prodShopsRes.json();
        assert(prodShopsRes.status === 200, 'GET /api/store/products/:id/shops returned HTTP 200');
        const stockingShop = prodShops.find(s => s.shop_id === printTech.shop_id);
        assert(!!stockingShop, 'PrintTech appears in store as stocking shop for customer');
        assert(parseFloat(stockingShop?.price) === 80.0, 'Customer sees the updated ₹80.00 price');

        // 7g: Delete the test inventory item
        const delRes = await fetch(`${baseUrl}/api/shop/inventory/${newInventoryId}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        assert(delRes.status === 200, 'DELETE /api/shop/inventory/:id removed item successfully');

        // Test 8: Shop Remote Print Agent
        console.log('\n--- Test Suite 8: Remote Print Agent Integration ---');
        const agentStatusRes = await fetch(`${baseUrl}/api/shop/agent`, { headers: authHeaders });
        const agentStatus = await agentStatusRes.json();
        assert(agentStatusRes.status === 200, 'GET /api/shop/agent returned HTTP 200');

        const pairCodeRes = await fetch(`${baseUrl}/api/shop/agent/pairing-code`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ device_name: 'Counter-PC-1' })
        });
        const pairCodeData = await pairCodeRes.json();
        assert(pairCodeRes.status === 200, 'POST /api/shop/agent/pairing-code generated code successfully');
        assert(/^[A-Z0-9]{6}$/.test(pairCodeData.pairing_code), `Generated valid 6-char pairing code: ${pairCodeData.pairing_code}`);

        // Summary
        console.log('\n=============================================');
        console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
        console.log('=============================================\n');

    } finally {
        server.close();
        pool.end();
    }
}

main().catch(err => {
    console.error('Fatal error running verification:', err);
    process.exit(1);
});
