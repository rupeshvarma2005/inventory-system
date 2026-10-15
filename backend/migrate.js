const fs = require('fs');
const pool = require('./db');

async function migrate() {
    const sql = fs.readFileSync('sql/08_ecommerce_schema_update.sql', 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (let stmt of statements) {
        if (stmt.startsWith('--')) {
            // Strip leading comments manually for the simple runner
            stmt = stmt.replace(/^--.*$/gm, '').trim();
            if (stmt.length === 0) continue;
        }
        try {
            await pool.query(stmt);
            console.log('Executed:', stmt.substring(0, 50).replace(/\n/g, ' ') + '...');
        } catch (err) {
            console.error('Error executing:', stmt.substring(0, 50).replace(/\n/g, ' ') + '...');
            console.error(err.message);
        }
    }
    console.log('Migration complete');
    process.exit(0);
}

migrate();
