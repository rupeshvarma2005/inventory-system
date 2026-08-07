USE inventory_system;

INSERT INTO warehouses (name, city, latitude, longitude) VALUES
('North Hub', 'Delhi', 28.7041, 77.1025),
('West Hub', 'Mumbai', 19.0760, 72.8777),
('South Hub', 'Bengaluru', 12.9716, 77.5946),
('East Hub', 'Kolkata', 22.5726, 88.3639);

INSERT INTO categories (name) VALUES
('Electronics'), ('Home & Kitchen'), ('Apparel'), ('Sports & Fitness');

INSERT INTO products (sku, name, category_id, price, reorder_threshold, attributes) VALUES
('ELEC-001', 'Wireless Mouse', 1, 599.00, 20, JSON_OBJECT('color', 'black')),
('ELEC-002', 'USB-C Charger 65W', 1, 1299.00, 15, JSON_OBJECT('watt', 65)),
('HOME-001', 'Non-stick Frying Pan', 2, 899.00, 10, JSON_OBJECT('size_cm', 26)),
('HOME-002', 'Cotton Bedsheet Set', 2, 1499.00, 12, JSON_OBJECT('size', 'queen')),
('APP-001', 'Men Running T-Shirt', 3, 499.00, 25, JSON_OBJECT('size', 'M')),
('SPRT-001', 'Yoga Mat 6mm', 4, 799.00, 18, JSON_OBJECT('thickness_mm', 6));

INSERT INTO suppliers (name, contact_email, lead_time_days) VALUES
('Alpha Traders', 'orders@alphatraders.example', 5),
('BrightSupply Co', 'sales@brightsupply.example', 7);

INSERT INTO customers (name, email, city) VALUES
('Rahul Sharma', 'rahul.sharma@example.com', 'Delhi'),
('Ananya Iyer', 'ananya.iyer@example.com', 'Bengaluru'),
('Vikram Singh', 'vikram.singh@example.com', 'Mumbai');

-- Seed inventory: every product in every warehouse, varied quantities
INSERT INTO inventory (product_id, warehouse_id, quantity, reserved) VALUES
(1,1,50,0), (1,2,30,0), (1,3,5,0),  (1,4,40,0),
(2,1,25,0), (2,2,10,0), (2,3,60,0), (2,4,8,0),
(3,1,15,0), (3,2,20,0), (3,3,7,0),  (3,4,18,0),
(4,1,22,0), (4,2,9,0),  (4,3,30,0), (4,4,12,0),
(5,1,45,0), (5,2,60,0), (5,3,20,0), (5,4,15,0),
(6,1,19,0), (6,2,25,0), (6,3,8,0),  (6,4,22,0);

-- A few sample orders so the analytics dashboard has data to chart
INSERT INTO orders (customer_id, status, total_amount, created_at) VALUES
(1, 'confirmed', 1198.00, NOW() - INTERVAL 20 DAY),
(2, 'shipped',   1499.00, NOW() - INTERVAL 15 DAY),
(3, 'confirmed',  899.00, NOW() - INTERVAL 10 DAY),
(1, 'shipped',    599.00, NOW() - INTERVAL 5 DAY),
(2, 'pending',   1798.00, NOW() - INTERVAL 1 DAY);

INSERT INTO order_items (order_id, product_id, warehouse_id, quantity, unit_price) VALUES
(1, 1, 1, 2, 599.00),
(2, 4, 3, 1, 1499.00),
(3, 3, 2, 1, 899.00),
(4, 1, 1, 1, 599.00),
(5, 6, 4, 1, 799.00),
(5, 2, 3, 1, 999.00);
