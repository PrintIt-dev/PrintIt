require('dotenv').config();
const express = require('express');
const pool = require('../src/config/db');
const jwt = require('jsonwebtoken');

const publicRoutes = require('../src/routes/publicRoutes');
const shopInventoryRoutes = require('../src/routes/shopInventoryRoutes');
const storeRoutes = require('../src/routes/storeRoutes');

async function testCustomProductFlow() {
    console.log('🧪 Testing Custom Product Creation and Customer Visibility Flow...\n');
    const app = express();
    app.use(express.json());
    app.use('/api/public', publicRoutes);
    app.use('/api/store', storeRoutes);
    app.use('/api/shop/inventory', shopInventoryRoutes);

    const server = await new Promise(r => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        const ownerRes = await pool.query("SELECT user_id, email, role FROM users WHERE email = 'avani.sawant24@pcpolytechnic.com'");
        const owner = ownerRes.rows[0];
        const token = jwt.sign({ user_id: owner.user_id, email: owner.email, role: owner.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        // 1. Create custom product
        console.log('1. Calling POST /api/shop/inventory/custom-product...');
        const createRes = await fetch(`${baseUrl}/api/shop/inventory/custom-product`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: 'Advanced DBMS Handwritten Notes Test',
                category: 'Notes',
                price: 65.0,
                stock_count: 20,
                branch: 'Computer Science',
                semester: 'Sem 4',
                subject: 'Database Management Systems',
                author: 'Prof. Kulkarni',
                description: 'Complete unit 1-5 handwritten notes with solved questions'
            })
        });
        const createData = await createRes.json();
        console.log('   Status:', createRes.status, '| Message:', createData.message);
        if (createRes.status !== 201) throw new Error(`Failed to create: ${JSON.stringify(createData)}`);

        const prodId = createData.product.product_id;
        const invId = createData.inventory_item.inventory_id;
        console.log(`   ✅ Created product_id: ${prodId} | inventory_id: ${invId}`);

        // 2. Verify in shopkeeper's inventory
        console.log('\n2. Calling GET /api/shop/inventory (Shopkeeper view)...');
        const invRes = await fetch(`${baseUrl}/api/shop/inventory`, { headers });
        const invData = await invRes.json();
        const foundInShop = invData.inventory.find(i => i.product_id === prodId);
        console.log(`   Found in shop inventory: ${!!foundInShop} | is_custom: ${foundInShop?.is_custom}`);
        if (!foundInShop || !foundInShop.is_custom) throw new Error('Product not found in shop inventory as custom!');

        // 3. Verify in Customer Store (/store/products)
        console.log('\n3. Calling Customer GET /api/store/products?search=Advanced%20DBMS...');
        const custStoreRes = await fetch(`${baseUrl}/api/store/products?search=Advanced%20DBMS`);
        const custStoreData = await custStoreRes.json();
        const foundInStore = custStoreData.find(p => p.product_id === prodId);
        console.log(`   Found in customer store: ${!!foundInStore} | min_price: ₹${foundInStore?.min_price} | shops_count: ${foundInStore?.shops_count}`);
        if (!foundInStore || parseFloat(foundInStore.min_price) !== 65.0) throw new Error('Product not visible in customer store!');

        // 4. Verify in Customer Stocking Shops (/store/products/:id/shops)
        console.log(`\n4. Calling Customer GET /api/store/products/${prodId}/shops...`);
        const custShopsRes = await fetch(`${baseUrl}/api/store/products/${prodId}/shops`);
        const custShopsData = await custShopsRes.json();
        console.log(`   Stocking shops count: ${custShopsData.length}`);
        console.log(`   Shop name: ${custShopsData[0]?.shop_name} | Price: ₹${custShopsData[0]?.price} | Stock: ${custShopsData[0]?.stock_count}`);
        if (custShopsData.length === 0 || parseFloat(custShopsData[0]?.price) !== 65.0) throw new Error('Customer does not see shop stocking this product!');

        // 5. Update custom product
        console.log(`\n5. Calling PUT /api/shop/inventory/custom-product/${prodId}...`);
        const updateRes = await fetch(`${baseUrl}/api/shop/inventory/custom-product/${prodId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                price: 70.0,
                stock_count: 25,
                description: 'Updated notes with additional diagrams'
            })
        });
        const updateData = await updateRes.json();
        console.log('   Status:', updateRes.status, '| Message:', updateData.message);

        // 6. Verify updated price visible to customer
        console.log('\n6. Checking updated price in customer view...');
        const custShopsRes2 = await fetch(`${baseUrl}/api/store/products/${prodId}/shops`);
        const custShopsData2 = await custShopsRes2.json();
        console.log(`   Customer sees updated price: ₹${custShopsData2[0]?.price} | Stock: ${custShopsData2[0]?.stock_count}`);
        if (parseFloat(custShopsData2[0]?.price) !== 70.0 || custShopsData2[0]?.stock_count !== 25) {
            throw new Error('Updated price not reflected for customer!');
        }

        // 7. Cleanup
        console.log('\n7. Cleaning up test product...');
        await fetch(`${baseUrl}/api/shop/inventory/${invId}`, { method: 'DELETE', headers });
        await pool.query('DELETE FROM product_catalog WHERE product_id = $1', [prodId]);
        console.log('   ✅ Cleaned up test product.');

        console.log('\n======================================================');
        console.log('🎉 ALL TESTS PASSED! Shopkeepers can add custom products,');
        console.log('   and customers see them immediately under Store option.');
        console.log('======================================================\n');
    } finally {
        server.close();
        pool.end();
    }
}

testCustomProductFlow().catch(e => {
    console.error('Test error:', e);
    process.exit(1);
});
