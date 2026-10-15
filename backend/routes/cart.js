const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/cart
// Get current user's cart items
router.get('/', async (req, res, next) => {
    try {
        const [items] = await pool.query(`
            SELECT c.cart_item_id, c.product_id, c.quantity, p.name, p.price, p.sku, p.discount_percentage,
                   p.seller_id, u.name AS seller_name,
                   (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = TRUE LIMIT 1) AS primary_image
            FROM cart_items c
            JOIN products p ON p.product_id = c.product_id
            LEFT JOIN users u ON p.seller_id = u.user_id
            WHERE c.user_id = ?
            ORDER BY c.created_at ASC
        `, [req.user.userId]);
        res.json(items);
    } catch (err) {
        next(err);
    }
});

// POST /api/cart
// Add or update an item in the cart
router.post('/', async (req, res, next) => {
    const { product_id, quantity } = req.body;
    if (!product_id || !quantity) {
        return res.status(400).json({ error: 'product_id and quantity required' });
    }

    try {
        await pool.query(`
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = ?
        `, [req.user.userId, product_id, quantity, quantity]);
        
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/cart/:productId
// Remove an item from the cart
router.delete('/:productId', async (req, res, next) => {
    try {
        await pool.query(
            'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
            [req.user.userId, req.params.productId]
        );
        res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
