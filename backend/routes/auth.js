const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const { authenticateToken } = require('../middleware/authMiddleware');

// POST /api/auth/register - Public Customer Registration
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        
        if (!name || !username || !email || !password) {
            return res.status(400).json({ error: 'Name, username, email, and password are required' });
        }

        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();

        const [existingUser] = await db.query(
            'SELECT user_id FROM users WHERE username = ? OR email = ?',
            [trimmedUsername, trimmedEmail]
        );
        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password.trim(), salt);

        // Security rule: Public registration ALWAYS assigns customer role. Never admin or seller.
        const userRole = 'customer';

        const [result] = await db.query(
            'INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), trimmedUsername, trimmedEmail, passwordHash, userRole]
        );

        res.status(201).json({ 
            message: 'Customer registered successfully', 
            userId: result.insertId,
            role: userRole
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/register-seller - Dedicated Merchant Onboarding
router.post('/register-seller', async (req, res) => {
    try {
        const { name, username, email, password, store_name } = req.body;
        
        if (!name || !username || !email || !password) {
            return res.status(400).json({ error: 'Name, username, email, and password are required for seller registration' });
        }

        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();

        const [existingUser] = await db.query(
            'SELECT user_id FROM users WHERE username = ? OR email = ?',
            [trimmedUsername, trimmedEmail]
        );
        if (existingUser.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password.trim(), salt);

        const displayName = store_name ? `${name.trim()} (${store_name.trim()})` : name.trim();
        const userRole = 'seller';

        const [result] = await db.query(
            'INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [displayName, trimmedUsername, trimmedEmail, passwordHash, userRole]
        );

        res.status(201).json({ 
            message: 'Merchant registered successfully', 
            userId: result.insertId,
            role: userRole
        });
    } catch (error) {
        console.error('Seller register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const identifier = (email || username || '').trim();

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Please enter your email or username, and password' });
        }
        
        password = password.trim();

        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?', 
            [identifier, identifier]
        );
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.user_id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me - Verify session & fetch authenticated user details
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, name, username, email, role, created_at FROM users WHERE user_id = ?',
            [req.user.userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Session verify error:', error);
        res.status(500).json({ error: 'Failed to verify session' });
    }
});

module.exports = router;
