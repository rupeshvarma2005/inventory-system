import { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Warehouse,
  Package,
  Layers,
  FileText
} from 'lucide-react';
import { api, getApiError } from '../api.js';

export default function StockTransactionModal({ 
  isOpen, 
  onClose, 
  initialType = 'IN', // 'IN' or 'OUT'
  preselectedProduct = null,
  warehouses = [],
  onSuccess 
}) {
  if (!isOpen) return null;

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(preselectedProduct?.product_id || '');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('1');
  const [transactionType, setTransactionType] = useState(initialType);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(initialType === 'IN' ? 'Purchase Order Inbound' : 'Customer Order Dispatch');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch products list for dropdown
    api.getProducts()
      .then(data => {
        setProducts(data || []);
        if (!selectedProductId && data?.length > 0) {
          setSelectedProductId(data[0].product_id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (preselectedProduct?.product_id) {
      setSelectedProductId(preselectedProduct.product_id);
    }
  }, [preselectedProduct]);

  useEffect(() => {
    if (transactionType === 'IN') {
      setReason('Purchase Order Inbound');
      setReferenceNumber(`PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
    } else {
      setReason('Customer Order Dispatch');
      setReferenceNumber(`DISP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
    }
  }, [transactionType]);

  const selectedProductObj = products.find(p => String(p.product_id) === String(selectedProductId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || Number(quantity) <= 0) {
      setError('Please select a product and enter a valid quantity greater than zero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedWhObj = warehouses.find(w => String(w.warehouse_id) === String(selectedWarehouseId));
      const whName = selectedWhObj?.name || 'North Hub - Delhi';

      await api.recordTransaction({
        product_id: Number(selectedProductId),
        warehouse_id: Number(selectedWarehouseId),
        warehouse_name: whName,
        transaction_type: transactionType,
        quantity: Number(quantity),
        reason,
        reference_number: referenceNumber,
        notes
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const isInflow = transactionType === 'IN';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="panel" style={{
        maxWidth: '560px',
        width: '100%',
        margin: 0,
        padding: '2rem',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        border: isInflow ? '2px solid var(--good)' : '2px solid var(--accent)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: isInflow ? 'var(--good-soft)' : 'var(--accent-soft)',
                color: isInflow ? 'var(--good)' : 'var(--accent)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {isInflow ? <ArrowDownToLine size={13} /> : <ArrowUpFromLine size={13} />}
                {isInflow ? 'Stock In (Inflow)' : 'Stock Out (Outflow)'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              {isInflow ? 'Inbound Inventory Restock' : 'Outbound Stock Deduction'}
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
              {isInflow 
                ? 'Record goods received from suppliers, purchase orders, or returns' 
                : 'Deduct stock for customer orders, transit dispatches, or scrap'}
            </p>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Inflow / Outflow Toggle Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'var(--surface-raised)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            className="btn sm"
            onClick={() => setTransactionType('IN')}
            style={{
              background: isInflow ? 'var(--good)' : 'transparent',
              color: isInflow ? '#FFFFFF' : 'var(--text-dim)',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ArrowDownToLine size={14} />
            + Stock In (Inflow)
          </button>

          <button
            type="button"
            className="btn sm"
            onClick={() => setTransactionType('OUT')}
            style={{
              background: !isInflow ? 'var(--accent)' : 'transparent',
              color: !isInflow ? '#FFFFFF' : 'var(--text-dim)',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ArrowUpFromLine size={14} />
            - Stock Out (Outflow)
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-soft)',
            color: 'var(--danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Product Select */}
          <div className="form-group">
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Target SKU / Product Item *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-raised)',
                color: 'var(--text)',
                fontSize: '0.9rem'
              }}
              required
            >
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>
                  [{p.sku_code || p.sku}] {p.name} — Current: {p.total_stock != null ? p.total_stock : p.stock_quantity} units
                </option>
              ))}
            </select>
            {selectedProductObj && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Unit Value: ₹{Number(selectedProductObj.price).toLocaleString()} &bull; Reorder Level: {selectedProductObj.reorder_level || 15} units
              </div>
            )}
          </div>

          {/* Warehouse and Quantity */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1.2 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Warehouse Hub *
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text)',
                  fontSize: '0.88rem'
                }}
              >
                <option value="1">North Hub (Delhi)</option>
                <option value="2">West Hub (Mumbai)</option>
                <option value="3">South Hub (Bengaluru)</option>
                <option value="4">East Hub (Kolkata)</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Units to {isInflow ? 'Add' : 'Deduct'} *
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
                required
              />
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick Presets:</span>
            {[10, 25, 50, 100, 250].map(val => (
              <button
                key={val}
                type="button"
                className="btn secondary sm"
                onClick={() => setQuantity(String(val))}
                style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '4px' }}
              >
                +{val}
              </button>
            ))}
          </div>

          {/* Reason & Reference Number */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Operation Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text)',
                  fontSize: '0.88rem'
                }}
              >
                {isInflow ? (
                  <>
                    <option value="Purchase Order Inbound">Purchase Order Inbound (PO)</option>
                    <option value="Customer Return Restock">Customer Return Restock</option>
                    <option value="Cycle Count Audit Surplus">Cycle Count Audit Surplus</option>
                    <option value="Inter-Hub Inbound Transfer">Inter-Hub Inbound Transfer</option>
                  </>
                ) : (
                  <>
                    <option value="Customer Order Dispatch">Customer Order Dispatch</option>
                    <option value="Damaged / Scrap Write-off">Damaged / Scrap Write-off</option>
                    <option value="Inter-Hub Outbound Transfer">Inter-Hub Outbound Transfer</option>
                    <option value="Inventory Shrinkage Audit">Inventory Shrinkage Audit</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Doc / PO / Order #
              </label>
              <input
                type="text"
                placeholder="e.g. PO-2026-004"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text)',
                  fontSize: '0.88rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Audit Ledger Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Verified batch expiration, received on dock bay 4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-raised)',
                color: 'var(--text)',
                fontSize: '0.86rem'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={onClose}
              disabled={loading}
              style={{ borderRadius: 'var(--radius-full)', padding: '9px 20px' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{
                background: isInflow ? 'var(--good)' : 'var(--accent)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-full)',
                padding: '9px 24px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading ? 'Committing…' : (
                <>
                  {isInflow ? <ArrowDownToLine size={15} /> : <ArrowUpFromLine size={15} />}
                  Confirm {isInflow ? 'Stock In (+)' : 'Stock Out (-)'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
