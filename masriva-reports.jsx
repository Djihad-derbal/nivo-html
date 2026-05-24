// masriva-reports.jsx — Operator-side analytics overview.
// Reads existing data on window: BOOKINGS, INSTANCES, TEMPLATES, AGENCIES.
// All numbers are derived live — no separate data store.

const { useMemo: useMemoR } = React;

function MsrvReports({ go }) {
  const data = useMemoR(() => computeReports(), []);

  return (
    <>
      <window.Topbar
        crumbs={["Insights", "Reports"]}
        actions={
          <button className="btn btn-ghost btn-sm">
            <window.Icon name="download" size={12}/>Export
          </button>
        }
      />

      <div className="page">
        <window.PageHead
          eyebrow="Insights · live snapshot"
          title={<>Operator <em>reports</em></>}
          lede="Revenue, fill rate, top trips, and your top agencies — derived from live bookings and the published instance inventory. Filters and date ranges land next."
          meta={
            <>
              <span>{data.totalBookings} bookings tracked</span>
              <span className="dot"/>
              <span>{window.fmtCurCompact ? window.fmtCurCompact(data.totalRevenue) : data.totalRevenue} lifetime revenue</span>
              <span className="dot"/>
              <span>{data.activeInstances} live departures</span>
            </>
          }
        />

        {/* KPI strip */}
        <div className="kpi-row" style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14, marginBottom:24}}>
          <Kpi
            label="Revenue · this month"
            value={window.fmtCurCompact ? window.fmtCurCompact(data.revenueThisMonth) : data.revenueThisMonth}
            sub={`${data.bookingsThisMonth} bookings · avg ${window.fmtCurCompact ? window.fmtCurCompact(data.avgBookingValue) : ""}`}
            trend={data.revenueTrendPct}
          />
          <Kpi
            label="Fill rate · overall"
            value={`${data.overallFillPct}%`}
            sub={`${data.bookedSeats} / ${data.totalCapacity} seats sold`}
          />
          <Kpi
            label="Top destination"
            value={data.topDestination?.city || "—"}
            sub={data.topDestination ? `${data.topDestination.bookings} bookings` : "no data yet"}
          />
          <Kpi
            label="Pending review"
            value={String(data.pendingReview)}
            sub={`${data.submittedCount} submitted · ${data.docsCount} docs pending`}
          />
        </div>

        <div className="split" style={{gridTemplateColumns:"1.45fr 1fr"}}>
          {/* Revenue by month */}
          <div className="block">
            <div className="block-title" style={{marginBottom:16}}>
              <span className="index">01</span>
              <h3 style={{margin:0}}>Revenue by month</h3>
              <span className="muted mono" style={{marginLeft:"auto", fontSize:11, letterSpacing:0.08+'em'}}>DZD · LIFETIME</span>
            </div>
            <RevenueBars rows={data.byMonth}/>
          </div>

          {/* Pending bookings sidebar */}
          <div className="block">
            <div className="block-title" style={{marginBottom:14}}>
              <span className="index">02</span>
              <h3 style={{margin:0}}>Needs attention</h3>
              <button className="btn btn-sm btn-quiet" style={{marginLeft:"auto"}} onClick={() => go("bookings")}>
                Open all<window.Icon name="arrowR" size={11}/>
              </button>
            </div>
            <div className="flex-col" style={{gap:0}}>
              {data.needsAttention.map(b => {
                const agc = window.agencyById?.(b.agencyId);
                const inst = window.instanceById?.(b.instanceId);
                const tpl = inst ? window.templateById?.(inst.templateId) : null;
                return (
                  <div key={b.ref} style={{display:"grid", gridTemplateColumns:"1fr auto", gap:10, padding:"10px 0", borderBottom:"1px dashed var(--sand-line)"}}>
                    <div style={{minWidth:0}}>
                      <div className="mono" style={{fontSize:12.5, letterSpacing:0.04+'em'}}>{b.ref}</div>
                      <div className="cell-secondary" style={{margin:"2px 0 0", fontSize:12, color:"var(--ink-mute)"}}>
                        {agc?.name || "—"} · {tpl?.name || "—"}
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <window.Pill status={b.status === "submitted" ? "submitted" : "docs"}>
                        {window.statusLabel?.(b.status) || b.status}
                      </window.Pill>
                    </div>
                  </div>
                );
              })}
              {data.needsAttention.length === 0 && (
                <div className="empty" style={{padding:"24px 0"}}>Nothing to review — all bookings are confirmed or completed.</div>
              )}
            </div>
          </div>
        </div>

        {/* Templates leaderboard */}
        <div className="block" style={{marginTop:24}}>
          <div className="block-title" style={{marginBottom:14}}>
            <span className="index">03</span>
            <h3 style={{margin:0}}>Trips by fill rate</h3>
            <span className="muted mono" style={{marginLeft:"auto", fontSize:11, letterSpacing:0.08+'em'}}>OPEN + FILLING + SOLD OUT</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Departures</th>
                  <th className="num">Capacity</th>
                  <th className="num">Booked</th>
                  <th>Fill</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.byTemplate.map(t => (
                  <tr key={t.tpl.id} onClick={() => go("instances", { templateId: t.tpl.id })} style={{cursor:"pointer"}}>
                    <td>
                      <div className="cell-primary">{t.tpl.name}</div>
                      <div className="cell-secondary">{t.tpl.code}</div>
                    </td>
                    <td className="muted mono" style={{fontSize:12}}>{t.runs} runs</td>
                    <td className="num">{t.capacity}</td>
                    <td className="num">{t.booked}</td>
                    <td>
                      <FillBar pct={t.fillPct}/>
                    </td>
                    <td className="num mono">{window.fmtCurCompact ? window.fmtCurCompact(t.revenue) : t.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agency leaderboard */}
        <div className="block" style={{marginTop:24, marginBottom:48}}>
          <div className="block-title" style={{marginBottom:14}}>
            <span className="index">04</span>
            <h3 style={{margin:0}}>Top agencies</h3>
            <span className="muted mono" style={{marginLeft:"auto", fontSize:11, letterSpacing:0.08+'em'}}>RANKED BY LIFETIME REVENUE</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Agency</th>
                  <th>Country</th>
                  <th>Tier</th>
                  <th className="num">Bookings</th>
                  <th className="num">Pax</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.byAgency.map((a, i) => (
                  <tr key={a.agency.id} onClick={() => go("agencies")} style={{cursor:"pointer"}}>
                    <td className="muted mono" style={{fontSize:12, color:"var(--ink-mute)"}}>{String(i+1).padStart(2,"0")}</td>
                    <td>
                      <div className="cell-primary">{a.agency.name}</div>
                      <div className="cell-secondary">{a.agency.contact || ""}</div>
                    </td>
                    <td className="muted" style={{fontSize:12.5}}>{a.agency.country || "—"}</td>
                    <td>
                      <span className={"tier " + (a.agency.tier || "bronze")}>
                        {(a.agency.tier || "bronze").replace(/^\w/, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="num">{a.bookings}</td>
                    <td className="num">{a.pax}</td>
                    <td className="num mono">{window.fmtCurCompact ? window.fmtCurCompact(a.revenue) : a.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Small KPI card ────────────────────────────────────────────────
function Kpi({ label, value, sub, trend }) {
  return (
    <div className="block" style={{padding:18, display:"flex", flexDirection:"column", gap:8}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <span className="muted mono" style={{fontSize:10, letterSpacing:0.16+'em', textTransform:"uppercase"}}>
          {label}
        </span>
        {typeof trend === "number" && (
          <span style={{
            fontFamily:"var(--font-mono)", fontSize:11,
            color: trend >= 0 ? "var(--ok)" : "var(--danger)",
            letterSpacing:0.04+'em',
          }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="kpi-val">{value}</div>
      {sub && <div className="muted" style={{fontSize:12, color:"var(--ink-mute)"}}>{sub}</div>}
    </div>
  );
}

// ─── Horizontal bar list for monthly revenue ───────────────────────
function RevenueBars({ rows }) {
  if (!rows.length) {
    return <div className="empty" style={{padding:"24px 0"}}>No bookings yet — submit one to see the curve.</div>;
  }
  const max = Math.max(...rows.map(r => r.amount));
  return (
    <div className="flex-col" style={{gap:10}}>
      {rows.map(r => (
        <div key={r.month} style={{display:"grid", gridTemplateColumns:"56px 1fr 110px", gap:14, alignItems:"center"}}>
          <span className="muted mono" style={{fontSize:11, letterSpacing:0.08+'em'}}>{r.month}</span>
          <div style={{height:8, background:"var(--parchment-deep)", borderRadius:6, overflow:"hidden"}}>
            <div style={{
              width: max ? `${Math.max(2, Math.round((r.amount / max) * 100))}%` : "0%",
              height:"100%",
              background:"linear-gradient(90deg, var(--gold) 0%, var(--gold-deep) 100%)",
            }}/>
          </div>
          <div className="num mono" style={{textAlign:"right", fontSize:12.5}}>
            {window.fmtCurCompact ? window.fmtCurCompact(r.amount) : r.amount}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Compact fill bar for the template table ───────────────────────
function FillBar({ pct }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct || 0)));
  const tone = clamped >= 90 ? "var(--danger)" : clamped >= 60 ? "var(--warn)" : "var(--ok)";
  return (
    <div style={{display:"flex", alignItems:"center", gap:8, minWidth:120}}>
      <div style={{flex:1, height:5, background:"var(--parchment-deep)", borderRadius:999, overflow:"hidden"}}>
        <div style={{height:"100%", width:`${clamped}%`, background:tone}}/>
      </div>
      <span className="mono" style={{fontSize:11.5, color:"var(--ink-mute)", minWidth:32, textAlign:"right"}}>{clamped}%</span>
    </div>
  );
}

// ─── Derivations ───────────────────────────────────────────────────
const _MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function computeReports() {
  const BOOKINGS = window.BOOKINGS || [];
  const INSTANCES = window.INSTANCES || [];
  const TEMPLATES = window.TEMPLATES || [];
  const AGENCIES = window.AGENCIES || [];

  // Booking aggregates
  const billable = BOOKINGS.filter(b => b.status !== "cancelled");
  const totalRevenue = billable.reduce((s, b) => s + (b.total || 0), 0);
  const avgBookingValue = billable.length ? Math.round(totalRevenue / billable.length) : 0;

  // Revenue by month (uses booking.submitted "MMM DD" — group on MMM only)
  const byMonthMap = {};
  billable.forEach(b => {
    const mon = (b.submitted || "").split(" ")[0];
    if (!mon) return;
    byMonthMap[mon] = (byMonthMap[mon] || 0) + (b.total || 0);
  });
  const monthOrder = _MONTHS.filter(m => byMonthMap[m] != null);
  const byMonth = monthOrder.map(m => ({ month: m.toUpperCase(), amount: byMonthMap[m] }));

  // Revenue this month / last month / trend (uses TODAY = May 2026 from masriva-data)
  const thisMonth = byMonthMap.May || 0;
  const lastMonth = byMonthMap.Apr || 0;
  const revenueThisMonth = thisMonth;
  const revenueTrendPct = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
  const bookingsThisMonth = billable.filter(b => (b.submitted || "").startsWith("May")).length;

  // Fill rate — sum across all instances
  const totalCapacity = INSTANCES.reduce((s, i) => s + (i.capacity || 0), 0);
  const bookedSeats   = INSTANCES.reduce((s, i) => s + (i.booked || 0), 0);
  const overallFillPct = totalCapacity ? Math.round((bookedSeats / totalCapacity) * 100) : 0;

  // Top destination — count bookings per first destination of the booked template
  const destCounts = {};
  billable.forEach(b => {
    const inst = INSTANCES.find(i => i.id === b.instanceId);
    const tpl = inst ? TEMPLATES.find(t => t.id === inst.templateId) : null;
    const city = tpl?.destinations?.[tpl.destinations.length - 1]; // last city = the resort destination
    if (city) destCounts[city] = (destCounts[city] || 0) + 1;
  });
  const topDestination = Object.entries(destCounts)
    .map(([city, bookings]) => ({ city, bookings }))
    .sort((a, b) => b.bookings - a.bookings)[0] || null;

  // Pending review counts
  const submittedCount = BOOKINGS.filter(b => b.status === "submitted").length;
  const docsCount      = BOOKINGS.filter(b => b.status === "docs").length;
  const pendingReview  = submittedCount + docsCount + BOOKINGS.filter(b => b.status === "pending").length;

  // Needs-attention (top 6 by submitted date, newest first — already sorted in seed)
  const needsAttention = BOOKINGS
    .filter(b => ["submitted", "docs", "pending"].includes(b.status))
    .slice(0, 6);

  // Per-template stats
  const byTemplate = TEMPLATES
    .filter(t => t.status === "active")
    .map(t => {
      const tplInstances = INSTANCES.filter(i => i.templateId === t.id);
      const capacity = tplInstances.reduce((s, i) => s + (i.capacity || 0), 0);
      const booked   = tplInstances.reduce((s, i) => s + (i.booked || 0), 0);
      const fillPct  = capacity ? (booked / capacity) * 100 : 0;
      const revenue  = billable
        .filter(b => tplInstances.some(i => i.id === b.instanceId))
        .reduce((s, b) => s + (b.total || 0), 0);
      return { tpl: t, runs: tplInstances.length, capacity, booked, fillPct, revenue };
    })
    .sort((a, b) => b.fillPct - a.fillPct);

  // Per-agency stats
  const byAgency = AGENCIES.map(agency => {
    const agcBookings = billable.filter(b => b.agencyId === agency.id);
    return {
      agency,
      bookings: agcBookings.length,
      pax: agcBookings.reduce((s, b) => s + (b.pax?.adults || 0) + (b.pax?.children || 0), 0),
      revenue: agcBookings.reduce((s, b) => s + (b.total || 0), 0),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return {
    totalBookings: BOOKINGS.length,
    totalRevenue,
    avgBookingValue,
    activeInstances: INSTANCES.filter(i => i.status === "open" || i.status === "filling").length,
    byMonth,
    revenueThisMonth,
    bookingsThisMonth,
    revenueTrendPct,
    overallFillPct,
    totalCapacity,
    bookedSeats,
    topDestination,
    pendingReview,
    submittedCount,
    docsCount,
    needsAttention,
    byTemplate,
    byAgency,
  };
}

window.MsrvReports = MsrvReports;
