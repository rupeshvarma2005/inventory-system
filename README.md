# Inventory Management & E-Commerce Platform

A production-ready, full-stack multi-vendor e-commerce and inventory management platform built with React, Node.js, Express, and MySQL.

## Features

- **Multi-Role Authentication**: Customer, Seller, and Admin roles with RBAC.
- **Amazon-Style Customer Experience**:
  - Browse products with robust filtering and searching.
  - Cart and Wishlist management.
  - Multi-step checkout with order tracking.
- **Seller Dashboard**:
  - Manage inventory, products, and incoming orders.
  - View analytics and low-stock alerts.
- **Admin Dashboard**:
  - Platform-wide analytics and oversight.
  - User and seller management.
- **Transactional Integrity**: Uses `SELECT ... FOR UPDATE` row-level locks during checkout to prevent overselling of stock.

## Tech Stack

- **Frontend**: React, Vite, React Router, Tailwind CSS (optional/planned).
- **Backend**: Node.js, Express.js, JWT Authentication.
- **Database**: MySQL 8.0 with relational constraints and triggers.

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### Setup

1. **Database:**
   - Create a MySQL database and user.
   - Run the initialization scripts located in `backend/sql/` in order (`01_schema.sql`, `02_triggers.sql`, etc.).

2. **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Update .env with your DB credentials
   npm install
   npm run dev
   ```

3. **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```


## Development Mode (Bypass Auth)

For testing UI without logging in, the frontend uses `VITE_AUTH_BYPASS=true` in its `.env` file. The backend supports this via `AUTH_BYPASS=true` to treat bypass requests as an Admin.

## License
MIT License
