// Horizontal "loading dock" gauge: fill shows stock as a percentage
// of a reference capacity, amber tick marks the reorder threshold.
export default function StockGauge({ quantity, threshold, capacity }) {
  const cap = capacity || Math.max(threshold * 3, quantity, 1);
  const fillPct = Math.min(100, (quantity / cap) * 100);
  const thresholdPct = Math.min(100, (threshold / cap) * 100);
  const isLow = quantity <= threshold;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="gauge">
        <div
          className={`gauge-fill ${isLow ? 'low' : ''}`}
          style={{ width: `${fillPct}%` }}
        />
        <div className="gauge-threshold" style={{ left: `${thresholdPct}%` }} />
      </div>
      <span className="mono" style={{ fontSize: 12, minWidth: 28, color: isLow ? 'var(--danger)' : 'var(--text-dim)' }}>
        {quantity}
      </span>
    </div>
  );
}
