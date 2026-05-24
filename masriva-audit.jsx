// masriva-audit.jsx — read-only audit log for ops.
// Streams every meaningful state change from window.AUDIT_LOG. Filters by
// kind / actor / target / date range.

const { useState: useStateAud, useMemo: useMemoAud, useEffect: useEffectAud } = React;

function MsrvAudit({ go }) {
  // Re-render trigger so live appends from saveBooking / updateBookingStatus
  // show up without a manual refresh.
  const [, bump] = useStateAud(0);
  useEffectAud(() => {
    function onAppend() { bump(n => n + 1); }
    function onStorage(e) { if (e.key === "nilvoya:audit") bump(n => n + 1); }
    window.addEventListener("nilvoya:audit:appended", onAppend);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("nilvoya:audit:appended", onAppend);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const [kindFilter, setKindFilter]   = useStateAud("all");
  const [actorFilter, setActorFilter] = useStateAud("all");
  const [search, setSearch]           = useStateAud("");

  const events = useMemoAud(() => window.auditAll?.() || [], [bump]);
  const actors = useMemoAud(() => Array.from(new Set(events.map(e => e.actor))).filter(Boolean), [events]);
  const kinds  = useMemoAud(() => Array.from(new Set(events.map(e => e.kind))).filter(Boolean), [events]);

  const filtered = events.filter(e => {
    if (kindFilter !== "all" && e.kind !== kindFilter) return false;
    if (actorFilter !== "all" && e.actor !== actorFilter) return false;
    if (search) {
      const hay = `${e.target} ${e.from} ${e.to} ${e.reason} ${e.actor}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  // Group by date for readability.
  const groups = {};
  filtered.forEach(e => {
    const d = new Date(e.ts);
    const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" });
    (groups[key] = groups[key] || []).push(e);
  });

  return (
    <>
      <window.Topbar
        crumbs={["Insights", "Audit log"]}
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const csv = ["timestamp,actor,role,kind,target,from,to,reason"]
              .concat(filtered.map(e => [new Date(e.ts).toISOString(), e.actor, e.actorRole, e.kind, e.target, e.from || "", e.to || "", e.reason || ""].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")))
              .join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `audit-${Date.now()}.csv`; a.click();
            URL.revokeObjectURL(url);
          }}>
            <window.Icon name="download" size={12}/>Export CSV
          </button>
        }
      />

      <div className="page">
        <window.PageHead
          eyebrow="Insights · live"
          title={<>Audit <em>log</em></>}
          lede="Every state change across templates, instances, hotels, agencies and bookings — append-only. Newest first."
          meta={
            <>
              <span>{events.length} total events</span>
              <span className="dot"/>
              <span>{filtered.length} shown</span>
              <span className="dot"/>
              <span>{actors.length} actors</span>
            </>
          }
        />

        <div className="toolbar">
          <input
            type="search"
            className="tb-search"
            placeholder="Search ref, status, reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}/>
          <select className="tb-select" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="all">All events</option>
            {kinds.map(k => (
              <option key={k} value={k}>{(window.AUDIT_KIND_LABEL?.[k]?.label) || k}</option>
            ))}
          </select>
          <select className="tb-select" value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
            <option value="all">All actors</option>
            {actors.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {(kindFilter !== "all" || actorFilter !== "all" || search) && (
            <button
              className="btn btn-quiet btn-sm"
              onClick={() => { setKindFilter("all"); setActorFilter("all"); setSearch(""); }}>
              Clear filters
            </button>
          )}
        </div>

        {Object.keys(groups).length === 0 && (
          <div className="block" style={{padding:"40px 24px", textAlign:"center"}}>
            <div className="empty-glyph" style={{margin:"0 auto 14px"}}><window.Icon name="search" size={20}/></div>
            <div className="muted">No events match the current filters.</div>
          </div>
        )}

        {Object.entries(groups).map(([dateLabel, batch]) => (
          <div key={dateLabel} style={{marginBottom:22}}>
            <div className="mono" style={{
              fontSize:10.5, letterSpacing:0.16+'em', textTransform:"uppercase",
              color:"var(--ink-mute)", marginBottom:8,
            }}>
              {dateLabel}
            </div>
            <div className="block" style={{padding:0, overflow:"hidden"}}>
              {batch.map((e, i) => <EventRow key={e.id} ev={e} go={go} last={i === batch.length - 1}/>)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EventRow({ ev, go, last }) {
  const meta = (window.AUDIT_KIND_LABEL?.[ev.kind]) || { label: ev.kind, tone: "neutral" };
  const toneColor = meta.tone === "ok" ? "var(--ok)"
                  : meta.tone === "danger" ? "var(--danger)"
                  : meta.tone === "warn" ? "var(--warn)"
                  : "var(--ink-mute)";
  const time = new Date(ev.ts).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });

  // Friendly target rendering: NLV-* → booking link; tpl-* → template; ins-* → instance; agc-* → agency
  function renderTarget(t) {
    if (!t) return "—";
    if (t.startsWith("NLV-")) {
      return <button className="btn-link mono" style={linkStyle} onClick={() => go("bookings", { ref: t })}>{t}</button>;
    }
    if (t.startsWith("tpl-")) return <span className="mono" style={{color:"var(--ink-soft)"}}>{t}</span>;
    if (t.startsWith("ins-")) return <button className="btn-link mono" style={linkStyle} onClick={() => go("instances")}>{t}</button>;
    if (t.startsWith("agc-")) return <button className="btn-link mono" style={linkStyle} onClick={() => go("agencies")}>{t}</button>;
    if (t.startsWith("h-"))   return <span className="mono" style={{color:"var(--ink-soft)"}}>{t}</span>;
    return <span className="mono">{t}</span>;
  }

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"56px 1fr 1.4fr 110px",
      gap:14, alignItems:"center",
      padding:"12px 20px",
      borderBottom: last ? "none" : "1px solid var(--sand-line)",
    }}>
      <div style={{
        fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ink-mute)",
        letterSpacing:0.04+'em',
      }}>{time}</div>
      <div>
        <div style={{fontSize:12.5, fontWeight:500, color: toneColor, letterSpacing:"-0.005em"}}>
          {meta.label}
        </div>
        <div style={{fontSize:12, color:"var(--ink-mute)", marginTop:2}}>
          {ev.actor} <span className="mono" style={{fontSize:10.5, letterSpacing:0.08+'em', textTransform:"uppercase", marginLeft:6}}>{ev.actorRole}</span>
        </div>
      </div>
      <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", fontSize:12.5}}>
        {renderTarget(ev.target)}
        {(ev.from != null || ev.to != null) && (
          <span style={{display:"inline-flex", alignItems:"center", gap:6, color:"var(--ink-mute)"}}>
            {ev.from != null && <span className="mono" style={{padding:"2px 6px", border:"1px solid var(--sand-line)", borderRadius:3, background:"var(--cream)"}}>{ev.from}</span>}
            <span style={{color:"var(--gold)"}}>→</span>
            {ev.to != null && <span className="mono" style={{padding:"2px 6px", border:"1px solid var(--sand-line)", borderRadius:3, background:"var(--paper)", color:"var(--ink)"}}>{ev.to}</span>}
          </span>
        )}
        {ev.reason && (
          <span style={{color:"var(--ink-mute)", fontStyle:"italic"}}>· {ev.reason}</span>
        )}
      </div>
      <div className="mono" style={{
        fontSize:10, letterSpacing:0.04+'em',
        color:"var(--ink-faint)", textAlign:"right",
      }}>
        {ev.id}
      </div>
    </div>
  );
}

const linkStyle = {
  background:"transparent", border:"none", padding:"3px 6px",
  borderRadius:3,
  color:"var(--gold-deep)", cursor:"pointer",
  fontFamily:"var(--font-mono)", fontSize:12, letterSpacing:0.02+'em',
  textDecoration:"underline", textDecorationColor:"transparent",
  transition:"text-decoration-color 140ms, background 140ms",
};

window.MsrvAudit = MsrvAudit;
