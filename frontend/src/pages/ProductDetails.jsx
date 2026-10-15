import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, getApiError } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import { getProductImage, handleImageError } from '../utils/productImages.js';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [justAdded, setJustAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getProduct(id)
      .then(data => {
        setProduct(data);
        const initialImg = (data.images && data.images.length > 0) 
          ? data.images[0].image_url 
          : getProductImage(data);
        setSelectedImage(initialImg);
        setError(null);
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || isAdding) return;
    setIsAdding(true);
    try {
      await api.addToCart({ product_id: product.product_id, quantity });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2500);
    } catch (err) {
      alert(getApiError(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await api.addToCart({ product_id: product.product_id, quantity });
      navigate('/cart');
    } catch (err) {
      alert(getApiError(err));
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 0' }}>
        <div className="product-details-container">
          <div className="skeleton" style={{ height: '450px', borderRadius: '16px' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '24px', width: '30%' }}></div>
            <div className="skeleton" style={{ height: '40px', width: '80%' }}></div>
            <div className="skeleton" style={{ height: '30px', width: '40%' }}></div>
            <div className="skeleton" style={{ height: '120px', width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="empty-state" style={{ margin: '3rem auto', maxWidth: '600px' }}>
        <div className="empty-state-icon">⚠️</div>
        <h3>Product Not Found</h3>
        <p>The requested product could not be loaded or has been archived.</p>
        <Link to="/products" className="btn" style={{ marginTop: '1rem' }}>Return to Catalog</Link>
      </div>
    );
  }

  const originalPrice = parseFloat(product.price || 0);
  const discount = parseFloat(product.discount_percentage || 0);
  const finalPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
  const savings = originalPrice - finalPrice;
  const rating = parseFloat(product.average_rating || 0);
  const reviewCount = parseInt(product.review_count || 0, 10);
  const stock = parseInt(product.total_stock != null ? product.total_stock : 10, 10);
  const isOutOfStock = stock <= 0;

  // Gallery images array fallback
  const galleryImages = product.images && product.images.length > 0
    ? product.images.map(img => img.image_url)
    : [getProductImage(product)];

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
      {/* Breadcrumb Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', fontSize: '0.88rem', color: 'var(--text-dim)' }}>
        <Link to="/" style={{ color: 'var(--text-dim)' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: 'var(--text-dim)' }}>Products</Link>
        <span>/</span>
        <Link to={`/products?category=${encodeURIComponent(product.category || '')}`} style={{ color: 'var(--text-dim)' }}>
          {product.category || 'General'}
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      <ApiErrorBanner error={error} />

      {/* Main Details Grid */}
      <div className="product-details-container">
        {/* Gallery */}
        <div className="details-gallery">
          <div className="details-main-img">
            <img 
              src={selectedImage} 
              alt={product.name} 
              onError={handleImageError} 
            />
          </div>

          {galleryImages.length > 1 && (
            <div className="details-thumbs">
              {galleryImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`details-thumb ${selectedImage === img ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img} alt="" onError={handleImageError} />
                </div>
              ))}
            </div>
          )}

          {/* Value Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '1rem' }}>
            <div style={{ background: 'var(--surface-raised)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem' }}>🛡️</span>
              <div style={{ fontSize: '0.8rem' }}>
                <strong>100% Genuine</strong>
                <p style={{ color: 'var(--text-dim)' }}>Verified supplier source</p>
              </div>
            </div>
            <div style={{ background: 'var(--surface-raised)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.25rem' }}>⚡</span>
              <div style={{ fontSize: '0.8rem' }}>
                <strong>Express Delivery</strong>
                <p style={{ color: 'var(--text-dim)' }}>Dispatch from 4 regional hubs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Information */}
        <div className="details-info">
          <div>
            <span className="details-sku">SKU: {product.sku}</span>
            <h1 className="details-title">{product.name}</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Vendor: <strong style={{ color: 'var(--text)' }}>{product.seller_name || 'MarketHub Official'}</strong> &bull; Category: <span className="badge info">{product.category || 'General'}</span>
            </p>
          </div>

          {/* Rating */}
          <div className="product-rating-row" style={{ fontSize: '0.95rem' }}>
            {rating > 0 ? (
              <>
                <div className="rating-stars" style={{ fontSize: '1.1rem' }}>
                  {'★'.repeat(Math.round(rating))}
                  {'☆'.repeat(5 - Math.round(rating))}
                </div>
                <strong style={{ fontSize: '1rem' }}>{rating.toFixed(1)}</strong>
                <span className="rating-count">({reviewCount} verified buyer reviews)</span>
              </>
            ) : (
              <span className="rating-count">New Arrival &bull; Be the first to review</span>
            )}
          </div>

          {/* Price Box */}
          <div style={{ background: 'var(--surface-raised)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div className="details-price-row">
              <span className="details-price">
                ₹{finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {discount > 0 && (
                <>
                  <span className="details-orig-price">
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="discount-pill">
                    -{Math.round(discount)}% OFF
                  </span>
                </>
              )}
            </div>
            {discount > 0 && (
              <p style={{ color: 'var(--good)', fontSize: '0.88rem', fontWeight: 700, marginTop: '6px' }}>
                You save ₹{savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })} with exclusive MarketHub pricing!
              </p>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Inclusive of all applicable taxes &bull; Free Shipping on this product
            </p>
          </div>

          {/* Stock Availability */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`stock-status-pill ${isOutOfStock ? 'out-stock' : stock <= 10 ? 'low-stock' : 'in-stock'}`} style={{ margin: 0 }}>
              <span className="stock-dot"></span>
              <span>{isOutOfStock ? 'Currently Out of Stock' : stock <= 10 ? `Hurry! Only ${stock} units left in stock` : `In Stock (${stock} units available)`}</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="details-desc">{product.description}</p>
          )}

          {/* Warehouse Stock Grid (if available) */}
          {product.stock && product.stock.length > 0 && (
            <div className="details-specs">
              <h4>Regional Fulfillment Availability</h4>
              <div className="details-specs-grid">
                {product.stock.map((w, idx) => (
                  <div key={idx} className="spec-item">
                    <span>{w.warehouse}</span>
                    <strong style={{ color: w.quantity > 0 ? 'var(--good)' : 'var(--text-dim)' }}>
                      {w.quantity > 0 ? `${w.quantity} in hub` : 'Transfer required'}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div className="cart-quantity-stepper">
              <button 
                type="button" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isOutOfStock}
              >
                -
              </button>
              <span>{quantity}</span>
              <button 
                type="button" 
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                disabled={quantity >= stock || isOutOfStock}
              >
                +
              </button>
            </div>

            <button 
              type="button" 
              className={`btn lg ${justAdded ? 'accent' : ''}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              style={{ flex: 1, minWidth: '180px' }}
            >
              {justAdded ? '✓ Added to Cart!' : isAdding ? 'Adding...' : 'Add to Cart'}
            </button>

            <button 
              type="button" 
              className="btn secondary lg"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              style={{ flex: 1, minWidth: '150px' }}
            >
              Buy Now
            </button>
          </div>

          {justAdded && (
            <div style={{ 
              background: 'var(--good-soft)', 
              color: 'var(--good)', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              fontWeight: 600, 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>✓ Successfully added {quantity} item(s) to your shopping cart!</span>
              <Link to="/cart" style={{ textDecoration: 'underline', color: 'inherit' }}>View Cart &rarr;</Link>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="panel">
        <div className="section-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h3>Customer Feedback &amp; Reviews</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              {reviewCount} verified review{reviewCount === 1 ? '' : 's'} with an average score of {rating.toFixed(1)}/5.0
            </p>
          </div>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {product.reviews.map((rev, idx) => (
              <div key={idx} style={{ 
                background: 'var(--surface-raised)', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      {(rev.customer_name || 'Buyer').charAt(0)}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{rev.customer_name || 'Verified Customer'}</strong>
                      <span className="badge success" style={{ marginLeft: '8px', fontSize: '0.68rem' }}>Verified Purchase</span>
                    </div>
                  </div>
                  <div className="rating-stars">
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                </div>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)' }}>
            <p>No customer reviews have been submitted for this item yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
