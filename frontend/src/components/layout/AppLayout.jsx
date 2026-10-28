import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { 
    LayoutDashboard, 
    Package, 
    Warehouse, 
    ShoppingBag, 
    Factory, 
    ArrowDownToLine, 
    Boxes, 
    Store, 
    Sun, 
    Moon, 
    LogOut, 
    ShieldCheck, 
    User as UserIcon, 
    Search,
    ExternalLink,
    Plus,
    Activity,
    Layers,
    SlidersHorizontal
} from 'lucide-react';

export default function AppLayout({ children }) {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div className="admin-layout" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '270px 1fr' }}>
            {/* Sidebar */}
            <aside className="sidebar" style={{ 
                background: 'var(--surface)', 
                borderRight: '1px solid var(--border)',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                height: '100vh',
                position: 'sticky',
                top: 0
            }}>
                {/* Brand Header */}
                <div style={{ padding: '0 0.5rem 1.25rem 0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '10px', 
                            background: 'linear-gradient(135deg, var(--primary), #0056B3)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <Boxes size={20} strokeWidth={2.4} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>
                                Nex<span style={{ color: 'var(--primary)' }}>Stock</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '2px' }}>
                                Enterprise Multi-Hub IMS
                            </div>
                        </div>
                    </Link>
                </div>
                
                {/* Section 1: Core Operations */}
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.06em', margin: '6px 0 4px 10px' }}>
                    Core Operations
                </div>

                <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={17} strokeWidth={2} />
                    <span>Executive Dashboard</span>
                </NavLink>

                <NavLink to="/inventory" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Layers size={17} strokeWidth={2} />
                    <span>Multi-Hub Stock</span>
                </NavLink>

                <NavLink to="/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Package size={17} strokeWidth={2} />
                    <span>SKU Master Catalog</span>
                </NavLink>

                <NavLink to="/warehouses" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Warehouse size={17} strokeWidth={2} />
                    <span>Fulfillment Hubs</span>
                </NavLink>

                {/* Section 2: Supply Chain & Logistics */}
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.06em', margin: '14px 0 4px 10px' }}>
                    Logistics &amp; Supply Chain
                </div>

                <NavLink to="/orders" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <ShoppingBag size={17} strokeWidth={2} />
                    <span>Outbound Dispatch</span>
                </NavLink>

                <NavLink to="/purchases" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <ArrowDownToLine size={17} strokeWidth={2} />
                    <span>Purchase Orders (PO)</span>
                </NavLink>

                <NavLink to="/suppliers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Factory size={17} strokeWidth={2} />
                    <span>Suppliers Ledger</span>
                </NavLink>
                
                
                {/* Sidebar Footer */}
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Database Telemetry Badge */}
                    <div style={{ 
                        fontSize: '0.74rem', 
                        padding: '6px 10px', 
                        background: 'var(--surface-raised)', 
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: 'var(--text-muted)'
                    }}>
                        <span className="stock-dot" style={{ background: 'var(--good)' }}></span>
                        <span>MySQL 8.0 Live Sync (3306)</span>
                    </div>

                    {/* Dark/Light mode toggle */}
                    <button 
                        className="btn secondary sm" 
                        onClick={toggleTheme} 
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.82rem' }}
                    >
                        {theme === 'dark' ? <><Sun size={14} /> Light Appearance</> : <><Moon size={14} /> Dark Appearance</>}
                    </button>

                    {/* Operator Account info */}
                    <div style={{ 
                        fontSize: '0.78rem', 
                        color: 'var(--text-dim)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '4px 6px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <UserIcon size={12} />
                            </div>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.name || user?.username || 'Admin Operator'}
                            </span>
                        </div>
                        <button 
                            onClick={logout} 
                            title="Sign Out"
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px 4px' }}
                        >
                            <LogOut size={13} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Application Area */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top Enterprise Header Bar */}
                <header style={{ 
                    height: '64px', 
                    borderBottom: '1px solid var(--border)', 
                    background: 'var(--surface)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0 2rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50
                }}>
                    {/* Global Search Bar */}
                    <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', width: '380px', position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-dim)' }} />
                        <input 
                            type="text" 
                            placeholder="Quick find SKU, product, hub, or order..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '8px 12px 8px 34px', 
                                fontSize: '0.84rem', 
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--border)',
                                background: 'var(--surface-raised)',
                                outline: 'none'
                            }} 
                        />
                    </form>

                    {/* Right Action Cluster */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            fontSize: '0.8rem', 
                            color: 'var(--text-muted)',
                            background: 'var(--surface-raised)',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <ShieldCheck size={14} style={{ color: user?.role === 'admin' ? 'var(--primary)' : 'var(--accent)' }} />
                            <span>Role: <strong>{user?.role === 'admin' ? 'System Administrator' : user?.role === 'seller' ? 'Merchant / Seller' : 'Inventory Operator'}</strong></span>
                        </div>

                        <Link 
                            to="/inventory" 
                            className="btn sm"
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '5px',
                                borderRadius: 'var(--radius-full)',
                                padding: '6px 14px',
                                fontSize: '0.82rem'
                            }}
                        >
                            <Plus size={14} />
                            Adjust Stock
                        </Link>

                        <Link 
                            to="/storefront" 
                            className="btn secondary sm"
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                borderRadius: 'var(--radius-full)',
                                padding: '6px 14px',
                                fontSize: '0.82rem',
                                color: 'var(--primary)'
                            }}
                        >
                            <Store size={14} />
                            Storefront Demo
                        </Link>
                    </div>
                </header>

                {/* Page Content Body */}
                <main className="dashboard-main" style={{ flex: 1, padding: '2rem 2.5rem' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
