const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    let query = `
      SELECT p.product_id, p.sku, p.name, c.name AS category,
             p.price, p.discount_percentage, p.reorder_threshold, p.attributes,
             u.name AS seller_name,
             (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = TRUE LIMIT 1) AS primary_image,
             IFNULL((SELECT AVG(rating) FROM reviews WHERE product_id = p.product_id), 0) AS average_rating,
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) AS review_count,
             IFNULL((SELECT SUM(quantity - reserved) FROM inventory WHERE product_id = p.product_id), 0) AS total_stock
      FROM products p
      LEFT JOIN categories c ON c.category_id = p.category_id
      LEFT JOIN users u ON u.user_id = p.seller_id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.mine === 'true' && req.user && req.user.role === 'seller') {
        query += ` AND p.seller_id = ? `;
        params.push(req.user.userId);
    }
    
    if (req.query.search) {
        query += ` AND p.name LIKE ? `;
        params.push(`%${req.query.search}%`);
    }

    if (req.query.category) {
        query += ` AND c.name = ? `;
        params.push(req.query.category);
    }

    query += ` ORDER BY p.product_id `;
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [[product]] = await pool.query(
      `SELECT p.*, c.name AS category, u.name AS seller_name,
        IFNULL((SELECT AVG(rating) FROM reviews WHERE product_id = p.product_id), 0) AS average_rating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) AS review_count,
        IFNULL((SELECT SUM(quantity - reserved) FROM inventory WHERE product_id = p.product_id), 0) AS total_stock
       FROM products p 
       LEFT JOIN categories c ON c.category_id = p.category_id
       LEFT JOIN users u ON u.user_id = p.seller_id
       WHERE p.product_id = ?`,
      [req.params.id]
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const [images] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC', [req.params.id]);
    const [reviews] = await pool.query('SELECT r.*, u.name as customer_name FROM reviews r JOIN users u ON u.user_id = r.user_id WHERE product_id = ? ORDER BY r.created_at DESC', [req.params.id]);

    const [stock] = await pool.query(
      `SELECT w.warehouse_id, w.name AS warehouse, i.quantity, i.reserved
       FROM inventory i JOIN warehouses w ON w.warehouse_id = i.warehouse_id
       WHERE i.product_id = ?`,
      [req.params.id]
    );
    res.json({ ...product, stock, images, reviews });
  } catch (err) { next(err); }
});

// POST /api/products
router.post('/', async (req, res, next) => {
  try {
    const { sku, name, category_id, price, discount_percentage, description, reorder_threshold, attributes, images } = req.body;
    if (!sku || !name || price == null) {
      return res.status(400).json({ error: 'sku, name and price are required' });
    }
    const sellerId = req.user.role === 'admin' ? 1 : req.user.userId;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `INSERT INTO products (sku, name, description, category_id, price, discount_percentage, reorder_threshold, attributes, seller_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sku, name, description || '', category_id || null, price, discount_percentage || 0, reorder_threshold || 10, JSON.stringify(attributes || {}), sellerId]
      );
      
      const productId = result.insertId;
      
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
            await connection.query(
                'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
                [productId, images[i], i === 0]
            );
        }
      }
      
      await connection.commit();
      res.status(201).json({ product_id: productId });
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  } catch (err) { next(err); }
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }
    
    // Check if user already reviewed
    const [existing] = await pool.query('SELECT * FROM reviews WHERE product_id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    await pool.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.userId, rating, comment || '']
    );
    res.status(201).json({ message: 'Review added' });
  } catch (err) { next(err); }
});

module.exports = router;
