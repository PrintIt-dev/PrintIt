require('dotenv').config();
const pool = require('../src/config/db');

async function inspect() {
  try {
    const shops = await pool.query('SELECT shop_id, shop_code, name, address, phone, is_open, is_active, owner_id FROM shops');
    console.log('--- ALL SHOPS ---');
    console.log(shops.rows);

    for (const shop of shops.rows) {
      console.log(`\nShop: ${shop.name} (${shop.shop_id})`);
      const orders = await pool.query('SELECT count(*) FROM orders WHERE shop_id::text = $1', [shop.shop_id]);
      const storeOrders = await pool.query('SELECT count(*) FROM store_orders WHERE shop_id::text = $1', [shop.shop_id]);
      const inv = await pool.query('SELECT si.inventory_id, pc.title, si.price, si.stock_count FROM shop_inventory si JOIN product_catalog pc ON si.product_id = pc.product_id WHERE si.shop_id::text = $1', [shop.shop_id]);
      console.log(`  orders: ${orders.rows[0].count}`);
      console.log(`  store_orders: ${storeOrders.rows[0].count}`);
      console.log(`  shop_inventory count: ${inv.rows.length}`);
      console.log(`  items:`, inv.rows.map(i => `${i.title} (Qty: ${i.stock_count}, Price: ${i.price})`));
    }

    const fk = await pool.query(`SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, rc.delete_rule FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name JOIN information_schema.referential_constraints AS rc ON rc.constraint_name = tc.constraint_name WHERE ccu.table_name = 'shops'`);
    console.log('\nFKs referencing shops:', fk.rows);

    // Check store orders
    const allStoreOrders = await pool.query('SELECT count(*) FROM store_orders');
    console.log(`Total store orders: ${allStoreOrders.rows[0].count}`);

  } catch (err) {
    console.error('Error inspecting:', err);
  } finally {
    pool.end();
  }
}

inspect();
