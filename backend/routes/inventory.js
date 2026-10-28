const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/inventory - full stock grid (product x warehouse)
router.get('/', async (req, res, next) => {
  try {
    let query = `
      SELECT p.product_id, 
             p.sku,
             IFNULL(p.sku_code, p.sku) AS sku_code,
             p.name AS product, 
             p.price,
             IFNULL(p.reorder_level, p.reorder_threshold) AS reorder_level,
             p.warehouse_location,
             w.warehouse_id, 
             w.name AS warehouse,
             w.city AS warehouse_city,
             i.quantity, 
             i.reserved, 
             (i.quantity - i.reserved) AS available
      FROM inventory i
      JOIN products p ON p.product_id = i.product_id
      JOIN warehouses w ON w.warehouse_id = i.warehouse_id
    `;
    const params = [];
    if (req.user && req.user.role === 'seller') {
        query += ` WHERE p.seller_id = ? `;
        params.push(req.user.userId);
    }
    query += ` ORDER BY p.name, w.name `;
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/inventory/alerts - Automatic Low Stock Alert warnings (Live computed where stock <= reorder_level)
router.get('/alerts', async (req, res, next) => {
  try {
    let query = `
      SELECT p.product_id, 
             IFNULL(p.sku_code, p.sku) AS sku_code,
             p.name AS product, 
             p.warehouse_location AS warehouse,
             p.price,
             p.stock_quantity,
             p.seller_id,
             IFNULL(p.reorder_level, p.reorder_threshold) AS reorder_level,
             IFNULL((SELECT SUM(quantity - reserved) FROM inventory WHERE product_id = p.product_id), p.stock_quantity) AS quantity_at_alert,
             (IFNULL(p.reorder_level, p.reorder_threshold) - IFNULL((SELECT SUM(quantity - reserved) FROM inventory WHERE product_id = p.product_id), p.stock_quantity)) AS deficit_units,
             NOW() AS created_at
      FROM products p
    `;
    const params = [];
    if (req.user && req.user.role === 'seller') {
      query += ` WHERE p.seller_id = ? `;
      params.push(req.user.userId);
    }
    query += `
      HAVING quantity_at_alert <= reorder_level
      ORDER BY quantity_at_alert ASC
    `;
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/inventory/transactions - Inflow & Outflow Transaction Audit Ledger
router.get('/transactions', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    let query = `
      SELECT t.*, 
             p.name AS product_name, 
             IFNULL(p.sku_code, p.sku) AS sku_code,
             p.price
      FROM stock_transactions t
      JOIN products p ON p.product_id = t.product_id
    `;
    const params = [];
    if (req.user && req.user.role === 'seller') {
      query += ` WHERE p.seller_id = ? `;
      params.push(req.user.userId);
    }
    query += `
      ORDER BY t.created_at DESC
      LIMIT ?
    `;
    params.push(limit);
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/inventory/transaction - Process Stock In (Inflow) or Stock Out (Outflow)
router.post('/transaction', async (req, res, next) => {
  const { 
    product_id, 
    warehouse_id = 1, 
    warehouse_name,
    transaction_type, // 'IN' or 'OUT'
    quantity, 
    reason, 
    reference_number, 
    notes 
  } = req.body;

  if (!product_id || !quantity || !transaction_type) {
    return res.status(400).json({ error: 'product_id, quantity and transaction_type (IN/OUT) are required' });
  }

  const txType = transaction_type.toUpperCase();
  if (txType !== 'IN' && txType !== 'OUT') {
    return res.status(400).json({ error: 'transaction_type must be either IN or OUT' });
  }

  const qty = parseInt(quantity, 10);
  if (qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than zero' });
  }

  const delta = txType === 'IN' ? qty : -qty;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[prod]] = await conn.query(
      `SELECT product_id, name, stock_quantity, reorder_level, warehouse_location, seller_id 
       FROM products WHERE product_id = ? FOR UPDATE`,
      [product_id]
    );

    if (!prod) {
      await conn.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user && req.user.role === 'seller' && prod.seller_id !== req.user.userId) {
      await conn.rollback();
      return res.status(403).json({ error: 'Forbidden: You do not have permission to adjust inventory for this product' });
    }

    const newStock = prod.stock_quantity + delta;
    if (newStock < 0) {
      await conn.rollback();
      return res.status(400).json({ error: `Cannot deduct ${qty} units. Only ${prod.stock_quantity} units available.` });
    }

    // 1. Update products table
    await conn.query('UPDATE products SET stock_quantity = ? WHERE product_id = ?', [newStock, product_id]);

    // 2. Update inventory table for warehouse
    const [[whRow]] = await conn.query(
      'SELECT quantity FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
      [product_id, warehouse_id]
    );

    const currentWhQty = whRow ? whRow.quantity : 0;
    const newWhQty = Math.max(0, currentWhQty + delta);

    if (whRow) {
      await conn.query(
        'UPDATE inventory SET quantity = ? WHERE product_id = ? AND warehouse_id = ?',
        [newWhQty, product_id, warehouse_id]
      );
    } else {
      await conn.query(
        'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
        [product_id, warehouse_id, newWhQty]
      );
    }

    // 3. Resolve warehouse name
    let finalWhName = warehouse_name || prod.warehouse_location;
    if (!finalWhName) {
      const [[wInfo]] = await conn.query('SELECT name FROM warehouses WHERE warehouse_id = ?', [warehouse_id]);
      finalWhName = wInfo ? wInfo.name : 'Central Warehouse';
    }

    // 4. Insert into stock_transactions
    const [txResult] = await conn.query(
      `INSERT INTO stock_transactions 
       (product_id, warehouse_id, warehouse_name, transaction_type, quantity, balance_after, reason, reference_number, notes, performed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id, 
        warehouse_id, 
        finalWhName, 
        txType, 
        qty, 
        newStock, 
        reason || (txType === 'IN' ? 'Purchase / Restock' : 'Order Fulfillment'), 
        reference_number || (txType === 'IN' ? `RESTOCK-${Date.now().toString().slice(-5)}` : `DISPATCH-${Date.now().toString().slice(-5)}`),
        notes || (txType === 'IN' ? 'Inflow stock received at dock' : 'Outflow stock dispatched'),
        req.user?.username || 'Admin Operator'
      ]
    );

    // 5. If below reorder level, add alert
    const reorderLevel = prod.reorder_level || 15;
    if (newStock <= reorderLevel) {
      await conn.query(
        `INSERT INTO reorder_alerts (product_id, warehouse_id, quantity_at_alert, resolved)
         VALUES (?, ?, ?, FALSE)`,
        [product_id, warehouse_id, newStock]
      );
    }

    await conn.commit();
    res.json({
      success: true,
      transaction_id: txResult.insertId,
      product_id: Number(product_id),
      transaction_type: txType,
      quantity: qty,
      new_balance: newStock,
      is_low_stock: newStock <= reorderLevel
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/inventory/adjust - legacy adjustment wrapper
router.post('/adjust', async (req, res, next) => {
  const { product_id, warehouse_id, change_qty } = req.body;
  if (!product_id || !warehouse_id || !change_qty) {
    return res.status(400).json({ error: 'product_id, warehouse_id and change_qty are required' });
  }

  const delta = parseInt(change_qty, 10);
  const txType = delta >= 0 ? 'IN' : 'OUT';

  req.body.transaction_type = txType;
  req.body.quantity = Math.abs(delta);
  req.body.reason = 'Manual Inventory Adjustment';
  
  // Forward to /transaction logic
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[row]] = await conn.query(
      `SELECT quantity FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE`,
      [product_id, warehouse_id]
    );

    const currentQty = row ? row.quantity : 0;
    const newQty = currentQty + delta;
    if (newQty < 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Adjustment would make stock negative' });
    }

    if (row) {
      await conn.query(
        'UPDATE inventory SET quantity = ? WHERE product_id = ? AND warehouse_id = ?',
        [newQty, product_id, warehouse_id]
      );
    } else {
      await conn.query(
        'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
        [product_id, warehouse_id, newQty]
      );
    }

    // Update products.stock_quantity with ownership verification
    const [[pRow]] = await conn.query('SELECT stock_quantity, seller_id FROM products WHERE product_id = ?', [product_id]);
    if (!pRow) {
      await conn.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }
    if (req.user && req.user.role === 'seller' && pRow.seller_id !== req.user.userId) {
      await conn.rollback();
      return res.status(403).json({ error: 'Forbidden: You do not have permission to adjust inventory for this product' });
    }

    const updatedTotal = Math.max(0, pRow.stock_quantity + delta);
    await conn.query('UPDATE products SET stock_quantity = ? WHERE product_id = ?', [updatedTotal, product_id]);

    // Insert into stock_transactions
    await conn.query(
      `INSERT INTO stock_transactions 
       (product_id, warehouse_id, warehouse_name, transaction_type, quantity, balance_after, reason, reference_number, notes)
       VALUES (?, ?, 'Regional Hub', ?, ?, ?, 'Manual Cycle Count', CONCAT('ADJ-', ?), 'Direct inventory balance adjustment')`,
      [product_id, warehouse_id, txType, Math.abs(delta), updatedTotal, product_id]
    );

    await conn.commit();
    res.json({ success: true, new_quantity: newQty, new_total: updatedTotal });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
