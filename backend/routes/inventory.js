const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/inventory - full stock grid (product x warehouse)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.product_id, p.name AS product, w.warehouse_id, w.name AS warehouse,
             i.quantity, i.reserved, (i.quantity - i.reserved) AS available
      FROM inventory i
      JOIN products p ON p.product_id = i.product_id
      JOIN warehouses w ON w.warehouse_id = i.warehouse_id
      ORDER BY p.name, w.name
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/inventory/alerts - open reorder alerts
router.get('/alerts', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT ra.alert_id, p.name AS product, w.name AS warehouse,
             ra.quantity_at_alert, ra.created_at
      FROM reorder_alerts ra
      JOIN products p ON p.product_id = ra.product_id
      JOIN warehouses w ON w.warehouse_id = ra.warehouse_id
      WHERE ra.resolved = FALSE
      ORDER BY ra.created_at DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/inventory/adjust - manual stock adjustment
// { product_id, warehouse_id, change_qty }  (change_qty can be negative)
// Runs as a transaction: update inventory + write an audit row together,
// so a crash between the two can never happen.
router.post('/adjust', async (req, res, next) => {
  const { product_id, warehouse_id, change_qty } = req.body;
  if (!product_id || !warehouse_id || !change_qty) {
    return res.status(400).json({ error: 'product_id, warehouse_id and change_qty are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[row]] = await conn.query(
      `SELECT quantity FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE`,
      [product_id, warehouse_id]
    );

    if (!row) {
      await conn.query(
        `INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, GREATEST(?, 0))`,
        [product_id, warehouse_id, change_qty]
      );
    } else {
      const newQty = row.quantity + Number(change_qty);
      if (newQty < 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Adjustment would make stock negative' });
      }
      await conn.query(
        `UPDATE inventory SET quantity = ? WHERE product_id = ? AND warehouse_id = ?`,
        [newQty, product_id, warehouse_id]
      );
    }

    await conn.query(
      `INSERT INTO inventory_movements (product_id, warehouse_id, change_qty, reason)
       VALUES (?, ?, ?, 'manual_adjustment')`,
      [product_id, warehouse_id, change_qty]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
