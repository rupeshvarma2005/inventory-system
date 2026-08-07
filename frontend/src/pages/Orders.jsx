import { useEffect, useState } from 'react';
import { api } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [customerId, setCustomerId] = useState('1');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const load = () => {
    setLoading(true);
    Promise.all([api.getOrders(), api.getProducts()])
      .then(([o, p]) => {
        setOrders(o);
        setProducts(p);
        setLoadError(null);
        if (!productId && p[0]) setProductId(String(p[0].product_id));
      })
      .catch((err) => setLoadError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const placeOrder = async () => {
    if (!productId || !quantity) return;
    setPlacing(true);
    setMessage(null);
    try {
      const result = await api.createOrder({
        customer_id: Number(customerId),
        items: [{ product_id: Number(productId), quantity: Number(quantity) }],
      });
      setMessage({ type: 'success', text: `Order #${result.order_id} confirmed — ₹${result.total_amount}` });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Order failed' });
    } finally {
      setPlacing(false);
    }
  };

  const ship = async (id) => {
    try {
      await api.shipOrder(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="page-title">Orders</h1>
      <p className="page-subtitle">Nearest-warehouse fulfillment, automatically</p>

      <ApiErrorBanner error={loadError} />

      <div className="panel" style={{ maxWidth: 560 }}>
        <div className="panel-title">Place a new order</div>
        <div className="form-row">
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="1">Rahul Sharma</option>
            <option value="2">Ananya Iyer</option>
            <option value="3">Vikram Singh</option>
          </select>
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map(p => (
              <option key={p.product_id} value={p.product_id}>{p.name}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            style={{ width: 70 }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <button className="btn" disabled={placing} onClick={placeOrder}>
            {placing ? 'Placing…' : 'Place order'}
          </button>
        </div>
        {message && (
          <p style={{ fontSize: 13, color: message.type === 'success' ? 'var(--good)' : 'var(--danger)' }}>
            {message.text}
          </p>
        )}
      </div>

      <div className="panel">
        <div className="panel-title">All orders</div>
        {loading ? <div className="empty-state">Loading…</div> : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.order_id}>
                  <td>{o.order_id}</td>
                  <td style={{ fontFamily: 'var(--font-display)' }}>{o.customer}</td>
                  <td>{o.item_count}</td>
                  <td>₹{Number(o.total_amount).toLocaleString()}</td>
                  <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    {o.status === 'confirmed' && (
                      <button className="btn secondary" onClick={() => ship(o.order_id)}>Mark shipped</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && orders.length === 0 && <div className="empty-state">No orders yet</div>}
      </div>
    </div>
  );
}