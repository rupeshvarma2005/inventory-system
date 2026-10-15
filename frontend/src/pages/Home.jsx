import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getApiError } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('trending');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getProducts()
      .then(data => {
        setProducts(data);
        setError(null);
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      await api.addToCart({ product_id: productId, quantity: 1 });
    } catch (err) {
      alert(getApiError(err));
    }
  };

  // Curated segments based on actual data
  const specialOffers = products.filter(p => parseFloat(p.discount_percentage || 0) > 0);
  const bestSellers = [...products].sort((a, b) => parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0));
  const newArrivals = [...products].reverse();

  const displayedProducts = activeTab === 'trending' 
    ? products.slice(0, 4) 
    : activeTab === 'bestsellers' 
      ? bestSellers.slice(0, 4) 
      : newArrivals.slice(0, 4);

  const categories = [
    { name: 'Electronics', icon: '⚡', desc: 'Precision gadgets, GaN chargers & audio', query: 'Electronics' },
    { name: 'Home & Kitchen', icon: '🏡', desc: 'Non-stick cookware & sateen linens', query: 'Home %26 Kitchen' },
    { name: 'Apparel', icon: '👔', desc: 'Engineered running tees & everyday comfort', query: 'Apparel' },
    { name: 'Sports & Fitness', icon: '🏃', desc: 'High-density yoga mats & workout gear', query: 'Sports %26 Fitness' },
  ];

  return (
    <div>
      <ApiErrorBanner error={error} />

      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-glow-1"></div>
        <div className="hero-glow-2"></div>

        <div className="hero-content">
          <div className="hero-pill">
            <span>✦</span>
            <span>The New Standard in Commerce</span>
          </div>

          <h1 className="hero-title">
            Curated Living. <br />
            <span className="gradient-text">Exceptional Quality.</span>
          </h1>

          <p className="hero-subtitle">
            Experience hand-selected tech, artisanal kitchenware, and performance apparel engineered with precision and dispatched from nearby fulfillment hubs.
          </p>

          <div className="hero-actions">
            <Link to="/products" className="btn lg">
              <span>Explore Catalog</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <Link to="/products?deals=true" className="btn secondary lg">
              <span>View Offers (-30%)</span>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-item">
              <h4>4.9 ★</h4>
              <p>Customer Rating</p>
            </div>
            <div className="hero-stat-item">
              <h4>100%</h4>
              <p>Authentic Verified</p>
            </div>
            <div className="hero-stat-item">
              <h4>4 Hubs</h4>
              <p>Fast Regional Dispatch</p>
            </div>
          </div>
        </div>

        {/* Hero Visual Composition */}
        <div className="hero-visual">
          <div className="hero-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80" 
              alt="Curated Lifestyle Showcase" 
            />
          </div>

          {/* Floating Glassmorphic Badges */}
          <div className="hero-floating-card card-top">
            <div className="hero-floating-icon">✦</div>
            <div className="hero-floating-text">
              <h5>Verified Quality</h5>
              <p>Rigorous multi-point testing</p>
            </div>
          </div>

          <div className="hero-floating-card card-bottom">
            <div className="hero-floating-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>⚡</div>
            <div className="hero-floating-text">
              <h5>Same-Day Dispatch</h5>
              <p>From nearest warehouse hub</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Value Proposition Pillars */}
      <section className="value-strip">
        <div className="value-card">
          <div className="value-icon">⚡</div>
          <div className="value-info">
            <h4>Fast Hub Delivery</h4>
            <p>Smart inventory routing from 4 regional hubs</p>
          </div>
        </div>
        <div className="value-card">
          <div className="value-icon">🛡️</div>
          <div className="value-info">
            <h4>Certified Authenticity</h4>
            <p>Direct manufacturer relationships with zero grey-market goods</p>
          </div>
        </div>
        <div className="value-card">
          <div className="value-icon">↩️</div>
          <div className="value-info">
            <h4>Hassle-Free Returns</h4>
            <p>Simple 7-day pickup &amp; instant refund processing</p>
          </div>
        </div>
        <div className="value-card">
          <div className="value-icon">💎</div>
          <div className="value-info">
            <h4>Concierge Support</h4>
            <p>Dedicated order assistance 7 days a week</p>
          </div>
        </div>
      </section>

      {/* 3. Featured Categories */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="section-header">
          <div>
            <h2>Explore Collections</h2>
            <p>Curated essentials categorized for your lifestyle</p>
          </div>
          <Link to="/products" className="section-link">
            <span>Browse All</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((cat, idx) => (
            <div 
              key={idx} 
              className="category-card"
              onClick={() => navigate(`/products?category=${cat.query}`)}
            >
              <div className="category-card-icon">{cat.icon}</div>
              <h3>{cat.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '8px' }}>{cat.desc}</p>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Explore Category &rarr;</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Promotional Banner Strip */}
      <section style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 3rem',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem',
        marginBottom: '4rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '580px' }}>
          <span style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '10px'
          }}>
            EXCLUSIVE OFFER
          </span>
          <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
            Upgrade Your Setup with 10% Off
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem' }}>
            Use voucher code <strong style={{ color: '#FCD34D', letterSpacing: '0.05em' }}>LUXE10</strong> at checkout on all orders above ₹500. Complimentary pan-India shipping included.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '1rem' }}>
          <Link to="/products?deals=true" className="btn accent lg">
            Claim Offer Now
          </Link>
        </div>
      </section>

      {/* 5. Special Offers Showcase */}
      {specialOffers.length > 0 && (
        <section style={{ marginBottom: '4rem' }}>
          <div className="section-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="discount-pill">LIMITED TIME OFFERS</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>Save up to 30%</span>
              </div>
              <h2>Today's Spotlight Deals</h2>
            </div>
            <Link to="/products?deals=true" className="section-link">
              <span>View all deals ({specialOffers.length})</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="product-grid">
            {specialOffers.slice(0, 3).map(product => (
              <ProductCard 
                key={product.product_id} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. Dynamic Curation Tabs (Trending / Best Sellers / New Arrivals) */}
      <section style={{ marginBottom: '4rem' }}>
        <div className="section-header" style={{ flexWrap: 'wrap' }}>
          <div>
            <h2>Curated Collection</h2>
            <p>Top-rated items handpicked for quality and endurance</p>
          </div>

          <div className="filter-chips">
            <button 
              className={`filter-chip ${activeTab === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveTab('trending')}
            >
              🔥 Trending
            </button>
            <button 
              className={`filter-chip ${activeTab === 'bestsellers' ? 'active' : ''}`}
              onClick={() => setActiveTab('bestsellers')}
            >
              ⭐ Top Rated
            </button>
            <button 
              className={`filter-chip ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => setActiveTab('new')}
            >
              ✨ Fresh Drops
            </button>
          </div>
        </div>

        {loading ? (
          <div className="product-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="product-card" style={{ height: '380px' }}>
                <div className="skeleton" style={{ height: '220px', width: '100%' }}></div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '40%' }}></div>
                  <div className="skeleton" style={{ height: '20px', width: '80%' }}></div>
                  <div className="skeleton" style={{ height: '16px', width: '30%' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {displayedProducts.map(product => (
              <ProductCard 
                key={product.product_id} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/products" className="btn secondary lg">
            <span>Explore All {products.length} Products</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
