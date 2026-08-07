USE inventory_system;

-- ============================================================
-- Trigger: after any inventory update, check if stock fell
-- below the product's reorder threshold. If so, log an alert
-- (unless one is already open for that product/warehouse).
-- ============================================================

DELIMITER $$

CREATE TRIGGER trg_inventory_reorder_check
AFTER UPDATE ON inventory
FOR EACH ROW
BEGIN
    DECLARE v_threshold INT;
    DECLARE v_open_alert INT;

    IF NEW.quantity < OLD.quantity THEN
        SELECT reorder_threshold INTO v_threshold
        FROM products WHERE product_id = NEW.product_id;

        IF NEW.quantity <= v_threshold THEN
            SELECT COUNT(*) INTO v_open_alert
            FROM reorder_alerts
            WHERE product_id = NEW.product_id
              AND warehouse_id = NEW.warehouse_id
              AND resolved = FALSE;

            IF v_open_alert = 0 THEN
                INSERT INTO reorder_alerts (product_id, warehouse_id, quantity_at_alert)
                VALUES (NEW.product_id, NEW.warehouse_id, NEW.quantity);
            END IF;
        END IF;
    END IF;

    -- auto-resolve alerts once stock is restocked above threshold
    IF NEW.quantity > OLD.quantity THEN
        SELECT reorder_threshold INTO v_threshold
        FROM products WHERE product_id = NEW.product_id;

        IF NEW.quantity > v_threshold THEN
            UPDATE reorder_alerts
            SET resolved = TRUE
            WHERE product_id = NEW.product_id
              AND warehouse_id = NEW.warehouse_id
              AND resolved = FALSE;
        END IF;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- Trigger: when a purchase order is marked 'received', add
-- stock back into inventory and log the movement automatically.
-- ============================================================

DELIMITER $$

CREATE TRIGGER trg_po_received
AFTER UPDATE ON purchase_orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'received' AND OLD.status != 'received' THEN
        INSERT INTO inventory (product_id, warehouse_id, quantity)
        VALUES (NEW.product_id, NEW.warehouse_id, NEW.quantity)
        ON DUPLICATE KEY UPDATE quantity = quantity + NEW.quantity;

        INSERT INTO inventory_movements (product_id, warehouse_id, change_qty, reason, reference_id)
        VALUES (NEW.product_id, NEW.warehouse_id, NEW.quantity, 'purchase_order', NEW.po_id);
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- Stored procedure: fulfil an order line from the *nearest*
-- warehouse that has enough stock, using row locking so two
-- concurrent orders can never oversell the same unit.
--
-- "Nearest" = smallest straight-line distance to a given
-- lat/lng (e.g. customer's delivery location), computed with
-- the Haversine formula.
-- ============================================================

DELIMITER $$

CREATE PROCEDURE fulfil_order_item(
    IN p_order_id INT,
    IN p_product_id INT,
    IN p_qty INT,
    IN p_customer_lat DECIMAL(9,6),
    IN p_customer_lng DECIMAL(9,6)
)
BEGIN
    DECLARE v_warehouse_id INT;
    DECLARE v_available INT;
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_done INT DEFAULT FALSE;

    START TRANSACTION;

    -- Rank candidate warehouses by distance, lock the stock rows
    -- for the ones that could satisfy this order, and pick the
    -- closest one that actually has enough free stock.
    SELECT i.warehouse_id, (i.quantity - i.reserved) AS available
    INTO v_warehouse_id, v_available
    FROM inventory i
    WHERE i.product_id = p_product_id
      AND (i.quantity - i.reserved) >= p_qty
    ORDER BY (
        6371 * ACOS(
            COS(RADIANS(p_customer_lat)) * COS(RADIANS(
                (SELECT latitude FROM warehouses w WHERE w.warehouse_id = i.warehouse_id)
            )) * COS(RADIANS(
                (SELECT longitude FROM warehouses w WHERE w.warehouse_id = i.warehouse_id)
            ) - RADIANS(p_customer_lng))
            + SIN(RADIANS(p_customer_lat)) * SIN(RADIANS(
                (SELECT latitude FROM warehouses w WHERE w.warehouse_id = i.warehouse_id)
            ))
        )
    ) ASC
    LIMIT 1
    FOR UPDATE;

    IF v_warehouse_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No warehouse has enough stock for this item';
    ELSE
        SELECT price INTO v_price FROM products WHERE product_id = p_product_id;

        UPDATE inventory
        SET reserved = reserved + p_qty
        WHERE product_id = p_product_id AND warehouse_id = v_warehouse_id;

        INSERT INTO order_items (order_id, product_id, warehouse_id, quantity, unit_price)
        VALUES (p_order_id, p_product_id, v_warehouse_id, p_qty, v_price);

        COMMIT;
    END IF;
END$$

DELIMITER ;
