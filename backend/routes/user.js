const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT user_id, name, username, email, role FROM users WHERE user_id = ?', [req.user.userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Get user addresses
router.get('/addresses', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [req.user.userId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});

// Add new address
router.post('/addresses', async (req, res) => {
    const { full_name, phone, street, city, state, zip_code, country, address_type, is_default } = req.body;
    try {
        if (is_default) {
            await pool.query('UPDATE addresses SET is_default = false WHERE user_id = ?', [req.user.userId]);
        }
        const [result] = await pool.query(
            'INSERT INTO addresses (user_id, full_name, phone, street, city, state, zip_code, country, address_type, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.userId, full_name, phone, street, city, state, zip_code, country || 'India', address_type || 'shipping', is_default ? 1 : 0]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add address' });
    }
});

module.exports = router;
