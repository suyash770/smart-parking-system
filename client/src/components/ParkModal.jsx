import { useState } from 'react';

const ZONE_TYPES = {
  A: ['Bike'],
  B: ['Car', 'SUV', 'Van'],
  C: ['Truck'],
};
const ZONE_LABELS = {
  A: '🏍️ Two Wheelers',
  B: '🚗 Cars & SUVs',
  C: '🚛 Trucks',
};

export default function ParkModal({ slot, onPark, onClose, pricing }) {
  let zone = slot.zone;
  if (!zone) {
    const n = slot.slotNumber;
    if (n >= 1 && n <= 6)        zone = 'A';
    else if (n >= 7 && n <= 14)  zone = 'B';
    else                         zone = 'C';
  }

  const types = ZONE_TYPES[zone] || ['Car'];
  const currentRate = pricing?.rates?.[zone] || { A: 10, B: 30, C: 50 }[zone];

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType]     = useState(types[0]);
  const [loading, setLoading]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) return;
    setLoading(true);
    try {
      await onPark(vehicleNumber.trim().toUpperCase(), vehicleType, zone);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>🅿️ Park Vehicle — Zone {zone}</h3>

        <div className="rate-badge">
          <span>⚡ ₹{currentRate}/hr</span>
          <span>• {ZONE_LABELS[zone]}</span>
          {pricing?.multiplier > 1 && (
            <span style={{ color: '#F59E0B', marginLeft: 'auto', fontSize: '0.65rem' }}>Surge {pricing.multiplier}×</span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="vehicleNumber">Vehicle Number</label>
          <input id="vehicleNumber" type="text" placeholder="e.g. MH 12 AB 1234"
            value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} autoFocus />

          <label htmlFor="vehicleType">Vehicle Type</label>
          <select id="vehicleType" value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !vehicleNumber.trim()}>
              {loading ? 'Parking…' : 'Park Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
