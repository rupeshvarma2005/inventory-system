-- Database Migration for RBAC and Multi-tenant Marketplace
USE inventory_system;

-- 1. Update `users` role ENUM
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'seller', 'customer') NOT NULL DEFAULT 'customer';

-- 2. Update `products` to have a `seller_id`
ALTER TABLE products ADD COLUMN seller_id INT;
-- For existing products, set to the admin user (user_id = 1) as a fallback
UPDATE products SET seller_id = 1 WHERE seller_id IS NULL;
ALTER TABLE products MODIFY COLUMN seller_id INT NOT NULL;
ALTER TABLE products ADD FOREIGN KEY (seller_id) REFERENCES users(user_id);

-- 3. Update `orders` to have a `seller_id`
ALTER TABLE orders ADD COLUMN seller_id INT;
-- For existing orders, link them to the admin user initially to satisfy constraints
UPDATE orders SET seller_id = 1 WHERE seller_id IS NULL;
ALTER TABLE orders MODIFY COLUMN seller_id INT NOT NULL;
ALTER TABLE orders ADD FOREIGN KEY (seller_id) REFERENCES users(user_id);

-- Wait, the unique index on `cart_items` is currently (user_id, product_id), which is fine.

-- Seed a dummy seller and a customer for testing if they don't exist
INSERT IGNORE INTO users (user_id, name, username, email, password_hash, role) VALUES 
(2, 'Seller One', 'seller1', 'seller1@example.com', '$2b$10$yAgZK.nBoOWMjn0Pr4cjHeTshE2n/i72hvvaA54gu2SQKP3jC183m', 'seller');

INSERT IGNORE INTO users (user_id, name, username, email, password_hash, role) VALUES 
(3, 'Customer One', 'customer1', 'customer1@example.com', '$2b$10$yAgZK.nBoOWMjn0Pr4cjHeTshE2n/i72hvvaA54gu2SQKP3jC183m', 'customer');
