import { useEffect, useState, useContext } from 'react';
import { api } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

export default function Orders() {
  const { user } = useContext(AuthContext);
  const isCustomer = user?.role === 'customer' || !user;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const load = () => {
    setLoading(true);
    api.getOrders()
      .then((o) => {
        setOrders(o);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const ship = async (id) => {
    try {
      await api.shipOrder(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      default: return 1;
    }
  };

  if (isCustomer) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Purchase History &amp; Tracking</h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginTop: '4px' }}>
              Real-time multi-hub logistics tracking and fulfillment status
            </p>
          </div>
          <Link to="/products" className="btn secondary sm">
            Browse More Items
          </Link>
        </div>
        
        <ApiErrorBanner error={loadError} />
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[1, 2].map(n => (
              <div key={n} className="skeleton" style={{ height: '220px', borderRadius: '16px' }}></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state" style={{ maxWidth: '600px', margin: '3rem auto' }}>
            <div className="empty-state-icon">📦</div>
            <h2>No orders placed yet</h2>
            <p style={{ color: 'var(--text-dim)', margin: '0.5rem auto 1.5rem', maxWidth: '400px' }}>
              When you complete a purchase, you'll be able to track live warehouse routing and courier delivery updates right here.
            </p>
            <Link to="/products" className="btn lg">Start Shopping Now</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {orders.map(o => {
              const step = getStepIndex(o.status);
              return (
                <div key={o.order_id} className="order-card">
                  {/* Order Header */}
                  <div className="order-card-header">
                    <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>
                          Order Placed
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {new Date(o.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>
                          Total Amount
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                          ₹{Number(o.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>
                          Shipment Items
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {o.item_count || 1} SKU{o.item_count === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>
                        Tracking Identifier
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                        ORD-{o.order_id.toString().padStart(6, '0')}
                      </div>
                    </div>
                  </div>

                  {/* Status Progress Stepper */}
                  <div className="order-timeline">
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: '10%',
                      right: '10%',
                      height: '3px',
                      background: 'var(--border)',
                      zIndex: 1
                    }}>
                      <div style={{
                        height: '100%',
                        background: 'var(--good)',
                        width: step === 0 ? '0%' : step === 1 ? '33%' : step === 2 ? '66%' : '100%',
                        transition: 'width 0.4s ease'
                      }}></div>
                    </div>

                    <div className={`timeline-step ${step >= 0 ? 'completed' : ''}`}>
                      <div className="timeline-dot">{step > 0 ? '✓' : '1'}</div>
                      <span>Order Placed</span>
                    </div>

                    <div className={`timeline-step ${step >= 1 ? (step === 1 ? 'active' : 'completed') : ''}`}>
                      <div className="timeline-dot">{step > 1 ? '✓' : '2'}</div>
                      <span>Processing at Hub</span>
                    </div>

                    <div className={`timeline-step ${step >= 2 ? (step === 2 ? 'active' : 'completed') : ''}`}>
                      <div className="timeline-dot">{step > 2 ? '✓' : '3'}</div>
                      <span>In Transit</span>
                    </div>

                    <div className={`timeline-step ${step >= 3 ? 'completed' : ''}`}>
                      <div className="timeline-dot">{step === 3 ? '✓' : '4'}</div>
                      <span>Delivered</span>
                    </div>
                  </div>

                  {/* Order Footer & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span className={`badge ${o.status}`} style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
                        {o.status === 'confirmed' ? '⚡ Hub Confirmed' : o.status === 'shipped' ? '🚚 Out for Delivery' : o.status}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginLeft: '12px' }}>
                        Carrier: <strong>MarketHub Express Air</strong> &bull; Free Transit Insurance
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Link to="/products" className="btn outline sm">
                        Order Again
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // Admin & Seller View
  // ----------------------------------------------------
  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 className="page-title">Fulfillment Orders</h1>
          <p className="page-subtitle">Track incoming consumer demand and dispatch warehouse shipments</p>
        </div>
      </div>

      <ApiErrorBanner error={loadError} />

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">Loading order ledger…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Purchaser</th>
                <th>Line Items</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Placed Timestamp</th>
                <th>Fulfillment Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.order_id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    ORD-{o.order_id.toString().padStart(6, '0')}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {o.customer || o.customer_name || 'Customer'}
                  </td>
                  <td>{o.item_count || 1} units</td>
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{Number(o.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`badge ${o.status}`}>{o.status}</span>
                  </td>
                  <td>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    {o.status === 'confirmed' ? (
                      <button 
                        className="btn sm" 
                        onClick={() => ship(o.order_id)}
                      >
                        🚚 Dispatch from Hub
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        {o.status === 'shipped' ? 'Dispatched' : 'Completed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && orders.length === 0 && <div className="empty-state">No orders logged in system</div>}
      </div>
    </div>
  );
}