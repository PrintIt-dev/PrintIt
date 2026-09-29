const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const shopCheck = require('../middleware/shopCheck');

// All shop inventory & store order routes require auth & shop ownership
router.use(auth);
router.use(shopCheck);

/**
 * @route   GET /api/shop/inventory
 * @desc    Get all inventory items for current shopkeeper
 * @access  Private (Shopkeeper)
 */
router.get('/', async (req, res) => {
    try {
        const { search, category } = req.query;

        let query = `
            SELECT 
                i.inventory_id,
                i.shop_id,
                i.product_id,
                i.price,
                i.stock_count,
                i.is_available,
                i.created_at,
                i.updated_at,
                p.title,
                p.description,
                p.category,
                p.branch,
                p.course_type,
                p.semester,
                p.subject,
                p.author,
                p.isbn,
                p.cover_photo_url,
                p.created_by,
                (p.created_by IS NOT NULL AND p.created_by = $2) AS is_custom
            FROM shop_inventory i
            JOIN product_catalog p ON i.product_id = p.product_id
            WHERE i.shop_id = $1
        `;
        const userId = req.user?.user_id;
        const params = [req.shop_id, userId];
        let paramIndex = 3;

        if (category && category !== 'All') {
            query += ` AND p.category ILIKE $${paramIndex++}`;
            params.push(category);
        }

        if (search && search.trim()) {
            query += ` AND (p.title ILIKE $${paramIndex} OR p.subject ILIKE $${paramIndex} OR p.author ILIKE $${paramIndex})`;
            params.push(`%${search.trim()}%`);
            paramIndex++;
        }

        query += ` ORDER BY i.updated_at DESC`;

        const result = await pool.query(query, params);
        res.json({ success: true, count: result.rows.length, inventory: result.rows });
    } catch (err) {
        console.error('Error fetching shop inventory:', err);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

/**
 * @route   GET /api/shop/inventory/catalog
 * @desc    Browse master catalog items with flag showing if shop already stocks them
 * @access  Private (Shopkeeper)
 */
router.get('/catalog', async (req, res) => {
    try {
        const { search, category } = req.query;

        let query = `
            SELECT 
                p.*,
                i.inventory_id,
                i.price AS current_price,
                i.stock_count AS current_stock,
                (i.inventory_id IS NOT NULL) AS is_stocked
            FROM product_catalog p
            LEFT JOIN shop_inventory i ON p.product_id = i.product_id AND i.shop_id = $1
            WHERE p.is_active = true
        `;
        const params = [req.shop_id];
        let paramIndex = 2;

        if (category && category !== 'All') {
            query += ` AND p.category ILIKE $${paramIndex++}`;
            params.push(category);
        }

        if (search && search.trim()) {
            query += ` AND (p.title ILIKE $${paramIndex} OR p.subject ILIKE $${paramIndex} OR p.author ILIKE $${paramIndex})`;
            params.push(`%${search.trim()}%`);
            paramIndex++;
        }

        query += ` ORDER BY p.title ASC`;

        const result = await pool.query(query, params);
        res.json({ success: true, count: result.rows.length, catalog: result.rows });
    } catch (err) {
        console.error('Error fetching master catalog for shopkeeper:', err);
        res.status(500).json({ error: 'Failed to fetch catalog' });
    }
});

/**
 * @route   POST /api/shop/inventory/custom-product
 * @desc    Create a custom product directly (not from master catalog) and add to shop's inventory
 * @access  Private (Shopkeeper)
 */
router.post('/custom-product', async (req, res) => {
    try {
        const {
            title,
            category,
            price,
            stock_count,
            description,
            branch,
            course_type,
            semester,
            subject,
            author,
            isbn,
            cover_photo_url
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Product title is required' });
        }

        const prodCategory = category && category.trim() ? category.trim() : 'Other';
        const numPrice = parseFloat(price);
        const numStock = parseInt(stock_count !== undefined ? stock_count : 0, 10);

        if (isNaN(numPrice) || numPrice < 0) {
            return res.status(400).json({ error: 'Valid positive selling price is required' });
        }

        if (isNaN(numStock) || numStock < 0) {
            return res.status(400).json({ error: 'Valid non-negative stock count is required' });
        }

        // 1. Insert directly into product_catalog
        const catInsert = await pool.query(
            `INSERT INTO product_catalog (
                title, description, category, branch, course_type,
                semester, subject, author, isbn, cover_photo_url,
                created_by, is_active
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, true
            ) RETURNING *`,
            [
                title.trim(),
                description ? description.trim() : null,
                prodCategory,
                branch ? branch.trim() : null,
                course_type ? course_type.trim() : null,
                semester ? semester.trim() : null,
                subject ? subject.trim() : null,
                author ? author.trim() : null,
                isbn ? isbn.trim() : null,
                cover_photo_url ? cover_photo_url.trim() : null,
                req.user?.user_id || null
            ]
        );

        const newProduct = catInsert.rows[0];

        // 2. Immediately add to shop_inventory
        const invInsert = await pool.query(
            `INSERT INTO shop_inventory (
                shop_id, product_id, price, stock_count, is_available, updated_at
            ) VALUES (
                $1, $2, $3, $4, ($4 > 0), NOW()
            ) RETURNING *`,
            [req.shop_id, newProduct.product_id, numPrice, numStock]
        );

        res.status(201).json({
            success: true,
            message: 'Custom product created and listed in your shop inventory successfully',
            product: newProduct,
            inventory_item: invInsert.rows[0]
        });
    } catch (err) {
        console.error('Error creating custom product:', err);
        res.status(500).json({ error: 'Failed to create product: ' + err.message });
    }
});

/**
 * @route   PUT /api/shop/inventory/custom-product/:productId
 * @desc    Update custom product details and pricing
 * @access  Private (Shopkeeper)
 */
router.put('/custom-product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const {
            title,
            category,
            price,
            stock_count,
            description,
            branch,
            course_type,
            semester,
            subject,
            author,
            isbn,
            cover_photo_url
        } = req.body;

        // Verify shop owns this in inventory
        const invRes = await pool.query(
            'SELECT inventory_id FROM shop_inventory WHERE shop_id = $1 AND product_id = $2',
            [req.shop_id, productId]
        );
        if (invRes.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found in your shop inventory' });
        }

        // Update product_catalog fields
        await pool.query(
            `UPDATE product_catalog SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                branch = COALESCE($4, branch),
                course_type = COALESCE($5, course_type),
                semester = COALESCE($6, semester),
                subject = COALESCE($7, subject),
                author = COALESCE($8, author),
                isbn = COALESCE($9, isbn),
                cover_photo_url = COALESCE($10, cover_photo_url)
             WHERE product_id = $11`,
            [
                title !== undefined ? title.trim() : null,
                description !== undefined ? description.trim() : null,
                category !== undefined ? category.trim() : null,
                branch !== undefined ? branch.trim() : null,
                course_type !== undefined ? course_type.trim() : null,
                semester !== undefined ? semester.trim() : null,
                subject !== undefined ? subject.trim() : null,
                author !== undefined ? author.trim() : null,
                isbn !== undefined ? isbn.trim() : null,
                cover_photo_url !== undefined ? cover_photo_url.trim() : null,
                productId
            ]
        );

        // Update inventory price & stock if supplied
        const invUpdates = [];
        const invParams = [req.shop_id, productId];
        let pIdx = 3;

        if (price !== undefined) {
            const numPrice = parseFloat(price);
            if (!isNaN(numPrice) && numPrice >= 0) {
                invUpdates.push(`price = $${pIdx++}`);
                invParams.push(numPrice);
            }
        }

        if (stock_count !== undefined) {
            const numStock = parseInt(stock_count, 10);
            if (!isNaN(numStock) && numStock >= 0) {
                invUpdates.push(`stock_count = $${pIdx++}`);
                invUpdates.push(`is_available = ($${pIdx - 1} > 0)`);
                invParams.push(numStock);
            }
        }

        if (invUpdates.length > 0) {
            invUpdates.push('updated_at = NOW()');
            await pool.query(
                `UPDATE shop_inventory SET ${invUpdates.join(', ')} WHERE shop_id = $1 AND product_id = $2`,
                invParams
            );
        }

        res.json({ success: true, message: 'Product updated successfully' });
    } catch (err) {
        console.error('Error updating custom product:', err);
        res.status(500).json({ error: 'Failed to update custom product: ' + err.message });
    }
});

/**
 * @route   POST /api/shop/inventory
 * @desc    Add or update a master catalog product in shop's inventory
 * @access  Private (Shopkeeper)
 */
router.post('/', async (req, res) => {
    try {
        const { product_id, price, stock_count } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'product_id is required' });
        }

        const numPrice = parseFloat(price);
        const numStock = parseInt(stock_count, 10);

        if (isNaN(numPrice) || numPrice < 0) {
            return res.status(400).json({ error: 'Valid positive price is required' });
        }

        if (isNaN(numStock) || numStock < 0) {
            return res.status(400).json({ error: 'Valid non-negative stock count is required' });
        }

        // Verify product exists in master catalog
        const prodCheck = await pool.query('SELECT product_id, title FROM product_catalog WHERE product_id = $1', [product_id]);
        if (prodCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Master product not found in catalog' });
        }

        const query = `
            INSERT INTO shop_inventory (shop_id, product_id, price, stock_count, is_available, updated_at)
            VALUES ($1, $2, $3, $4, true, NOW())
            ON CONFLICT (shop_id, product_id)
            DO UPDATE SET 
                price = EXCLUDED.price,
                stock_count = EXCLUDED.stock_count,
                is_available = true,
                updated_at = NOW()
            RETURNING *;
        `;

        const result = await pool.query(query, [req.shop_id, product_id, numPrice, numStock]);
        res.status(201).json({
            success: true,
            message: 'Inventory item saved successfully',
            inventory_item: result.rows[0]
        });
    } catch (err) {
        console.error('Error saving inventory item:', err);
        res.status(500).json({ error: 'Failed to save inventory item' });
    }
});

/**
 * @route   PATCH /api/shop/inventory/:id/stock
 * @desc    Quick adjust stock count
 * @access  Private (Shopkeeper)
 */
router.patch('/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_count, delta } = req.body;

        let query;
        let params;

        if (stock_count !== undefined) {
            const count = parseInt(stock_count, 10);
            if (isNaN(count) || count < 0) {
                return res.status(400).json({ error: 'Invalid stock count' });
            }
            query = `
                UPDATE shop_inventory 
                SET stock_count = $1, is_available = ($1 > 0), updated_at = NOW() 
                WHERE inventory_id = $2 AND shop_id = $3 
                RETURNING *
            `;
            params = [count, id, req.shop_id];
        } else if (delta !== undefined) {
            const change = parseInt(delta, 10);
            if (isNaN(change)) {
                return res.status(400).json({ error: 'Invalid stock delta' });
            }
            query = `
                UPDATE shop_inventory 
                SET stock_count = GREATEST(0, stock_count + $1), is_available = (GREATEST(0, stock_count + $1) > 0), updated_at = NOW() 
                WHERE inventory_id = $2 AND shop_id = $3 
                RETURNING *
            `;
            params = [change, id, req.shop_id];
        } else {
            return res.status(400).json({ error: 'Either stock_count or delta must be provided' });
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found for your shop' });
        }

        res.json({ success: true, message: 'Stock updated', item: result.rows[0] });
    } catch (err) {
        console.error('Error updating stock:', err);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

/**
 * @route   PATCH /api/shop/inventory/:id/price
 * @desc    Quick adjust item price
 * @access  Private (Shopkeeper)
 */
router.patch('/:id/price', async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;

        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0) {
            return res.status(400).json({ error: 'Valid positive price required' });
        }

        const result = await pool.query(
            `UPDATE shop_inventory 
             SET price = $1, updated_at = NOW() 
             WHERE inventory_id = $2 AND shop_id = $3 
             RETURNING *`,
            [numPrice, id, req.shop_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found for your shop' });
        }

        res.json({ success: true, message: 'Price updated', item: result.rows[0] });
    } catch (err) {
        console.error('Error updating price:', err);
        res.status(500).json({ error: 'Failed to update price' });
    }
});

/**
 * @route   DELETE /api/shop/inventory/:id
 * @desc    Remove an item from shop's inventory
 * @access  Private (Shopkeeper)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM shop_inventory WHERE inventory_id = $1 AND shop_id = $2 RETURNING inventory_id',
            [id, req.shop_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        res.json({ success: true, message: 'Item removed from inventory' });
    } catch (err) {
        console.error('Error removing inventory item:', err);
        res.status(500).json({ error: 'Failed to remove inventory item' });
    }
});

/**
 * @route   GET /api/shop/inventory/orders
 * @desc    Fetch store orders placed at this shop
 * @access  Private (Shopkeeper)
 */
router.get('/orders', async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT 
                so.*,
                u.full_name AS customer_name,
                u.phone AS customer_phone,
                u.email AS customer_email,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'order_item_id', soi.item_id,
                            'item_id', soi.item_id,
                            'product_id', soi.product_id,
                            'title', p.title,
                            'category', p.category,
                            'quantity', soi.quantity,
                            'unit_price', soi.unit_price,
                            'total_price', soi.subtotal,
                            'cover_photo_url', p.cover_photo_url
                        )
                    ) FILTER (WHERE soi.item_id IS NOT NULL), '[]'
                ) AS items
            FROM store_orders so
            LEFT JOIN users u ON so.customer_id = u.user_id
            LEFT JOIN store_order_items soi ON so.order_id = soi.order_id
            LEFT JOIN product_catalog p ON soi.product_id = p.product_id
            WHERE so.shop_id = $1
        `;

        const params = [req.shop_id];

        if (status && status !== 'all') {
            query += ` AND so.status = $2`;
            params.push(status);
        }

        query += ` GROUP BY so.order_id, u.user_id ORDER BY so.created_at DESC`;

        const result = await pool.query(query, params);
        res.json({ success: true, orders: result.rows });
    } catch (err) {
        console.error('Error fetching shop store orders:', err);
        res.status(500).json({ error: 'Failed to fetch store orders' });
    }
});

/**
 * @route   PATCH /api/shop/inventory/orders/:id/collect
 * @desc    Verify 4-digit pickup code and mark store order as collected
 * @access  Private (Shopkeeper)
 */
router.patch('/orders/:id/collect', async (req, res) => {
    try {
        const { id } = req.params;
        const { pickup_code } = req.body;

        if (!pickup_code) {
            return res.status(400).json({ error: '4-digit pickup code is required' });
        }

        const orderResult = await pool.query(
            'SELECT * FROM store_orders WHERE order_id = $1 AND shop_id = $2',
            [id, req.shop_id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found for this shop' });
        }

        const order = orderResult.rows[0];

        if (order.status === 'collected') {
            return res.status(400).json({ error: 'Order has already been collected' });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot collect a cancelled order' });
        }

        if (String(order.pickup_code).trim() !== String(pickup_code).trim()) {
            return res.status(400).json({ error: 'Invalid pickup code. Please ask customer to verify code in their app.' });
        }

        const updateResult = await pool.query(
            `UPDATE store_orders 
             SET status = 'collected', collected_at = NOW(), updated_at = NOW() 
             WHERE order_id = $1 
             RETURNING *`,
            [id]
        );

        res.json({
            success: true,
            message: 'Order verified and marked as collected!',
            order: updateResult.rows[0]
        });
    } catch (err) {
        console.error('Error collecting store order:', err);
        res.status(500).json({ error: 'Failed to complete order collection' });
    }
});

module.exports = router;
