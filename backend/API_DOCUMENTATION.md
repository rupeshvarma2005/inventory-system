# MarketHub Backend API Documentation

The backend service runs an Express.js REST API with MySQL connection pooling, JWT-based authentication, and role-based access control (RBAC).

- **Base URL:** `http://localhost:4000/api`
- **Health Check:** [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **Authentication:** Bearer token in HTTP `Authorization` header (`Authorization: Bearer <token>`). Supported by `AUTH_BYPASS=true` for local development.

---

## 1. System & Health

### `GET /api/health`
Checks the server and MySQL database connectivity.
- **Access:** Public
- **Response:**
  ```json
  {
    "status": "ok",
    "database": "connected"
  }
  ```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
Create a new user account (Customer, Seller, or Admin).
- **Body:**
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "role": "customer" // "customer" | "seller" | "admin"
  }
  ```

### `POST /api/auth/login`
Authenticate existing user and receive JWT.
- **Body:**
  ```json
  {
    "username": "johndoe", // or email
    "password": "securepassword"
  }
  ```
- **Response:**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
  ```

---

## 3. Products Catalog (`/api/products`)

### `GET /api/products`
Fetch catalog items with filtering, searching, and sorting.
- **Query Params:**
  - `search`: Full-text search term
  - `category`: Filter by category (e.g. `Electronics`, `Apparel`, `Home & Kitchen`)
  - `sort`: `price_asc`, `price_desc`, `rating`, `newest`
  - `deals`: `true` for discounted products

### `GET /api/products/:id`
Fetch single product details including seller and stock data.

### `POST /api/products`
Add a new product (Seller / Admin).
- **Body:**
  ```json
  {
    "name": "Noise Cancelling Headphones",
    "sku": "TECH-NCH-01",
    "category": "Electronics",
    "price": 12999.00,
    "description": "Premium wireless over-ear headphones",
    "discount_percentage": 10
  }
  ```

---

## 4. Shopping Cart (`/api/cart`)

### `GET /api/cart`
Retrieve items currently in user's cart with live pricing and subtotals.

### `POST /api/cart`
Add an item or update quantity.
- **Body:**
  ```json
  {
    "product_id": 1,
    "quantity": 2
  }
  ```

### `DELETE /api/cart/:productId`
Remove product from cart.

---

## 5. Orders & Transactions (`/api/orders`)

### `GET /api/orders`
List orders for the authenticated user (or all platform orders for Admin).

### `GET /api/orders/:id`
Retrieve full order details, tracking number, and line items.

### `POST /api/orders`
Place a new order with row-level transaction locks (`SELECT ... FOR UPDATE`) to prevent overselling.
- **Body:**
  ```json
  {
    "shipping_address": "123 MG Road, Bengaluru, KA 560001",
    "payment_method": "credit_card",
    "items": [
      { "product_id": 1, "quantity": 1 }
    ]
  }
  ```

### `POST /api/orders/:id/ship`
Mark order as shipped (Seller / Admin).

---

## 6. Inventory & Warehouses

### `GET /api/warehouses`
List all fulfillment centers and distribution hubs.

### `GET /api/inventory`
Get current stock levels across all warehouse locations.

### `GET /api/inventory/alerts`
Get low-stock threshold warnings.

### `POST /api/inventory/adjust`
Adjust stock quantity with audit reason (restock, cycle count, damaged).

---

## 7. Analytics (`/api/analytics`)
*(Requires Admin or Seller privileges)*

- `GET /api/analytics/top-products`: Best-selling items by revenue/units
- `GET /api/analytics/revenue-by-category`: Category breakdown
- `GET /api/analytics/monthly-growth`: Monthly revenue trends
- `GET /api/analytics/warehouse-utilization`: Warehouse capacity utilization
