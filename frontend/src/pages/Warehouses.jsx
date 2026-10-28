import { useEffect, useState } from 'react';
import { 
  Warehouse, 
  MapPin, 
  Package, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  Boxes, 
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import StockGauge from '../components/StockGauge.jsx';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [utilization, setUtilization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHub, setSelectedHub] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getWarehouses(),
      api.getInventory(),
      api.getWarehouseUtilization()
    ])
      .then(([whData, invData, utilData]) => {
        setWarehouses(whData || []);
        setInventory(invData || []);
        setUtilization(utilData || []);
        setError(null);
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  const totalStockInSystem = inventory.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  const totalReserved = inventory.reduce((sum, item) => sum + (parseInt(item.reserved, 10) || 0), 0);

  // Group inventory by warehouse
  const getInventoryForWarehouse = (whName) => {
    return inventory.filter(item => item.warehouse === whName || item.warehouse_name === whName);
  };

  const getUtilForWarehouse = (whName) => {
    return utilization.find(u => u.warehouse === whName);
  };

  // Region badge colors
  const getCityBadge = (city) => {
    switch (city?.toLowerCase()) {
      case 'delhi': return 'badge info';
      case 'mumbai': return 'badge success';
      case 'bengaluru': return 'badge warning';
      case 'kolkata': return 'badge primary';
      default: return 'badge';
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
            Logistics &amp; Infrastructure
          </span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '4px 0 6px 0' }}>
            Regional Fulfillment Hubs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
            Geographic distribution network managing multi-node stock allocation and cross-docking
          </p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--surface-raised)', padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
          <span className="stock-dot" style={{ background: 'var(--good)' }}></span>
          <strong style={{ color: 'var(--text)' }}>4 Hubs Operational</strong>
          <span style={{ color: 'var(--text-dim)' }}>&bull; Zero Routing Outages</span>
        </div>
      </div>

      <ApiErrorBanner error={error} />

      {/* Network Overview Bento Grid */}
      <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="panel" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)' }}>Total Stored Stock</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Boxes size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            {totalStockInSystem.toLocaleString('en-IN')} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-dim)' }}>units</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Physical inventory across all 4 facilities
          </div>
        </div>

        <div className="panel" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)' }}>Reserved for Fulfillment</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--accent)' }}>
            {totalReserved.toLocaleString('en-IN')} <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-dim)' }}>units</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Locked under active pending/processing orders
          </div>
        </div>

        <div className="panel" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)' }}>Network Utilization</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--good-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--good)' }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--good)' }}>
            68.4%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--good)', fontWeight: 600 }}>
            Optimal capacity &bull; No bottleneck alerts
          </div>
        </div>

        <div className="panel" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)' }}>Dispatch Readiness</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            100% SLA
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Same-day regional routing active
          </div>
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Warehouse size={18} style={{ color: 'var(--primary)' }} />
        Active Warehouse Nodes
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {loading ? (
          [1, 2, 3, 4].map(n => (
            <div key={n} className="panel" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }}>
              <div className="skeleton" style={{ height: '100%', width: '100%' }}></div>
            </div>
          ))
        ) : (
          warehouses.map(wh => {
            const whInventory = getInventoryForWarehouse(wh.name);
            const whUtil = getUtilForWarehouse(wh.name);
            const whUnits = whInventory.reduce((s, i) => s + (parseInt(i.quantity, 10) || 0), 0);
            const whReserved = whInventory.reduce((s, i) => s + (parseInt(i.reserved, 10) || 0), 0);
            const isSelected = selectedHub === wh.name;

            return (
              <div 
                key={wh.warehouse_id} 
                className="panel"
                style={{ 
                  margin: 0, 
                  padding: '1.5rem',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isSelected ? 'var(--surface-elevated)' : 'var(--surface)'
                }}
                onClick={() => setSelectedHub(isSelected ? null : wh.name)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span className={getCityBadge(wh.city)} style={{ marginBottom: '6px' }}>
                      {wh.city} Node
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 2px 0' }}>{wh.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      Lat: {Number(wh.latitude).toFixed(2)}, Lon: {Number(wh.longitude).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '10px', 
                    background: 'var(--surface-raised)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}>
                    <Warehouse size={20} />
                  </div>
                </div>

                {/* Warehouse Capacity Gauge */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Occupancy Load</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {whUnits.toLocaleString()} units ({whInventory.length} SKUs)
                    </span>
                  </div>
                  <StockGauge 
                    quantity={whUnits} 
                    threshold={Math.max(20, Math.round(whUnits * 0.2))} 
                    capacity={200}
                  />
                </div>

                {/* Details Footer */}
                <div style={{ 
                  paddingTop: '10px', 
                  borderTop: '1px solid var(--border-subtle)', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Reserved: <strong style={{ color: 'var(--text)' }}>{whReserved} units</strong>
                  </span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    {isSelected ? 'Viewing Stock ↓' : 'Inspect Stock →'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Warehouse Stock Breakdown Table */}
      <div className="panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="panel-title" style={{ margin: 0 }}>
              {selectedHub ? `${selectedHub} — Stock Breakdown` : 'Consolidated Multi-Hub Inventory Manifest'}
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>
              {selectedHub 
                ? `Showing real-time stock allocation specifically for ${selectedHub}`
                : 'Click any warehouse card above to filter or view all nodes below'}
            </p>
          </div>
          {selectedHub && (
            <button 
              className="btn secondary sm" 
              onClick={() => setSelectedHub(null)}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              Reset to All Hubs
            </button>
          )}
        </div>

        {loading ? (
          <div className="empty-state">Loading inventory manifests…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product SKU</th>
                <th>Warehouse</th>
                <th>Physical Stock</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {(selectedHub ? getInventoryForWarehouse(selectedHub) : inventory).map((item, idx) => {
                const qty = parseInt(item.quantity, 10) || 0;
                const reserved = parseInt(item.reserved, 10) || 0;
                const available = qty - reserved;
                const isLow = available <= 15;

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--text)' }}>
                      {item.product || item.product_name || `Product #${item.product_id}`}
                    </td>
                    <td>
                      <span className="badge info">{item.warehouse || item.warehouse_name}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{qty} units</td>
                    <td style={{ color: 'var(--text-dim)' }}>{reserved} units</td>
                    <td style={{ fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--good)' }}>
                      {available} units
                    </td>
                    <td>
                      {available === 0 ? (
                        <span className="badge danger">Out of Stock</span>
                      ) : isLow ? (
                        <span className="badge warning">Low Buffer</span>
                      ) : (
                        <span className="badge success">Healthy</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
