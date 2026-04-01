import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ParkingGrid from './components/ParkingGrid';
import ParkModal from './components/ParkModal';
import UnparkModal from './components/UnparkModal';
import AutoParkModal from './components/AutoParkModal';
import AutoUnparkModal from './components/AutoUnparkModal';
import SearchBar from './components/SearchBar';
import LocateVehicle from './components/LocateVehicle';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import Toast from './components/Toast';

const API = import.meta.env.VITE_API_URL || '';

/* ── Mock fallback data ── */
const MOCK_SLOTS_F1 = [
  { slotNumber: 1,  floor: 1, zone: 'A', status: 'Occupied', vehicleNumber: 'UP92J7754', vehicleType: 'Scooter', entryTime: new Date(Date.now() - 36000000).toISOString() },
  { slotNumber: 2,  floor: 1, zone: 'A', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 3,  floor: 1, zone: 'A', status: 'Reserved', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 4,  floor: 1, zone: 'A', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 5,  floor: 1, zone: 'A', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 6,  floor: 1, zone: 'A', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 7,  floor: 1, zone: 'B', status: 'Occupied', vehicleNumber: 'UP92J0291', vehicleType: 'Car', entryTime: new Date(Date.now() - 7200000).toISOString() },
  { slotNumber: 8,  floor: 1, zone: 'B', status: 'Occupied', vehicleNumber: 'UP82JC28A', vehicleType: 'SUV', entryTime: new Date(Date.now() - 5400000).toISOString() },
  { slotNumber: 9,  floor: 1, zone: 'B', status: 'Occupied', vehicleNumber: 'UP92JD03A', vehicleType: 'Car', entryTime: new Date(Date.now() - 1800000).toISOString() },
  { slotNumber: 10, floor: 1, zone: 'B', status: 'Reserved', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 11, floor: 1, zone: 'B', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 12, floor: 1, zone: 'B', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 13, floor: 1, zone: 'B', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 14, floor: 1, zone: 'B', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 15, floor: 1, zone: 'C', status: 'Occupied', vehicleNumber: 'UP84XB0028', vehicleType: 'Truck', entryTime: new Date(Date.now() - 5400000).toISOString() },
  { slotNumber: 16, floor: 1, zone: 'C', status: 'Occupied', vehicleNumber: 'UP82J7765', vehicleType: 'Truck', entryTime: new Date(Date.now() - 1800000).toISOString() },
  { slotNumber: 17, floor: 1, zone: 'C', status: 'Reserved', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 18, floor: 1, zone: 'C', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 19, floor: 1, zone: 'C', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 20, floor: 1, zone: 'C', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
];

const MOCK_SLOTS_F2 = [
  { slotNumber: 1,  floor: 2, zone: 'A', status: 'Occupied', vehicleNumber: 'DL3C9988', vehicleType: 'Scooter', entryTime: new Date(Date.now() - 1200000).toISOString() },
  { slotNumber: 2,  floor: 2, zone: 'A', status: 'Occupied', vehicleNumber: 'HR26D1122', vehicleType: 'Bike', entryTime: new Date(Date.now() - 3600000).toISOString() },
  { slotNumber: 3,  floor: 2, zone: 'A', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 4,  floor: 2, zone: 'A', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 5,  floor: 2, zone: 'A', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 6,  floor: 2, zone: 'A', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 7,  floor: 2, zone: 'B', status: 'Occupied', vehicleNumber: 'MH02B3344', vehicleType: 'Car', entryTime: new Date(Date.now() - 7200000).toISOString() },
  { slotNumber: 8,  floor: 2, zone: 'B', status: 'Occupied', vehicleNumber: 'TN01C5566', vehicleType: 'SUV', entryTime: new Date(Date.now() - 5400000).toISOString() },
  { slotNumber: 9,  floor: 2, zone: 'B', status: 'Occupied', vehicleNumber: 'KA03A7788', vehicleType: 'Car', entryTime: new Date(Date.now() - 1800000).toISOString() },
  { slotNumber: 10, floor: 2, zone: 'B', status: 'Occupied', vehicleNumber: 'RJ14C9900', vehicleType: 'Car', entryTime: new Date(Date.now() - 3600000).toISOString() },
  { slotNumber: 11, floor: 2, zone: 'B', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 12, floor: 2, zone: 'B', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 13, floor: 2, zone: 'B', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 14, floor: 2, zone: 'B', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 15, floor: 2, zone: 'C', status: 'Occupied', vehicleNumber: 'UP16A1122', vehicleType: 'Truck', entryTime: new Date(Date.now() - 5400000).toISOString() },
  { slotNumber: 16, floor: 2, zone: 'C', status: 'Occupied', vehicleNumber: 'UP14B3344', vehicleType: 'Truck', entryTime: new Date(Date.now() - 1800000).toISOString() },
  { slotNumber: 17, floor: 2, zone: 'C', status: 'Occupied', vehicleNumber: 'UP80C5566', vehicleType: 'Truck', entryTime: new Date(Date.now() - 3600000).toISOString() },
  { slotNumber: 18, floor: 2, zone: 'C', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 19, floor: 2, zone: 'C', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
  { slotNumber: 20, floor: 2, zone: 'C', status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null },
];

const MOCK_PRICING = {
  multiplier: 1.2,
  rates: { A: 12, B: 36, C: 60 },
};

export default function App() {
  const navigate = useNavigate();

  // Auth state from localStorage
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('sp_user')); } catch { return null; }
  })();

  const [tab, setTab]               = useState('parking');
  const [floor, setFloor]           = useState(1);
  const [slotsF1, setSlotsF1]       = useState(MOCK_SLOTS_F1);
  const [slotsF2, setSlotsF2]       = useState(MOCK_SLOTS_F2);
  const [slots, setSlots]           = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showPark, setShowPark]     = useState(false);
  const [showUnpark, setShowUnpark] = useState(false);
  const [showAutoPark, setShowAutoPark] = useState(false);
  const [showAutoUnpark, setShowAutoUnpark] = useState(false);
  const [highlightSlot, setHighlightSlot] = useState(null);
  const [toasts, setToasts]         = useState([]);
  const [pricing, setPricing]       = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentTime, setCurrentTime] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const socketRef = useRef(null);

  const role = storedUser?.role || 'admin';
  const userName = storedUser?.name || 'Admin';

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    navigate('/');
  };

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    const socket = io(API || window.location.origin, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('slotsUpdated', setSlots);
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetch(`${API}/api/slots`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setSlots)
      .catch(() => setSlots(null));
    fetch(`${API}/api/pricing`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setPricing)
      .catch(() => setPricing(MOCK_PRICING));
  }, []);

  let currentSlots = [...((slots && slots.length > 0)
    ? slots.filter(s => (s.floor || 1) === floor)
    : (floor === 1 ? slotsF1 : slotsF2))];

  // Dynamically pad the floor with "Free" slots if the DB doesn't have 20 slots for this floor yet
  if (currentSlots.length < 20) {
    const existingNums = new Set(currentSlots.map(s => s.slotNumber));
    for (let i = 1; i <= 20; i++) {
      if (!existingNums.has(i)) {
        currentSlots.push({
          slotNumber: i,
          floor,
          zone: i <= 6 ? 'A' : i <= 14 ? 'B' : 'C',
          status: 'Free',
          vehicleNumber: null,
          vehicleType: null,
          entryTime: null
        });
      }
    }
  }

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    if (slot.status === 'Free' || slot.status === 'Reserved') setShowPark(true);
    else setShowUnpark(true);
  };

  const updateLocalSlot = (floorNum, slotNum, newProps) => {
    const updater = prev => prev.map(s => s.slotNumber === slotNum ? { ...s, ...newProps } : s);
    if (floorNum === 1) setSlotsF1(updater);
    else setSlotsF2(updater);
  };

  const handlePark = async (vehicleNumber, vehicleType, zone) => {
    try {
      const res = await fetch(`${API}/api/park`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNumber, vehicleType, zone }),
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      addToast(`Parked at Zone ${data.zone}, Slot ${data.slotNumber}`, 'success');
      setShowPark(false);
      setShowAutoPark(false);
      return data;
    } catch (err) { 
      if (selectedSlot) {
        updateLocalSlot(floor, selectedSlot.slotNumber, { 
          status: 'Occupied', vehicleNumber, vehicleType, entryTime: new Date().toISOString() 
        });
        addToast(`Parked locally at Slot ${selectedSlot.slotNumber}`, 'success');
      }
      setShowPark(false);
      setShowAutoPark(false);
    }
  };

  const handleUnpark = async (vehicleNumber) => {
    try {
      const res = await fetch(`${API}/api/unpark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNumber }),
      });
      if (!res.ok) throw new Error('API Error');
      
      const text = await res.text();
      let data = {};
      if (text) data = JSON.parse(text);

      addToast(`${data.fee || '₹50'} — ${data.duration || 'Online'}`, 'success');
      setShowAutoUnpark(false);
      setShowUnpark(false);
      return data;
    } catch (err) { 
      if (selectedSlot && selectedSlot.vehicleNumber === vehicleNumber) {
        updateLocalSlot(floor, selectedSlot.slotNumber, { 
          status: 'Free', vehicleNumber: null, vehicleType: null, entryTime: null 
        });
      }
      addToast(`Unparked locally successfully`, 'success');
      setShowAutoUnpark(false);
      setShowUnpark(false);
    }
  };

  const handleSearch = async (plate) => {
    if (!plate.trim()) { setHighlightSlot(null); return; }
    try {
      const res = await fetch(`${API}/api/search/${encodeURIComponent(plate)}`);
      if (res.ok) {
        const data = await res.json();
        setHighlightSlot(data.slotNumber);
        return;
      }
    } catch {}
    
    const f1Match = slotsF1.find(s => s.vehicleNumber && s.vehicleNumber.includes(plate.toUpperCase()));
    if (f1Match) { setFloor(1); setHighlightSlot(f1Match.slotNumber); return; }
    
    const f2Match = slotsF2.find(s => s.vehicleNumber && s.vehicleNumber.includes(plate.toUpperCase()));
    if (f2Match) { setFloor(2); setHighlightSlot(f2Match.slotNumber); return; }

    setHighlightSlot(null);
  };

  const getFilteredSlots = () => {
    return currentSlots.map(slot => {
      let dimmed = false;
      if (filterStatus === 'available' && slot.status === 'Occupied') dimmed = true;
      if (filterStatus === 'occupied' && slot.status !== 'Occupied') dimmed = true;
      if (filterType !== 'all') {
        if (filterType === 'bike' && slot.zone !== 'A') dimmed = true;
        if (filterType === 'car' && slot.zone !== 'B') dimmed = true;
        if (filterType === 'truck' && slot.zone !== 'C') dimmed = true;
      }
      return { ...slot, _dimmed: dimmed };
    });
  };

  const totalSlotsF1 = slotsF1.length;
  const occCountF1 = slotsF1.filter(s => s.status === 'Occupied').length;
  const totalSlotsF2 = slotsF2.length;
  const occCountF2 = slotsF2.filter(s => s.status === 'Occupied').length;
  const totalSlots = totalSlotsF1 + totalSlotsF2;
  const occCount = occCountF1 + occCountF2;
  const freeCount = totalSlots - occCount;
  const occPct = totalSlots > 0 ? Math.round((occCount / totalSlots) * 100) : 0;
  const busyColor = occPct > 80 ? '#EF4444' : occPct > 50 ? '#F59E0B' : '#22C55E';

  const canSeeAnalytics = role === 'service_provider' || role === 'admin';

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          {/* ── NEW LOGO: Road-curve SmartPark icon ── */}
          <div className="logo" style={{ background: 'transparent', boxShadow: 'none' }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="url(#appLogoGrad)" />
              <path d="M12 28 C12 18, 16 14, 20 14 C24 14, 28 18, 28 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M12 28 C12 22, 14 18, 20 18 C26 18, 28 14, 28 12" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <circle cx="20" cy="10" r="3" fill="#60A5FA"/>
              <circle cx="20" cy="30" r="3" fill="#34D399"/>
              <defs>
                <linearGradient id="appLogoGrad" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stopColor="#1E3A5F"/>
                  <stop offset="100%" stopColor="#0F172A"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1><span className="brand-a">Smart</span><span className="brand-b">Park</span></h1>
        </div>
        <div className="nav-right">
          <div className="nav-tabs">
            <button className={`nav-tab ${tab === 'parking' ? 'active' : ''}`} onClick={() => setTab('parking')}>🅿️ Parking</button>
            <button className={`nav-tab ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}>🗺 Map</button>
            <button className={`nav-tab ${tab === 'locate' ? 'active' : ''}`} onClick={() => setTab('locate')}>📍 Locate</button>
            {canSeeAnalytics && (
              <button className={`nav-tab ${tab === 'dash' ? 'active' : ''}`} onClick={() => setTab('dash')}>📊 Analytics</button>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <div className="user-avatar" title={`${userName} (${role})`} onClick={() => setShowUserMenu(!showUserMenu)}>
              {userName.charAt(0).toUpperCase()}
            </div>
            {showUserMenu && (
              <div className="role-menu">
                <div style={{ padding: '10px 12px', fontSize: '11px', color: '#94A3B8', borderBottom: '1px solid #F1F5F9', cursor: 'default' }}>
                  Signed in as <strong style={{ color: '#0F172A' }}>{userName}</strong>
                  <div style={{ fontSize: '10px', color: '#3B82F6', marginTop: '2px' }}>{role === 'service_provider' ? '🔧 Service Provider' : role === 'admin' ? '👑 Admin' : '👤 User'}</div>
                </div>
                <div onClick={handleLogout} style={{ color: '#EF4444' }}>🚪 Logout</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {tab === 'parking' && (
        <div className="status-bar">
          <div className="status-pills">
            <span className="pill free">🟢 {freeCount} Free</span>
            <span className="pill occupied">🔴 {occCount} Occupied</span>
            <div className="pill pricing hover-chart-trigger">
              ⚡ {pricing?.multiplier || 1.2}× Surge
              <div className="hover-chart-popup">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px' }}>
                  <div style={{ width: '12px', background: '#3B82F6', height: '100%' }}></div>
                  <div style={{ width: '12px', background: '#3B82F6', height: '70%' }}></div>
                  <div style={{ width: '12px', background: '#3B82F6', height: '40%' }}></div>
                  <div style={{ width: '12px', background: '#3B82F6', height: '30%' }}></div>
                </div>
                <div style={{ display: 'flex', gap: '4px', fontSize: '9px', color: '#94A3B8', marginTop: '4px' }}>
                  <span>Sct</span><span>Car</span><span>SUV</span><span>Trk</span>
                </div>
              </div>
            </div>
            <div className="busy-meter" style={{ marginLeft: '12px' }}>
              <span className="pill cap">⚡ {occPct}% Cap.</span>
              <div className="busy-meter-bar">
                <div className="busy-meter-fill" style={{ width: `${occPct}%`, background: busyColor }} />
              </div>
              <span className="busy-meter-text" style={{ color: busyColor, minWidth: 'auto' }}>{occPct}%</span>
            </div>
          </div>
          <div className="status-right" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="pill" style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}>
              <span style={{ color: '#475569' }}>💸 Current Revenue:</span> <strong style={{ color: '#0F172A', marginLeft: '4px' }}>₹72,400</strong>
            </div>
            <div className="pill" style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}>
              <span style={{ color: '#475569' }}>🕐 Time</span>
            </div>
            <div className="pill warning-pill" style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
              ⛅ Weather: 10°C, Clear
            </div>
          </div>
        </div>
      )}

      {tab === 'parking' && (
        <div className="grid-container">
          <div className="grid-header">
            <div className="grid-header-left">
              <h2>Pick Parking Spot!</h2>
              <div className="floor-tabs">
                <button className={`floor-tab ${floor === 1 ? 'active' : ''}`} onClick={() => setFloor(1)}>1st Floor</button>
                <button className={`floor-tab ${floor === 2 ? 'active' : ''}`} onClick={() => setFloor(2)}>2nd Floor</button>
                <button className={`floor-tab ${floor === 3 ? 'active' : ''}`} onClick={() => setFloor(3)}>3rd Floor</button>
              </div>
            </div>
            <div className="grid-header-right">
              <SearchBar onSearch={handleSearch} />
              <div className="filter-controls">
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                </select>
                <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="bike">🏍️ Scooter</option>
                  <option value="car">🚗 Cars</option>
                  <option value="truck">🚛 Trucks</option>
                </select>
              </div>
              <div className="current-time">🕐 {currentTime}</div>
            </div>
          </div>
          {floor === 1 || floor === 2 ? (
            <ParkingGrid
              slots={getFilteredSlots()} highlightSlot={highlightSlot}
              onSlotClick={handleSlotClick} pricing={pricing}
              onEntranceClick={() => setShowAutoPark(true)}
              onExitClick={() => setShowAutoUnpark(true)}
            />
          ) : (
            <div className="empty-state" style={{ minHeight: '260px' }}>
              <span className="icon">🚧</span>
              <p>3rd Floor — Coming Soon</p>
            </div>
          )}
        </div>
      )}

      {tab === 'map' && <MapView slots={currentSlots} pricing={pricing} />}
      {tab === 'locate' && <LocateVehicle api={API} slots={[...slotsF1, ...slotsF2]} />}
      {tab === 'dash' && canSeeAnalytics && <Dashboard api={API} />}

      {showPark && selectedSlot && <ParkModal slot={selectedSlot} onPark={handlePark} onClose={() => setShowPark(false)} pricing={pricing} />}
      {showUnpark && selectedSlot && <UnparkModal slot={selectedSlot} onUnpark={handleUnpark} onClose={() => setShowUnpark(false)} />}
      {showAutoPark && <AutoParkModal onPark={handlePark} onClose={() => setShowAutoPark(false)} pricing={pricing} />}
      {showAutoUnpark && <AutoUnparkModal onUnpark={handleUnpark} onClose={() => setShowAutoUnpark(false)} />}

      <Toast toasts={toasts} />
    </>
  );
}
