import { useRef, useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';

const ZONES = [
  { name: 'A', label: 'Two Wheelers', zone: 'A', top: [1, 2, 3], bottom: [4, 5, 6] },
  { name: 'B', label: 'Cars / SUVs',  zone: 'B', top: [7, 8, 9, 10], bottom: [11, 12, 13, 14] },
  { name: 'C', label: 'Trucks',       zone: 'C', top: [15, 16, 17], bottom: [18, 19, 20] },
];

const SLOT_LABELS = {};
ZONES.forEach(z => {
  [...z.top, ...z.bottom].forEach((num, i) => {
    SLOT_LABELS[num] = `${z.name}-${i + 1}`;
  });
});

/* ── Realistic top-down SVG sprites ── */
function BikeSprite({ color }) {
  return (
    <svg width="40" height="46" viewBox="0 0 40 46" fill="none">
      {/* Body */}
      <ellipse cx="20" cy="23" rx="8" ry="16" fill={color} opacity="0.95"/>
      {/* Front wheel */}
      <ellipse cx="20" cy="8" rx="4" ry="3" fill="#333" opacity="0.7"/>
      <ellipse cx="20" cy="8" rx="2.5" ry="1.8" fill="#555" opacity="0.5"/>
      {/* Rear wheel */}
      <ellipse cx="20" cy="38" rx="4.5" ry="3.2" fill="#333" opacity="0.7"/>
      <ellipse cx="20" cy="38" rx="2.8" ry="2" fill="#555" opacity="0.5"/>
      {/* Handlebar */}
      <rect x="13" y="10" width="14" height="2.5" rx="1.25" fill="#222" opacity="0.6"/>
      {/* Seat */}
      <ellipse cx="20" cy="26" rx="5" ry="3" fill={color} opacity="0.7"/>
      <ellipse cx="20" cy="26" rx="3.5" ry="2" fill="#000" opacity="0.15"/>
      {/* Headlight */}
      <circle cx="20" cy="6" r="1.5" fill="#FEF3C7" opacity="0.9"/>
      {/* Taillight */}
      <rect x="18" y="40" width="4" height="1.5" rx="0.75" fill="#EF4444" opacity="0.7"/>
      {/* Mirror details */}
      <circle cx="13" cy="11" r="1.2" fill="#666" opacity="0.5"/>
      <circle cx="27" cy="11" r="1.2" fill="#666" opacity="0.5"/>
    </svg>
  );
}

function CarSprite({ color }) {
  return (
    <svg width="40" height="46" viewBox="0 0 40 46" fill="none">
      {/* Shadow */}
      <ellipse cx="20" cy="44" rx="16" ry="2" fill="#000" opacity="0.06"/>
      {/* Car body */}
      <rect x="5" y="6" width="30" height="34" rx="8" fill={color}/>
      {/* Roof/cabin */}
      <rect x="9" y="13" width="22" height="12" rx="4" fill={color} opacity="0.85"/>
      {/* Windshield */}
      <rect x="10" y="11" width="20" height="8" rx="3" fill="#B0D4F1" opacity="0.55"/>
      {/* Rear window */}
      <rect x="10" y="28" width="20" height="6" rx="2.5" fill="#B0D4F1" opacity="0.4"/>
      {/* Side mirrors */}
      <rect x="2" y="16" width="5" height="3.5" rx="1.5" fill={color} opacity="0.75"/>
      <rect x="33" y="16" width="5" height="3.5" rx="1.5" fill={color} opacity="0.75"/>
      {/* Headlights */}
      <circle cx="11" cy="8" r="2.2" fill="#FEF3C7" opacity="0.9"/>
      <circle cx="29" cy="8" r="2.2" fill="#FEF3C7" opacity="0.9"/>
      {/* Headlight inner */}
      <circle cx="11" cy="8" r="1.2" fill="#FFF" opacity="0.5"/>
      <circle cx="29" cy="8" r="1.2" fill="#FFF" opacity="0.5"/>
      {/* Taillights */}
      <rect x="9" y="37" width="5" height="2" rx="1" fill="#EF4444" opacity="0.75"/>
      <rect x="26" y="37" width="5" height="2" rx="1" fill="#EF4444" opacity="0.75"/>
      {/* Door line */}
      <line x1="20" y1="14" x2="20" y2="35" stroke="#fff" strokeWidth="0.4" opacity="0.2"/>
      {/* Wheel wells */}
      <circle cx="11" cy="13" r="2" fill="#333" opacity="0.3"/>
      <circle cx="29" cy="13" r="2" fill="#333" opacity="0.3"/>
      <circle cx="11" cy="33" r="2" fill="#333" opacity="0.3"/>
      <circle cx="29" cy="33" r="2" fill="#333" opacity="0.3"/>
    </svg>
  );
}

function TruckSprite({ color }) {
  return (
    <svg width="40" height="46" viewBox="0 0 40 46" fill="none">
      {/* Shadow */}
      <ellipse cx="20" cy="44" rx="17" ry="2" fill="#000" opacity="0.06"/>
      {/* Truck body - cargo */}
      <rect x="4" y="14" width="32" height="24" rx="3" fill={color} opacity="0.85"/>
      {/* Cargo cover */}
      <rect x="5" y="15" width="30" height="22" rx="2" fill={color} opacity="0.65"/>
      <line x1="5" y1="22" x2="35" y2="22" stroke="#fff" strokeWidth="0.5" opacity="0.2"/>
      <line x1="5" y1="29" x2="35" y2="29" stroke="#fff" strokeWidth="0.5" opacity="0.2"/>
      {/* Cab */}
      <rect x="6" y="4" width="28" height="12" rx="4" fill={color}/>
      {/* Windshield */}
      <rect x="9" y="6" width="22" height="7" rx="2.5" fill="#B0D4F1" opacity="0.5"/>
      {/* Headlights */}
      <rect x="7" y="4.5" width="5.5" height="2.5" rx="1.2" fill="#FEF3C7" opacity="0.8"/>
      <rect x="27.5" y="4.5" width="5.5" height="2.5" rx="1.2" fill="#FEF3C7" opacity="0.8"/>
      {/* Taillights */}
      <rect x="6" y="36" width="6" height="2" rx="1" fill="#EF4444" opacity="0.7"/>
      <rect x="28" y="36" width="6" height="2" rx="1" fill="#EF4444" opacity="0.7"/>
      {/* Wheel wells */}
      <circle cx="10" cy="13" r="2.5" fill="#333" opacity="0.25"/>
      <circle cx="30" cy="13" r="2.5" fill="#333" opacity="0.25"/>
      <circle cx="10" cy="35" r="2.5" fill="#333" opacity="0.25"/>
      <circle cx="30" cy="35" r="2.5" fill="#333" opacity="0.25"/>
    </svg>
  );
}

const CAR_COLORS = [
  '#2563EB', '#1E40AF', '#3B82F6', '#1D4ED8',
  '#1E3A5F', '#2D5A8E', '#4F7CAC', '#1E88E5',
];
function getCarColor(n) { return CAR_COLORS[n % CAR_COLORS.length]; }

const BIKE_COLORS = ['#D97706', '#B45309', '#F59E0B', '#DC2626', '#16A34A'];
function getBikeColor(n) { return BIKE_COLORS[n % BIKE_COLORS.length]; }

const TRUCK_COLORS = ['#2563EB', '#DC2626', '#16A34A', '#7C3AED', '#D97706'];
function getTruckColor(n) { return TRUCK_COLORS[n % TRUCK_COLORS.length]; }

function getSprite(zone, slotNum) {
  if (zone === 'A') return <BikeSprite color={getBikeColor(slotNum)} />;
  if (zone === 'C') return <TruckSprite color={getTruckColor(slotNum)} />;
  return <CarSprite color={getCarColor(slotNum)} />;
}

export default function ParkingGrid({ slots, highlightSlot, onSlotClick, pricing, onEntranceClick, onExitClick }) {
  const [showLegend, setShowLegend] = useState(false);
  const slotMap = {};
  slots.forEach(s => { slotMap[s.slotNumber] = s; });

  const pieData = useMemo(() => {
    let bike = 0, car = 0, truck = 0;
    slots.filter(s => s.status === 'Occupied').forEach(s => {
      if(s.zone === 'A') bike++; else if(s.zone === 'B') car++; else truck++;
    });
    return [
      { name: 'Scooter', value: bike, fill: '#3B82F6' },
      { name: 'Car', value: car, fill: '#EF4444' },
      { name: 'Truck', value: truck, fill: '#F59E0B' }
    ].filter(d => d.value > 0);
  }, [slots]);

  const barData = useMemo(() => [
    { hour: '1', turn: 12 }, { hour: '2', turn: 19 }, { hour: '3', turn: 15 },
    { hour: '4', turn: 25 }, { hour: '5', turn: 22 }, { hour: '6', turn: 8 }
  ], []);

  if (slots.length === 0) {
    return <div className="empty-state" style={{ minHeight: '200px' }}><span className="icon">🔌</span><p>Connecting to server…</p></div>;
  }

  return (
    <div className="floor-map-wrapper">
      <div className="floor-map">
        {/* Entry */}
        <div className="road-marker entry" onClick={onEntranceClick} title="Quick Park">
          <span>▼</span> Entry
        </div>

        {ZONES.map(zone => {
          const rate = pricing?.rates?.[zone.zone];
          return (
            <div key={zone.name} className="zone-row">
              <div className={`zone-sidebar zone-${zone.zone}`}>
                <span>{zone.name} • {zone.label}</span>
              </div>
              <div className="parking-area">
                <div className="slot-row top">
                  {zone.top.map(num => (
                    <SlotCard key={num} slot={slotMap[num]} num={num} zone={zone.zone} rate={rate}
                      highlight={highlightSlot === num}
                      onClick={() => slotMap[num] && onSlotClick(slotMap[num])} />
                  ))}
                </div>
                <div className="road-lane">
                  <div className="road-lane-arrows">
                    <span className="road-chevron">▶</span>
                    <span className="road-chevron">▶</span>
                    <span className="road-chevron">▶</span>
                  </div>
                  {rate && <span className="road-rate">₹{rate}/hr</span>}
                </div>
                <div className="slot-row bottom">
                  {zone.bottom.map(num => (
                    <SlotCard key={num} slot={slotMap[num]} num={num} zone={zone.zone} rate={rate}
                      highlight={highlightSlot === num}
                      onClick={() => slotMap[num] && onSlotClick(slotMap[num])} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Exit */}
        <div className="road-marker exit" onClick={onExitClick} title="Quick Checkout">
          <span>▲</span> Exit
        </div>
      </div>

      {/* Lot Analytics Sidebar */}
      <div className="lot-analytics-panel">
        <div className="lap-header">Lot Analytics</div>
        <div className="building-illustration-mini">
          <img src="/assets/parking-building.png" alt="Building" />
        </div>
        
        <div className="lap-charts">
          <div className="lap-chart-box">
            <div className="lap-chart-title">Vehicle Distribution</div>
            <div style={{ height: '90px' }}>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={22} outerRadius={36} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`c-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ fontSize: '9px', padding: '4px', borderRadius: '4px', border: '1px solid #E2E8F0' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '30px' }}>No vehicles</div>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', fontSize: '9px', fontWeight: '700', color: '#64748B', marginTop: '6px' }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.fill }}></div>
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          <div className="lap-chart-box" style={{ borderLeft: '1px dashed #E2E8F0', paddingLeft: '16px' }}>
            <div className="lap-chart-title">Hourly Turnover</div>
            <div style={{ height: '90px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="hour" tick={{ fontSize: 8, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '9px', padding: '4px' }} />
                  <Bar dataKey="turn" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lap-footer">Peak Hours: 1 AM - 1 PM</div>
      </div>

      {/* Legend */}
      <button className="legend-btn" onClick={() => setShowLegend(!showLegend)}>
        Legend
      </button>
      {showLegend && (
        <div className="legend-panel">
          <h4>Map Legend</h4>
          <div className="legend-item">
            <div className="legend-dot free">✓</div>
            <span>Available Slot</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot highlighted" style={{ background: '#F59E0B' }}>R</div>
            <span>Reserved Slot</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot occupied" />
            <span>Occupied Slot</span>
          </div>
          <div className="legend-item" style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
            <div className="legend-vehicle"><BikeSprite color="#D97706" /></div>
            <span>Scooter</span>
          </div>
          <div className="legend-item">
            <div className="legend-vehicle"><CarSprite color="#2563EB" /></div>
            <span>Car / SUV</span>
          </div>
          <div className="legend-item">
            <div className="legend-vehicle"><TruckSprite color="#DC2626" /></div>
            <span>Truck</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SlotCard({ slot, num, zone, highlight, rate, onClick }) {
  const ref = useRef(null);
  const prevStatus = useRef(slot?.status);

  useEffect(() => {
    if (!slot) return;
    if (prevStatus.current !== slot.status && ref.current) {
      ref.current.classList.remove('slot-pop');
      void ref.current.offsetWidth;
      ref.current.classList.add('slot-pop');
    }
    prevStatus.current = slot.status;
  }, [slot?.status]);

  if (!slot) return <div className="slot slot-empty" />;
  
  const isFree = slot.status === 'Free';
  const isReserved = slot.status === 'Reserved';
  const isOccupied = slot.status === 'Occupied';

  let durationHr = 0;
  let accrued = 0;
  let arrivalTime = '';
  
  if (isOccupied && slot.entryTime) {
    const entryDate = new Date(slot.entryTime);
    const ms = Date.now() - entryDate.getTime();
    durationHr = (ms / 3600000).toFixed(1);
    accrued = Math.round(durationHr * (rate || 0));
    arrivalTime = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  return (
    <div
      ref={ref}
      className={`slot hover-target ${highlight ? 'highlight' : ''} ${isOccupied ? 'occupied-slot' : ''} ${isReserved ? 'reserved-slot' : ''} ${slot._dimmed ? 'dimmed' : ''}`}
      onClick={onClick}
    >
      <span className="slot-label">{SLOT_LABELS[num]}</span>
      <div className="car-sprite">
        {isFree ? <div className="free-dot" /> : isReserved ? <div className="reserved-icon">R</div> : getSprite(zone, num)}
      </div>
      {isOccupied && <span className="slot-plate">{slot.vehicleNumber}</span>}
      {isReserved && <span className="slot-plate" style={{ color: '#D97706', background: 'transparent' }}>Reserved</span>}

      {/* Modern Hover Tooltip */}
      <div className="slot-tooltip">
        <h5>{slot.vehicleType || (isReserved ? 'Reserved' : 'Empty Slot')}</h5>
        {isOccupied && <div className="st-plate">{slot.vehicleNumber}</div>}
        
        {isReserved && (
          <div className="st-row" style={{ color: '#D97706', fontWeight: 700, margin: '8px 0', fontSize: '10px' }}>
            Available to Park →
          </div>
        )}

        {isOccupied && (
          <>
            <div className="st-divider"></div>
            <div className="st-row"><span>Arrival:</span> <strong>{arrivalTime}</strong></div>
            <div className="st-row"><span>Parking:</span> <strong>{durationHr}hr</strong></div>
            <div className="st-row" style={{ marginTop: '6px' }}>
              <span>Accrued:</span> <strong style={{ color: '#10B981', fontSize: '11px' }}>₹{accrued}</strong>
            </div>
          </>
        )}

        {isFree && (
          <div className="st-row" style={{ color: '#16A34A', fontWeight: 700, margin: '8px 0', fontSize: '10px' }}>
            Available to Park →
          </div>
        )}
      </div>
    </div>
  );
}
