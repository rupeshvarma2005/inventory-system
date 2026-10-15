import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getProductImage, handleImageError } from '../utils/productImages.js';

export default function ProductCard({ product, onAddToCart }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const originalPrice = parseFloat(product.price || 0);
  const discount = parseFloat(product.discount_percentage || 0);
  const finalPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
  const savings = originalPrice - finalPrice;
  
  const rating = parseFloat(product.average_rating || 0);
  const reviewCount = parseInt(product.review_count || 0, 10);
  const stock = parseInt(product.total_stock != null ? product.total_stock : 10, 10);
  const isOutOfStock = stock <= 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    try {
      if (onAddToCart) {
        await onAddToCart(product.product_id);
      }
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div className="product-card">
      {/* Image Showcase */}
      <Link to={`/products/${product.product_id}`} className="product-image-container">
        <img 
          src={getProductImage(product)} 
          alt={product.name}
          className="product-card-img"
          loading="lazy"
          onError={handleImageError}
        />

        {/* Badges Overlay */}
        <div className="product-card-badges">
          {discount > 0 && (
            <span className="discount-pill">
              -{Math.round(discount)}% OFF
            </span>
          )}
          {product.category && (
            <span className="category-pill-badge">
              {product.category}
            </span>
          )}
        </div>

        {/* Interactive Wishlist */}
        <button 
          type="button" 
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={toggleWishlist}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-label="Wishlist toggle"
        >
          {isWishlisted ? '♥' : '♡'}
        </button>
      </Link>

      {/* Info Section */}
      <div className="product-info">
        <div className="product-brand">{product.category || 'Curated Collection'}</div>
        <Link to={`/products/${product.product_id}`} className="product-title" title={product.name}>
          {product.name}
        </Link>

        {/* Rating Row (Only show if supported by actual data) */}
        <div className="product-rating-row">
          {rating > 0 ? (
            <>
              <div className="rating-stars">
                {'★'.repeat(Math.round(rating))}
                {'☆'.repeat(5 - Math.round(rating))}
              </div>
              <span className="rating-score">{rating.toFixed(1)}</span>
              <span className="rating-count">({reviewCount})</span>
            </>
          ) : (
            <span className="rating-count">No reviews yet</span>
          )}
        </div>

        {/* Stock Status Badge */}
        <div className={`stock-status-pill ${isOutOfStock ? 'out-stock' : stock <= 10 ? 'low-stock' : 'in-stock'}`}>
          <span className="stock-dot"></span>
          <span>
            {isOutOfStock ? 'Out of Stock' : stock <= 10 ? `Only ${stock} left` : 'In Stock'}
          </span>
        </div>

        {/* Price & Action Row */}
        <div className="product-price-row">
          <div className="price-box">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className={`product-price ${discount > 0 ? 'discounted' : ''}`}>
                ₹{finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {discount > 0 && (
                <span className="product-original-price">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {discount > 0 && (
              <span className="product-save-badge">
                Save ₹{savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>

          <button 
            type="button"
            className={`product-add-btn ${justAdded ? 'added' : ''}`}
            onClick={handleAdd}
            disabled={isOutOfStock || isAdding}
          >
            {justAdded ? (
              <><span>✓</span><span>Added</span></>
            ) : isAdding ? (
              <span>...</span>
            ) : isOutOfStock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
