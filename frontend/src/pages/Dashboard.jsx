import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Package, 
  AlertTriangle, 
  Warehouse, 
  Boxes, 
  TrendingUp, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Plus,
  ShieldCheck,
  XCircle,
  Truck
} from 'lucide-react';
import { api, getApiError } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import StockGauge from '../components/StockGauge.jsx';
import StockTransactionModal from '../components/StockTransactionModal.jsx';

const CustomChartTooltip = ({ active, payload, label, prefix = '₹' }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 12px',
        boxShadow: 'var(--shadow-sm)',
        fontSize: '0.82rem',
        color: 'var(--text)'
      }}>
        <p style={{ fontWeight: 600, color: 'var(--text-dim)', marginBottom: '2px' }}>{label}</p>
        <p style={{ fontWeight: 700, color: 'var(--primary)', margin: 0, fontSize: '0.92rem' }}>
          {prefix}{Number(payload[0].value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stock Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('IN');
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      api.getProducts(),
      api.getInventory(),
      api.getAlerts(),
      api.getTransactions({ limit: 10 }),
      api.getWarehouses(),
      api.getRevenueByCategory(),
      api.getMonthlyGrowth()
    ])
      .then(([pData, iData, aData, tData, wData, crData, mgData]) => {
        setProducts(pData || []);
        setInventory(iData || []);
        setAlerts(aData || []);
        setTransactions(tData || []);
        setWarehouses(wData || []);
        setCategoryRevenue(crData || []);
        setGrowth(mgData || []);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute Warehouse Metrics requested:
  // Total SKUs, Low Stock Items, Out of Stock, Total Inventory Value
  const totalSKUs = products.length;

  const outOfStockItems = products.filter(p => {
    const stock = parseInt(p.total_stock != null ? p.total_stock : p.stock_quantity, 10) || 0;
    return stock === 0;
  });

  const lowStockItems = products.filter(p => {
    const stock = parseInt(p.total_stock != null ? p.total_stock : p.stock_quantity, 10) || 0;
    const threshold = p.reorder_level || p.reorder_threshold || 15;
    return stock > 0 && stock <= threshold;
  });

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => {
      const stock = parseInt(p.total_stock != null ? p.total_stock : p.stock_quantity, 10) || 0;
      const unitPrice = parseFloat(p.price) || 0;
      return acc + (stock * unitPrice);
    }, 0);
  }, [products]);

  const totalPhysicalUnits = inventory.reduce((s, i) => s + (parseInt(i.quantity, 10) || 0), 0);

  const openStockModal = (type, prod = null) => {
    setModalType(type);
    setSelectedProductForModal(prod);
    setModalOpen(true);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Dashboard Executive Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '4px' }}>
              Operations Telemetry
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="stock-dot" style={{ background: 'var(--good)' }}></span> MySQL Live Sync Active
            </span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: 'var(--text)' }}>
            Inventory Analytics &amp; Control
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '4px 0 0 0' }}>
            Consolidated warehouse telemetry, safety stock buffer tracking, and live audit movements
          </p>
        </div>

        {/* Quick Action Bar for Stock In / Stock Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn sm"
            onClick={() => openStockModal('IN')}
            style={{ 
              background: 'var(--good)', 
              color: '#FFFFFF', 
              borderRadius: 'var(--radius-full)', 
              padding: '8px 18px', 
              fontSize: '0.84rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: 700 
            }}
          >
            <ArrowDownToLine size={15} />
            + Stock In (Inflow)
          </button>

          <button 
            className="btn secondary sm"
            onClick={() => openStockModal('OUT')}
            style={{ 
              borderRadius: 'var(--radius-full)', 
              padding: '8px 18px', 
              fontSize: '0.84rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: 700,
              color: 'var(--accent)'
            }}
          >
            <ArrowUpFromLine size={15} />
            - Stock Out (Outflow)
          </button>

          <button 
            className="btn secondary sm"
            onClick={loadDashboardData}
            title="Refresh Data"
            style={{ borderRadius: 'var(--radius-full)', padding: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <ApiErrorBanner error={error} />

      {/* ====================================================================
          CORE WAREHOUSE METRICS CARDS (Total SKUs, Low Stock, Out of Stock, Inventory Value)
          ==================================================================== */}
      <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* 1. Total SKUs Card */}
        <div className="panel" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)' }}>Total Active SKUs</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            {totalSKUs} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dim)' }}>Lines</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {totalPhysicalUnits.toLocaleString()} total units across 4 regional hubs
          </div>
        </div>

        {/* 2. Total Inventory Value Card */}
        <div className="panel" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)' }}>Total Inventory Asset Value</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--good-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--good)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            ₹{totalInventoryValue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--good)', fontWeight: 600 }}>
            Weighted asset valuation (Stock &times; Unit Price)
          </div>
        </div>

        {/* 3. Low Stock Items Card */}
        <div className="panel" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)' }}>Low Stock Buffer Warnings</span>
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '8px', 
              background: lowStockItems.length > 0 ? 'var(--danger-soft)' : 'var(--good-soft)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: lowStockItems.length > 0 ? 'var(--danger)' : 'var(--good)' 
            }}>
              {lowStockItems.length > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: lowStockItems.length > 0 ? 'var(--danger)' : 'var(--good)' }}>
            {lowStockItems.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dim)' }}>Items</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: lowStockItems.length > 0 ? 'var(--danger)' : 'var(--good)', fontWeight: 600 }}>
            {lowStockItems.length > 0 ? 'Below safety reorder threshold' : 'All buffer thresholds optimal'}
          </div>
        </div>

        {/* 4. Out of Stock Card */}
        <div className="panel" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)' }}>Out of Stock SKUs</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: outOfStockItems.length > 0 ? 'var(--danger-soft)' : 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: outOfStockItems.length > 0 ? 'var(--danger)' : 'var(--text-dim)' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: outOfStockItems.length > 0 ? 'var(--danger)' : 'var(--text)' }}>
            {outOfStockItems.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-dim)' }}>Lines</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {outOfStockItems.length > 0 ? 'Zero available balance in hubs' : 'Zero stockout events recorded'}
          </div>
        </div>
      </div>

      {/* ====================================================================
          LOW STOCK ALERTS TABLE & WAREHOUSE BUFFER WARNINGS
          ==================================================================== */}
      <div className="panel" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="panel-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
              Automated Safety Reorder Alerts
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>
              Items triggered when physical on-hand stock falls below minimum safety buffer (reorder_level)
            </p>
          </div>

          <Link to="/inventory" className="btn secondary sm" style={{ borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}>
            View Multi-Hub Balances →
          </Link>
        </div>

        {alerts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--good)', background: 'var(--good-soft)', borderRadius: 'var(--radius-md)' }}>
            <ShieldCheck size={28} style={{ marginBottom: '6px' }} />
            <p style={{ fontWeight: 700, margin: '4px 0 2px 0', fontSize: '0.95rem' }}>
              All inventory levels are fully compliant with safety stock parameters.
            </p>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              No SKU is currently below its configured minimum reorder threshold.
            </span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Product Item</th>
                  <th>Location Hub</th>
                  <th>Current Stock</th>
                  <th>Safety Threshold</th>
                  <th>Deficit Units</th>
                  <th style={{ textAlign: 'right' }}>Replenishment Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, idx) => {
                  const targetProd = products.find(p => p.product_id === a.product_id);
                  return (
                    <tr key={idx}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, background: 'var(--surface-raised)', padding: '4px 8px', borderRadius: '4px' }}>
                          {a.sku_code || `PID-${a.product_id}`}
                        </span>
                      </td>
                      <td>
                        <strong>{a.product}</strong>
                      </td>
                      <td>
                        <span className="badge info">{a.warehouse || 'Central Hub'}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--danger)', fontSize: '0.95rem' }}>
                          {a.quantity_at_alert} units
                        </strong>
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>{a.reorder_level} units</td>
                      <td>
                        <span className="badge danger">
                          -{a.deficit_units || Math.max(1, (a.reorder_level - a.quantity_at_alert))} units
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn sm"
                          onClick={() => openStockModal('IN', targetProd || { product_id: a.product_id, name: a.product })}
                          style={{
                            background: 'var(--good)',
                            color: '#FFFFFF',
                            borderRadius: 'var(--radius-full)',
                            padding: '5px 14px',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <ArrowDownToLine size={13} />
                          + Restock Inflow
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====================================================================
          STOCK TRANSACTIONS AUDIT LEDGER (Inflow / Outflow Stream)
          ==================================================================== */}
      <div className="panel" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="panel-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Boxes size={18} style={{ color: 'var(--primary)' }} />
              Live Stock Inflow &amp; Outflow Transactions Ledger
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>
              Real-time audit log tracking purchases, restocks, orders, and manual balance adjustments
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn sm" 
              onClick={() => openStockModal('IN')}
              style={{ background: 'var(--good)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '5px 12px', fontSize: '0.78rem' }}
            >
              + Record Inflow
            </button>
            <button 
              className="btn secondary sm" 
              onClick={() => openStockModal('OUT')}
              style={{ borderRadius: 'var(--radius-full)', padding: '5px 12px', fontSize: '0.78rem', color: 'var(--accent)' }}
            >
              - Record Outflow
            </button>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">No transaction records recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Flow Type</th>
                  <th>Reference #</th>
                  <th>Item SKU</th>
                  <th>Warehouse Node</th>
                  <th>Quantity Delta</th>
                  <th>Balance After</th>
                  <th>Reason / Operation</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isInflow = tx.transaction_type === 'IN';
                  return (
                    <tr key={tx.transaction_id}>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                        {new Date(tx.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <span style={{
                          background: isInflow ? 'var(--good-soft)' : 'var(--accent-soft)',
                          color: isInflow ? 'var(--good)' : 'var(--accent)',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isInflow ? <ArrowDownToLine size={12} /> : <ArrowUpFromLine size={12} />}
                          {isInflow ? 'INFLOW' : 'OUTFLOW'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem' }}>
                          {tx.reference_number || `TX-${tx.transaction_id}`}
                        </span>
                      </td>
                      <td>
                        <strong>{tx.product_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {tx.sku_code}
                        </div>
                      </td>
                      <td>
                        <span className="badge info">{tx.warehouse_name || 'Central Hub'}</span>
                      </td>
                      <td>
                        <strong style={{ color: isInflow ? 'var(--good)' : 'var(--accent)', fontSize: '0.92rem' }}>
                          {isInflow ? `+${tx.quantity}` : `-${tx.quantity}`}
                        </strong>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {tx.balance_after} units
                      </td>
                      <td style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        {tx.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====================================================================
          ANALYTICS GRAPHS GRID (Category Asset Distribution & Monthly Movement)
          ==================================================================== */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        <div className="panel">
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="panel-title" style={{ margin: 0 }}>Inventory Turnover &amp; Value by Category</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>Monetary distribution across active product categories</p>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: '230px', borderRadius: '12px' }}></div>
          ) : categoryRevenue.length === 0 ? (
            <div style={{
              height: '230px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dim)',
              background: 'var(--surface-raised)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <Package size={36} style={{ marginBottom: '8px', opacity: 0.45, color: 'var(--primary)' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                No Category Sales Recorded Yet
              </p>
              <span style={{ fontSize: '0.78rem', marginTop: '4px', maxWidth: '300px' }}>
                Confirmed customer orders for your catalog will automatically plot category revenue here.
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={categoryRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="category" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="panel-title" style={{ margin: 0 }}>Monthly Order Fulfillment Throughput</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>Historical dispatch trajectory across regional supply chains</p>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: '230px', borderRadius: '12px' }}></div>
          ) : growth.length === 0 ? (
            <div style={{
              height: '230px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dim)',
              background: 'var(--surface-raised)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <TrendingUp size={36} style={{ marginBottom: '8px', opacity: 0.45, color: 'var(--good)' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                No Monthly Trajectory Recorded Yet
              </p>
              <span style={{ fontSize: '0.78rem', marginTop: '4px', maxWidth: '300px' }}>
                Monthly dispatch throughput and percentage growth over time will plot here as orders progress.
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month_label" stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#growthGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stock Transaction Modal */}
      <StockTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialType={modalType}
        preselectedProduct={selectedProductForModal}
        warehouses={warehouses}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}
