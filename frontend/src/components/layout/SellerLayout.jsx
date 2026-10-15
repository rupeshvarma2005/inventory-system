import { NavLink, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ThemeContext } from '../../context/ThemeContext.jsx';

export default function SellerLayout({ children }) {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <div className="seller-layout">
            <aside className="sidebar">
                <div className="brand">
                    <div className="nav-brand-icon" style={{ width: '30px', height: '30px', borderRadius: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <span>Market<span style={{ color: 'var(--primary)' }}>Hub</span></span>
                    <span className="badge warning" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>Seller</span>
                </div>
                
                <NavLink to="/seller/dashboard" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span>📊</span>
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/seller/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span>🏷️</span>
                    <span>My Catalog</span>
                </NavLink>
                <NavLink to="/seller/inventory" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span>📦</span>
                    <span>Warehouse Stock</span>
                </NavLink>
                <NavLink to="/seller/orders" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <span>📋</span>
                    <span>Incoming Orders</span>
                </NavLink>
                
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Link to="/" className="nav-link" style={{ fontSize: '0.85rem' }}>
                        <span>🛍️</span>
                        <span>Customer Store</span>
                    </Link>
                    <Link to="/admin/dashboard" className="nav-link" style={{ fontSize: '0.85rem' }}>
                        <span>🛡️</span>
                        <span>Admin Console</span>
                    </Link>
                </div>
                
                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <button className="btn secondary sm" onClick={toggleTheme} style={{ width: '100%', marginBottom: '10px' }}>
                        {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                    </button>
                    {user && (
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '10px' }}>
                            Merchant: <strong>{user.name || user.username}</strong>
                        </div>
                    )}
                    <button className="btn outline sm" onClick={logout} style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}>
                        Sign Out
                    </button>
                </div>
            </aside>
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
}
