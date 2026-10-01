require('dotenv').config();
const db = require('./src/config/db');

async function run() {
  try {
    console.log('Dropping old check_order_status constraint...');
    await db.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_status;`);

    console.log('Adding updated check_order_status constraint...');
    await db.query(`
      ALTER TABLE orders ADD CONSTRAINT check_order_status 
      CHECK ((status)::text = ANY (ARRAY[
        'pending_payment'::text, 
        'queued'::text, 
        'accepted'::text, 
        'processing'::text, 
        'printing'::text, 
        'ready'::text, 
        'collected'::text, 
        'completed'::text, 
        'cancelled'::text, 
        'no_show'::text, 
        'in_progress'::text
      ]));
    `);
    console.log('Successfully updated check_order_status constraint!');

    // Now test updating Saa3669
    const testPrintOptions = {
      copies: 1,
      color: 'bw',
      size: 'A4',
      sides: 'single',
      orientation: 'portrait'
    };
    const o = await db.query("SELECT order_id, shop_id, status, print_options, files FROM orders WHERE order_id = 'Saa3669'");
    const order = o.rows[0];
    let files = order.files;
    if (typeof files === 'string') {
      try { files = JSON.parse(files); } catch (e) { files = []; }
    }
    if (Array.isArray(files) && files.length > 0) {
      const target = files[0].file_info ? files[0] : files[0];
      target.print_options = { ...(target.print_options || {}), ...testPrintOptions };
    }

    const querySql = `UPDATE orders 
         SET status = $1::text::order_status,
             print_options = jsonb_strip_nulls(COALESCE(print_options, '{}'::jsonb) || $3::jsonb),
             files = $4::jsonb,
             completed_at = CASE WHEN $1::text = 'collected' OR $1::text = 'cancelled' THEN NOW() ELSE completed_at END,
             secure_expires_at = CASE WHEN $1::text = 'cancelled' AND print_mode = 'secure' THEN NOW() + INTERVAL '15 minutes' ELSE secure_expires_at END
         WHERE order_id = $2 
         RETURNING *`;
    const queryParams = ['processing', 'Saa3669', JSON.stringify(testPrintOptions), JSON.stringify(files)];

    console.log('Running test update query for Saa3669 to processing...');
    const updateRes = await db.query(querySql, queryParams);
    console.log('UPDATE SUCCESS! New status:', updateRes.rows[0].status);

    // Revert Saa3669 back to 'ready' (or whatever its original status was)
    await db.query("UPDATE orders SET status = 'ready' WHERE order_id = 'Saa3669'");
    console.log('Reverted test order Saa3669 back to ready.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

run();
