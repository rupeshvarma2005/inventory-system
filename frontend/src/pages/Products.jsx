import { useEffect, useState } from 'react';
import { api } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getProducts()
      .then((data) => { setProducts(data); setError(null); })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="page-title">Products</h1>
      <p className="page-subtitle">Catalog across all categories</p>

      <ApiErrorBanner error={error} />

      <div className="panel">
        {loading ? <div className="empty-state">Loading…</div> : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Reorder threshold</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.product_id}>
                  <td>{p.sku}</td>
                  <td style={{ fontFamily: 'var(--font-display)' }}>{p.name}</td>
                  <td>{p.category || '—'}</td>
                  <td>₹{Number(p.price).toLocaleString()}</td>
                  <td>{p.reorder_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && products.length === 0 && <div className="empty-state">No products yet</div>}
      </div>
    </div>
  );
}
