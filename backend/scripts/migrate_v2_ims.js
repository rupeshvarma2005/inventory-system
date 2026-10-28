const pool = require('../db');

async function migrateSchema() {
  console.log('--- Starting IMS Schema Migration ---');

  try {
    // 1. Check existing columns in products
    const [cols] = await pool.query('DESCRIBE products');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('stock_quantity')) {
      console.log('Adding stock_quantity to products...');
      await pool.query('ALTER TABLE products ADD COLUMN stock_quantity INT NOT NULL DEFAULT 0 AFTER price');
    }

    if (!colNames.includes('sku_code')) {
      console.log('Adding sku_code to products...');
      await pool.query('ALTER TABLE products ADD COLUMN sku_code VARCHAR(50) NULL AFTER sku');
      await pool.query('UPDATE products SET sku_code = sku WHERE sku_code IS NULL');
    }

    if (!colNames.includes('reorder_level')) {
      console.log('Adding reorder_level to products...');
      await pool.query('ALTER TABLE products ADD COLUMN reorder_level INT NOT NULL DEFAULT 15 AFTER reorder_threshold');
      await pool.query('UPDATE products SET reorder_level = reorder_threshold WHERE reorder_level IS NULL');
    }

    if (!colNames.includes('warehouse_location')) {
      console.log('Adding warehouse_location to products...');
      await pool.query('ALTER TABLE products ADD COLUMN warehouse_location VARCHAR(100) DEFAULT "North Hub - Delhi" AFTER reorder_level');
    }

    // 2. Synchronize products.stock_quantity with sum from inventory
    console.log('Synchronizing total stock into products.stock_quantity...');
    const [stockSums] = await pool.query(`
      SELECT p.product_id, IFNULL(SUM(i.quantity), 0) AS total_qty
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.product_id
      GROUP BY p.product_id
    `);

    for (const row of stockSums) {
      await pool.query(
        'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
        [row.total_qty, row.product_id]
      );
    }

    // 3. Create stock_transactions table
    console.log('Creating stock_transactions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        transaction_id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        warehouse_id INT NULL,
        warehouse_name VARCHAR(100) NULL,
        transaction_type ENUM('IN', 'OUT') NOT NULL,
        quantity INT NOT NULL,
        balance_after INT NOT NULL DEFAULT 0,
        reason VARCHAR(100) NOT NULL DEFAULT 'Manual Adjustment',
        reference_number VARCHAR(100) NULL,
        notes TEXT NULL,
        performed_by VARCHAR(100) DEFAULT 'Admin Operator',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_prod (product_id),
        INDEX idx_created (created_at),
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
      )
    `);

    // 4. Seed initial transaction records if empty
    const [[{ txCount }]] = await pool.query('SELECT COUNT(*) AS txCount FROM stock_transactions');
    if (txCount === 0) {
      console.log('Seeding initial stock transaction audit ledger...');
      const [prods] = await pool.query('SELECT product_id, name, stock_quantity, warehouse_location FROM products LIMIT 6');
      
      for (const p of prods) {
        // Initial Purchase / Inflow
        await pool.query(`
          INSERT INTO stock_transactions 
          (product_id, warehouse_name, transaction_type, quantity, balance_after, reason, reference_number, notes)
          VALUES (?, ?, 'IN', ?, ?, 'Purchase Order Inbound', CONCAT('PO-2026-00', ?), 'Initial shipment received at distribution center')
        `, [p.product_id, p.warehouse_location || 'North Hub - Delhi', p.stock_quantity, p.stock_quantity, p.product_id]);

        // Sample Outflow / Sale
        await pool.query(`
          INSERT INTO stock_transactions 
          (product_id, warehouse_name, transaction_type, quantity, balance_after, reason, reference_number, notes)
          VALUES (?, ?, 'OUT', 5, ?, 'Order Dispatch', CONCAT('ORD-2026-00', ?), 'Customer order fulfilled and dispatched via courier')
        `, [p.product_id, p.warehouse_location || 'North Hub - Delhi', Math.max(0, p.stock_quantity - 5), p.product_id]);
      }
    }

    console.log('✅ Schema migration and transaction ledger setup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Error:', err);
    process.exit(1);
  }
}

migrateSchema();
