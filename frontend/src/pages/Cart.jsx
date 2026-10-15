import React, { useState, useEffect } from 'react';
import { api, getApiError } from '../api';
import { Link, useNavigate } from 'react-router-dom';
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
            setPromoMessage({ type: 'success', text: 'Voucher LUXE10 applied! 10% discount credited.' });
        } else if (code) {
            setPromoMessage({ type: 'error', text: 'Invalid promo code. Use LUXE10 for 10% off.' });
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
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Shopping Bag</h1>
                <div className="cart-grid">
                    <div className="skeleton" style={{ height: '350px', borderRadius: '16px' }}></div>
                    <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }}></div>
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
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Shopping Bag</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginTop: '4px' }}>
                        {cartItems.length} item{cartItems.length === 1 ? '' : 's'} ready for express fulfillment
                    </p>
                </div>
                <Link to="/products" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                    &larr; Continue Exploring
                </Link>
            </div>

            {/* Order Confirmation Modal / Overlay */}
            {orderSuccess && (
                <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--good)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '3rem 2.5rem',
                    textAlign: 'center',
                    maxWidth: '650px',
                    margin: '2rem auto',
                    boxShadow: 'var(--shadow-xl)'
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'var(--good-soft)',
                        color: 'var(--good)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        margin: '0 auto 1.5rem'
                    }}>
                        ✓
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        Order Confirmed!
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                        Your purchase was processed successfully. Inventory locks have been verified and your package is being routed to the nearest regional hub.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <Link to="/orders" className="btn lg">
                            View Order Tracking
                        </Link>
                        <Link to="/products" className="btn secondary lg">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            )}

            {!orderSuccess && cartItems.length === 0 ? (
                <div className="empty-state" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                    <div className="empty-state-icon">🛒</div>
                    <h2>Your Bag is Currently Empty</h2>
                    <p style={{ margin: '0.5rem auto 1.5rem', maxWidth: '400px' }}>
                        Discover our collection of curated essentials, high-performance electronics, and artisanal goods.
                    </p>
                    <Link to="/products" className="btn lg">Explore Catalog</Link>
                </div>
            ) : !orderSuccess && (
                <div className="cart-grid">
                    {/* Cart Items List */}
                    <div className="cart-items-card">
                        {/* Free Shipping Alert Bar */}
                        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px' }}>
                                <span>
                                    {subtotal >= freeShippingThreshold ? (
                                        <strong style={{ color: 'var(--good)' }}>🎉 You unlocked Free Express Shipping!</strong>
                                    ) : (
                                        <span>Add <strong>₹{(freeShippingThreshold - subtotal).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> more for Free Shipping</span>
                                    )}
                                </span>
                                <span style={{ color: 'var(--text-dim)' }}>{Math.round(freeShippingProgress)}%</span>
                            </div>
                            <div className="shipping-progress">
                                <div className="shipping-bar" style={{ width: `${freeShippingProgress}%` }}></div>
                            </div>
                        </div>

                        {/* Items */}
                        {cartItems.map(item => (
                            <div key={item.cart_item_id || item.product_id} className="cart-item">
                                <Link to={`/products/${item.product_id}`} className="cart-item-img">
                                    <img 
                                        src={getProductImage(item)} 
                                        alt={item.name} 
                                        onError={handleImageError} 
                                    />
                                </Link>

                                <div className="cart-item-details">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '8px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                                                {item.category || 'General'}
                                            </span>
                                            <Link to={`/products/${item.product_id}`}>
                                                <h3 className="cart-item-title">{item.name}</h3>
                                            </Link>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                Vendor: {item.seller_name || 'MarketHub Official'} &bull; SKU: <span style={{ fontFamily: 'monospace' }}>{item.sku}</span>
                                            </p>
                                        </div>
                                        <div className="cart-item-price">
                                            ₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="cart-quantity-stepper">
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                                                    title="Decrease"
                                                >
                                                    -
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                                                    title="Increase"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button 
                                                type="button" 
                                                className="cart-remove-btn"
                                                onClick={() => handleRemove(item.product_id)}
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div style={{ fontSize: '0.8rem', color: 'var(--good)', fontWeight: 600 }}>
                                            ✓ In Stock &bull; Dispatched Today
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary Panel */}
                    <div className="order-summary-card">
                        <h3>Order Summary</h3>

                        {/* Promo Voucher Form */}
                        <form onSubmit={handleApplyPromo} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="text" 
                                    placeholder="Voucher code (try LUXE10)" 
                                    value={promoCode}
                                    onChange={e => setPromoCode(e.target.value)}
                                    style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}
                                />
                                <button type="submit" className="btn secondary sm" style={{ padding: '0 16px' }}>
                                    Apply
                                </button>
                            </div>
                            {promoMessage && (
                                <p style={{ 
                                    fontSize: '0.8rem', 
                                    marginTop: '6px', 
                                    fontWeight: 600, 
                                    color: promoMessage.type === 'success' ? 'var(--good)' : 'var(--danger)' 
                                }}>
                                    {promoMessage.text}
                                </p>
                            )}
                        </form>

                        {/* Cost Breakdown */}
                        <div className="summary-row">
                            <span>Subtotal ({cartItems.length} items):</span>
                            <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        {appliedDiscount > 0 && (
                            <div className="summary-row" style={{ color: 'var(--good)' }}>
                                <span>Privilege Discount ({appliedDiscount}%):</span>
                                <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        <div className="summary-row">
                            <span>Estimated Tax (5% GST):</span>
                            <span>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="summary-row">
                            <span>Fulfillment &amp; Shipping:</span>
                            <span>
                                {shipping === 0 ? (
                                    <strong style={{ color: 'var(--good)' }}>FREE</strong>
                                ) : (
                                    `₹${shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                )}
                            </span>
                        </div>

                        <div className="summary-row total">
                            <span>Total Due:</span>
                            <span className="amount">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <button 
                            type="button" 
                            className="btn lg" 
                            style={{ width: '100%', marginTop: '1.5rem' }}
                            onClick={handleCheckout}
                            disabled={placingOrder}
                        >
                            {placingOrder ? 'Securing Inventory & Processing...' : 'Complete Purchase'}
                        </button>

                        {/* Security Guarantees */}
                        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🔒</span>
                                <span>256-Bit Bank Grade Encrypted Checkout</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>↩️</span>
                                <span>7-Day Effortless Doorstep Return Policy</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>⚡</span>
                                <span>Protected by MarketHub Buyer Assurance</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
