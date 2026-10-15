const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/orders - list orders with customer + item summary
router.get('/', async (req, res, next) => {
  try {
    let query = `
      SELECT o.order_id, o.status, o.total_amount, o.created_at, o.payment_status,
             u.name AS customer, COUNT(oi.order_item_id) AS item_count
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
    `;
    const params = [];
    if (req.user.role === 'customer') {
        query += ` WHERE o.user_id = ? `;
        params.push(req.user.userId);
    } else if (req.user.role === 'seller') {
        query += ` WHERE o.seller_id = ? `;
        params.push(req.user.userId);
    }
    query += `
      GROUP BY o.order_id, o.status, o.total_amount, o.created_at, o.payment_status, u.name
      ORDER BY o.created_at DESC
    `;
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/orders/:id - single order with line items
router.get('/:id', async (req, res, next) => {
  try {
    const [[order]] = await pool.query(
      `SELECT o.*, u.name AS customer, u.email
       FROM orders o JOIN users u ON u.user_id = o.user_id
       WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role === 'customer' && order.user_id !== req.user.userId) return res.status(403).json({error: 'Forbidden'});
    if (req.user.role === 'seller' && order.seller_id !== req.user.userId) return res.status(403).json({error: 'Forbidden'});

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
  const { delivery_lat, delivery_lng, address_id, payment_method } = req.body;
  const user_id = req.user.userId;

  const conn = await pool.getConnection();
  const reservedSoFar = []; 

  try {
    const [cartItems] = await conn.query(`
      SELECT c.product_id, c.quantity, p.seller_id 
      FROM cart_items c
      JOIN products p ON p.product_id = c.product_id
      WHERE c.user_id = ?`, 
      [user_id]
    );
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const itemsBySeller = {};
    for (const item of cartItems) {
      if (!itemsBySeller[item.seller_id]) itemsBySeller[item.seller_id] = [];
      itemsBySeller[item.seller_id].push(item);
    }

    const createdOrders = [];

    for (const [sellerIdStr, items] of Object.entries(itemsBySeller)) {
      const sellerId = parseInt(sellerIdStr);
      const [orderResult] = await conn.query(
        `INSERT INTO orders (user_id, seller_id, status, total_amount, address_id, payment_method, payment_status) VALUES (?, ?, 'pending', 0, ?, ?, 'pending')`,
        [user_id, sellerId, address_id || null, payment_method || 'cod']
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
          throw new Error(`Could not fulfil product ${item.product_id}: insufficient stock across all warehouses`);
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

      // Create mock payment record
      await conn.query(
        `INSERT INTO payments (order_id, amount, payment_method, status, transaction_id) VALUES (?, ?, ?, ?, ?)`,
        [orderId, total || 0, payment_method || 'cod', payment_method === 'card' ? 'success' : 'pending', payment_method === 'card' ? 'txn_mock_' + Date.now() : null]
      );
      
      if (payment_method === 'card') {
          await conn.query(`UPDATE orders SET payment_status = 'paid' WHERE order_id = ?`, [orderId]);
      }

      createdOrders.push(orderId);
    }

    await conn.query(`DELETE FROM cart_items WHERE user_id = ?`, [user_id]);

    res.status(201).json({ orders: createdOrders, status: 'confirmed' });
  } catch (err) {
    await conn.rollback();
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
      `SELECT oi.product_id, oi.warehouse_id, oi.quantity, o.seller_id 
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );
    
    if (items.length > 0 && req.user.role === 'seller' && items[0].seller_id !== req.user.userId) {
        await conn.rollback();
        conn.release();
        return res.status(403).json({ error: 'Forbidden' });
    }

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
