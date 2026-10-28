import { useEffect, useState, useMemo } from 'react';
import { 
  Layers, 
  Warehouse, 
  Package, 
  Search, 
  ArrowUpDown, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Minus, 
  RefreshCw,
  Boxes,
  ShieldCheck,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit,
  SlidersHorizontal
} from 'lucide-react';
import { api, getApiError } from '../api.js';
import ApiErrorBanner from '../components/ApiErrorBanner.jsx';
import StockGauge from '../components/StockGauge.jsx';
import StockTransactionModal from '../components/StockTransactionModal.jsx';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Inflow / Outflow Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('IN'); // 'IN' or 'OUT'
  const [targetProductForModal, setTargetProductForModal] = useState(null);

  // Direct Stock Edit / Reorder Level Edit State
  const [editingItem, setEditingItem] = useState(null); // { product_id, sku, name, current_stock, reorder_level }
  const [editStockVal, setEditStockVal] = useState('');
  const [editReorderVal, setEditReorderVal] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Filtering & Search
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getInventory(),
      api.getWarehouses()
    ])
      .then(([invData, whData]) => {
        setInventory(invData || []);
        setWarehouses(whData || []);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openStockModal = (type, item = null) => {
    setModalType(type);
    if (item) {
      setTargetProductForModal({
        product_id: item.product_id,
        name: item.product || item.product_name,
        sku_code: item.sku_code || item.sku,
        total_stock: item.quantity
      });
    } else {
      setTargetProductForModal(null);
    }
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditStockVal(String(item.quantity));
    setEditReorderVal(String(item.reorder_level || 15));
    setEditError('');
  };

  const handleSaveStockEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    setEditError('');

    try {
      await api.updateStock(editingItem.product_id, {
        stock_quantity: Number(editStockVal),
        warehouse_id: editingItem.warehouse_id || 1,
        reason: 'Physical Audit Stock Level Update'
      });

      if (editReorderVal && Number(editReorderVal) !== editingItem.reorder_level) {
        await api.updateProduct(editingItem.product_id, {
          reorder_level: Number(editReorderVal)
        });
      }

      setEditingItem(null);
      loadData();
    } catch (err) {
      setEditError(getApiError(err));
    } finally {
      setSavingEdit(false);
    }
  };

  // Distinct Warehouses
  const warehouseNames = useMemo(() => {
    const set = new Set();
    inventory.forEach(i => {
      const name = i.warehouse || i.warehouse_name;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [inventory]);

  // Filtering
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const whName = item.warehouse || item.warehouse_name;
      if (selectedWarehouse !== 'all' && whName !== selectedWarehouse) return false;

      const qty = parseInt(item.quantity, 10) || 0;
      const reserved = parseInt(item.reserved, 10) || 0;
      const available = qty - reserved;
      const threshold = item.reorder_level || 15;

      if (stockStatusFilter === 'low' && available > threshold) return false;
      if (stockStatusFilter === 'healthy' && available <= threshold) return false;
      if (stockStatusFilter === 'out' && available > 0) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const pName = (item.product || item.product_name || '').toLowerCase();
        const pSku = (item.sku_code || item.sku || '').toLowerCase();
        return pName.includes(q) || pSku.includes(q) || whName.toLowerCase().includes(q);
      }

      return true;
    });
  }, [inventory, selectedWarehouse, stockStatusFilter, searchQuery]);

  const totalStockUnits = inventory.reduce((s, i) => s + (parseInt(i.quantity, 10) || 0), 0);
  const totalReserved = inventory.reduce((s, i) => s + (parseInt(i.reserved, 10) || 0), 0);
  const lowBufferCount = inventory.filter(i => (parseInt(i.quantity, 10) || 0) <= (i.reorder_level || 15)).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Title & Inflow/Outflow Buttons */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
            Physical Stock Audit &amp; Movements
          </span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '4px 0 6px 0' }}>
            Multi-Hub Inventory Grid
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
            Live stock balances, reorder safety thresholds, and inbound/outbound stock controls across all facilities
          </p>
        </div>

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
            + Stock In (Restock)
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
            - Stock Out (Dispatch)
          </button>

          <button 
            className="btn secondary sm"
            onClick={loadData}
            title="Refresh Balances"
            style={{ borderRadius: 'var(--radius-full)', padding: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <ApiErrorBanner error={loadError} />

      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Total Physical Stock</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>
            {totalStockUnits.toLocaleString()} Units
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '2px' }}>Across {warehouseNames.length || 4} regional facilities</div>
        </div>

        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Allocated / Reserved</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>
            {totalReserved.toLocaleString()} Units
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>Locked for pending dispatches</div>
        </div>

        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Net Available to Promise</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--good)' }}>
            {(totalStockUnits - totalReserved).toLocaleString()} Units
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--good)', marginTop: '2px', fontWeight: 600 }}>Ready for immediate fulfillment</div>
        </div>

        <div className="panel" style={{ margin: 0, padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Low Buffer Alerts</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: lowBufferCount > 0 ? 'var(--danger)' : 'var(--good)' }}>
            {lowBufferCount} Records
          </div>
          <div style={{ fontSize: '0.76rem', color: lowBufferCount > 0 ? 'var(--danger)' : 'var(--good)', marginTop: '2px' }}>
            {lowBufferCount > 0 ? 'Requires immediate restock' : 'All hub buffers healthy'}
          </div>
        </div>
      </div>

      {/* Direct Stock Level Edit Drawer Modal */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="panel" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--primary)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge info" style={{ marginBottom: '4px' }}>
                  {editingItem.sku_code || editingItem.sku}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                  Update Stock &bull; {editingItem.product}
                </h3>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ padding: '8px 12px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.84rem', marginBottom: '1rem' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveStockEdit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Warehouse Hub
                </label>
                <input type="text" value={editingItem.warehouse || 'North Hub - Delhi'} disabled />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Physical Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStockVal}
                    onChange={(e) => setEditStockVal(e.target.value)}
                    required
                    style={{ fontWeight: 700, fontSize: '0.95rem' }}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Safety Reorder Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editReorderVal}
                    onChange={(e) => setEditReorderVal(e.target.value)}
                    placeholder="15"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setEditingItem(null)}
                  disabled={savingEdit}
                  style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={savingEdit}
                  style={{ borderRadius: 'var(--radius-full)', padding: '8px 22px' }}
                >
                  {savingEdit ? 'Updating…' : 'Save Stock Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="panel" style={{ padding: '12px 18px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Warehouse Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`filter-chip ${selectedWarehouse === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedWarehouse('all')}
          >
            All Warehouses
          </button>
          {warehouseNames.map(wh => (
            <button
              key={wh}
              type="button"
              className={`filter-chip ${selectedWarehouse === wh ? 'active' : ''}`}
              onClick={() => setSelectedWarehouse(wh)}
            >
              {wh}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search SKU, product, or hub..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* ====================================================================
          DETAILED INVENTORY TABLE
          Columns: SKU, Item Name, Category, Stock Left, Warehouse Hub, Status, Action buttons
          ==================================================================== */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">Loading inventory balances…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Stock Left</th>
                <th>Warehouse Hub</th>
                <th style={{ width: '180px' }}>Stock Gauge</th>
                <th>Buffer Status</th>
                <th style={{ textAlign: 'right' }}>Action Buttons</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((row) => {
                const qty = parseInt(row.quantity, 10) || 0;
                const reserved = parseInt(row.reserved, 10) || 0;
                const available = qty - reserved;
                const reorder = row.reorder_level || 15;
                const isCritical = available <= reorder;

                return (
                  <tr key={`${row.product_id}-${row.warehouse_id}`}>
                    {/* 1. SKU */}
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, background: 'var(--surface-raised)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.84rem' }}>
                        {row.sku_code || row.sku || `SKU-${row.product_id}`}
                      </span>
                    </td>

                    {/* 2. Item Name */}
                    <td>
                      <strong style={{ color: 'var(--text)', fontSize: '0.92rem' }}>{row.product}</strong>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                        PID #{row.product_id} &bull; ₹{Number(row.price || 0).toLocaleString()}
                      </div>
                    </td>

                    {/* 3. Category */}
                    <td>
                      <span className="badge info">
                        {row.category || 'Standard Goods'}
                      </span>
                    </td>

                    {/* 4. Stock Left */}
                    <td>
                      <strong style={{ fontSize: '0.98rem', color: isCritical ? 'var(--danger)' : 'var(--text)' }}>
                        {qty} units
                      </strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                        ({available} free &bull; {reserved} rsv)
                      </div>
                    </td>

                    {/* 5. Warehouse Hub */}
                    <td>
                      <span className="badge primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Warehouse size={11} /> {row.warehouse}
                      </span>
                    </td>

                    {/* 6. Stock Gauge */}
                    <td>
                      <StockGauge 
                        quantity={qty} 
                        threshold={reorder} 
                        capacity={150} 
                      />
                    </td>

                    {/* 7. Buffer Status */}
                    <td>
                      {available === 0 ? (
                        <span className="badge danger">Out of Stock</span>
                      ) : isCritical ? (
                        <span className="badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <AlertTriangle size={11} /> Reorder ({reorder})
                        </span>
                      ) : (
                        <span className="badge success">Healthy</span>
                      )}
                    </td>

                    {/* 8. Action Buttons (Update Stock / Restock) */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* + Restock (Stock In) */}
                        <button
                          className="btn sm"
                          onClick={() => openStockModal('IN', row)}
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
                          title="Stock In / Restock"
                        >
                          <Plus size={12} /> Restock
                        </button>

                        {/* - Stock Out */}
                        <button
                          className="btn secondary sm"
                          onClick={() => openStockModal('OUT', row)}
                          style={{
                            borderRadius: 'var(--radius-full)',
                            padding: '4px 10px',
                            fontSize: '0.76rem',
                            color: 'var(--accent)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Stock Out / Deduct"
                        >
                          <Minus size={12} /> Out
                        </button>

                        {/* Update Stock */}
                        <button
                          className="btn secondary sm"
                          onClick={() => openEditModal(row)}
                          style={{
                            borderRadius: 'var(--radius-full)',
                            padding: '4px 10px',
                            fontSize: '0.76rem'
                          }}
                          title="Update Exact Stock & Reorder Threshold"
                        >
                          <Edit size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filteredInventory.length === 0 && (
          <div className="empty-state">No inventory records matching your filter.</div>
        )}
      </div>

      {/* Stock In / Stock Out Reusable Modal */}
      <StockTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialType={modalType}
        preselectedProduct={targetProductForModal}
        warehouses={warehouses}
        onSuccess={loadData}
      />
    </div>
  );
}