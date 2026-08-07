import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { api } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import StockGauge from '../components/StockGauge.jsx';

export default function Dashboard() {
  const [topProducts, setTopProducts] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [utilization, setUtilization] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getTopProducts(),
      api.getRevenueByCategory(),
      api.getMonthlyGrowth(),
      api.getWarehouseUtilization(),
      api.getAlerts(),
    ])
      .then(([tp, cr, mg, wu, al]) => {
        setTopProducts(tp);
        setCategoryRevenue(cr);
        setGrowth(mg);
        setUtilization(wu);
        setAlerts(al);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = topProducts.reduce((s, p) => s + Number(p.revenue || 0), 0);
  const totalUnits = topProducts.reduce((s, p) => s + Number(p.units_sold || 0), 0);

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Live view across all warehouses</p>

      <ApiErrorBanner error={error} />

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Revenue (confirmed+shipped)</div>
          <div className="kpi-value">₹{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Units Sold</div>
          <div className="kpi-value">{totalUnits}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Open Reorder Alerts</div>
          <div className="kpi-value" style={{ color: alerts.length ? 'var(--danger)' : 'var(--good)' }}>
            {alerts.length}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Warehouses</div>
          <div className="kpi-value">{utilization.length}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Revenue by category</div>
          {loading ? <div className="empty-state">Loading…</div> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" />
                <XAxis dataKey="category" stroke="#8B909A" fontSize={12} />
                <YAxis stroke="#8B909A" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1B1E23', border: '1px solid #2B2F36' }} />
                <Bar dataKey="revenue" fill="#F5A623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Warehouse stock levels</div>
          {utilization.map(w => (
            <div key={w.warehouse} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>{w.warehouse}</div>
              <StockGauge quantity={Number(w.total_units)} threshold={Number(w.total_units) * 0.2} capacity={Math.max(...utilization.map(u => Number(u.total_units)), 1)} />
            </div>
          ))}
          {!loading && utilization.length === 0 && <div className="empty-state">No data yet</div>}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Monthly revenue growth</div>
          {loading ? <div className="empty-state">Loading…</div> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" />
                <XAxis dataKey="month_label" stroke="#8B909A" fontSize={12} />
                <YAxis stroke="#8B909A" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1B1E23', border: '1px solid #2B2F36' }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3DDC84" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Reorder alerts</div>
          {alerts.length === 0 && <div className="empty-state">All stock above threshold</div>}
          {alerts.slice(0, 8).map(a => (
            <div className="alert-row" key={a.alert_id}>
              <span>{a.product} <span style={{ color: 'var(--text-dim)' }}>@ {a.warehouse}</span></span>
              <span className="mono" style={{ color: 'var(--danger)' }}>{a.quantity_at_alert} left</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
