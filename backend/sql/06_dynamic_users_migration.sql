-- Database Migration for Dynamic Users & Cart
USE inventory_system;

-- 1. Add `name` column to `users`
ALTER TABLE users ADD COLUMN name VARCHAR(150) AFTER user_id;

-- Backfill name for the default admin
UPDATE users SET name = 'Admin User' WHERE username = 'admin';

-- Make name NOT NULL now that it's backfilled
ALTER TABLE users MODIFY COLUMN name VARCHAR(150) NOT NULL;

-- 2. Clean up old mock orders and order items to avoid constraint errors
-- We need to drop foreign keys on orders.
-- First, drop the order_items FK constraint that references orders
-- To be safe, we just drop the tables completely.

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
    order_id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    status          ENUM('pending','confirmed','shipped','cancelled') NOT NULL DEFAULT 'pending',
    total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_orders_created (created_at),
    INDEX idx_orders_status (status)
);

CREATE TABLE order_items (
    order_item_id   INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    product_id      INT NOT NULL,
    warehouse_id    INT NOT NULL,
    quantity        INT NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

-- 4. Create `cart_items` table
CREATE TABLE cart_items (
    cart_item_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    product_id      INT NOT NULL,
    quantity        INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id)
);
