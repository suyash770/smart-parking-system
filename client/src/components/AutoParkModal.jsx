import { useState } from 'react';

export default function AutoParkModal({ onPark, onClose, pricing }) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType]     = useState('Car');
  const [loading, setLoading]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) return;
    setLoading(true);
    try {
      // Logic: backend will automatically pick the best slot based on MinHeap for this type
      await onPark(vehicleNumber.trim().toUpperCase(), vehicleType, null); 
    } catch {
      // Error handled by Toast in parent
    } finally {
      setLoading(false);
    }
  };

  const types = ['Bike', 'Car', 'SUV', 'Van', 'Truck'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>🚀 Express Entrance — Quick Park</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Enter details below and we'll automatically assign the <strong>nearest available slot</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="ap-vn">Vehicle Number</label>
          <input
            id="ap-vn" type="text"
            placeholder="e.g. MH 12 AB 1234"
            value={vehicleNumber}
            onChange={e => setVehicleNumber(e.target.value)}
            autoFocus
          />

          <label htmlFor="ap-vt">Vehicle Type</label>
          <select id="ap-vt" value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>

          {pricing && (
            <div className="rate-badge" style={{ marginTop: '0.5rem' }}>
              <span>⚡</span>
              <span>Price adjusts based on current occupancy.</span>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !vehicleNumber.trim()}>
              {loading ? 'Finding Slot…' : 'Park Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
