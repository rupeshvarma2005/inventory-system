USE inventory_system;

-- ============================================================
-- These are the queries the /api/analytics/* routes run.
-- Kept here standalone so you can run/explain them directly
-- in MySQL Workbench during an interview walkthrough.
-- ============================================================

-- 1) Top-selling products by revenue
SELECT
    p.product_id,
    p.name,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
JOIN orders o ON o.order_id = oi.order_id
WHERE o.status IN ('confirmed','shipped')
GROUP BY p.product_id, p.name
ORDER BY revenue DESC
LIMIT 10;

-- 2) Revenue by category, ranked (window function: RANK)
SELECT
    c.name AS category,
    SUM(oi.quantity * oi.unit_price) AS revenue,
    RANK() OVER (ORDER BY SUM(oi.quantity * oi.unit_price) DESC) AS revenue_rank
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
JOIN categories c ON c.category_id = p.category_id
JOIN orders o ON o.order_id = oi.order_id
WHERE o.status IN ('confirmed','shipped')
GROUP BY c.name;

-- 3) Month-over-month revenue growth (window function: LAG)
SELECT
    month_label,
    revenue,
    LAG(revenue) OVER (ORDER BY month_label) AS prev_month_revenue,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY month_label))
        / NULLIF(LAG(revenue) OVER (ORDER BY month_label), 0) * 100, 2
    ) AS pct_growth
FROM (
    SELECT
        DATE_FORMAT(o.created_at, '%Y-%m') AS month_label,
        SUM(o.total_amount) AS revenue
    FROM orders o
    WHERE o.status IN ('confirmed','shipped')
    GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
) monthly
ORDER BY month_label;

-- 4) 7-day rolling average of daily order count (window function: AVG ... ROWS BETWEEN)
SELECT
    order_date,
    daily_orders,
    ROUND(AVG(daily_orders) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 2) AS rolling_7day_avg
FROM (
    SELECT DATE(created_at) AS order_date, COUNT(*) AS daily_orders
    FROM orders
    GROUP BY DATE(created_at)
) daily
ORDER BY order_date;

-- 5) Warehouse utilization: stock on hand vs. capacity proxy
SELECT
    w.name AS warehouse,
    SUM(i.quantity) AS total_units,
    SUM(i.reserved) AS reserved_units,
    ROUND(SUM(i.reserved) / NULLIF(SUM(i.quantity), 0) * 100, 2) AS reserved_pct
FROM inventory i
JOIN warehouses w ON w.warehouse_id = i.warehouse_id
GROUP BY w.name
ORDER BY total_units DESC;

-- 6) Products currently at or below reorder threshold, per warehouse
SELECT
    p.name AS product,
    w.name AS warehouse,
    i.quantity,
    p.reorder_threshold
FROM inventory i
JOIN products p ON p.product_id = i.product_id
JOIN warehouses w ON w.warehouse_id = i.warehouse_id
WHERE i.quantity <= p.reorder_threshold
ORDER BY i.quantity ASC;

-- 7) Point-in-time stock reconstruction from the audit log
-- (proves the inventory_movements table can rebuild history)
SELECT
    product_id,
    warehouse_id,
    SUM(change_qty) AS quantity_as_of
FROM inventory_movements
WHERE created_at <= '2026-06-30 23:59:59'
GROUP BY product_id, warehouse_id;
