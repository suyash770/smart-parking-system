import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const TT = {
  contentStyle: {
    background: '#fff', border: '1px solid #CBD5E1',
    borderRadius: '10px', color: '#0F172A', fontSize: '0.75rem',
    boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
  },
};

function heatColor(count, max) {
  if (max === 0) return '#EFF6FF';
  const r = count / max;
  if (r > 0.75) return '#FCA5A5';
  if (r > 0.5)  return '#FDE68A';
  if (r > 0.25) return '#BFDBFE';
  return '#DBEAFE';
}

/* ── Mock analytics data ── */
const MOCK_ANALYTICS = {
  totalSlots: 20,
  totalParked: 6,
  revenueToday: 1240,
  avgDuration: 47,
  occupancy: [
    { hour: 0, count: 1 }, { hour: 1, count: 1 }, { hour: 2, count: 0 },
    { hour: 3, count: 0 }, { hour: 4, count: 0 }, { hour: 5, count: 1 },
    { hour: 6, count: 2 }, { hour: 7, count: 4 }, { hour: 8, count: 7 },
    { hour: 9, count: 10 }, { hour: 10, count: 12 }, { hour: 11, count: 14 },
    { hour: 12, count: 15 }, { hour: 13, count: 13 }, { hour: 14, count: 11 },
    { hour: 15, count: 9 }, { hour: 16, count: 11 }, { hour: 17, count: 14 },
    { hour: 18, count: 16 }, { hour: 19, count: 12 }, { hour: 20, count: 8 },
    { hour: 21, count: 5 }, { hour: 22, count: 3 }, { hour: 23, count: 2 },
  ],
  revenue: [
    { date: '2026-03-22', total: 850 },
    { date: '2026-03-23', total: 1120 },
    { date: '2026-03-24', total: 980 },
    { date: '2026-03-25', total: 1350 },
    { date: '2026-03-26', total: 1480 },
    { date: '2026-03-27', total: 1240 },
  ],
  heatmap: [
    { slot: 1, count: 12 }, { slot: 2, count: 5 }, { slot: 3, count: 3 },
    { slot: 4, count: 8 }, { slot: 5, count: 2 }, { slot: 6, count: 6 },
    { slot: 7, count: 18 }, { slot: 8, count: 15 }, { slot: 9, count: 14 },
    { slot: 10, count: 7 }, { slot: 11, count: 9 }, { slot: 12, count: 4 },
    { slot: 13, count: 3 }, { slot: 14, count: 6 }, { slot: 15, count: 16 },
    { slot: 16, count: 13 }, { slot: 17, count: 2 }, { slot: 18, count: 5 },
    { slot: 19, count: 1 }, { slot: 20, count: 4 },
  ],
  vehicleHistory: [
    { vehicleNumber: 'UP92J0044', vehicleType: 'Car', slotNumber: 8, entryTime: '2026-03-27T08:30:00Z', exitTime: '2026-03-27T10:15:00Z', durationMinutes: 105, fee: 63 },
    { vehicleNumber: 'UP84Y1122', vehicleType: 'Bike', slotNumber: 2, entryTime: '2026-03-27T09:00:00Z', exitTime: '2026-03-27T11:30:00Z', durationMinutes: 150, fee: 30 },
    { vehicleNumber: 'DL01AB5678', vehicleType: 'SUV', slotNumber: 10, entryTime: '2026-03-27T07:45:00Z', exitTime: '2026-03-27T09:00:00Z', durationMinutes: 75, fee: 45 },
    { vehicleNumber: 'UP93J9876', vehicleType: 'Truck', slotNumber: 17, entryTime: '2026-03-27T06:00:00Z', exitTime: '2026-03-27T08:00:00Z', durationMinutes: 120, fee: 120 },
    { vehicleNumber: 'MH12AB3456', vehicleType: 'Car', slotNumber: 9, entryTime: '2026-03-26T14:00:00Z', exitTime: '2026-03-26T16:30:00Z', durationMinutes: 150, fee: 90 },
    { vehicleNumber: 'UP82J4455', vehicleType: 'Bike', slotNumber: 3, entryTime: '2026-03-26T10:00:00Z', exitTime: '2026-03-26T12:00:00Z', durationMinutes: 120, fee: 24 },
  ],
  pricing: {
    multiplier: 1.2,
    rates: { A: 12, B: 36, C: 60 },
  },
};

export default function Dashboard({ api }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${api}/api/analytics`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setData(MOCK_ANALYTICS); setLoading(false); });
  }, [api]);

  if (loading) return <div className="dashboard"><div className="empty-state"><span className="icon">⏳</span><p>Loading analytics…</p></div></div>;
  if (!data) return <div className="dashboard"><div className="empty-state"><span className="icon">📊</span><p>No data available</p></div></div>;

  const occupancyData = Array.from({ length: 24 }, (_, h) => {
    const m = data.occupancy.find(o => o.hour === h);
    return { hour: `${String(h).padStart(2, '0')}:00`, count: m?.count || 0 };
  });
  const peakHour = occupancyData.reduce((max, o) => o.count > max.count ? o : max, { hour: '-', count: 0 });
  const revenueData = data.revenue.map(r => ({ date: r.date.slice(5), total: r.total }));
  const heatmapData = data.heatmap || [];
  const maxHeat = Math.max(1, ...heatmapData.map(h => h.count));
  const vehicleHistory = data.vehicleHistory || [];
  const p = data.pricing || {};

  return (
    <div className="dashboard">
      <h2>📊 Analytics Dashboard</h2>

      <div className="dash-cards">
        <div className="dash-card"><div className="label">Total Slots</div><div className="value blue">{data.totalSlots}</div></div>
        <div className="dash-card"><div className="label">Parked Now</div><div className="value amber">{data.totalParked}</div></div>
        <div className="dash-card"><div className="label">Available</div><div className="value green">{data.totalSlots - data.totalParked}</div></div>
        <div className="dash-card"><div className="label">Revenue Today</div><div className="value green">₹{data.revenueToday}</div></div>
        <div className="dash-card"><div className="label">Peak Hour</div><div className="value red">{peakHour.hour}</div></div>
        <div className="dash-card"><div className="label">Avg Duration</div><div className="value blue">{data.avgDuration} min</div></div>
        {p.rates && (
          <div className="dash-card">
            <div className="label">Dynamic Rates</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', lineHeight: 1.6 }}>
              🏍 ₹{p.rates.A} &nbsp; 🚗 ₹{p.rates.B} &nbsp; 🚛 ₹{p.rates.C}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#3B82F6', fontWeight: 700, marginTop: '0.15rem' }}>{p.multiplier}× surge</div>
          </div>
        )}
      </div>

      <div className="chart-row">
        <div className="chart-box">
          <h3>🕐 Hourly Occupancy</h3>
          {occupancyData.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={occupancyData}>
                <defs><linearGradient id="gO" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 9 }} interval={3}/>
                <YAxis tick={{ fill: '#94A3B8', fontSize: 9 }} allowDecimals={false}/>
                <Tooltip {...TT}/>
                <Area type="monotone" dataKey="count" name="Vehicles" stroke="#2563EB" strokeWidth={2} fill="url(#gO)" dot={{ fill: '#2563EB', r: 2 }} activeDot={{ r: 5, fill: '#3B82F6' }}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><span className="icon">📈</span><p>No data yet</p></div>}
        </div>

        <div className="chart-box">
          <h3>💰 Daily Revenue</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 9 }}/>
                <YAxis tick={{ fill: '#94A3B8', fontSize: 9 }}/>
                <Tooltip {...TT} formatter={v => [`₹${v}`, 'Revenue']}/>
                <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><span className="icon">💹</span><p>No revenue yet</p></div>}
        </div>
      </div>

      <div className="chart-row" style={{ marginTop: '0.75rem' }}>
        <div className="chart-box">
          <h3>🔥 Slot Popularity</h3>
          {heatmapData.length > 0 ? (
            <div className="heatmap-grid">
              {Array.from({ length: 20 }, (_, i) => {
                const num = i + 1; const m = heatmapData.find(h => h.slot === num); const c = m?.count || 0;
                return <div key={num} className="heatmap-cell" style={{ background: heatColor(c, maxHeat) }}>{num}<span className="cell-label">{c}×</span></div>;
              })}
            </div>
          ) : <div className="empty-state"><span className="icon">🔥</span><p>No data</p></div>}
        </div>
        <div className="chart-box">
          <h3>📈 Revenue Trend</h3>
          {revenueData.length > 1 ? (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 9 }}/>
                <YAxis tick={{ fill: '#94A3B8', fontSize: 9 }}/>
                <Tooltip {...TT} formatter={v => [`₹${v}`, 'Revenue']}/>
                <Line type="monotone" dataKey="total" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 3 }} activeDot={{ r: 6, fill: '#FBBF24' }}/>
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><span className="icon">📉</span><p>Need more data</p></div>}
        </div>
      </div>

      <div className="chart-box" style={{ marginTop: '0.75rem' }}>
        <h3>🚗 Vehicle History</h3>
        {vehicleHistory.length > 0 ? (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead><tr><th>Vehicle</th><th>Type</th><th>Slot</th><th>Entry</th><th>Exit</th><th>Duration</th><th>Fee</th></tr></thead>
              <tbody>
                {vehicleHistory.map((v, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{v.vehicleNumber}</td>
                    <td><span className={`type-badge ${v.vehicleType}`}>{v.vehicleType}</span></td>
                    <td>{v.slotNumber}</td>
                    <td>{new Date(v.entryTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</td>
                    <td>{new Date(v.exitTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</td>
                    <td style={{ fontWeight: 600 }}>{v.durationMinutes} min</td>
                    <td style={{ fontWeight: 700, color: '#2563EB' }}>₹{v.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><span className="icon">📋</span><p>No completed parkings yet</p></div>}
      </div>
    </div>
  );
}
