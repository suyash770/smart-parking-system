import { useState } from 'react';

export default function UnparkModal({ slot, onUnpark, onClose }) {
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const data = await onUnpark(slot.vehicleNumber);
      setReceipt(data);
    } catch {
      // toast handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={receipt ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {!receipt ? (
          <>
            <h3>🚙 Unpark Vehicle</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
              Slot <strong style={{ color: 'var(--text-primary)' }}>{slot.slotNumber}</strong> •{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{slot.vehicleNumber}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              Parked since {new Date(slot.entryTime).toLocaleString()}
            </p>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? 'Processing…' : 'Unpark & Calculate Fee'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>✅ Vehicle Removed</h3>
            <div className="receipt">
              <p>Slot: <span>{receipt.slotNumber}</span></p>
              <p>Duration: <span>{receipt.duration}</span></p>
              <p className="fee">{receipt.fee}</p>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={onClose} style={{ flex: 'none', padding: '0.65rem 2rem' }}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
