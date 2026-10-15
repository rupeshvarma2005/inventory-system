const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all purchase orders
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT po.*, s.name as supplier_name, w.name as warehouse_name, p.name as product_name
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.supplier_id
            JOIN warehouses w ON po.warehouse_id = w.warehouse_id
            JOIN products p ON po.product_id = p.product_id
            ORDER BY po.placed_at DESC
        `;
        const [pos] = await db.query(query);
        res.json(pos);
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST a new purchase order
router.post('/', async (req, res) => {
    try {
        const { supplier_id, warehouse_id, product_id, quantity } = req.body;
        if (!supplier_id || !warehouse_id || !product_id || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await db.query(
            'INSERT INTO purchase_orders (supplier_id, warehouse_id, product_id, quantity) VALUES (?, ?, ?, ?)',
            [supplier_id, warehouse_id, product_id, quantity]
        );
        res.status(201).json({ message: 'Purchase order created', po_id: result.insertId });
    } catch (error) {
        console.error('Error creating PO:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST mark purchase order as received
router.post('/:id/receive', async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [poRows] = await conn.query('SELECT * FROM purchase_orders WHERE po_id = ? FOR UPDATE', [req.params.id]);
        if (poRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Purchase order not found' });
        }

        const po = poRows[0];
        if (po.status === 'received') {
            await conn.rollback();
            return res.status(400).json({ error: 'Purchase order is already received' });
        }
        if (po.status === 'cancelled') {
            await conn.rollback();
            return res.status(400).json({ error: 'Purchase order is cancelled' });
        }

        // Update PO status
        await conn.query('UPDATE purchase_orders SET status = "received", received_at = CURRENT_TIMESTAMP WHERE po_id = ?', [po.po_id]);

        // Add inventory
        await conn.query(
            `INSERT INTO inventory (product_id, warehouse_id, quantity, reserved)
             VALUES (?, ?, ?, 0)
             ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
            [po.product_id, po.warehouse_id, po.quantity]
        );

        // Audit log (inventory_movements)
        await conn.query(
            `INSERT INTO inventory_movements (product_id, warehouse_id, change_qty, reason, reference_id)
             VALUES (?, ?, ?, 'purchase_order', ?)`,
            [po.product_id, po.warehouse_id, po.quantity, po.po_id]
        );

        await conn.commit();
        res.json({ message: 'Purchase order received and inventory updated' });
    } catch (error) {
        await conn.rollback();
        console.error('Error receiving PO:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        conn.release();
    }
});

module.exports = router;
