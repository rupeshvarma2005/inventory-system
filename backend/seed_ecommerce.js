const pool = require('./db');

async function seedImageryAndData() {
    try {
        console.log('Seeding images, discounts, and reviews...');
        
        // 1. Update discounts and descriptions
        const updates = [
            { id: 1, discount: 15.00, desc: 'Ultra-responsive ergonomic wireless mouse with silent tactile switches and precision optical tracking across all surfaces.' },
            { id: 2, discount: 20.00, desc: 'Gallium Nitride (GaN) 65W dual-port fast charger compatible with laptops, tablets, and smartphones with dynamic power allocation.' },
            { id: 3, discount: 10.00, desc: 'Heavy-gauge granite-coated non-stick frying pan with stay-cool ergonomic handle and induction-compatible base.' },
            { id: 4, discount: 25.00, desc: '100% long-staple combed cotton 400-thread-count bedsheet set with two matching pillowcases in a sateen weave.' },
            { id: 5, discount: 30.00, desc: 'Featherlight quick-dry performance running shirt engineered with anti-odor fabric and ergonomic flatlock seams.' },
            { id: 6, discount: 15.00, desc: 'Eco-friendly 6mm high-density TPE yoga mat featuring laser-aligned positioning guides and dual-sided non-slip texture.' },
        ];

        for (const u of updates) {
            await pool.query(
                'UPDATE products SET discount_percentage = ?, description = ? WHERE product_id = ?',
                [u.discount, u.desc, u.id]
            );
        }

        // 2. Clear old images & insert fresh curated ones
        await pool.query('DELETE FROM product_images');
        const images = [
            { pid: 1, url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80', primary: true },
            { pid: 1, url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', primary: false },
            { pid: 2, url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80', primary: true },
            { pid: 2, url: 'https://images.unsplash.com/photo-1622445262464-84b14e0745b1?auto=format&fit=crop&w=800&q=80', primary: false },
            { pid: 3, url: 'https://images.unsplash.com/photo-1584990347449-399a9b2bdf9e?auto=format&fit=crop&w=800&q=80', primary: true },
            { pid: 4, url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80', primary: true },
            { pid: 5, url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80', primary: true },
            { pid: 6, url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80', primary: true },
        ];

        for (const img of images) {
            await pool.query(
                'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
                [img.pid, img.url, img.primary]
            );
        }

        // 3. Insert reviews if users exist
        const [users] = await pool.query('SELECT user_id FROM users LIMIT 3');
        if (users.length > 0) {
            await pool.query('DELETE FROM reviews');
            const u1 = users[0].user_id;
            const u2 = users[1] ? users[1].user_id : u1;
            const u3 = users[2] ? users[2].user_id : u1;

            const reviewData = [
                { pid: 1, uid: u1, rating: 5, comment: 'Remarkable ergonomics and buttery smooth tracking. Battery lasts weeks on a single charge!' },
                { pid: 1, uid: u2, rating: 4, comment: 'Great build quality, very silent clicks. Ideal for late night work.' },
                { pid: 2, uid: u1, rating: 5, comment: 'Charges my MacBook and phone simultaneously at full speed without overheating.' },
                { pid: 2, uid: u3, rating: 5, comment: 'Compact GaN tech. Easily replaces 3 separate bricks in my travel kit.' },
                { pid: 3, uid: u2, rating: 5, comment: 'Truly non-stick, very easy to clean with minimal oil. Heat spreads evenly.' },
                { pid: 4, uid: u3, rating: 5, comment: 'Extremely soft and breathable 400TC cotton. Color stays vibrant after multiple washes.' },
                { pid: 5, uid: u1, rating: 4, comment: 'Lightweight, moisture-wicking material. Perfect fit and zero chafing during marathon training.' },
                { pid: 6, uid: u2, rating: 5, comment: 'High density cushioning protects knees on hard floors. Great non-slip grip even when sweating.' },
            ];

            for (const r of reviewData) {
                try {
                    await pool.query(
                        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
                        [r.pid, r.uid, r.rating, r.comment]
                    );
                } catch (e) {
                    // ignore unique constraint collisions if users count < 3
                }
            }
        }

        console.log('Seed completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seedImageryAndData();
