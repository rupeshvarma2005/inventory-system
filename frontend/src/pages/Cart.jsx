import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Minus, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Truck, 
  Lock, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  Tag, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { api, getApiError } from '../api';
import { getProductImage, handleImageError } from '../utils/productImages.js';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await api.getCart();
      setCartItems(data);
      setError(null);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await api.removeFromCart(productId);
      loadCart();
    } catch (err) {
      alert(getApiError(err));
    }
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      return handleRemove(productId);
    }
    try {
      await api.addToCart({ product_id: productId, quantity });
      loadCart();
    } catch (err) {
      alert(getApiError(err));
    }
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'LUXE10') {
      setAppliedDiscount(10);
      setPromoMessage({ type: 'success', text: 'Privilege voucher LUXE10 applied! 10% discount credited.' });
    } else if (code) {
      setPromoMessage({ type: 'error', text: 'Invalid promo code. Try LUXE10 for 10% off.' });
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setPlacingOrder(true);
    try {
      const orderRes = await api.createOrder({ delivery_lat: 28.7041, delivery_lng: 77.1025 });
      setOrderSuccess(orderRes || { order_id: Math.floor(1000 + Math.random() * 9000) });
      loadCart();
    } catch (err) {
      alert(getApiError(err));
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 0' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '2rem' }}>Shopping Bag</h1>
        <div className="cart-grid">
          <div className="skeleton" style={{ height: '360px', borderRadius: 'var(--radius-2xl)' }}></div>
          <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-2xl)' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="api-error-banner" style={{ margin: '2rem auto', maxWidth: '800px' }}>
        <p>{error}</p>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const discountAmount = appliedDiscount > 0 ? (subtotal * (appliedDiscount / 100)) : 0;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = taxableSubtotal * 0.05; // 5% GST
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = taxableSubtotal + tax + shipping;

  const freeShippingThreshold = 500;
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>Review your Bag.</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            {cartItems.length} curated item{cartItems.length === 1 ? '' : 's'} &bull; Express delivery with priority fulfillment
          </p>
        </div>
        <Link 
          to="/products" 
          style={{ 
            color: 'var(--primary)', 
            fontWeight: 600, 
            fontSize: '0.9rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px' 
          }}
        >
          Continue Shopping <ChevronRight size={14} />
        </Link>
      </div>

      {/* Order Confirmation Apple Modal */}
      {orderSuccess && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-2xl)',
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
          maxWidth: '620px',
          margin: '3rem auto',
          boxShadow: 'var(--shadow-xl)',
          animation: 'appleFadeIn 0.4s ease forwards'
        }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'var(--good-soft)',
            color: 'var(--good)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '1px solid var(--good)'
          }}>
            <CheckCircle2 size={38} strokeWidth={2.2} />
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Order Confirmed.
          </h2>
          <div style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            ORD-{orderSuccess.order_id ? orderSuccess.order_id.toString().padStart(6, '0') : '009421'}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto 2rem', lineHeight: 1.5 }}>
            Thank you for your purchase. Inventory has been locked and dispatch preparations are currently underway at our primary regional hub.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/orders" className="btn lg" style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px' }}>
              Track Shipment Status
            </Link>
            <Link to="/products" className="btn secondary lg" style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px' }}>
              Explore More Products
            </Link>
          </div>
        </div>
      )}

      {!orderSuccess && cartItems.length === 0 ? (
        <div className="empty-state" style={{ 
          maxWidth: '540px', 
          margin: '3rem auto',
          padding: '4.5rem 2rem',
          textAlign: 'center',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            margin: '0 auto 1.5rem'
          }}>
            <ShoppingBag size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Your Bag is Empty.
          </h2>
          <p style={{ margin: '0 auto 1.75rem', maxWidth: '380px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Explore our curated catalog of precision electronics, home essentials, and certified designer pieces.
          </p>
          <Link to="/products" className="btn lg" style={{ borderRadius: 'var(--radius-full)', padding: '12px 28px' }}>
            Explore the Catalog
          </Link>
        </div>
      ) : !orderSuccess && (
        <div className="cart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '2rem', alignItems: 'start' }}>
          {/* Cart Items List */}
          <div className="cart-items-card" style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Free Shipping Alert Bar */}
            <div style={{ 
              padding: '1.25rem 1.5rem', 
              background: 'var(--surface-raised)', 
              borderBottom: '1px solid var(--border-subtle)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={15} style={{ color: 'var(--primary)' }} />
                  {subtotal >= freeShippingThreshold ? (
                    <span style={{ color: 'var(--good)', fontWeight: 700 }}>Complimentary Express Shipping Unlocked</span>
                  ) : (
                    <span>Add <strong>₹{(freeShippingThreshold - subtotal).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> more for Free Express Delivery</span>
                  )}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="shipping-progress" style={{ height: '6px', background: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div 
                  className="shipping-bar" 
                  style={{ 
                    height: '100%',
                    width: `${freeShippingProgress}%`,
                    background: subtotal >= freeShippingThreshold ? 'var(--good)' : 'var(--primary)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.4s ease'
                  }}
                ></div>
              </div>
            </div>

            {/* Item Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {cartItems.map(item => (
                <div 
                  key={item.cart_item_id || item.product_id} 
                  className="cart-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  <Link to={`/products/${item.product_id}`} style={{ flexShrink: 0 }}>
                    <img 
                      src={getProductImage(item)} 
                      alt={item.name} 
                      onError={handleImageError}
                      style={{
                        width: '96px',
                        height: '96px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--surface-raised)'
                      }}
                    />
                  </Link>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '2px' }}>
                          {item.category || 'Curated Item'}
                        </div>
                        <Link to={`/products/${item.product_id}`}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>
                            {item.name}
                          </h3>
                        </Link>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px', margin: 0 }}>
                          SKU: <span style={{ fontFamily: 'monospace' }}>{item.sku}</span> &bull; Sold by {item.seller_name || 'NexStock Official'}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                          ₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {item.quantity > 1 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            ₹{Number(item.price).toLocaleString('en-IN')} each
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Apple Pill Stepper */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-full)',
                          padding: '3px 6px'
                        }}>
                          <button 
                            type="button" 
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            title="Decrease Quantity"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%'
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 700, fontSize: '0.88rem' }}>
                            {item.quantity}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            title="Increase Quantity"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%'
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <button 
                          type="button" 
                          onClick={() => handleRemove(item.product_id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            padding: '4px 6px',
                            transition: 'color 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--good)', fontWeight: 600 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--good)' }}></span>
                        In Stock &bull; Dispatches from Hub
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Apple Store Style Order Summary Panel */}
          <div className="order-summary-card" style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--border-subtle)',
            padding: '1.75rem',
            position: 'sticky',
            top: '80px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
              Order Summary
            </h3>

            {/* Promo Voucher Form */}
            <form onSubmit={handleApplyPromo} style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Voucher code (LUXE10)" 
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  style={{ 
                    textTransform: 'uppercase', 
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-full)',
                    padding: '8px 14px'
                  }}
                />
                <button 
                  type="submit" 
                  className="btn secondary sm" 
                  style={{ 
                    padding: '0 16px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 600
                  }}
                >
                  Apply
                </button>
              </div>
              {promoMessage && (
                <p style={{ 
                  fontSize: '0.78rem', 
                  marginTop: '6px', 
                  fontWeight: 600, 
                  color: promoMessage.type === 'success' ? 'var(--good)' : 'var(--danger)' 
                }}>
                  {promoMessage.text}
                </p>
              )}
            </form>

            {/* Cost Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal ({cartItems.length} items)</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {appliedDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--good)', fontWeight: 600 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={13} />
                    Privilege Saving ({appliedDiscount}%)
                  </span>
                  <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Estimated Tax (5% GST)</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Fulfillment &amp; Express Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <strong style={{ color: 'var(--good)' }}>FREE</strong>
                  ) : (
                    `₹${shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  )}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'baseline',
                marginTop: '8px', 
                paddingTop: '12px', 
                borderTop: '1px solid var(--border-subtle)' 
              }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Total Due</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button 
              type="button" 
              className="btn lg" 
              style={{ 
                width: '100%', 
                marginTop: '1.5rem', 
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700
              }}
              onClick={handleCheckout}
              disabled={placingOrder}
            >
              <Lock size={16} />
              {placingOrder ? 'Securing Inventory & Processing...' : 'Complete Purchase'}
            </button>

            {/* Apple Guarantees */}
            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1.25rem', 
              borderTop: '1px solid var(--border-subtle)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px', 
              fontSize: '0.78rem', 
              color: 'var(--text-tertiary)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={15} style={{ color: 'var(--primary)' }} />
                <span>256-Bit Bank Grade Encrypted Checkout</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={15} style={{ color: 'var(--primary)' }} />
                <span>7-Day Effortless Doorstep Return Policy</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} style={{ color: 'var(--primary)' }} />
                <span>Protected by NexStock Buyer Assurance</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
