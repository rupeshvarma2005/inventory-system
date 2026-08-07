const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/products - list all products with category name
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.product_id, p.sku, p.name, c.name AS category,
             p.price, p.reorder_threshold, p.attributes
      FROM products p
      LEFT JOIN categories c ON c.category_id = p.category_id
      ORDER BY p.product_id
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/products/:id - single product with per-warehouse stock
router.get('/:id', async (req, res, next) => {
  try {
    const [[product]] = await pool.query(
      `SELECT p.*, c.name AS category
       FROM products p LEFT JOIN categories c ON c.category_id = p.category_id
       WHERE p.product_id = ?`,
      [req.params.id]
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const [stock] = await pool.query(
      `SELECT w.warehouse_id, w.name AS warehouse, i.quantity, i.reserved
       FROM inventory i JOIN warehouses w ON w.warehouse_id = i.warehouse_id
       WHERE i.product_id = ?`,
      [req.params.id]
    );
    res.json({ ...product, stock });
  } catch (err) { next(err); }
});

// POST /api/products - create a product
router.post('/', async (req, res, next) => {
  try {
    const { sku, name, category_id, price, reorder_threshold, attributes } = req.body;
    if (!sku || !name || price == null) {
      return res.status(400).json({ error: 'sku, name and price are required' });
    }
    const [result] = await pool.query(
      `INSERT INTO products (sku, name, category_id, price, reorder_threshold, attributes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sku, name, category_id || null, price, reorder_threshold || 10, JSON.stringify(attributes || {})]
    );
    res.status(201).json({ product_id: result.insertId });
  } catch (err) { next(err); }
});

module.exports = router;
