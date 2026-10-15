import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { api } from '../../api.js';

export default function CustomerLayout({ children }) {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch initial cart count
    useEffect(() => {
        if (localStorage.getItem('token') || import.meta.env.VITE_AUTH_BYPASS === 'true') {
            api.getCart()
                .then(items => {
                    const count = Array.isArray(items) ? items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
                    setCartCount(count);
                })
                .catch(() => {});
        }
    }, [location.pathname]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/products');
        }
    };

    const handleNewsletter = (e) => {
        e.preventDefault();
        if (newsletterEmail.trim()) {
            setSubscribed(true);
            setNewsletterEmail('');
        }
    };

    const categories = [
        { name: 'All Products', path: '/products', icon: '✦' },
        { name: 'Electronics', path: '/products?category=Electronics', icon: '⚡' },
        { name: 'Home & Kitchen', path: '/products?category=Home %26 Kitchen', icon: '🏡' },
        { name: 'Apparel', path: '/products?category=Apparel', icon: '👔' },
        { name: 'Sports & Fitness', path: '/products?category=Sports %26 Fitness', icon: '🏃' },
        { name: 'Special Offers', path: '/products?deals=true', icon: '🏷️' },
    ];

    return (
        <div className="customer-layout">
            {/* Top Announcement Bar */}
            <div className="announcement-bar">
                <span className="announcement-badge">LIMITED TIME</span>
                <span>✨ Free Express Delivery on orders over ₹500 &bull; Use code <strong>LUXE10</strong> for 10% off today &bull; 100% Genuine Certified</span>
            </div>

            {/* Main Header */}
            <header className="top-nav">
                <div className="nav-container">
                    {/* Brand */}
                    <Link to="/" className="nav-brand">
                        <div className="nav-brand-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </div>
                        <span>Market<span className="highlight">Hub</span></span>
                    </Link>
                    
                    {/* Search Bar */}
                    <div className="nav-search">
                        <form onSubmit={handleSearch}>
                            <span className="nav-search-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </span>
                            <input 
                                type="text" 
                                placeholder="Search premium tech, home decor, apparel..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    type="button" 
                                    onClick={() => setSearchQuery('')}
                                    style={{ background: 'transparent', color: 'var(--text-dim)', border: 'none', padding: '0 8px', cursor: 'pointer', fontSize: '1rem' }}
                                    title="Clear"
                                >
                                    ✕
                                </button>
                            )}
                            <button type="submit">
                                <span>Search</span>
                            </button>
                        </form>
                    </div>
                    
                    {/* Actions */}
                    <div className="nav-actions">
                        {user ? (
                            <>
                                <Link to="/orders" className="nav-link-btn" title="View Order History">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                                    </svg>
                                    <span>Orders</span>
                                </Link>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                        {user.name.split(' ')[0]}
                                    </span>
                                    <button 
                                        className="btn secondary sm" 
                                        onClick={logout}
                                        style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link-btn">Login</Link>
                                <Link to="/register" className="btn sm">Sign Up</Link>
                            </>
                        )}
                        
                        {/* Cart */}
                        <Link to="/cart" className="cart-icon-wrapper" aria-label="Shopping Cart">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <span>Cart</span>
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>

                        {/* Admin / Seller shortcuts */}
                        {(import.meta.env.VITE_AUTH_BYPASS === 'true' || (user && ['seller', 'admin'].includes(user.role))) && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <Link to="/seller/dashboard" className="btn secondary sm" title="Seller Operations">
                                    📦 Seller
                                </Link>
                                <Link to="/admin/dashboard" className="btn secondary sm" title="Admin Oversight">
                                    🛡️ Admin
                                </Link>
                            </div>
                        )}

                        {/* Theme Toggle */}
                        <button 
                            className="theme-toggle-btn" 
                            onClick={toggleTheme} 
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                            aria-label="Toggle visual theme"
                        >
                            {theme === 'dark' ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Category Navigation Strip */}
                <div className="category-subnav">
                    <div className="category-subnav-container">
                        {categories.map((c, i) => (
                            <Link 
                                key={i} 
                                to={c.path} 
                                className={`category-subnav-link ${location.pathname + location.search === c.path ? 'active' : ''}`}
                            >
                                <span>{c.icon}</span>
                                <span>{c.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </header>
            
            {/* Main Page Content */}
            <main className="main-content">
                {children}
            </main>

            {/* Luxury Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-brand">
                        <div className="nav-brand" style={{ marginBottom: '8px' }}>
                            <div className="nav-brand-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                </svg>
                            </div>
                            <span>Market<span className="highlight">Hub</span></span>
                        </div>
                        <p>
                            Curated multi-vendor commerce platform engineered for supreme reliability, verified merchant authenticity, and instantaneous delivery.
                        </p>
                    </div>

                    <div className="footer-col">
                        <h4>Explore Categories</h4>
                        <ul className="footer-links">
                            <li><Link to="/products?category=Electronics">Electronics &amp; Gadgets</Link></li>
                            <li><Link to="/products?category=Home %26 Kitchen">Home &amp; Kitchen</Link></li>
                            <li><Link to="/products?category=Apparel">Apparel &amp; Fashion</Link></li>
                            <li><Link to="/products?category=Sports %26 Fitness">Fitness &amp; Outdoors</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Customer Care</h4>
                        <ul className="footer-links">
                            <li><Link to="/orders">Order Tracking</Link></li>
                            <li><Link to="/cart">Shopping Bag</Link></li>
                            <li><Link to="/login">Account Access</Link></li>
                            <li><a href="#privacy">Privacy &amp; Terms</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Privilege Newsletter</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                            Receive private drops, insider sale previews, and exclusive editorial curations.
                        </p>
                        {subscribed ? (
                            <div style={{ color: 'var(--good)', fontWeight: 600, fontSize: '0.9rem' }}>
                                ✓ Welcome to MarketHub Private Circle!
                            </div>
                        ) : (
                            <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    required 
                                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                                />
                                <button type="submit" className="btn sm">Join</button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>&copy; {new Date().getFullYear()} MarketHub Technologies, Inc. All rights reserved.</span>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <span>🔒 256-Bit SSL Encryption</span>
                        <span>⚡ Guaranteed Authenticity</span>
                        <span>📦 Nationwide Multi-Hub Dispatch</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
