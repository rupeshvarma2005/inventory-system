/**
 * Secure Admin Provisioning CLI Tool
 * Usage:
 *   node backend/scripts/create_admin.js <username> <email> <password> [name]
 * Or via env variables:
 *   ADMIN_USERNAME=admin ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret node backend/scripts/create_admin.js
 */

const bcrypt = require('bcryptjs');
const pool = require('../db');

async function provisionAdmin() {
  const username = process.env.ADMIN_USERNAME || process.argv[2] || 'admin';
  const email = process.env.ADMIN_EMAIL || process.argv[3] || 'admin@nexstock.internal';
  const password = process.env.ADMIN_PASSWORD || process.argv[4] || 'Admin@NexStock2026';
  const name = process.env.ADMIN_NAME || process.argv[5] || 'System Administrator';

  if (!username || !email || !password) {
    console.error('Error: Username, email, and password are required.');
    process.exit(1);
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [existing] = await pool.query('SELECT user_id, username, role FROM users WHERE username = ? OR email = ?', [username, email]);

    if (existing.length > 0) {
      const user = existing[0];
      await pool.query(
        'UPDATE users SET password_hash = ?, role = "admin", name = ? WHERE user_id = ?',
        [passwordHash, name, user.user_id]
      );
      console.log(`✓ Admin user "${user.username}" (ID: ${user.user_id}) successfully updated with role: admin.`);
    } else {
      const [res] = await pool.query(
        'INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, "admin")',
        [name, username, email, passwordHash]
      );
      console.log(`✓ New Admin user "${username}" (ID: ${res.insertId}) successfully created with role: admin.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Failed to provision admin:', err.message);
    process.exit(1);
  }
}

provisionAdmin();
