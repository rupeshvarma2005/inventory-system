import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, getApiError } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { 
  Sparkles, ArrowRight, ShieldCheck, Truck, RotateCcw, 
  ChevronRight, Cpu, Home as HomeIcon, Shirt, 
  Activity, Tag, Award, ShoppingBag, Sun, Moon, ArrowDown
} from 'lucide-react';

export default function Home() {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('trending');
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const searchFilter = (searchParams.get('search') || '').trim();
  const categoryFilter = (searchParams.get('category') || '').trim();
  const dealsFilter = searchParams.get('deals');
  const hasFilter = Boolean(searchFilter || categoryFilter || dealsFilter);

  useEffect(() => {
    setLoading(true);
    api.getProducts()
      .then(data => {
        setProducts(data);
        setError(null);
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));

    // Cart Count
    if (localStorage.getItem('token') || import.meta.env.VITE_AUTH_BYPASS === 'true') {
      api.getCart()
        .then(items => {
          const count = Array.isArray(items) ? items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
          setCartCount(count);
        })
        .catch(() => {});
    }
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      await api.addToCart({ product_id: productId, quantity: 1 });
      setCartCount(prev => prev + 1);
    } catch (err) {
      alert(getApiError(err));
    }
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Curated segments based on actual data
  const specialOffers = products.filter(p => parseFloat(p.discount_percentage || 0) > 0);
  const bestSellers = [...products].sort((a, b) => parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0));
  const newArrivals = [...products].reverse();

  const filteredProducts = products.filter(p => {
    if (searchFilter && !p.name?.toLowerCase().includes(searchFilter.toLowerCase()) && !p.category?.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (categoryFilter && p.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (dealsFilter && !(parseFloat(p.discount_percentage || 0) > 0)) {
      return false;
    }
    return true;
  });

  const displayedProducts = hasFilter
    ? filteredProducts
    : activeTab === 'trending' 
      ? products.slice(0, 8) 
      : activeTab === 'bestsellers' 
        ? bestSellers.slice(0, 8) 
        : newArrivals.slice(0, 8);

  const categories = [
    { name: 'Electronics', icon: Cpu, desc: 'GaN charging, studio audio & portable power', query: 'Electronics' },
    { name: 'Home & Living', icon: HomeIcon, desc: 'Non-stick ceramics & organic cotton linens', query: 'Home %26 Kitchen' },
    { name: 'Apparel', icon: Shirt, desc: 'Technical running tees & performance comfort', query: 'Apparel' },
    { name: 'Fitness & Sports', icon: Activity, desc: 'High-density yoga mats & training gear', query: 'Sports %26 Fitness' },
  ];

  return (
    <div style={{ color: 'hsl(var(--foreground))', overflowX: 'hidden' }}>
      <ApiErrorBanner error={error} />

      {/* ====================================================================
          1. Clean Modern Store Hero Banner
          ==================================================================== */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1.5rem 2rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--surface-raised) 0%, var(--surface) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'clamp(2.5rem, 5vw, 3.5rem) clamp(1.5rem, 4vw, 3rem)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 113, 227, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ maxWidth: '780px', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--primary)',
              marginBottom: '1.25rem'
            }}>
              <Sparkles size={14} />
              <span>Multi-Hub Fulfillment Network</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              Direct Warehouse Quality. <br />
              <span style={{ color: 'var(--primary)' }}>Dispatched with Precision.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              maxWidth: '640px'
            }}>
              Explore authentic consumer electronics, lifestyle goods, and athletic apparel. Every order is verified in real-time and dispatched from regional distribution warehouses.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2.5rem' }}>
              <a 
                href="#curated-collection" 
                onClick={(e) => scrollToSection(e, 'curated-collection')}
                className="btn lg" 
                style={{ 
                  borderRadius: 'var(--radius-full)', 
                  padding: '12px 28px', 
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none'
                }}
              >
                <span>Shop All Products</span>
                <ArrowRight size={16} />
              </a>
              <Link 
                to="/storefront?deals=true" 
                className="btn secondary lg" 
                style={{ 
                  borderRadius: 'var(--radius-full)', 
                  padding: '12px 24px', 
                  fontSize: '0.95rem' 
                }}
              >
                Special Offers ({specialOffers.length})
              </Link>
            </div>

            {/* Value Guarantees Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Truck size={17} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>Express Courier Dispatch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                <ShieldCheck size={17} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>100% Certified Genuine Stock</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <RotateCcw size={17} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>7-Day Return Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Shortcut Tiles */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem 2.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem'
        }}>
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to={`/storefront?category=${cat.query}`}
                className="panel"
                style={{
                  margin: 0,
                  padding: '1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--surface-raised)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0
                }}>
                  <Icon size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cat.name}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                    {cat.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          2. Curated Product Showcases
          ==================================================================== */}
      <div id="curated-collection" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>
        {/* Curated Collection Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: 'var(--primary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              marginBottom: '8px'
            }}>
              <Sparkles size={14} />
              <span>Verified Stock Selection</span>
            </div>
            <h2 style={{ 
              fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)', 
              fontWeight: 700, 
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)'
            }}>
              Trending Across Warehouses
            </h2>
          </div>

          {/* Segmented Tab Controls */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur))',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              className={`filter-chip ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveTab('trending')}
              style={{ border: 'none' }}
            >
              Trending
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === 'bestsellers' ? 'active' : ''}`}
              onClick={() => setActiveTab('bestsellers')}
              style={{ border: 'none' }}
            >
              Top Rated
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => setActiveTab('new')}
              style={{ border: 'none' }}
            >
              New Releases
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="product-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="product-card" style={{ height: '380px' }}>
                <div className="skeleton" style={{ height: '220px', width: '100%' }}></div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '35%' }}></div>
                  <div className="skeleton" style={{ height: '20px', width: '85%' }}></div>
                  <div className="skeleton" style={{ height: '16px', width: '45%' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid" style={{ marginBottom: '4rem' }}>
            {displayedProducts.map(product => (
              <ProductCard
                key={product.product_id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {/* All Products CTA Banner */}
        <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
          <Link 
            to="/products" 
            className="btn lg" 
            style={{ 
              borderRadius: 'var(--radius-full)', 
              padding: '14px 36px', 
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>Explore Complete Catalog ({products.length} Products)</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* ====================================================================
            3. Apple / Velorah Bento Grid Value Pillars (#about)
            ==================================================================== */}
        <div id="about" style={{ marginBottom: '6rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
            <h2 style={{ 
              fontFamily: "var(--font-display)",
              fontSize: 'clamp(1.75rem, 3vw, 2.35rem)', 
              fontWeight: 700, 
              lineHeight: 1.25,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
              marginBottom: '10px'
            }}>
              Crafted with Precision. Delivered with Care.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
              NexStock operates across regional fulfillment hubs to eliminate artificial delays, verify hardware integrity, and honor conscious design.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Bento Card 1 */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--border-subtle)',
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(0, 113, 227, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
                100% Certified Authenticity
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Every SKU is inspected at our origin warehouse for serial verification, material standard, and tamper-evident sealing.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--border-subtle)',
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(52, 199, 89, 0.1)',
                color: 'var(--good)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Truck size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
                4 Regional Dispatch Hubs
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Real-time inventory locks distribute items from the nearest regional hub, cutting transit emissions and transit hours in half.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--border-subtle)',
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(255, 159, 10, 0.1)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <RotateCcw size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Effortless 7-Day Doorstep Returns
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Experience items in your home. If a piece does not completely elevate your routine, return it at no additional courier charge.
              </p>
            </div>
          </div>
        </div>

        {/* ====================================================================
            4. Seasonal Editorial Promotion
            ==================================================================== */}
        <div style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-2xl)',
          padding: '3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          marginBottom: '5rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ maxWidth: '580px' }}>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: 'var(--primary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              marginBottom: '6px',
              display: 'block'
            }}>
              Member Privilege
            </span>
            <h3 style={{ 
              fontFamily: "var(--font-display)", 
              fontSize: 'clamp(1.4rem, 2.4vw, 1.9rem)', 
              fontWeight: 700, 
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              Enjoy 10% Savings on Your First Order.
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Use coupon code <strong style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>LUXE10</strong> during checkout to unlock courtesy discounts and express dispatch.
            </p>
          </div>
          <Link 
            to="/products?deals=true" 
            className="btn"
            style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px', whiteSpace: 'nowrap' }}
          >
            Claim Privilege Offer
          </Link>
        </div>
      </div>
    </div>
  );
}
