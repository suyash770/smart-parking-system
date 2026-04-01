import { useState } from 'react';

export default function LocateVehicle({ api, slots }) {
  const [plate, setPlate]     = useState('');
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleLocate = async (e) => {
    e.preventDefault();
    if (!plate.trim()) return;
    setLoading(true); setError(''); setResult(null);

    const searchPlate = plate.trim().toUpperCase();

    // Try API first, fall back to local slot search
    try {
      const res = await fetch(`${api}/api/locate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNumber: searchPlate }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setLoading(false);
        return;
      }
    } catch {}

    // Fallback: search in local slots data
    const found = slots?.find(s => s.vehicleNumber === searchPlate && s.status === 'Occupied');
    if (found) {
      const zoneLabels = { A: '🏍️ Zone A — Bikes', B: '🚗 Zone B — Cars', C: '🚛 Zone C — Trucks' };
      const duration = found.entryTime
        ? `${Math.round((Date.now() - new Date(found.entryTime).getTime()) / 60000)} min`
        : 'N/A';
      setResult({
        vehicleNumber: found.vehicleNumber,
        vehicleType: found.vehicleType,
        zone: found.zone,
        slotNumber: found.slotNumber,
        entryTime: found.entryTime,
        parkedFor: duration,
        currentRate: `₹${found.zone === 'A' ? 12 : found.zone === 'B' ? 36 : 60}/hr`,
        estimatedFee: `₹${Math.round(((Date.now() - new Date(found.entryTime).getTime()) / 3600000) * (found.zone === 'A' ? 12 : found.zone === 'B' ? 36 : 60))}`,
      });
    } else {
      setError('Vehicle not found in any parking slot.');
    }
    setLoading(false);
  };

  const zoneColors = { A: '#3B82F6', B: '#2563EB', C: '#F59E0B' };
  const zoneLabels = { A: '🏍️ Zone A — Bikes', B: '🚗 Zone B — Cars', C: '🚛 Zone C — Trucks' };

  const PARKING_LAT = '28.6139';
  const PARKING_LNG = '77.2090';
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${PARKING_LAT},${PARKING_LNG}&travelmode=driving`;

  return (
    <div className="locate-container">
      <div className="locate-hero">
        <div className="lh-icon">📍</div>
        <h2>Locate Your Vehicle</h2>
        <p>Enter your vehicle number to find its location</p>
      </div>

      <form onSubmit={handleLocate} className="locate-form">
        <input
          id="locate-input" type="text"
          placeholder="e.g. UP92J7784"
          value={plate} onChange={e => setPlate(e.target.value)}
        />
        <button type="submit" disabled={loading || !plate.trim()}>
          {loading ? '🔄' : '🔍'} Locate
        </button>
      </form>

      {error && <div className="locate-error">❌ {error}</div>}

      {result && (
        <>
          <div className="locate-result">
            <div className="loc-zone-badge" style={{ background: `linear-gradient(135deg, ${zoneColors[result.zone] || '#3B82F6'}, ${zoneColors[result.zone] || '#3B82F6'}dd)` }}>
              {zoneLabels[result.zone] || `Zone ${result.zone}`} — Slot {result.slotNumber}
            </div>
            <div className="loc-row"><span>Vehicle</span><strong>{result.vehicleNumber}</strong></div>
            <div className="loc-row"><span>Type</span><strong>{result.vehicleType}</strong></div>
            <div className="loc-row"><span>Zone</span><strong>Zone {result.zone}</strong></div>
            <div className="loc-row"><span>Slot</span><strong>#{result.slotNumber}</strong></div>
            <div className="loc-row"><span>Parked Since</span><strong>{new Date(result.entryTime).toLocaleString()}</strong></div>
            <div className="loc-row"><span>Duration</span><strong>{result.parkedFor}</strong></div>
            <div className="loc-row"><span>Rate</span><strong>{result.currentRate}</strong></div>
            <div className="loc-row">
              <span>Est. Fee</span>
              <strong style={{ color: '#2563EB', fontSize: '1rem' }}>{result.estimatedFee}</strong>
            </div>
          </div>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="map-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Navigate to Parking
          </a>
        </>
      )}
    </div>
  );
}
