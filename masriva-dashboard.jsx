// masriva-dashboard.jsx — KPIs + recent bookings + upcoming departures.

function MsrvDashboard({ go }) {
  const monthly = window.bookingsThisMonth();
  const revenue = monthly.reduce((s, b) => s + b.total, 0);
  const activeAgencies = window.activeAgencyCount();
  const upcoming14 = window.upcomingInstances(14);
  const upcoming7  = window.upcomingInstances(7);

  const recent = [...window.BOOKINGS]
    .sort((a, b) => window.daysFromTodaySafe(b.submitted) - window.daysFromTodaySafe(a.submitted))
    .slice(0, 6);

  return (
    <>
      <window.Topbar
        crumbs={["Operations", "Dashboard"]}
        actions={<button className="btn btn-gold" onClick={() => go("instances")}><window.Icon name="plus" size={13}/>New trip instance</button>}
      />

      <div className="page">
        <window.PageHead
          eyebrow="Overview"
          title={<>Good morning, <em>Fatima</em>.</>}
          lede="A snapshot of bookings, revenue, and departures across all partner agencies — refreshed live as agencies submit and operators confirm."
          meta={
            <>
              <span>{window.AGENCIES.length} agencies · {activeAgencies} active</span>
              <span className="dot"/>
              <span>{window.INSTANCES.length} live instances</span>
              <span className="dot"/>
              <span>As of May 21, 2026</span>
            </>
          }
        />

        {/* KPI strip */}
        <div className="kpi-strip">
          <div className="kpi">
            <div className="kpi-lbl">Bookings · this month</div>
            <div className="kpi-val">{monthly.length}</div>
            <div className="kpi-trend">↑ 24% vs. last month</div>
          </div>
          <div className="kpi">
            <div className="kpi-lbl">Revenue · this month</div>
            <div className="kpi-val">{window.fmtCurCompact(revenue)}</div>
            <div className="kpi-trend">↑ 18% vs. last month</div>
          </div>
          <div className="kpi">
            <div className="kpi-lbl">Active agencies</div>
            <div className="kpi-val">{activeAgencies}<span className="unit">/ {window.AGENCIES.length}</span></div>
            <div className="kpi-trend flat">No change</div>
          </div>
          <div className="kpi">
            <div className="kpi-lbl">Upcoming departures · 14d</div>
            <div className="kpi-val">{upcoming14.length}</div>
            <div className="kpi-trend">{upcoming7.length} within 7 days</div>
          </div>
        </div>

        {/* Two-column */}
        <div style={{display:"grid", gridTemplateColumns:"1.55fr 1fr", gap:24, alignItems:"start"}}>
          {/* Recent bookings */}
          <section>
            <div className="sect-head">
              <h2>Recent <em>bookings</em></h2>
              <span className="tag">Latest submissions across all agencies</span>
              <div className="right">
                <button className="btn btn-sm btn-ghost" onClick={() => go("bookings")}>
                  View all <window.Icon name="arrowR" size={11}/>
                </button>
              </div>
            </div>

            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Reference · Agency</th>
                    <th>Trip · Departure</th>
                    <th className="num">Pax</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(b => {
                    const inst = window.instanceById(b.instanceId);
                    const tpl  = window.templateById(inst?.templateId);
                    const agc  = window.agencyById(b.agencyId);
                    return (
                      <tr key={b.ref} onClick={() => go("bookings", { ref: b.ref })}>
                        <td>
                          <div className="cell-primary">{b.ref}</div>
                          <div className="cell-secondary">{agc?.name}</div>
                        </td>
                        <td>
                          <div className="cell-primary">{tpl?.name || "—"}</div>
                          <div className="cell-secondary">{inst?.departure}</div>
                        </td>
                        <td className="num">{b.pax.adults + b.pax.children}</td>
                        <td><window.Pill status={b.status}/></td>
                        <td>
                          <div className="row-actions">
                            <button className="row-action" title="View" onClick={(e) => { e.stopPropagation(); go("bookings", { ref: b.ref }); }}>
                              <window.Icon name="eye" size={12}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Upcoming departures */}
          <section>
            <div className="sect-head">
              <h2>Upcoming <em>departures</em></h2>
              <span className="tag">Within 7 days</span>
              <div className="right">
                <button className="btn btn-sm btn-ghost" onClick={() => go("instances")}>
                  Manage <window.Icon name="arrowR" size={11}/>
                </button>
              </div>
            </div>

            <div className="block" style={{padding:14}}>
              {upcoming7.length === 0 && (
                <div className="empty">
                  <div className="empty-glyph"><window.Icon name="calendar" size={20}/></div>
                  No departures within 7 days.
                </div>
              )}
              <div className="flex-col" style={{gap:0}}>
                {upcoming7.map(inst => {
                  const tpl = window.templateById(inst.templateId);
                  const fill = (inst.booked / inst.capacity) * 100;
                  return (
                    <div key={inst.id} className="upcoming-row">
                      <div className="date-chip">
                        <div>{inst.departure.split(" ")[0]}</div>
                        <strong>{inst.departure.split(" ")[1].replace(",", "")}</strong>
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:13.5, letterSpacing:"-0.005em"}}>{tpl?.name}</div>
                        <div className="cell-secondary">{inst.direction} · in {inst._days || 0}d</div>
                        <div className="bar"><div className={"fill " + (inst.status === "soldout" ? "full" : inst.status === "filling" ? "warn" : "")} style={{width: `${fill}%`}}/></div>
                        <div style={{fontFamily:"var(--font-mono)", fontSize:10, color:"var(--ink-mute)", marginTop:4, letterSpacing:0.06+'em'}}>
                          {inst.booked} BOOKED · {inst.capacity - inst.booked} OPEN
                        </div>
                      </div>
                      <window.Pill status={inst.status === "open" ? "open" : inst.status === "filling" ? "filling" : inst.status === "soldout" ? "soldout" : "open"}>
                        {inst.status === "open" ? "Open" : inst.status === "filling" ? "Filling" : "Sold out"}
                      </window.Pill>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// Safe wrapper because daysFromToday lives on window via masriva-data; we
// need it here even though it isn't explicitly exported. Define a fallback.
window.daysFromTodaySafe = window.daysFromTodaySafe || function (s) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = { m: 4, d: 21 };
  if (!s) return 0;
  const [mo, dy] = s.split(/[ ,]+/);
  return (months.indexOf(mo) - today.m) * 30 + (parseInt(dy) - today.d);
};

window.MsrvDashboard = MsrvDashboard;
