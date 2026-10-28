const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    let query = `
      SELECT p.product_id, 
             p.sku, 
             IFNULL(p.sku_code, p.sku) AS sku_code,
             p.name, 
             c.name AS category,
             p.price, 
             p.discount_percentage, 
             IFNULL(p.reorder_level, p.reorder_threshold) AS reorder_level,
             p.reorder_threshold,
             p.warehouse_location,
             p.stock_quantity,
             p.attributes,
             u.name AS seller_name,
             (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = TRUE LIMIT 1) AS primary_image,
             IFNULL((SELECT AVG(rating) FROM reviews WHERE product_id = p.product_id), 0) AS average_rating,
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) AS review_count,
             IFNULL((SELECT SUM(quantity - reserved) FROM inventory WHERE product_id = p.product_id), p.stock_quantity) AS total_stock
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
        query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.sku_code LIKE ?) `;
        params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
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
      `SELECT p.*, 
              IFNULL(p.sku_code, p.sku) AS sku_code,
              IFNULL(p.reorder_level, p.reorder_threshold) AS reorder_level,
              c.name AS category, 
              u.name AS seller_name,
              IFNULL((SELECT AVG(rating) FROM reviews WHERE product_id = p.product_id), 0) AS average_rating,
              (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id) AS review_count,
              IFNULL((SELECT SUM(quantity - reserved) FROM inventory WHERE product_id = p.product_id), p.stock_quantity) AS total_stock
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

    const [transactions] = await pool.query(
      `SELECT * FROM stock_transactions WHERE product_id = ? ORDER BY created_at DESC LIMIT 20`,
      [req.params.id]
    );

    res.json({ ...product, stock, images, reviews, transactions });
  } catch (err) { next(err); }
});

// POST /api/products - Create new product with initial inventory (Admin & Seller only)
router.post('/', authenticateToken, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const { 
      sku, 
      sku_code, 
      name, 
      category_id, 
      price, 
      stock_quantity = 0, 
      reorder_level = 15, 
      reorder_threshold = 15,
      warehouse_location = 'North Hub - Delhi',
      warehouse_id = 1,
      discount_percentage = 0, 
      description = '', 
      attributes, 
      images 
    } = req.body;

    const finalSku = (sku || sku_code || `SKU-${Date.now().toString().slice(-6)}`).trim();
    if (!name || price == null) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    const sellerId = req.user.role === 'admin' ? (req.body.seller_id || req.user.userId) : req.user.userId;
    const initialQty = parseInt(stock_quantity, 10) || 0;
    const finalReorder = parseInt(reorder_level || reorder_threshold, 10) || 15;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const [result] = await connection.query(
        `INSERT INTO products 
         (sku, sku_code, name, description, category_id, price, stock_quantity, reorder_level, reorder_threshold, warehouse_location, discount_percentage, attributes, seller_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalSku, 
          finalSku, 
          name, 
          description, 
          category_id || 1, 
          price, 
          initialQty, 
          finalReorder, 
          finalReorder, 
          warehouse_location, 
          discount_percentage || 0, 
          JSON.stringify(attributes || {}), 
          sellerId
        ]
      );
      
      const productId = result.insertId;
      
      // 1. Create initial inventory record in default warehouse
      if (warehouse_id) {
        await connection.query(
          `INSERT INTO inventory (product_id, warehouse_id, quantity, reserved)
           VALUES (?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE quantity = ?`,
          [productId, warehouse_id, initialQty, initialQty]
        );
      }

      // 2. Log initial transaction into stock_transactions
      if (initialQty > 0) {
        await connection.query(
          `INSERT INTO stock_transactions 
           (product_id, warehouse_id, warehouse_name, transaction_type, quantity, balance_after, reason, reference_number, notes, performed_by)
           VALUES (?, ?, ?, 'IN', ?, ?, 'Initial Stock Entry', CONCAT('INIT-', ?), 'Product registration in inventory system', ?)`,
          [productId, warehouse_id, warehouse_location, initialQty, initialQty, productId, req.user?.username || 'Admin Operator']
        );
      }

      // 3. Images if provided
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await connection.query(
            'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
            [productId, images[i], i === 0]
          );
        }
      }
      
      await connection.commit();
      res.status(201).json({ product_id: productId, sku: finalSku, message: 'Product created and inventory allocated' });
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  } catch (err) { next(err); }
});

// PUT /api/products/:id/stock - Direct stock update & audit logging (Stock In / Stock Out / Absolute Update)
router.put('/:id/stock', authenticateToken, requireRole(['admin', 'seller']), async (req, res, next) => {
  const productId = req.params.id;
  const { 
    stock_quantity, 
    change_qty, 
    transaction_type, 
    warehouse_id = 1, 
    warehouse_name,
    reason = 'Manual Stock Adjustment', 
    reference_number, 
    notes 
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock product row and retrieve seller_id
    const [[prod]] = await conn.query(
      `SELECT product_id, name, stock_quantity, reorder_level, warehouse_location, seller_id 
       FROM products WHERE product_id = ? FOR UPDATE`,
      [productId]
    );

    if (!prod) {
      await conn.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    // Role check: Seller can only adjust stock for their own catalog
    if (req.user.role === 'seller' && prod.seller_id !== req.user.userId) {
      await conn.rollback();
      return res.status(403).json({ error: 'Forbidden: You do not have permission to adjust stock for this product' });
    }

    let delta = 0;
    let newTotalStock = 0;
    let txType = transaction_type ? transaction_type.toUpperCase() : 'IN';

    if (change_qty != null && change_qty !== '') {
      delta = parseInt(change_qty, 10);
      newTotalStock = prod.stock_quantity + delta;
      txType = delta >= 0 ? 'IN' : 'OUT';
    } else if (stock_quantity != null) {
      const targetStock = parseInt(stock_quantity, 10);
      delta = targetStock - prod.stock_quantity;
      newTotalStock = targetStock;
      txType = delta >= 0 ? 'IN' : 'OUT';
    } else {
      await conn.rollback();
      return res.status(400).json({ error: 'Provide stock_quantity or change_qty' });
    }

    if (newTotalStock < 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Stock balance cannot be negative' });
    }

    // 1. Update products table
    await conn.query(
      'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
      [newTotalStock, productId]
    );

    // 2. Update or insert inventory per-warehouse
    const [[whRow]] = await conn.query(
      'SELECT quantity FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE',
      [productId, warehouse_id]
    );

    const currentWhQty = whRow ? whRow.quantity : 0;
    const newWhQty = Math.max(0, currentWhQty + delta);

    if (whRow) {
      await conn.query(
        'UPDATE inventory SET quantity = ? WHERE product_id = ? AND warehouse_id = ?',
        [newWhQty, productId, warehouse_id]
      );
    } else {
      await conn.query(
        'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
        [productId, warehouse_id, newWhQty]
      );
    }

    // 3. Resolve warehouse name
    let finalWhName = warehouse_name || prod.warehouse_location;
    if (!finalWhName) {
      const [[whInfo]] = await conn.query('SELECT name FROM warehouses WHERE warehouse_id = ?', [warehouse_id]);
      finalWhName = whInfo ? whInfo.name : 'Central Warehouse';
    }

    // 4. Record in stock_transactions ledger
    const absQty = Math.abs(delta);
    await conn.query(
      `INSERT INTO stock_transactions 
       (product_id, warehouse_id, warehouse_name, transaction_type, quantity, balance_after, reason, reference_number, notes, performed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        warehouse_id,
        finalWhName,
        txType,
        absQty,
        newTotalStock,
        reason,
        reference_number || (txType === 'IN' ? `RESTOCK-${Date.now().toString().slice(-5)}` : `DISPATCH-${Date.now().toString().slice(-5)}`),
        notes || (txType === 'IN' ? 'Stock Inflow received and verified' : 'Stock Outflow processed'),
        req.user?.username || 'Admin Operator'
      ]
    );

    // 5. Automatic Low Stock Alert logic: if new stock <= reorder_level
    const reorderLevel = prod.reorder_level || 15;
    if (newTotalStock <= reorderLevel) {
      await conn.query(
        `INSERT INTO reorder_alerts (product_id, warehouse_id, quantity_at_alert, resolved)
         VALUES (?, ?, ?, FALSE)`,
        [productId, warehouse_id, newTotalStock]
      );
    }

    await conn.commit();
    res.json({
      success: true,
      product_id: Number(productId),
      previous_stock: prod.stock_quantity,
      new_stock: newTotalStock,
      delta,
      transaction_type: txType,
      is_low_stock: newTotalStock <= reorderLevel
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// PUT /api/products/:id - Update product item metadata (Admin & Owner Seller only)
router.put('/:id', authenticateToken, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { name, price, sku_code, sku, category_id, reorder_level, warehouse_location, description } = req.body;
    const finalSku = sku_code || sku;

    // Check product existence and ownership
    const [[prod]] = await pool.query('SELECT product_id, seller_id FROM products WHERE product_id = ?', [productId]);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role === 'seller' && prod.seller_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to modify this product' });
    }

    await pool.query(
      `UPDATE products 
       SET name = COALESCE(?, name),
           price = COALESCE(?, price),
           sku = COALESCE(?, sku),
           sku_code = COALESCE(?, sku_code),
           category_id = COALESCE(?, category_id),
           reorder_level = COALESCE(?, reorder_level),
           reorder_threshold = COALESCE(?, reorder_threshold),
           warehouse_location = COALESCE(?, warehouse_location),
           description = COALESCE(?, description)
       WHERE product_id = ?`,
      [name, price, finalSku, finalSku, category_id, reorder_level, reorder_level, warehouse_location, description, productId]
    );

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id - Delete product and associated records (Admin & Owner Seller only)
router.delete('/:id', authenticateToken, requireRole(['admin', 'seller']), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const productId = req.params.id;

    // Check product existence and ownership
    const [[prod]] = await conn.query('SELECT product_id, seller_id FROM products WHERE product_id = ?', [productId]);
    if (!prod) {
      await conn.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role === 'seller' && prod.seller_id !== req.user.userId) {
      await conn.rollback();
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this product' });
    }

    // Delete associated inventory, alerts, images, reviews
    await conn.query('DELETE FROM inventory WHERE product_id = ?', [productId]);
    await conn.query('DELETE FROM stock_transactions WHERE product_id = ?', [productId]);
    await conn.query('DELETE FROM reorder_alerts WHERE product_id = ?', [productId]);
    await conn.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await conn.query('DELETE FROM reviews WHERE product_id = ?', [productId]);
    
    // Delete product
    const [result] = await conn.query('DELETE FROM products WHERE product_id = ?', [productId]);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    await conn.commit();
    res.json({ success: true, message: `Product #${productId} deleted from catalog` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
