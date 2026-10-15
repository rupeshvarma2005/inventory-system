const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/analytics/top-products
router.get('/top-products', async (req, res, next) => {
  try {
    const query = `
      SELECT p.product_id, p.name, SUM(oi.quantity) AS units_sold,
             SUM(oi.quantity * oi.unit_price) AS revenue
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id
      JOIN orders o ON o.order_id = oi.order_id
      WHERE o.status IN ('confirmed','shipped')
      ${req.user.role === 'seller' ? `AND p.seller_id = ?` : ''}
      GROUP BY p.product_id, p.name
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const params = req.user.role === 'seller' ? [req.user.userId] : [];
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/analytics/revenue-by-category (RANK window function)
router.get('/revenue-by-category', async (req, res, next) => {
  try {
    const query = `
      SELECT c.name AS category,
             SUM(oi.quantity * oi.unit_price) AS revenue,
             RANK() OVER (ORDER BY SUM(oi.quantity * oi.unit_price) DESC) AS revenue_rank
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id
      JOIN categories c ON c.category_id = p.category_id
      JOIN orders o ON o.order_id = oi.order_id
      WHERE o.status IN ('confirmed','shipped')
      ${req.user.role === 'seller' ? `AND p.seller_id = ?` : ''}
      GROUP BY c.name
    `;
    const params = req.user.role === 'seller' ? [req.user.userId] : [];
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/analytics/monthly-growth (LAG window function)
router.get('/monthly-growth', async (req, res, next) => {
  try {
    const query = `
      SELECT month_label, revenue,
             LAG(revenue) OVER (ORDER BY month_label) AS prev_month_revenue,
             ROUND(
               (revenue - LAG(revenue) OVER (ORDER BY month_label))
               / NULLIF(LAG(revenue) OVER (ORDER BY month_label), 0) * 100, 2
             ) AS pct_growth
      FROM (
        SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS month_label,
               SUM(o.total_amount) AS revenue
        FROM orders o
        WHERE o.status IN ('confirmed','shipped')
        ${req.user.role === 'seller' ? `AND o.seller_id = ?` : ''}
        GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ) monthly
      ORDER BY month_label
    `;
    const params = req.user.role === 'seller' ? [req.user.userId] : [];
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/analytics/rolling-orders (7-day rolling average window function)
router.get('/rolling-orders', async (req, res, next) => {
  try {
    const query = `
      SELECT order_date, daily_orders,
             ROUND(AVG(daily_orders) OVER (
               ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
             ), 2) AS rolling_7day_avg
      FROM (
        SELECT DATE(created_at) AS order_date, COUNT(*) AS daily_orders
        FROM orders
        WHERE 1=1
        ${req.user.role === 'seller' ? `AND seller_id = ?` : ''}
        GROUP BY DATE(created_at)
      ) daily
      ORDER BY order_date
    `;
    const params = req.user.role === 'seller' ? [req.user.userId] : [];
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/analytics/warehouse-utilization
router.get('/warehouse-utilization', async (req, res, next) => {
  try {
    const query = `
      SELECT w.name AS warehouse,
             SUM(i.quantity) AS total_units,
             SUM(i.reserved) AS reserved_units,
             ROUND(SUM(i.reserved) / NULLIF(SUM(i.quantity), 0) * 100, 2) AS reserved_pct
      FROM inventory i
      JOIN warehouses w ON w.warehouse_id = i.warehouse_id
      ${req.user.role === 'seller' ? `WHERE i.product_id IN (SELECT product_id FROM products WHERE seller_id = ?)` : ''}
      GROUP BY w.name
      ORDER BY total_units DESC
    `;
    const params = req.user.role === 'seller' ? [req.user.userId] : [];
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
