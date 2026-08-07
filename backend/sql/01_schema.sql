-- ============================================================
-- Multi-Warehouse Inventory & Order Management System
-- MySQL 8.0+ schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventory_system;
USE inventory_system;

-- ------------------------------------------------------------
-- Core reference tables
-- ------------------------------------------------------------

CREATE TABLE warehouses (
    warehouse_id    INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    latitude        DECIMAL(9,6) NOT NULL,
    longitude       DECIMAL(9,6) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE products (
    product_id      INT AUTO_INCREMENT PRIMARY KEY,
    sku             VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    category_id     INT,
    price           DECIMAL(10,2) NOT NULL,
    reorder_threshold INT NOT NULL DEFAULT 10,
    attributes      JSON,                     -- flexible product attributes (color, size, etc.)
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE customers (
    customer_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    city            VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    supplier_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    contact_email   VARCHAR(150),
    lead_time_days  INT DEFAULT 7
);

-- ------------------------------------------------------------
-- Inventory: how much of each product sits in each warehouse
-- ------------------------------------------------------------

CREATE TABLE inventory (
    product_id      INT NOT NULL,
    warehouse_id    INT NOT NULL,
    quantity        INT NOT NULL DEFAULT 0,
    reserved        INT NOT NULL DEFAULT 0,      -- stock held for unconfirmed orders
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, warehouse_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    CONSTRAINT chk_qty_non_negative CHECK (quantity >= 0),
    CONSTRAINT chk_reserved_le_qty CHECK (reserved <= quantity)
);

-- Append-only audit log: every stock change, ever
CREATE TABLE inventory_movements (
    movement_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id      INT NOT NULL,
    warehouse_id    INT NOT NULL,
    change_qty      INT NOT NULL,               -- positive = stock in, negative = stock out
    reason          ENUM('purchase_order','order_fulfilled','order_cancelled','manual_adjustment') NOT NULL,
    reference_id    INT,                        -- order_id or purchase_order_id, depending on reason
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    INDEX idx_movements_product_time (product_id, created_at),
    INDEX idx_movements_warehouse_time (warehouse_id, created_at)
);

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------

CREATE TABLE orders (
    order_id        INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    status          ENUM('pending','confirmed','shipped','cancelled') NOT NULL DEFAULT 'pending',
    total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    INDEX idx_orders_created (created_at),
    INDEX idx_orders_status (status)
);

CREATE TABLE order_items (
    order_item_id   INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    product_id      INT NOT NULL,
    warehouse_id    INT NOT NULL,               -- which warehouse this line is fulfilled from
    quantity        INT NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

-- ------------------------------------------------------------
-- Purchasing / restock side
-- ------------------------------------------------------------

CREATE TABLE purchase_orders (
    po_id           INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id     INT NOT NULL,
    warehouse_id    INT NOT NULL,
    product_id      INT NOT NULL,
    quantity        INT NOT NULL,
    status          ENUM('placed','received','cancelled') NOT NULL DEFAULT 'placed',
    placed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at     TIMESTAMP NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- ------------------------------------------------------------
-- Reorder alerts: populated by trigger, read by dashboard
-- ------------------------------------------------------------

CREATE TABLE reorder_alerts (
    alert_id        INT AUTO_INCREMENT PRIMARY KEY,
    product_id      INT NOT NULL,
    warehouse_id    INT NOT NULL,
    quantity_at_alert INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved        BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);
