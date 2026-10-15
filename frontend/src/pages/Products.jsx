import { useEffect, useState, useContext, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api, getApiError } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import { getProductImage, handleImageError } from '../utils/productImages.js';

export default function Products() {
  const { user } = useContext(AuthContext);
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer' || !user;

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const dealsParam = searchParams.get('deals') === 'true';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Seller Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    sku: '', 
    name: '', 
    price: '', 
    category_id: '1', 
    discount_percentage: '', 
    description: '',
    image_url: '' 
  });

  const navigate = useNavigate();

  const fetchProducts = () => {
    setLoading(true);
    const params = {};
    if (isSeller) params.mine = 'true';
    if (searchQuery) params.search = searchQuery;
    if (categoryParam) params.category = categoryParam;
    
    api.getProducts(params)
      .then((data) => { setProducts(data); setError(null); })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [isSeller, searchQuery, categoryParam]);

  const handleAddToCart = async (productId) => {
    try {
      await api.addToCart({ product_id: productId, quantity: 1 });
    } catch (err) {
      alert(getApiError(err));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        images: newProduct.image_url ? [newProduct.image_url] : []
      };
      await api.createProduct(payload);
      setShowAddForm(false);
      setNewProduct({ sku: '', name: '', price: '', category_id: '1', discount_percentage: '', description: '', image_url: '' });
      fetchProducts();
    } catch (err) {
      setError(err);
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter deals if parameter is set
    if (dealsParam) {
      result = result.filter(p => parseFloat(p.discount_percentage || 0) > 0);
    }

    // Filter in-stock only
    if (onlyInStock) {
      result = result.filter(p => parseInt(p.total_stock != null ? p.total_stock : 10, 10) > 0);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => {
        const priceA = parseFloat(a.price) * (1 - parseFloat(a.discount_percentage || 0) / 100);
        const priceB = parseFloat(b.price) * (1 - parseFloat(b.discount_percentage || 0) / 100);
        return priceA - priceB;
      });
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => {
        const priceA = parseFloat(a.price) * (1 - parseFloat(a.discount_percentage || 0) / 100);
        const priceB = parseFloat(b.price) * (1 - parseFloat(b.discount_percentage || 0) / 100);
        return priceB - priceA;
      });
    } else if (sortBy === 'rating') {
      result.sort((a, b) => parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0));
    } else if (sortBy === 'discount') {
      result.sort((a, b) => parseFloat(b.discount_percentage || 0) - parseFloat(a.discount_percentage || 0));
    }

    return result;
  }, [products, dealsParam, onlyInStock, sortBy]);

  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'Electronics', value: 'Electronics' },
    { label: 'Home & Kitchen', value: 'Home & Kitchen' },
    { label: 'Apparel', value: 'Apparel' },
    { label: 'Sports & Fitness', value: 'Sports & Fitness' },
  ];

  const handleCategoryFilter = (catValue) => {
    const params = new URLSearchParams(searchParams);
    if (catValue) {
      params.set('category', catValue);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setOnlyInStock(false);
    setSortBy('featured');
  };

  // ----------------------------------------------------
  // Customer Storefront View
  // ----------------------------------------------------
  if (isCustomer) {
    return (
      <div>
        {/* Catalog Header */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Link to="/" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Home</Link>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>/</span>
              <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                {categoryParam ? categoryParam : dealsParam ? 'Special Offers' : 'Catalog'}
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
              {searchQuery 
                ? `Search: "${searchQuery}"` 
                : categoryParam 
                  ? categoryParam 
                  : dealsParam 
                    ? 'Exclusive Deals & Offers' 
                    : 'All Products'}
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginTop: '4px' }}>
              Showing {filteredAndSortedProducts.length} verified item{filteredAndSortedProducts.length === 1 ? '' : 's'}
            </p>
          </div>

          {(searchQuery || categoryParam || dealsParam || onlyInStock) && (
            <button 
              className="btn outline sm"
              onClick={handleClearFilters}
              style={{ height: 'fit-content' }}
            >
              ✕ Reset All Filters
            </button>
          )}
        </div>

        <ApiErrorBanner error={error} />

        {/* Toolbar: Category Chips, Stock Filter & Sorting */}
        <div className="catalog-toolbar">
          <div className="filter-chips">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                className={`filter-chip ${categoryParam === cat.value ? 'active' : ''}`}
                onClick={() => handleCategoryFilter(cat.value)}
              >
                {cat.label}
              </button>
            ))}

            <button
              type="button"
              className={`filter-chip ${dealsParam ? 'active' : ''}`}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                if (dealsParam) params.delete('deals');
                else params.set('deals', 'true');
                setSearchParams(params);
              }}
            >
              🏷️ On Sale
            </button>

            <button
              type="button"
              className={`filter-chip ${onlyInStock ? 'active' : ''}`}
              onClick={() => setOnlyInStock(!onlyInStock)}
            >
              ✓ In Stock Only
            </button>
          </div>

          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Featured Curations</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="discount">Biggest Savings</option>
            </select>
          </div>
        </div>

        {/* Product Grid / Skeleton Loaders */}
        {loading ? (
          <div className="product-grid">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="product-card" style={{ height: '380px' }}>
                <div className="skeleton" style={{ height: '220px', width: '100%' }}></div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '35%' }}></div>
                  <div className="skeleton" style={{ height: '20px', width: '85%' }}></div>
                  <div className="skeleton" style={{ height: '16px', width: '45%' }}></div>
                  <div className="skeleton" style={{ height: '28px', width: '100%', marginTop: 'auto' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredAndSortedProducts.length > 0 ? (
              <div className="product-grid">
                {filteredAndSortedProducts.map(p => (
                  <ProductCard 
                    key={p.product_id} 
                    product={p} 
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No matching products found</h3>
                <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem', color: 'var(--text-dim)' }}>
                  We couldn't find any products matching your active filters. Try searching with different keywords or clearing filters.
                </p>
                <button className="btn" onClick={handleClearFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // Admin & Seller Management View (Catalog Table)
  // ----------------------------------------------------
  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 className="page-title">{isSeller ? 'My Merchant Catalog' : 'Platform Products'}</h1>
          <p className="page-subtitle">
            {isSeller ? 'Manage pricing, discounts, and SKUs' : 'Oversight across all verified vendors'}
          </p>
        </div>
        <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add New SKU'}
        </button>
      </div>

      <ApiErrorBanner error={error} />

      {showAddForm && (
        <div className="panel" style={{ marginBottom: '24px' }}>
          <h3 className="panel-title">Add Product to Catalog</h3>
          <form onSubmit={handleAddProduct}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>SKU *</label>
                <input 
                  type="text" 
                  value={newProduct.sku} 
                  onChange={e => setNewProduct({...newProduct, sku: e.target.value})} 
                  placeholder="e.g. ELEC-003"
                  required 
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Product Name *</label>
                <input 
                  type="text" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                  placeholder="e.g. Mechanical Bluetooth Keyboard"
                  required 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Category *</label>
                <select 
                  value={newProduct.category_id} 
                  onChange={e => setNewProduct({...newProduct, category_id: e.target.value})}
                >
                  <option value="1">Electronics</option>
                  <option value="2">Home & Kitchen</option>
                  <option value="3">Apparel</option>
                  <option value="4">Sports & Fitness</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Price (₹) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={newProduct.price} 
                  onChange={e => setNewProduct({...newProduct, price: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Discount (%)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={newProduct.discount_percentage} 
                  onChange={e => setNewProduct({...newProduct, discount_percentage: e.target.value})} 
                  placeholder="e.g. 15"
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Primary Image URL (optional)</label>
                <input 
                  type="url" 
                  value={newProduct.image_url} 
                  onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} 
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Editorial Description</label>
              <textarea 
                rows="3" 
                value={newProduct.description} 
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Product craftsmanship, key specifications, and materials..."
              ></textarea>
            </div>

            <button type="submit" className="btn">Save &amp; Publish Product</button>
          </form>
        </div>
      )}

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">Loading catalog…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Visual</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Stock</th>
                <th>Vendor</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const stock = parseInt(p.total_stock != null ? p.total_stock : 10, 10);
                return (
                  <tr key={p.product_id}>
                    <td>
                      <img 
                        src={getProductImage(p)} 
                        style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} 
                        alt="" 
                        onError={handleImageError}
                      />
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.sku}</td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td><span className="badge info">{p.category || 'General'}</span></td>
                    <td style={{ fontWeight: 700 }}>₹{Number(p.price).toLocaleString()}</td>
                    <td>
                      {parseFloat(p.discount_percentage) > 0 ? (
                        <span className="badge danger">-{Math.round(p.discount_percentage)}%</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>0%</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${stock <= 10 ? 'warning' : 'success'}`}>
                        {stock} units
                      </span>
                    </td>
                    <td>{p.seller_name || 'System Managed'}</td>
                    <td>
                      {p.average_rating > 0 ? (
                        <span style={{ fontWeight: 600 }}>⭐ {Number(p.average_rating).toFixed(1)} ({p.review_count})</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && products.length === 0 && <div className="empty-state">No products found</div>}
      </div>
    </div>
  );
}
