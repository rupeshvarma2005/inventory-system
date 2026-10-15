const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all suppliers
router.get('/', async (req, res) => {
    try {
        const [suppliers] = await db.query('SELECT * FROM suppliers ORDER BY name ASC');
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST a new supplier
router.post('/', async (req, res) => {
    try {
        const { name, contact_email, lead_time_days } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const [result] = await db.query(
            'INSERT INTO suppliers (name, contact_email, lead_time_days) VALUES (?, ?, ?)',
            [name, contact_email, lead_time_days || 7]
        );
        res.status(201).json({ message: 'Supplier added', supplier_id: result.insertId });
    } catch (error) {
        console.error('Error adding supplier:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT (update) a supplier
router.put('/:id', async (req, res) => {
    try {
        const { name, contact_email, lead_time_days } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        await db.query(
            'UPDATE suppliers SET name = ?, contact_email = ?, lead_time_days = ? WHERE supplier_id = ?',
            [name, contact_email, lead_time_days, req.params.id]
        );
        res.json({ message: 'Supplier updated' });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE a supplier
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM suppliers WHERE supplier_id = ?', [req.params.id]);
        res.json({ message: 'Supplier deleted' });
    } catch (error) {
        // Will fail if there are dependent purchase orders
        console.error('Error deleting supplier:', error);
        res.status(500).json({ error: 'Cannot delete supplier. They may have active purchase orders.' });
    }
});

module.exports = router;
