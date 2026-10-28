import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { api } from '../../api.js';
import { 
    Search, ShoppingBag, Sun, Moon, Sparkles, Cpu, Home, Shirt, 
    Activity, Tag, ShieldCheck, Truck, RotateCcw, X, Layers,
    ChevronRight, Store, SlidersHorizontal, LogOut, User as UserIcon
} from 'lucide-react';

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
            navigate(`/storefront?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/storefront');
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
        { name: 'All Collections', path: '/storefront', icon: Sparkles },
        { name: 'Electronics', path: '/storefront?category=Electronics', icon: Cpu },
        { name: 'Home & Living', path: '/storefront?category=Home %26 Kitchen', icon: Home },
        { name: 'Apparel', path: '/storefront?category=Apparel', icon: Shirt },
        { name: 'Fitness & Sports', path: '/storefront?category=Sports %26 Fitness', icon: Activity },
        { name: 'Special Offers', path: '/storefront?deals=true', icon: Tag },
    ];

    return (
        <div className="customer-layout">
            {/* Top IMS Simulation Bar */}
            <div style={{
                background: 'linear-gradient(90deg, #1E293B, #0F172A)',
                color: '#F8FAFC',
                padding: '8px 1.5rem',
                fontSize: '0.82rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 999
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        Storefront Demo
                    </span>
                    <span style={{ color: '#CBD5E1' }}>
                        Orders placed here trigger real-time stock deduction across warehouse hubs in the IMS.
                    </span>
                </div>
                <Link 
                    to="/" 
                    style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}
                >
                    ← Back to NexStock Inventory Console
                </Link>
            </div>

            {/* Top Announcement Bar */}
            <div className="announcement-bar">
                <span className="announcement-badge">Complimentary Dispatch</span>
                <span>Free express delivery on all orders over ₹500 &bull; Use code <strong>LUXE10</strong> for 10% savings</span>
                <Link to="/storefront?deals=true" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--primary)', textDecoration: 'none', marginLeft: '6px' }}>
                    Shop Deals <ChevronRight size={13} />
                </Link>
            </div>

            {/* Main Header */}
            <header className="top-nav">
                <div className="nav-container">
                    {/* Brand */}
                    <Link to="/storefront" className="nav-brand" aria-label="NexStock Home">
                        <div className="nav-brand-icon">
                            <Layers size={18} strokeWidth={2.4} />
                        </div>
                        <span>Nex<span className="highlight">Stock</span></span>
                    </Link>
                    
                    {/* Search Bar (Spotlight Style) */}
                    <div className="nav-search">
                        <form onSubmit={handleSearch}>
                            <span className="nav-search-icon">
                                <Search size={16} strokeWidth={2.2} />
                            </span>
                            <input 
                                type="text" 
                                placeholder="Search products, technology, home goods..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    type="button" 
                                    onClick={() => setSearchQuery('')}
                                    style={{ background: 'transparent', color: 'var(--text-dim)', border: 'none', padding: '0 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    title="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <button type="submit">
                                <span>Search</span>
                            </button>
                        </form>
                    </div>
                    
                    {/* Navigation Actions */}
                    <div className="nav-actions">
                        {user ? (
                            <>
                                <Link to="/orders" className="nav-link-btn" title="View Order History">
                                    <ShoppingBag size={16} strokeWidth={2} />
                                    <span>Orders</span>
                                </Link>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-raised)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid var(--border-subtle)' }}>
                                    <UserIcon size={14} style={{ color: 'var(--primary)' }} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)' }}>
                                        {user.name ? user.name.split(' ')[0] : user.username}
                                    </span>
                                    <button 
                                        onClick={logout}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
                                        title="Sign out"
                                    >
                                        <LogOut size={13} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link-btn">Sign In</Link>
                                <Link to="/register" className="btn sm">Get Started</Link>
                            </>
                        )}
                        
                        {/* Cart Trigger */}
                        <Link to="/cart" className="cart-icon-wrapper" aria-label="Shopping Bag">
                            <ShoppingBag size={17} strokeWidth={2} />
                            <span>Bag</span>
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>

                        {/* Workspace Switcher (only for authenticated Admins & Sellers) */}
                        {user && ['seller', 'admin'].includes(user.role) && (
                            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-raised)', padding: '3px', borderRadius: '9999px', border: '1px solid var(--border-subtle)' }}>
                                <Link to="/seller/dashboard" className="nav-link-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} title="Seller Workspace">
                                    <Store size={13} /> Seller
                                </Link>
                                {user.role === 'admin' && (
                                    <Link to="/admin/dashboard" className="nav-link-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} title="Admin Console">
                                        <SlidersHorizontal size={13} /> Admin
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Theme Toggle (Cupertino Sun/Moon) */}
                        <button 
                            className="theme-toggle-btn" 
                            onClick={toggleTheme} 
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                            aria-label="Toggle visual theme"
                        >
                            {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
                        </button>
                    </div>
                </div>

                {/* Apple Segmented Category Navigation Strip */}
                <div className="category-subnav">
                    <div className="category-subnav-container">
                        {categories.map((c, i) => {
                            const IconComponent = c.icon;
                            const isActive = location.pathname + location.search === c.path;
                            return (
                                <Link 
                                    key={i} 
                                    to={c.path} 
                                    className={`category-subnav-link ${isActive ? 'active' : ''}`}
                                >
                                    <IconComponent size={14} strokeWidth={2} />
                                    <span>{c.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </header>
            
            {/* Main Page Content */}
            <main className="main-content">
                {children}
            </main>

            {/* Apple Clean Minimalist Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-brand">
                        <div className="nav-brand" style={{ marginBottom: '12px' }}>
                            <div className="nav-brand-icon">
                                <Layers size={18} strokeWidth={2.4} />
                            </div>
                            <span>Nex<span className="highlight">Stock</span></span>
                        </div>
                        <p style={{ lineHeight: '1.6', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                            Engineered for precision living. Curated flagship electronics, artisan lifestyle goods, and performance apparel dispatched from regional hubs.
                        </p>
                    </div>

                    <div className="footer-col">
                        <h4>Explore Catalog</h4>
                        <ul className="footer-links">
                            <li><Link to="/products?category=Electronics">Electronics &amp; Gadgets</Link></li>
                            <li><Link to="/products?category=Home %26 Kitchen">Home &amp; Kitchen</Link></li>
                            <li><Link to="/products?category=Apparel">Apparel &amp; Fashion</Link></li>
                            <li><Link to="/products?category=Sports %26 Fitness">Fitness &amp; Outdoors</Link></li>
                            <li><Link to="/products?deals=true">Special Offers</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>Customer Care</h4>
                        <ul className="footer-links">
                            <li><Link to="/orders">Order Tracking</Link></li>
                            <li><Link to="/cart">Shopping Bag</Link></li>
                            <li><Link to="/login">Account Access</Link></li>
                            <li><Link to="/seller/register" style={{ color: 'var(--accent, #f59e0b)', fontWeight: 600 }}>Sell on NexStock &rarr;</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4>NexStock Insider</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>
                            Subscribe to receive curated product drops and exclusive private sale previews.
                        </p>
                        {subscribed ? (
                            <div style={{ color: 'var(--good)', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={16} /> Subscribed to NexStock Insider.
                            </div>
                        ) : (
                            <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    required 
                                    style={{ flex: 1, padding: '7px 12px', fontSize: '0.85rem' }}
                                />
                                <button type="submit" className="btn sm">Join</button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>&copy; {new Date().getFullYear()} NexStock Technologies, Inc. All rights reserved.</span>
                    <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={14} style={{ color: 'var(--primary)' }} /> 256-Bit SSL Encryption
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Truck size={14} style={{ color: 'var(--primary)' }} /> 4-Hub Regional Routing
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <RotateCcw size={14} style={{ color: 'var(--primary)' }} /> 7-Day Guaranteed Returns
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
