// screens-dashboard.jsx
const { useState: useStateD } = React;

// Logged-in partner session — hardcoded for prototype.
const MY_AGENCY = "agc-001";
// Resolve display fields from a booking, falling back to instanceId → template.
function bookingDisplay(b) {
  const inst = b.instanceId ? window.instanceById?.(b.instanceId) : null;
  const tpl = inst ? window.templateById?.(inst.templateId) : null;
  return {
    tripName: b.trip || tpl?.name || "—",
    tripCode: b.tripCode || tpl?.code || "",
    departure: b.departure || inst?.departure || "—",
  };
}
function DashboardScreen({ go, openBooking }) {
  // "My bookings" — only this agency's records.
  const myBookings = (window.BOOKINGS || []).filter(b => b.agencyId === MY_AGENCY);
  const upcoming = myBookings.filter(b => ["confirmed","verified","submitted","pending","docs"].includes(b.status)).slice(0, 6);
  const totalPax = myBookings.reduce((s, b) => s + b.pax.adults + b.pax.children, 0);
  const totalRev = myBookings.reduce((s, b) => s + b.total, 0);
  const monthSpark = [11, 14, 9, 17, 21, 18, 24, 22, 28, 31, 29, 34];
  const paxSpark = [80, 95, 110, 130, 140, 160, 170, 190, 210, 230, 245, 270];

  return (
    <>
      <window.Topbar
        crumbs={["Workspace", "Dashboard"]}
        actions={<button className="btn btn-primary" onClick={() => go("trips")}>New booking <window.Icon name="arrowRight" size={14}/></button>}
      />

      <div className="page">
        <window.PageHeader
          eyebrow="Agency overview"
          title="Welcome back, Yacine."
          num="01"
          lede="Six bookings need your attention this week. Five departures within the next 14 days."
        />

        <div className="stat-strip" style={{marginBottom: 40}}>
          <div className="stat">
            <div className="stat-label">Active bookings</div>
            <div className="stat-value">34<span className="unit">groups</span></div>
            <div className="stat-trend">↗ +6 vs last month</div>
            <window.Sparkline data={monthSpark} />
          </div>
          <div className="stat">
            <div className="stat-label">Passengers, this season</div>
            <div className="stat-value">{window.fmt(totalPax * 9)}<span className="unit">pax</span></div>
            <div className="stat-trend">↗ +18% YoY</div>
            <window.Sparkline data={paxSpark} />
          </div>
          <div className="stat">
            <div className="stat-label">Volume booked</div>
            <div className="stat-value">{(totalRev/1e6).toFixed(1)}<span className="unit">M DZD</span></div>
            <div className="stat-trend">↗ +DZD 3.35M last 30d</div>
            <window.Sparkline data={[20,28,24,32,30,38,42,45,50,58,62,68]} />
          </div>
          <div className="stat">
            <div className="stat-label">Avg. group size</div>
            <div className="stat-value">14.2<span className="unit">pax</span></div>
            <div className="stat-trend">↘ −0.8 vs Q1</div>
            <window.Sparkline data={[16,15,14,16,15,14,15,14,13,14,14,14]} />
          </div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 360px", gap:24, alignItems:"start"}}>
          {/* Bookings table */}
          <div className="table-wrap">
            <div className="table-head">
              <h3>Your bookings</h3>
              <span className="count">{myBookings.length} total</span>
              <div className="tabs">
                <button className="tab active">All</button>
                <button className="tab">Open</button>
                <button className="tab">Past</button>
              </div>
              <div className="right">
                <button className="btn btn-sm btn-ghost"><window.Icon name="filter" size={12}/>Filter</button>
                <button className="btn btn-sm btn-ghost"><window.Icon name="download" size={12}/>Export</button>
              </div>
            </div>

            <table className="tbl">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Trip</th>
                  <th>Departure</th>
                  <th>Pax</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map(b => {
                  const d = bookingDisplay(b);
                  return (
                  <tr key={b.ref} onClick={() => openBooking(b)}>
                    <td>
                      <div className="ref">{b.ref}</div>
                      <div className="secondary">{b.submitted}, {b.lead}</div>
                    </td>
                    <td>
                      <div>{d.tripName}</div>
                      <div className="secondary" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:0.04+'em'}}>{d.tripCode}</div>
                    </td>
                    <td>{d.departure}</td>
                    <td className="num">{b.pax.adults}<span style={{color:"var(--ink-faint)"}}> + {b.pax.children}c</span></td>
                    <td><window.Pill status={b.status}/></td>
                    <td className="num"><span style={{color:"var(--ink-mute)", fontSize:10, marginRight:4}}>{window.CUR}</span>{window.fmt(b.total)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Side column */}
          <div style={{display:"flex", flexDirection:"column", gap:20}}>
            <div className="block" style={{padding:"22px 24px"}}>
              <div className="eyebrow" style={{marginBottom:14}}>Featured · Spring season</div>
              <div style={{marginBottom:14, height:140, borderRadius:8, overflow:"hidden", background:"var(--sand)", position:"relative"}}>
                <img src="https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=600&q=80"
                     style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}} alt=""/>
              </div>
              <h4 style={{margin:"0 0 6px", fontSize:17, fontWeight:500, letterSpacing:"-0.015em"}}>Cairo &amp; Sharm el-Sheikh</h4>
              <p style={{margin:"0 0 16px", color:"var(--ink-mute)", fontSize:13}}>
                Nine nights across two cities — your highest-converting package this quarter.
              </p>
              <button className="btn btn-ghost" style={{width:"100%", justifyContent:"center"}} onClick={() => go("trips")}>
                Browse all trips <window.Icon name="arrowRight" size={14}/>
              </button>
            </div>

            <div className="block" style={{padding:"22px 24px"}}>
              <div className="eyebrow" style={{marginBottom:14}}>Reminders</div>
              <ul style={{margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:14}}>
                <li style={{display:"flex", gap:10, fontSize:13, lineHeight:1.5}}>
                  <span style={{color:"var(--warn)", marginTop:2}}>●</span>
                  <span>3 passports expiring within 6 months on booking <strong style={{fontFamily:"var(--font-mono)"}}>EGP-9D4X-115</strong>.</span>
                </li>
                <li style={{display:"flex", gap:10, fontSize:13, lineHeight:1.5}}>
                  <span style={{color:"var(--gold)", marginTop:2}}>●</span>
                  <span>Voucher available for <strong style={{fontFamily:"var(--font-mono)"}}>EGP-7M3V-209</strong>.</span>
                </li>
                <li style={{display:"flex", gap:10, fontSize:13, lineHeight:1.5}}>
                  <span style={{color:"var(--ok)", marginTop:2}}>●</span>
                  <span>Sharm 7N has 22 new dates added for July–September.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.DashboardScreen = DashboardScreen;
