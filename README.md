# Warehouse Ops Console — Multi-Warehouse Inventory & Order Management System

A full-stack inventory + order management system built to actually show SQL depth: row-locking transactions to prevent overselling, triggers for automatic reorder alerts, stored procedures for nearest-warehouse fulfillment, and window-function-driven analytics.

**Stack:** MySQL 8, Node.js/Express, React (Vite)

---

## 1. Prerequisites

Install these first:

- **Node.js** v18+ — https://nodejs.org (LTS version)
- **MySQL** 8.0+ — either installed locally (MySQL Community Server) or a free cloud instance (Railway, Aiven, PlanetScale — see deployment section)
- **Git**
- **Cursor** or **VS Code** — either works fine, this is just plain Node.js + React, no editor-specific setup needed

Check installs:
```bash
node -v      # should print v18.x or higher
npm -v
mysql --version
```

---

## 2. Project structure

```
inventory-system/
  backend/          Express API
    sql/            schema, triggers, seed data, analytics queries
    routes/
    server.js
  frontend/         React (Vite) dashboard
    src/
```

---

## 3. Set up the database

Open a terminal and log into MySQL:
```bash
mysql -u root -p
```

Then run the three SQL files in order (from the `backend/sql/` folder). Easiest way — exit the MySQL prompt and run:
```bash
cd backend/sql
mysql -u root -p < 01_schema.sql
mysql -u root -p < 02_triggers.sql
mysql -u root -p < 03_seed.sql
```

This creates the `inventory_system` database with all tables, triggers, the stored procedure, and sample data (4 warehouses, 6 products, 3 customers, some orders).

Verify it worked:
```bash
mysql -u root -p -e "USE inventory_system; SELECT * FROM products;"
```

---

## 4. Run the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in your MySQL credentials (`DB_USER`, `DB_PASSWORD`, etc.) — for local MySQL this is usually `DB_USER=root` and whatever password you set during install.

```bash
npm run dev
```

You should see `API running on port 4000`. Test it:
```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/products
```

---

## 5. Run the frontend

Open a **second terminal**:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 — you should see the dashboard with charts, product catalog, inventory gauges, and orders.

---

## 6. Try it out

- **Dashboard** — revenue by category, monthly growth, warehouse stock gauges, live reorder alerts
- **Inventory** — see stock per warehouse; try `POST /api/inventory/adjust` to change stock and watch a reorder alert appear automatically (trigger-driven)
- **Orders** — place a new order; the backend picks the nearest warehouse with enough stock automatically (Haversine distance + row locking, so concurrent orders can't oversell)

To really prove the concurrency-safety feature to yourself (great interview demo): open two terminals and fire two simultaneous curl requests for the same product with quantity that only one can satisfy — one will succeed, the other gets a clean "insufficient stock" error instead of overselling.

---

## 7. Deploy it (so you have a live link for your resume)

All free-tier. Roughly 30–40 minutes total.

### 7a. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: inventory management system"
```
Create a new repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/inventory-system.git
git push -u origin main
```

### 7b. Database — Railway (easiest MySQL free tier)
1. Go to railway.app, sign in with GitHub
2. New Project → Provision MySQL
3. Once it's up, open the MySQL service → Connect tab → copy the connection details (host, port, user, password, database)
4. Use the **Railway CLI** or the "Query" tab in their dashboard to run your three SQL files against it (same commands as step 3, just pointed at the Railway host/port instead of localhost)

### 7c. Backend — Render or Railway
1. On Render.com: New → Web Service → connect your GitHub repo → set root directory to `backend`
2. Build command: `npm install`  |  Start command: `npm start`
3. Add environment variables (same as your `.env`, but pointing at the Railway MySQL host/port/credentials from 7b)
4. Deploy — you'll get a URL like `https://your-app.onrender.com`

### 7d. Frontend — Vercel
1. Go to vercel.com, import your GitHub repo
2. Set root directory to `frontend`
3. Add environment variable `VITE_API_URL` = your Render backend URL + `/api` (e.g. `https://your-app.onrender.com/api`)
4. Deploy — you get a live link like `https://inventory-system.vercel.app`

### 7e. Update CORS
Go back to your backend's environment variables on Render and set `CORS_ORIGIN` to your Vercel URL, then redeploy the backend so it accepts requests from your live frontend.

---

## 8. For your resume

> Designed and deployed a full-stack multi-warehouse inventory management system (MySQL, Node/Express, React) implementing row-locking transactions to prevent overselling, trigger-driven reorder alerts, a nearest-warehouse fulfillment algorithm, and a window-function-based analytics dashboard. [Live demo] [GitHub]

Be ready to explain in an interview:
- Why `FOR UPDATE` row locking prevents overselling under concurrent orders (see `fulfil_order_item` stored procedure)
- How the reorder-alert trigger works and why it auto-resolves
- What `RANK()`, `LAG()`, and the 7-day rolling average window functions do, and why you chose them over a subquery (see `backend/sql/04_analytics_queries.sql`)
- The compensating-rollback pattern in `POST /api/orders` — if one line item can't be fulfilled, previously reserved stock is released instead of leaving a half-built order

---

## 9. Common issues

- **`ER_NOT_SUPPORTED_AUTH_MODE`** — your MySQL install uses `caching_sha2_password`. Fix: `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yourpassword';`
- **CORS errors in the browser console** — check `CORS_ORIGIN` in backend `.env` matches your frontend's exact URL (including port)
- **Trigger/procedure creation fails when piping the .sql file** — some MySQL clients choke on `DELIMITER`. If `02_triggers.sql` fails via `mysql < file`, open it in MySQL Workbench and run it there instead (Workbench handles `DELIMITER` correctly).
