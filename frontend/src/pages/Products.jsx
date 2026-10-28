import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Plus, 
  X, 
  SlidersHorizontal, 
  Layers, 
  Tag, 
  Star, 
  Boxes, 
  ArrowUpDown, 
  Check, 
  AlertTriangle,
  LayoutGrid,
  List,
  Edit,
  ShieldCheck,
  Trash2,
  ArrowDownToLine
} from 'lucide-react';
import { api, getApiError } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import { getProductImage, handleImageError } from '../utils/productImages.js';
import StockTransactionModal from '../components/StockTransactionModal.jsx';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'table' (Enterprise Ledger) vs 'cards' (Visual Inspection)
  const [viewMode, setViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('id');

  // Add SKU Modal Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetProductForModal, setTargetProductForModal] = useState(null);

  const [newProduct, setNewProduct] = useState({ 
    sku: '', 
    sku_code: '',
    name: '', 
    price: '', 
    category_id: '1', 
    stock_quantity: '50',
    reorder_level: '15',
    warehouse_location: 'North Hub - Delhi',
    description: '',
    image_url: '' 
  });

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete SKU "${name}" (PID #${id}) from the catalog? This will remove all associated stock.`)) {
      return;
    }
    try {
      await api.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert(getApiError(err));
    }
  };

  const fetchProducts = () => {
    setLoading(true);
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (categoryParam) params.category = categoryParam;
    
    api.getProducts(params)
      .then((data) => { setProducts(data); setError(null); })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, categoryParam]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        images: newProduct.image_url ? [newProduct.image_url] : []
      };
      await api.createProduct(payload);
      setShowAddForm(false);
      setNewProduct({ sku: '', name: '', price: '', category_id: '1', discount_percentage: '', reorder_threshold: '15', description: '', image_url: '' });
      fetchProducts();
    } catch (err) {
      setError(err);
    }
  };

  // Sorting
  const sortedProducts = useMemo(() => {
    let result = [...products];
    if (sortBy === 'price_asc') {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortBy === 'stock_asc') {
      result.sort((a, b) => (parseInt(a.total_stock, 10) || 0) - (parseInt(b.total_stock, 10) || 0));
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => (parseInt(b.total_stock, 10) || 0) - (parseInt(a.total_stock, 10) || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [products, sortBy]);

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

  const totalCatalogSKUs = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + (parseInt(p.total_stock, 10) || 0), 0);
  const lowStockCount = products.filter(p => (parseInt(p.total_stock, 10) || 0) <= (p.reorder_threshold || 15)).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
            Inventory Master Data
          </span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '4px 0 6px 0' }}>
            SKU Master Catalog
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
            Centralized product item masters, barcode identification, safety stock thresholds &amp; multi-hub inventory allocation
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Toggle */}
          <div style={{ 
            display: 'inline-flex', 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '3px' 
          }}>
            <button 
              className={`btn sm ${viewMode === 'table' ? '' : 'secondary'}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '5px 10px', fontSize: '0.8rem', borderRadius: '6px' }}
              title="Table View"
            >
              <List size={14} />
              Table
            </button>
            <button 
              className={`btn sm ${viewMode === 'cards' ? '' : 'secondary'}`}
              onClick={() => setViewMode('cards')}
              style={{ padding: '5px 10px', fontSize: '0.8rem', borderRadius: '6px' }}
              title="Card Grid View"
            >
              <LayoutGrid size={14} />
              Grid
            </button>
          </div>

          <button 
            className="btn" 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? 'Cancel' : 'Create New SKU'}
          </button>
        </div>
      </div>

      <ApiErrorBanner error={error} />

      {/* KPI Status Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Active SKUs</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>{totalCatalogSKUs} Lines</div>
        </div>
        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>On-Hand Stock</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{totalStockUnits.toLocaleString()} Units</div>
        </div>
        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Critical Stock Items</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: lowStockCount > 0 ? 'var(--danger)' : 'var(--good)' }}>
            {lowStockCount} SKUs
          </div>
        </div>
        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Sync Status</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--good)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="stock-dot" style={{ background: 'var(--good)' }}></span> MySQL Verified
          </div>
        </div>
      </div>

      {/* Add SKU Modal / Form */}
      {showAddForm && (
        <div className="panel" style={{ marginBottom: '24px', border: '2px solid var(--primary)' }}>
          <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            <Plus size={18} />
            Register New SKU into Inventory
          </h3>
          <form onSubmit={handleAddProduct}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>SKU Code *</label>
                <input 
                  type="text" 
                  value={newProduct.sku} 
                  onChange={e => setNewProduct({...newProduct, sku: e.target.value})} 
                  placeholder="e.g. ELEC-005"
                  required 
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Item Name *</label>
                <input 
                  type="text" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                  placeholder="e.g. 100W Anker GaN USB-C Hub"
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
                  <option value="2">Home &amp; Kitchen</option>
                  <option value="3">Apparel</option>
                  <option value="4">Sports &amp; Fitness</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Unit Price (₹) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={newProduct.price} 
                  onChange={e => setNewProduct({...newProduct, price: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Reorder Safety Threshold (Units)</label>
                <input 
                  type="number" 
                  value={newProduct.reorder_threshold} 
                  onChange={e => setNewProduct({...newProduct, reorder_threshold: e.target.value})} 
                  placeholder="15"
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Image Asset URL (optional)</label>
                <input 
                  type="url" 
                  value={newProduct.image_url} 
                  onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} 
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Technical Specifications &amp; Notes</label>
              <textarea 
                rows="2" 
                value={newProduct.description} 
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Product specifications, manufacturing standard, and warranty..."
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn" style={{ borderRadius: 'var(--radius-full)', padding: '10px 24px' }}>
                Save &amp; Commit SKU to Catalog
              </button>
              <button type="button" className="btn secondary" onClick={() => setShowAddForm(false)} style={{ borderRadius: 'var(--radius-full)', padding: '10px 20px' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="panel" style={{ padding: '12px 18px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Category Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              type="button"
              className={`filter-chip ${categoryParam === cat.value ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(cat.value)}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={13} /> Sort By:
          </span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ 
              background: 'var(--surface-raised)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '6px 12px',
              fontSize: '0.82rem',
              color: 'var(--text)'
            }}
          >
            <option value="id">Default (SKU ID)</option>
            <option value="name">Name (A-Z)</option>
            <option value="stock_desc">Highest Stock On-Hand</option>
            <option value="stock_asc">Lowest Stock (Restock Alert)</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Master Data View: Table View */}
      {viewMode === 'table' ? (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="empty-state">Loading SKU registry…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Visual</th>
                  <th>SKU Code</th>
                  <th>Product Item Name</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Safety Threshold</th>
                  <th>Total Stock</th>
                  <th>Inventory Status</th>
                  <th>Vendor / Seller</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map(p => {
                  const stock = parseInt(p.total_stock != null ? p.total_stock : 10, 10);
                  const threshold = p.reorder_threshold || 15;
                  const isCritical = stock <= threshold;

                  return (
                    <tr key={p.product_id}>
                      <td>
                        <img 
                          src={getProductImage(p)} 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} 
                          alt="" 
                          onError={handleImageError}
                        />
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, background: 'var(--surface-raised)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.84rem' }}>
                          {p.sku}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text)', fontSize: '0.92rem' }}>{p.name}</strong>
                      </td>
                      <td>
                        <span className="badge info">{p.category || 'General'}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{Number(p.price).toLocaleString()}</td>
                      <td style={{ color: 'var(--text-dim)' }}>{threshold} units</td>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: isCritical ? 'var(--danger)' : 'var(--text)' }}>
                          {stock} units
                        </strong>
                      </td>
                      <td>
                        {stock === 0 ? (
                          <span className="badge danger">Out of Stock</span>
                        ) : isCritical ? (
                          <span className="badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={11} /> Reorder Soon
                          </span>
                        ) : (
                          <span className="badge success">Healthy</span>
                        )}
                      </td>
                      <td>{p.seller_name || 'Central Warehouse'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn sm"
                            onClick={() => {
                              setTargetProductForModal({
                                product_id: p.product_id,
                                name: p.name,
                                sku_code: p.sku_code || p.sku,
                                total_stock: p.total_stock != null ? p.total_stock : p.stock_quantity
                              });
                              setModalOpen(true);
                            }}
                            style={{
                              background: 'var(--good)',
                              color: '#FFFFFF',
                              borderRadius: 'var(--radius-full)',
                              padding: '4px 10px',
                              fontSize: '0.76rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Restock Item"
                          >
                            <ArrowDownToLine size={12} /> Restock
                          </button>
                          <Link 
                            to="/inventory" 
                            className="btn secondary sm"
                            style={{ borderRadius: 'var(--radius-full)', padding: '4px 10px', fontSize: '0.76rem' }}
                            title="Multi-Hub Stock"
                          >
                            Hubs
                          </Link>
                          <button
                            className="btn secondary sm"
                            onClick={() => handleDeleteProduct(p.product_id, p.name)}
                            style={{
                              borderRadius: 'var(--radius-full)',
                              padding: '4px 8px',
                              color: 'var(--danger)',
                              fontSize: '0.76rem'
                            }}
                            title="Delete SKU"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && sortedProducts.length === 0 && (
            <div className="empty-state">No products found matching criteria.</div>
          )}
        </div>
      ) : (
        /* Visual Cards View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {sortedProducts.map(p => {
            const stock = parseInt(p.total_stock != null ? p.total_stock : 10, 10);
            const isCritical = stock <= (p.reorder_threshold || 15);

            return (
              <div key={p.product_id} className="panel" style={{ margin: 0, padding: '1.25rem' }}>
                <div style={{ height: '160px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem', background: 'var(--surface-raised)' }}>
                  <img 
                    src={getProductImage(p)} 
                    alt={p.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={handleImageError}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', background: 'var(--surface-raised)', padding: '2px 6px', borderRadius: '4px' }}>
                    {p.sku}
                  </span>
                  <span className={`badge ${isCritical ? 'warning' : 'success'}`}>
                    {stock} in stock
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '4px 0 6px 0' }}>{p.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>₹{Number(p.price).toLocaleString()}</div>
                  <Link to="/inventory" className="btn secondary sm" style={{ borderRadius: 'var(--radius-full)' }}>
                    Stock Hubs →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock In / Restock Transaction Modal */}
      <StockTransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setTargetProductForModal(null);
        }}
        initialType="IN"
        preselectedProduct={targetProductForModal}
        onSuccess={() => {
          fetchProducts();
        }}
      />
    </div>
  );
}
