import { useEffect, useState, useContext } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Warehouse, 
  Search, 
  Filter, 
  Boxes, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye
} from 'lucide-react';
import { api } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Orders() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shippingId, setShippingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  const loadOrders = () => {
    setLoading(true);
    api.getOrders()
      .then((data) => {
        setOrders(data || []);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleShipOrder = async (orderId) => {
    setShippingId(orderId);
    try {
      await api.shipOrder(orderId);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to dispatch order');
    } finally {
      setShippingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <span className="badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><CheckCircle2 size={11} /> Delivered</span>;
      case 'shipped':
        return <span className="badge info" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Truck size={11} /> In Transit</span>;
      case 'confirmed':
        return <span className="badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Clock size={11} /> Ready to Ship</span>;
      case 'pending':
      default:
        return <span className="badge primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Clock size={11} /> Pending Pick</span>;
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'pending_ship') {
      if (o.status === 'delivered' || o.status === 'shipped') return false;
    } else if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchId = String(o.order_id).includes(q);
      const matchCustomer = (o.customer_name || '').toLowerCase().includes(q);
      const matchCity = (o.shipping_city || '').toLowerCase().includes(q);
      return matchId || matchCustomer || matchCity;
    }
    return true;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0);
  const pendingShipCount = orders.filter(o => o.status === 'confirmed' || o.status === 'pending').length;
  const inTransitCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
            Fulfillment &amp; Logistics
          </span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '4px 0 6px 0' }}>
            Outbound Dispatch &amp; Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
            Pick, pack, and ship outbound customer shipments across multi-regional distribution hubs
          </p>
        </div>

        <button 
          className="btn secondary sm"
          onClick={loadOrders}
          style={{ borderRadius: 'var(--radius-full)', padding: '7px 16px', fontSize: '0.82rem' }}
        >
          ↻ Refresh Manifests
        </button>
      </div>

      <ApiErrorBanner error={error} />

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Total Order Manifests</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>{orders.length} Orders</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '2px' }}>₹{totalRevenue.toLocaleString('en-IN')} gross volume</div>
        </div>

        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Awaiting Warehouse Dispatch</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: pendingShipCount > 0 ? 'var(--accent)' : 'var(--good)' }}>
            {pendingShipCount} Orders
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>Ready for packing &amp; carrier pickup</div>
        </div>

        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>In Regional Transit</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            {inTransitCount} En Route
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>Tracked via carrier manifests</div>
        </div>

        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Successfully Delivered</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--good)' }}>
            {deliveredCount} Fulfilled
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--good)', marginTop: '2px', fontWeight: 600 }}>99.2% on-time fulfillment</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel" style={{ padding: '12px 18px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Manifests ({orders.length})
          </button>
          <button 
            type="button"
            className={`filter-chip ${statusFilter === 'pending_ship' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending_ship')}
          >
            Needs Dispatch ({pendingShipCount})
          </button>
          <button 
            type="button"
            className={`filter-chip ${statusFilter === 'shipped' ? 'active' : ''}`}
            onClick={() => setStatusFilter('shipped')}
          >
            In Transit ({inTransitCount})
          </button>
          <button 
            type="button"
            className={`filter-chip ${statusFilter === 'delivered' ? 'active' : ''}`}
            onClick={() => setStatusFilter('delivered')}
          >
            Completed ({deliveredCount})
          </button>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search Order # or City..." 
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '6px 10px 6px 30px', 
              fontSize: '0.82rem', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-raised)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">Loading dispatch orders…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Order Date</th>
                <th>Destination City</th>
                <th>Allocated Hub</th>
                <th>Order Amount</th>
                <th>Fulfillment Status</th>
                <th style={{ textAlign: 'right' }}>Fulfillment Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => {
                const canShip = o.status === 'confirmed' || o.status === 'pending';
                const isShipping = shippingId === o.order_id;

                return (
                  <tr key={o.order_id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', fontSize: '0.88rem' }}>
                        ORD-{String(o.order_id).padStart(4, '0')}
                      </strong>
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{o.shipping_city || 'Delhi Hub Delivery'}</span>
                    </td>
                    <td>
                      <span className="badge info" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Warehouse size={11} /> {o.warehouse_name || 'Regional Hub'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{Number(o.total_price || o.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td>{getStatusBadge(o.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {canShip && ['admin', 'seller'].includes(user?.role) ? (
                        <button 
                          className="btn sm"
                          onClick={() => handleShipOrder(o.order_id)}
                          disabled={isShipping}
                          style={{ 
                            borderRadius: 'var(--radius-full)', 
                            padding: '6px 14px', 
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Truck size={13} />
                          {isShipping ? 'Dispatching…' : 'Mark Dispatched'}
                        </button>
                      ) : canShip ? (
                        <span className="badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> Processing
                        </span>
                      ) : o.status === 'shipped' ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--good)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> In Transit
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Fulfilled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filteredOrders.length === 0 && (
          <div className="empty-state">No orders found matching criteria.</div>
        )}
      </div>
    </div>
  );
}