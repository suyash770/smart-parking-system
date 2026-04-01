import { useState } from 'react';

export default function AutoUnparkModal({ onUnpark, onClose }) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading]             = useState(false);
  const [receipt, setReceipt]             = useState(null);
  const [error, setError]                 = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await onUnpark(vehicleNumber.trim().toUpperCase());
      setReceipt(data);
    } catch (err) {
      setError(err.message || 'Vehicle not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={receipt ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {!receipt ? (
          <>
            <h3>🏁 Express Exit — Quick Checkout</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Enter your vehicle number to calculate fees and release your slot.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="au-vn">Vehicle Number</label>
              <input
                id="au-vn" type="text"
                placeholder="e.g. MH 12 AB 1234"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value)}
                autoFocus
              />
              {error && <p style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>{error}</p>}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={loading || !vehicleNumber.trim()}>
                  {loading ? 'Searching…' : 'Unpark'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3>✅ Parking Released</h3>
            <div className="receipt">
              <p>Vehicle: <span>{vehicleNumber.toUpperCase()}</span></p>
              <p>Slot ID: <span>{receipt.slotNumber}</span></p>
              <p>Duration: <span>{receipt.duration}</span></p>
              <p className="fee">{receipt.fee}</p>
            </div>
            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={onClose} style={{ flex: 'none', padding: '0.65rem 2.5rem' }}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
