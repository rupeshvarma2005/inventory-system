const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/orders - list orders with customer + item summary
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.order_id, o.status, o.total_amount, o.created_at,
             c.name AS customer, COUNT(oi.order_item_id) AS item_count
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      GROUP BY o.order_id, o.status, o.total_amount, o.created_at, c.name
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/orders/:id - single order with line items
router.get('/:id', async (req, res, next) => {
  try {
    const [[order]] = await pool.query(
      `SELECT o.*, c.name AS customer, c.email
       FROM orders o JOIN customers c ON c.customer_id = o.customer_id
       WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const [items] = await pool.query(
      `SELECT oi.*, p.name AS product, w.name AS warehouse
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       JOIN warehouses w ON w.warehouse_id = oi.warehouse_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );
    res.json({ ...order, items });
  } catch (err) { next(err); }
});

// POST /api/orders - place an order
// { customer_id, delivery_lat, delivery_lng, items: [{ product_id, quantity }] }
//
// Each line item is fulfilled from the nearest warehouse with enough
// free stock, via the fulfil_order_item stored procedure (which uses
// SELECT ... FOR UPDATE row locking so concurrent orders can never
// oversell the same units). If any line item can't be fulfilled, we
// compensate by releasing the stock already reserved for earlier
// lines and mark the order cancelled, rather than leaving a
// half-fulfilled order behind.
router.post('/', async (req, res, next) => {
  const { customer_id, delivery_lat, delivery_lng, items } = req.body;

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customer_id and a non-empty items array are required' });
  }

  const conn = await pool.getConnection();
  const reservedSoFar = []; // for compensating rollback

  try {
    const [orderResult] = await conn.query(
      `INSERT INTO orders (customer_id, status, total_amount) VALUES (?, 'pending', 0)`,
      [customer_id]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      try {
        await conn.query(
          `CALL fulfil_order_item(?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, delivery_lat || 20.5937, delivery_lng || 78.9629]
        );
        reservedSoFar.push(item);
      } catch (procErr) {
        // Compensate: release everything reserved for this order so far
        for (const done of reservedSoFar) {
          await conn.query(
            `UPDATE inventory i
             JOIN order_items oi ON oi.product_id = i.product_id AND oi.warehouse_id = i.warehouse_id
             SET i.reserved = i.reserved - oi.quantity
             WHERE oi.order_id = ? AND oi.product_id = ?`,
            [orderId, done.product_id]
          );
        }
        await conn.query(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
        await conn.query(`UPDATE orders SET status = 'cancelled' WHERE order_id = ?`, [orderId]);

        return res.status(409).json({
          error: `Could not fulfil product ${item.product_id}: insufficient stock across all warehouses`,
          order_id: orderId,
          status: 'cancelled',
        });
      }
    }

    const [[{ total }]] = await conn.query(
      `SELECT SUM(quantity * unit_price) AS total FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    await conn.query(
      `UPDATE orders SET status = 'confirmed', total_amount = ? WHERE order_id = ?`,
      [total || 0, orderId]
    );

    res.status(201).json({ order_id: orderId, status: 'confirmed', total_amount: total || 0 });
  } catch (err) {
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/orders/:id/ship - move a confirmed order to shipped,
// converting the reservation into an actual stock decrement +
// audit log entry (transaction).
router.post('/:id/ship', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [items] = await conn.query(
      `SELECT product_id, warehouse_id, quantity FROM order_items WHERE order_id = ?`,
      [req.params.id]
    );

    for (const item of items) {
      await conn.query(
        `UPDATE inventory
         SET quantity = quantity - ?, reserved = reserved - ?
         WHERE product_id = ? AND warehouse_id = ?`,
        [item.quantity, item.quantity, item.product_id, item.warehouse_id]
      );
      await conn.query(
        `INSERT INTO inventory_movements (product_id, warehouse_id, change_qty, reason, reference_id)
         VALUES (?, ?, ?, 'order_fulfilled', ?)`,
        [item.product_id, item.warehouse_id, -item.quantity, req.params.id]
      );
    }

    await conn.query(`UPDATE orders SET status = 'shipped' WHERE order_id = ?`, [req.params.id]);
    await conn.commit();
    res.json({ success: true, status: 'shipped' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
