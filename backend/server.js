const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = require('./db');
const productsRouter = require('./routes/products');
const warehousesRouter = require('./routes/warehouses');
const inventoryRouter = require('./routes/inventory');
const ordersRouter = require('./routes/orders');
const analyticsRouter = require('./routes/analytics');
const authRouter = require('./routes/auth');
const suppliersRouter = require('./routes/suppliers');
const purchasesRouter = require('./routes/purchases');
const userRouter = require('./routes/user');
const { authenticateToken, optionalAuth, requireRole } = require('./middleware/authMiddleware');

const app = express();

let allowedOrigins = process.env.CORS_ORIGIN || '*';
if (allowedOrigins !== '*') {
  allowedOrigins = allowedOrigins.split(',').map(s => s.trim());
}
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  const payload = { status: 'ok', database: 'connected' };
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    payload.status = 'degraded';
    payload.database = 'disconnected';
    payload.error = err.message;
    if (process.env.DB_PASSWORD === 'your_password') {
      payload.hint = 'Update DB_PASSWORD in backend/.env (currently the placeholder from .env.example), then run backend/scripts/setup-db.ps1 to create and seed the database.';
    }
    return res.status(503).json(payload);
  }
  res.json(payload);
});

app.use('/api/auth', authRouter);

const cartRouter = require('./routes/cart');

// 1. Storefront & Catalog Routes (Public browsing with optional authentication)
app.use('/api/products', optionalAuth, productsRouter);
app.use('/api/warehouses', optionalAuth, warehousesRouter);

// 2. Customer & User Operations (Requires authenticated user, scoped by req.user.userId)
app.use('/api/cart', authenticateToken, cartRouter);
app.use('/api/user', authenticateToken, userRouter);
app.use('/api/orders', authenticateToken, ordersRouter);

// 3. Merchant & Enterprise Inventory Management (Restricted to Admin & Seller roles)
app.use('/api/inventory', authenticateToken, requireRole(['admin', 'seller']), inventoryRouter);
app.use('/api/analytics', authenticateToken, requireRole(['admin', 'seller']), analyticsRouter);

// 4. Platform Administration Operations (Strictly restricted to Admin role)
app.use('/api/suppliers', authenticateToken, requireRole(['admin']), suppliersRouter);
app.use('/api/purchases', authenticateToken, requireRole(['admin']), purchasesRouter);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

async function verifyDatabase() {
  if (process.env.DB_PASSWORD === 'your_password') {
    console.warn('\n⚠️  DB_PASSWORD is still "your_password" (placeholder).');
    console.warn('   Update backend/.env with your MySQL root password.');
    console.warn('   Then run: .\\scripts\\setup-db.ps1 -Password "YOUR_PASSWORD"\n');
  }
  try {
    await pool.query('SELECT 1');
    try {
      const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM products');
      console.log(`Database connected (${count} products in catalog)`);
    } catch {
      console.warn('Database reachable but schema/seed missing — run .\\scripts\\setup-db.ps1');
    }
  } catch (err) {
    console.error('\n❌ Database connection failed:', err.message);
    console.error('   API will respond with errors until MySQL is configured.\n');
  }
}

app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);
  await verifyDatabase();
});

// nodemon restart trigger 2
