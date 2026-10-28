import { NavLink, Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { 
    LayoutDashboard, Package, Warehouse, ShoppingBag, 
    Store, SlidersHorizontal, Sun, Moon, LogOut, Layers, 
    User as UserIcon, Tag
} from 'lucide-react';

export default function SellerLayout({ children }) {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <div className="seller-layout">
            <aside className="sidebar">
                <div className="brand">
                    <div className="nav-brand-icon" style={{ width: '28px', height: '28px', borderRadius: '7px' }}>
                        <Layers size={16} strokeWidth={2.4} />
                    </div>
                    <span>Nex<span style={{ color: 'var(--primary)' }}>Stock</span></span>
                    <span className="badge warning" style={{ marginLeft: 'auto', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Tag size={10} /> Merchant
                    </span>
                </div>
                
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', margin: '8px 0 4px 8px' }}>
                    Merchant Workspace
                </div>

                <NavLink to="/seller/dashboard" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={16} strokeWidth={2} />
                    <span>Analytics</span>
                </NavLink>
                <NavLink to="/seller/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Package size={16} strokeWidth={2} />
                    <span>My Catalog</span>
                </NavLink>
                <NavLink to="/seller/inventory" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Warehouse size={16} strokeWidth={2} />
                    <span>Warehouse Stock</span>
                </NavLink>
                <NavLink to="/seller/orders" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <ShoppingBag size={16} strokeWidth={2} />
                    <span>Incoming Orders</span>
                </NavLink>
                
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '16px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', margin: '4px 0 4px 8px' }}>
                        Quick Navigation
                    </div>
                    <Link to="/storefront" className="nav-link" style={{ fontSize: '0.86rem' }}>
                        <Store size={15} />
                        <span>Customer Storefront</span>
                    </Link>
                    {user?.role === 'admin' && (
                        <Link to="/admin/dashboard" className="nav-link" style={{ fontSize: '0.86rem' }}>
                            <SlidersHorizontal size={15} />
                            <span>Admin Console</span>
                        </Link>
                    )}
                </div>
                
                <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button 
                        className="btn secondary sm" 
                        onClick={toggleTheme} 
                        style={{ width: '100%', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {theme === 'dark' ? <><Sun size={14} /> Light Appearance</> : <><Moon size={14} /> Dark Appearance</>}
                    </button>
                    {user && (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <UserIcon size={12} />
                            <span>Merchant: <strong>{user.name || user.username}</strong></span>
                        </div>
                    )}
                    <button 
                        className="btn outline sm" 
                        onClick={logout} 
                        style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    );
}
