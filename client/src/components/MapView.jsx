import { useState } from 'react';

/* ── Parking Map SVG Zones ── */
const ZONE_COLORS = {
  A: { fill: '#DBEAFE', stroke: '#3B82F6', label: 'Zone A · Two Wheelers' },
  B: { fill: '#DCFCE7', stroke: '#22C55E', label: 'Zone B · Cars / SUVs' },
  C: { fill: '#FEF3C7', stroke: '#F59E0B', label: 'Zone C · Trucks' },
};

function MiniSlot({ slot, zone }) {
  const isFree = slot.status === 'Free';
  const isOccupied = slot.status === 'Occupied';
  const isReserved = slot.status === 'Reserved';

  let bg = '#22C55E';
  let label = '✓';
  if (isOccupied) { bg = '#3B82F6'; label = '🚗'; }
  if (isReserved) { bg = '#F59E0B'; label = 'R'; }
  if (zone === 'A' && isOccupied) label = '🏍️';
  if (zone === 'C' && isOccupied) label = '🚛';

  return (
    <div className="pmap-slot" style={{ background: isFree ? '#F0FDF4' : isReserved ? '#FFFBEB' : '#EFF6FF', borderColor: isFree ? '#BBF7D0' : isReserved ? '#FDE68A' : '#BFDBFE' }}
      title={`Slot ${slot.slotNumber} · ${slot.status}${slot.vehicleNumber ? ` · ${slot.vehicleNumber}` : ''}`}
    >
      <span className="pmap-slot-icon">{label}</span>
      <span className="pmap-slot-num">{slot.slotNumber}</span>
    </div>
  );
}

export default function MapView({ slots, pricing }) {
  const freeCount = slots.filter(s => s.status === 'Free').length;
  const occCount = slots.filter(s => s.status === 'Occupied').length;
  const resCount = slots.filter(s => s.status === 'Reserved').length;
  const totalSlots = slots.length || 20;
  const occPct = totalSlots > 0 ? Math.round((occCount / totalSlots) * 100) : 0;

  const zoneA = slots.filter(s => s.zone === 'A');
  const zoneB = slots.filter(s => s.zone === 'B');
  const zoneC = slots.filter(s => s.zone === 'C');

  return (
    <div className="map-container">
      <div className="map-header">
        <h2>🅿️ Parking Map</h2>
      </div>

      {/* Info Cards — no Est. Revenue */}
      <div className="map-info-cards">
        <div className="map-info-card">
          <div className="mic-icon blue">🅿️</div>
          <div className="mic-text">
            <div className="mic-label">Total Slots</div>
            <div className="mic-value">{totalSlots}</div>
          </div>
        </div>
        <div className="map-info-card">
          <div className="mic-icon green">✅</div>
          <div className="mic-text">
            <div className="mic-label">Available</div>
            <div className="mic-value" style={{ color: '#22C55E' }}>{freeCount}</div>
          </div>
        </div>
        <div className="map-info-card">
          <div className="mic-icon red">🚗</div>
          <div className="mic-text">
            <div className="mic-label">Occupied</div>
            <div className="mic-value" style={{ color: '#EF4444' }}>{occCount}</div>
          </div>
        </div>
      </div>

      {/* Interactive Parking Map */}
      <div className="pmap-wrapper">
        <div className="pmap-frame">
          {/* Live Badge */}
          <div className="map-overlay-badge">
            <div className="mob-dot" />
            <span>SmartPark — Live Map</span>
          </div>

          {/* Entry */}
          <div className="pmap-entry-marker">
            <div className="pmap-entry-arrow">▼</div>
            <span>ENTRY</span>
            <div className="pmap-entry-line" />
          </div>

          {/* Zone A */}
          <div className="pmap-zone" style={{ borderColor: ZONE_COLORS.A.stroke }}>
            <div className="pmap-zone-label" style={{ background: ZONE_COLORS.A.stroke }}>
              {ZONE_COLORS.A.label}
            </div>
            <div className="pmap-slots-grid">
              {zoneA.map(s => <MiniSlot key={s.slotNumber} slot={s} zone="A" />)}
            </div>
          </div>

          {/* Road */}
          <div className="pmap-road">
            <div className="pmap-road-dashes">
              <span>▶</span><span>▶</span><span>▶</span><span>▶</span><span>▶</span>
            </div>
          </div>

          {/* Zone B */}
          <div className="pmap-zone" style={{ borderColor: ZONE_COLORS.B.stroke }}>
            <div className="pmap-zone-label" style={{ background: ZONE_COLORS.B.stroke }}>
              {ZONE_COLORS.B.label}
            </div>
            <div className="pmap-slots-grid">
              {zoneB.map(s => <MiniSlot key={s.slotNumber} slot={s} zone="B" />)}
            </div>
          </div>

          {/* Road */}
          <div className="pmap-road">
            <div className="pmap-road-dashes">
              <span>▶</span><span>▶</span><span>▶</span><span>▶</span><span>▶</span>
            </div>
          </div>

          {/* Zone C */}
          <div className="pmap-zone" style={{ borderColor: ZONE_COLORS.C.stroke }}>
            <div className="pmap-zone-label" style={{ background: ZONE_COLORS.C.stroke }}>
              {ZONE_COLORS.C.label}
            </div>
            <div className="pmap-slots-grid">
              {zoneC.map(s => <MiniSlot key={s.slotNumber} slot={s} zone="C" />)}
            </div>
          </div>

          {/* Exit */}
          <div className="pmap-exit-marker">
            <div className="pmap-exit-line" />
            <span>EXIT</span>
            <div className="pmap-exit-arrow">▲</div>
          </div>
        </div>

        {/* Legend Sidebar */}
        <div className="pmap-legend">
          <h4>Map Legend</h4>
          <div className="pmap-legend-item">
            <div className="pmap-legend-dot" style={{ background: '#22C55E' }}>✓</div>
            <span>Free Slot</span>
          </div>
          <div className="pmap-legend-item">
            <div className="pmap-legend-dot" style={{ background: '#3B82F6' }}>P</div>
            <span>Occupied</span>
          </div>
          <div className="pmap-legend-item">
            <div className="pmap-legend-dot" style={{ background: '#F59E0B' }}>R</div>
            <span>Reserved</span>
          </div>
          <div className="pmap-legend-divider" />
          <div className="pmap-legend-stat">
            <span>Occupancy</span>
            <strong>{occPct}%</strong>
          </div>
          <div className="pmap-occ-bar">
            <div className="pmap-occ-fill" style={{ width: `${occPct}%`, background: occPct > 80 ? '#EF4444' : occPct > 50 ? '#F59E0B' : '#22C55E' }} />
          </div>
          {resCount > 0 && (
            <div className="pmap-legend-stat" style={{ marginTop: '8px' }}>
              <span>Reserved</span>
              <strong>{resCount}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
