import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, getApiError } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import { getProductImage, handleImageError } from '../utils/productImages.js';
import { 
  ShieldCheck, Truck, Star, ArrowRight, Check, Plus, 
  Minus, ShoppingBag, ChevronRight, AlertCircle, Warehouse
} from 'lucide-react';

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
        <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center' }}>
          <AlertCircle size={48} color="var(--danger)" />
        </div>
        <h3>Product Not Available</h3>
        <p>The requested product catalog item could not be found or has been discontinued.</p>
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
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
        <Link to="/" style={{ color: 'var(--text-dim)' }}>Home</Link>
        <ChevronRight size={13} />
        <Link to="/products" style={{ color: 'var(--text-dim)' }}>Catalog</Link>
        <ChevronRight size={13} />
        <Link to={`/products?category=${encodeURIComponent(product.category || '')}`} style={{ color: 'var(--text-dim)' }}>
          {product.category || 'General'}
        </Link>
        <ChevronRight size={13} />
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{product.name}</span>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '1.25rem' }}>
            <div style={{ background: 'var(--surface-raised)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="var(--primary)" />
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: 'var(--text)' }}>100% Genuine</strong>
                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Verified supplier source</p>
              </div>
            </div>
            <div style={{ background: 'var(--surface-raised)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Truck size={20} color="var(--primary)" />
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: 'var(--text)' }}>Regional Dispatch</strong>
                <p style={{ color: 'var(--text-dim)', margin: 0 }}>Dispatched from 4 local hubs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Information */}
        <div className="details-info">
          <div>
            <span className="details-sku" style={{ letterSpacing: '0.04em' }}>SKU: {product.sku}</span>
            <h1 className="details-title" style={{ letterSpacing: '-0.03em' }}>{product.name}</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Vendor: <strong style={{ color: 'var(--text)' }}>{product.seller_name || 'NexStock Official'}</strong> &bull; Category: <span className="badge info">{product.category || 'General'}</span>
            </p>
          </div>

          {/* Rating */}
          <div className="product-rating-row" style={{ fontSize: '0.9rem' }}>
            {rating > 0 ? (
              <>
                <div className="rating-stars" style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <Star 
                      key={starIdx} 
                      size={15} 
                      fill={starIdx <= Math.round(rating) ? "#FF9F0A" : "none"} 
                      color={starIdx <= Math.round(rating) ? "#FF9F0A" : "var(--border)"}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{rating.toFixed(1)}</strong>
                <span className="rating-count">({reviewCount} verified reviews)</span>
              </>
            ) : (
              <span className="rating-count">New Release &bull; Be the first to review</span>
            )}
          </div>

          {/* Price Box */}
          <div style={{ background: 'var(--surface-raised)', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div className="details-price-row">
              <span className="details-price" style={{ letterSpacing: '-0.02em' }}>
                ₹{finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {discount > 0 && (
                <>
                  <span className="details-orig-price">
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="discount-pill">
                    -{Math.round(discount)}%
                  </span>
                </>
              )}
            </div>
            {discount > 0 && (
              <p style={{ color: 'var(--good)', fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>
                Save ₹{savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })} with exclusive NexStock pricing
              </p>
            )}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Inclusive of all taxes &bull; Complimentary regional shipping included
            </p>
          </div>

          {/* Stock Availability with Apple micro-pulse */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`stock-status-pill ${isOutOfStock ? 'out-stock' : stock <= 10 ? 'low-stock' : 'in-stock'}`} style={{ margin: 0 }}>
              <span className="stock-dot"></span>
              <span>{isOutOfStock ? 'Currently Out of Stock' : stock <= 10 ? `Only ${stock} units remaining in stock` : `In Stock (${stock} units available)`}</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="details-desc" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{product.description}</p>
          )}

          {/* Warehouse Stock Grid (if available) */}
          {product.stock && product.stock.length > 0 && (
            <div className="details-specs">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Warehouse size={15} style={{ color: 'var(--primary)' }} /> Multi-Hub Fulfillment Availability
              </h4>
              <div className="details-specs-grid">
                {product.stock.map((w, idx) => (
                  <div key={idx} className="spec-item">
                    <span>{w.warehouse}</span>
                    <strong style={{ color: w.quantity > 0 ? 'var(--good)' : 'var(--text-dim)' }}>
                      {w.quantity > 0 ? `${w.quantity} in hub` : 'Transit required'}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA buttons */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <div className="cart-quantity-stepper" style={{ borderRadius: '9999px', background: 'var(--surface-raised)' }}>
              <button 
                type="button" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                aria-label="Decrease quantity"
              >
                <Minus size={13} />
              </button>
              <span style={{ fontWeight: 600 }}>{quantity}</span>
              <button 
                type="button" 
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                disabled={quantity >= stock || isOutOfStock}
                aria-label="Increase quantity"
              >
                <Plus size={13} />
              </button>
            </div>

            <button 
              type="button" 
              className={`btn lg ${justAdded ? 'accent' : ''}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              style={{ flex: 1, minWidth: '170px' }}
            >
              {justAdded ? (
                <><Check size={16} /><span>Added to Bag</span></>
              ) : isAdding ? (
                <span>Adding...</span>
              ) : (
                <><ShoppingBag size={16} /><span>Add to Bag</span></>
              )}
            </button>

            <button 
              type="button" 
              className="btn secondary lg"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              style={{ flex: 1, minWidth: '140px' }}
            >
              <span>Instant Checkout</span>
            </button>
          </div>

          {justAdded && (
            <div style={{ 
              background: 'var(--good-soft)', 
              color: 'var(--good)', 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-sm)', 
              fontWeight: 500, 
              fontSize: '0.86rem',
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Successfully added to your shopping bag!</span>
              <Link to="/cart" style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>View Bag &rarr;</Link>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="panel" style={{ marginTop: '2.5rem' }}>
        <div className="section-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h3>Verified Customer Reviews</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              {reviewCount} verified review{reviewCount === 1 ? '' : 's'} with average rating of {rating.toFixed(1)}/5.0
            </p>
          </div>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {product.reviews.map((rev, idx) => (
              <div key={idx} style={{ 
                background: 'var(--surface-raised)', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                      {(rev.customer_name || 'B').charAt(0)}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.92rem' }}>{rev.customer_name || 'Verified Buyer'}</strong>
                      <span className="badge success" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>Verified Purchase</span>
                    </div>
                  </div>
                  <div className="rating-stars" style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star 
                        key={starIdx} 
                        size={13} 
                        fill={starIdx <= rev.rating ? "#FF9F0A" : "none"} 
                        color={starIdx <= rev.rating ? "#FF9F0A" : "var(--border)"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>
                <p style={{ color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)' }}>
            <p>No customer reviews have been published for this item yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
