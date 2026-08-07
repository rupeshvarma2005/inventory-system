import { useEffect, useState } from 'react';
import { api } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import StockGauge from '../components/StockGauge.jsx';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [adjusting, setAdjusting] = useState(null); // { product_id, warehouse_id, product, warehouse }
  const [changeQty, setChangeQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.getInventory()
      .then((data) => { setInventory(data); setLoadError(null); })
      .catch((err) => setLoadError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submitAdjustment = async () => {
    if (!changeQty || Number(changeQty) === 0) return;
    setSaving(true);
    setError('');
    try {
      await api.adjustStock({
        product_id: adjusting.product_id,
        warehouse_id: adjusting.warehouse_id,
        change_qty: Number(changeQty),
      });
      setAdjusting(null);
      setChangeQty('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Adjustment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Inventory</h1>
      <p className="page-subtitle">Stock per product, per warehouse</p>

      <ApiErrorBanner error={loadError} />

      <div className="panel">
        {loading ? <div className="empty-state">Loading…</div> : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Stock level</th>
                <th>Reserved</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row) => (
                <tr key={`${row.product_id}-${row.warehouse_id}`}>
                  <td style={{ fontFamily: 'var(--font-display)' }}>{row.product}</td>
                  <td>{row.warehouse}</td>
                  <td style={{ minWidth: 160 }}>
                    <StockGauge quantity={row.quantity} threshold={Math.max(5, Math.round(row.quantity * 0.2))} />
                  </td>
                  <td>{row.reserved}</td>
                  <td>
                    <button
                      className="btn secondary"
                      onClick={() => { setAdjusting(row); setChangeQty(''); setError(''); }}
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && inventory.length === 0 && <div className="empty-state">No inventory data</div>}
      </div>

      {adjusting && (
        <div className="panel" style={{ maxWidth: 420 }}>
          <div className="panel-title">
            Adjust stock — {adjusting.product} @ {adjusting.warehouse}
          </div>
          <div className="form-row">
            <input
              type="number"
              placeholder="e.g. 20 or -5"
              value={changeQty}
              onChange={(e) => setChangeQty(e.target.value)}
            />
            <button className="btn" disabled={saving} onClick={submitAdjustment}>
              {saving ? 'Saving…' : 'Apply'}
            </button>
            <button className="btn secondary" onClick={() => setAdjusting(null)}>Cancel</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            Positive number adds stock, negative removes it. If stock drops at or below the reorder threshold, a reorder alert is created automatically.
          </p>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        </div>
      )}
    </div>
  );
}