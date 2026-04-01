import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <div className="landing-page-console">
      {/* ────── 3D NAVBAR ────── */}
      <nav className="nav-console">
        <div className="nav-brand-console">
          <div className="nav-logo-console">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="url(#logoGradConsole)" />
              <path d="M12 28 C12 18, 16 14, 20 14 C24 14, 28 18, 28 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M12 28 C12 22, 14 18, 20 18 C26 18, 28 14, 28 12" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <circle cx="20" cy="10" r="3" fill="#34D399"/>
              <circle cx="20" cy="30" r="3" fill="#34D399"/>
              <defs>
                <linearGradient id="logoGradConsole" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stopColor="#1E3A5F"/>
                  <stop offset="100%" stopColor="#0F172A"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="nav-text-console">SmartPark</span>
        </div>
        <div className="nav-actions-console">
          <button className="btn-text-console" onClick={() => navigate('/app')}>Enter App</button>
          <button className="btn-primary-console" onClick={() => navigate('/app')}>Request a Demo</button>
        </div>
      </nav>

      <div className="landing-content-console">
        {/* ────── HERO SECTION ────── */}
        <div className="hero-section-console">
          
          <div className="hero-left-console">
            <h1>
              Real-time lot occupancy,<br/>Future of Efficient<br/>Parking Management,<br/>
              <span className="highlight-console">Live and Automated.</span>
            </h1>
            <p>
              Real-time lot occupancy, dynamic pricing, and analytics.<br/>Experience smart parking, simplified.
            </p>
            
            <div className="hero-mini-cards">
              <div className="mini-card">
                <div className="mc-header">
                  <span>Revenue Funnel</span>
                  <span className="mc-dots">...</span>
                </div>
                <div className="mc-chart">
                  <div className="funnel">
                    <div className="funnel-layer l1">35% <span>Reservation</span></div>
                    <div className="funnel-layer l2">25% <span>Completion</span></div>
                    <div className="funnel-layer l3">10% <span>Completion</span></div>
                  </div>
                </div>
              </div>
              <div className="mini-card">
                <div className="mc-header">
                  <span>Churn Risk Score</span>
                  <span className="mc-dots">...</span>
                </div>
                <div className="mc-desc">Predicting potential customer loss.</div>
                <div className="mc-chart">
                  <div className="line-area">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                      <path d="M0,5 Q20,10 40,25 T100,35 L100,40 L0,40 Z" fill="rgba(244,63,94,0.15)"/>
                      <path d="M0,5 Q20,10 40,25 T100,35" fill="none" stroke="#f43f5e" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="mc-x-axis"><span>0k</span><span>4k</span><span>8k</span><span>12k</span></div>
                </div>
              </div>
              <div className="mini-card">
                <div className="mc-header">
                  <span>Surge Multiplier Trend</span>
                  <span className="mc-dots">...</span>
                </div>
                <div className="mc-chart">
                  <div className="line-multi">
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                      <polyline points="0,30 5,25 10,28 15,10 20,25 25,20 30,35 35,5 40,20 45,15 50,30 55,20 60,25 65,10 70,20 75,5 80,30 85,15 90,25 95,10 100,20" fill="none" stroke="#2563eb" strokeWidth="1.5"/>
                      <polyline points="0,35 10,32 20,38 30,30 40,35 50,28 60,35 70,30 80,38 90,32 100,35" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                    </svg>
                  </div>
                  <div className="mc-x-axis"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-right-console">
            {/* ────── COMMAND CONSOLE FRAME ────── */}
            <div className="console-wrapper">
              <div className="console-screw cs-tl"></div>
              <div className="console-screw cs-tr"></div>

              {/* Recessed Screen */}
              <div className="console-screen-bezel">
                <div className="console-inner-screen">
                  <div className="cs-top-bar">SmartPark Platform View</div>
                  
                  <div className="cs-content">
                    {/* Left Stats Block */}
                    <div className="cs-left-stats">
                      <div className="cs-stat-glass">
                        <div><span className="green-txt">$1.2K</span> / Floor 1</div>
                        <div className="sub-txt">$1,239 / Floor 1 <span className="green-txt">(+2.3%)</span></div>
                      </div>
                      <div className="cs-stat-glass">
                        <div><span className="green-txt">$1.2K</span> / Floor 2</div>
                        <div className="sub-txt">$1,233 / Floor 2 <span className="green-txt">(+3.2%)</span></div>
                      </div>
                      <div className="cs-stat-glass yell">
                        <div><span className="yell-txt">$1.2K</span> / Floor 3</div>
                        <div className="sub-txt">$1,248 / Floor 3 <span className="green-txt">(+5.3%)</span></div>
                      </div>
                      
                      <div className="cs-map-card-glass">
                        <div className="mc-title-glass">License plate</div>
                        <div className="mc-subtitle-glass">parked for fee</div>
                        <div className="mc-map-img-glass">
                           <svg viewBox="0 0 100 50">
                             <polyline points="10,40 40,25 70,35 90,15" fill="none" stroke="#3b82f6" strokeWidth="2"/>
                             <circle cx="10" cy="40" r="3" fill="#10b981"/>
                             <circle cx="90" cy="15" r="3" fill="#ef4444"/>
                           </svg>
                        </div>
                      </div>
                    </div>

                    {/* Center 3D Building Area */}
                    <div className="cs-center-building">
                       <img src="/assets/parking-hero.png" alt="3D Parking Building" />
                       
                       <div className="conn-line" style={{top: '32%', left: '0', width: '220px'}} />
                       <div className="conn-line" style={{top: '55%', left: '0', width: '150px'}} />
                       
                       <div className="float-tag tr"><span className="green-bg">$1.2K</span> / Floor 1</div>
                       <div className="float-tag mr"><span className="green-bg">$1.2K</span> / Floor 2</div>
                       <div className="float-tag br"><span className="yell-bg">$1.2K</span> / Floor 3</div>
                       
                       <div className="f-card-glass">
                          <div className="fc-title">License<br/>plate</div>
                          <div className="fc-row">parked<br/>for <strong>3h</strong></div>
                          <div className="fc-row">fee <strong>$45</strong></div>
                       </div>
                    </div>

                    {/* Right Matrix Area */}
                    <div className="cs-right-matrix">
                       <div className="mat-header">Lot Performance Matrix</div>
                       <div className="mat-row">
                         <span>ARR</span>
                         <span className="mat-val">$7,390.48 <span className="arw green">↗</span></span>
                       </div>
                       <div className="mat-row">
                         <span className="sub-txt">ARR - $77,750</span>
                         <div className="mat-chart">
                           <svg viewBox="0 0 50 15"><polyline points="0,10 10,12 20,5 30,8 40,2 50,5" fill="none" stroke="#ef4444" strokeWidth="1.5"/></svg>
                           <span className="arw red">↘</span>
                         </div>
                       </div>
                       <div className="mat-row">
                         <span>Average Parking<br/>Time</span>
                         <div className="mat-chart">
                           <svg viewBox="0 0 50 15"><polyline points="0,8 10,2 20,10 30,5 40,12 50,8" fill="none" stroke="#10b981" strokeWidth="1.5"/></svg>
                           <span className="arw green">↗</span>
                         </div>
                       </div>
                       <div className="mat-row">
                         <span>Spot Turnover Rate</span>
                         <div className="mat-chart">
                           <svg viewBox="0 0 50 15"><polyline points="0,5 10,12 20,8 30,14 40,5 50,2" fill="none" stroke="#f59e0b" strokeWidth="1.5"/></svg>
                           <span className="arw yell">→</span>
                         </div>
                       </div>

                       <div className="mat-bar-chart">
                          <div className="bar-header">Occupancy <span className="sub-txt">Last 24 hours</span></div>
                          <div className="bar-legend">
                            <span><span className="dot blue"></span> Free</span>
                            <span><span className="dot teal"></span> Reserved</span>
                            <span><span className="dot red"></span> Occupied</span>
                          </div>
                          <div className="bars-container">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                              <div key={i} className="bar-col">
                                <div className="bar occ" style={{height:`${Math.random()*30+10}%`}}></div>
                                <div className="bar res" style={{height:`${Math.random()*15+5}%`}}></div>
                                <div className="bar free" style={{height:`${Math.random()*40+10}%`}}></div>
                              </div>
                            ))}
                          </div>
                          <div className="bar-labels"><span>8am</span><span>10am</span><span>12pm</span><span>14pm</span><span>16pm</span></div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ────── HARDWARE BEZEL (JOYSTICK) ────── */}
              <div className="control-chassis">
                 <div className="chassis-left">
                    <button className="hw-btn blue"></button>
                    <button className="hw-btn"></button>
                    <button className="hw-btn"></button>
                    <div style={{width:'30px', height:'8px', background:'#0a0d11', borderRadius:'4px', marginLeft:'4px', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.8)'}}></div>
                 </div>

                 {/* Giant Ass Joystick */}
                 <div className="joystick-base">
                    <div className="joystick-ball-joint">
                       <div className="joystick-stick">
                          <div className="joystick-knob"></div>
                       </div>
                    </div>
                    <div className="joystick-dial"></div>
                 </div>

                 <div className="chassis-right">
                    <div className="speaker-vent"></div>
                    <div className="speaker-vent"></div>
                    <button className="hw-btn" style={{width:'40px', borderRadius:'10px'}}></button>
                 </div>
              </div>

            </div>
          </div>
        </div>

        {/* ────── BOTTOM METALLIC PANELS ────── */}
        <div className="bottom-panels">
          <div className="inset-panel">
            <div className="ip-icon" style={{color: '#34d399'}}>$</div>
            <h3>Dynamic Pricing</h3>
            <p>Dynamic pricing and reservation to keep pricing up over time.</p>
          </div>
          <div className="inset-panel">
            <div className="ip-icon" style={{color: '#3b82f6'}}>📈</div>
            <h3>Predictive Analytics</h3>
            <p>Predicts potential customer for custom down with alert.</p>
          </div>
          <div className="inset-panel">
            <div className="ip-icon" style={{color: '#f43f5e'}}>🧊</div>
            <h3>Multi-Lot Management</h3>
            <p>Multi-Lot management with easy integration into any ecosystem.</p>
          </div>
          <div className="inset-panel" style={{flex: 1.5, position: 'relative', overflow: 'hidden'}}>
            <div className="ip-cta">
               <div>
                  <h3 style={{color: '#e2e8f0', fontSize: '18px', marginBottom: '8px'}}>Get started with a free trial</h3>
                  <p style={{marginBottom: '16px'}}>No credit card required. Setup in under 5 minutes.</p>
               </div>
               <button className="btn-primary-console">Free Trial</button>
            </div>
            
            <div style={{position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '80px', opacity: 0.05}}>✨</div>
          </div>
        </div>

      </div>
    </div>
  );
}
