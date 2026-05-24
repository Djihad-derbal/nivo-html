// screens-catalog.jsx — Browse Trips

function CatalogScreen({ go, startBooking, viewTrip }) {
  const [dest, setDest] = React.useState("All");
  const [dur, setDur] = React.useState("Any");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("popular");

  const destinations = ["All", "Cairo", "Sharm el-Sheikh", "Hurghada", "Luxor"];
  const durations = [
    { id: "Any", label: "Any duration", count: window.TRIPS.length },
    { id: "Short", label: "≤ 7 nights", count: window.TRIPS.filter(t => t.segments.reduce((s,x)=>s+x.nights,0) <= 7).length },
    { id: "Mid", label: "8–10 nights", count: window.TRIPS.filter(t => { const n=t.segments.reduce((s,x)=>s+x.nights,0); return n>=8 && n<=10; }).length },
    { id: "Long", label: "11+ nights", count: window.TRIPS.filter(t => t.segments.reduce((s,x)=>s+x.nights,0) >= 11).length },
  ];

  const q = query.trim().toLowerCase();
  const filtered = window.TRIPS.filter(t => {
    if (dest !== "All" && !t.destinations.includes(dest)) return false;
    const n = t.segments.reduce((s,x)=>s+x.nights,0);
    if (dur === "Short" && n > 7) return false;
    if (dur === "Mid" && (n < 8 || n > 10)) return false;
    if (dur === "Long" && n < 11) return false;
    if (q) {
      const hay = `${t.name} ${t.code} ${t.blurb || ""} ${t.destinations.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const trips = [...filtered].sort((a, b) => {
    switch (sort) {
      case "price-asc": return (a.fromPrice || 0) - (b.fromPrice || 0);
      case "duration":  return a.segments.reduce((s,x)=>s+x.nights,0) - b.segments.reduce((s,x)=>s+x.nights,0);
      case "date":      return new Date(a.nextDate) - new Date(b.nextDate);
      default:          return (b.runs || 0) - (a.runs || 0); // "popular" → most runs first
    }
  });
  const activeFilters = (dest !== "All" ? 1 : 0) + (dur !== "Any" ? 1 : 0) + (q ? 1 : 0);

  // No filter → use a single curated showcase ordering with a featured hero.
  const isUnfiltered = dest === "All" && dur === "Any" && !q && sort === "popular";
  const featured = isUnfiltered ? trips[0] : null;
  const rest = isUnfiltered ? trips.slice(1) : trips;
  const chipStyle = {
    display:"inline-flex", alignItems:"center",
    fontSize:12, padding:"5px 12px",
    border:"1px solid var(--sand-line)", borderRadius:999,
    background:"var(--paper)", color:"var(--ink-soft)",
    cursor:"pointer", font:"inherit",
  };

  return (
    <>
      {/* Floating profile chip — single discreet entry to the agency app. */}
      <button type="button" className="landing-profile-fab" onClick={() => go("dashboard")} title="Open agency dashboard">
        <span className="lpf-avatar">YB</span>
        <span className="lpf-text">
          <span className="lpf-name">Yacine Belaïd</span>
          <span className="lpf-org">Open dashboard</span>
        </span>
      </button>

      <div className="page landing-page">
        <section className="landing-hero landing-hero-compact">
          <h1 className="landing-hero-title">
            Trips
          </h1>
        </section>

        <div className="filters">
          <div className="filter-group">
            {destinations.map(d => (
              <button key={d}
                className={"filter-chip " + (dest === d ? "active" : "")}
                onClick={() => setDest(d)}>
                {d}
              </button>
            ))}
          </div>
          <div className="filter-group">
            {durations.map(d => (
              <button key={d.id}
                className={"filter-chip " + (dur === d.id ? "active" : "")}
                onClick={() => setDur(d.id)}>
                {d.label}<span className="count">{d.count}</span>
              </button>
            ))}
          </div>
          <div style={{flex:1, display:"flex", justifyContent:"flex-end", gap:10}}>
            <div style={{position:"relative", flex:"0 0 240px"}}>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search trips, destinations…"
                style={{
                  width:"100%", height:36,
                  padding:"0 30px 0 32px",
                  border:"1px solid var(--sand-line)",
                  borderRadius:"var(--r-sm)",
                  background:"var(--paper) url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235E6B82' stroke-width='1.8' stroke-linecap='round'><circle cx='11' cy='11' r='7'/><path d='m20 20-3-3'/></svg>\") no-repeat 10px center",
                  fontSize:13, color:"var(--ink)", outline:"none",
                }}/>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  style={{position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", border:"none", background:"transparent", color:"var(--ink-mute)", cursor:"pointer", padding:6, fontSize:14}}
                  title="Clear search">×</button>
              )}
            </div>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="popular">Sort · Most popular</option>
              <option value="price-asc">Sort · Price, low to high</option>
              <option value="duration">Sort · Duration</option>
              <option value="date">Sort · Next departure</option>
            </select>
          </div>
        </div>

        {/* Active filter pills with x to remove */}
        {activeFilters > 0 && (
          <div style={{display:"flex", gap:8, marginTop:14, alignItems:"center", flexWrap:"wrap"}}>
            <span className="mono" style={{fontSize:11, letterSpacing:0.12+'em', textTransform:"uppercase", color:"var(--ink-mute)"}}>
              {trips.length} match{trips.length === 1 ? "" : "es"} · filters:
            </span>
            {dest !== "All" && (
              <button onClick={() => setDest("All")} style={chipStyle}>
                Destination · {dest} <span style={{marginLeft:4, color:"var(--ink-mute)"}}>×</span>
              </button>
            )}
            {dur !== "Any" && (
              <button onClick={() => setDur("Any")} style={chipStyle}>
                {durations.find(d => d.id === dur)?.label} <span style={{marginLeft:4, color:"var(--ink-mute)"}}>×</span>
              </button>
            )}
            {q && (
              <button onClick={() => setQuery("")} style={chipStyle}>
                "{query}" <span style={{marginLeft:4, color:"var(--ink-mute)"}}>×</span>
              </button>
            )}
            <button
              onClick={() => { setDest("All"); setDur("Any"); setQuery(""); }}
              style={{background:"none", border:"none", color:"var(--gold-deep)", cursor:"pointer", fontSize:12, padding:"4px 8px", textDecoration:"underline"}}>
              Clear all
            </button>
          </div>
        )}

        {featured && (
          <article className="trip-feature" onClick={() => viewTrip(featured)}>
            <div className="trip-feature-photo">
              <img src={featured.photo} alt="" />
              <span className="corner">{featured.code}</span>
              <span className="feat-badge">Most booked this season</span>
            </div>
            <div className="trip-feature-body">
              <div className="trip-code">{featured.destinations.join(" / ")}</div>
              <h2 className="trip-feature-name">{featured.name}</h2>
              <p className="trip-feature-blurb">{featured.blurb}</p>
              <div className="trip-segments" style={{marginBottom:20}}>
                {featured.segments.map((s, i) => (
                  <span key={i} style={{display:"inline-flex", alignItems:"baseline", gap:6}}>
                    <span className="trip-seg">
                      {s.city} <span className="nights">{s.nights}N</span>
                    </span>
                    {i < featured.segments.length - 1 && <span className="arrow">→</span>}
                  </span>
                ))}
              </div>
              <div className="trip-feature-foot">
                <div>
                  <div className="trip-from">From, per adult</div>
                  <div className="trip-price">
                    <span className="currency">{window.CUR}</span>{window.fmt(featured.fromPrice)}
                  </div>
                </div>
                <div className="trip-feature-runs">
                  <div className="eyebrow" style={{marginBottom:6}}>Next runs</div>
                  <div style={{fontSize:13.5}}>{featured.runs} departures · next {featured.nextDate}</div>
                </div>
                <button className="btn btn-primary btn-lg">Start booking <window.Icon name="arrowRight" size={14}/></button>
              </div>
            </div>
          </article>
        )}

        <div className="trip-grid">
          {rest.map(t => (
            <article key={t.id} className="trip" onClick={() => viewTrip(t)}>
              <div className="trip-photo">
                <img src={t.photo} alt="" />
                <span className="corner">{t.code}</span>
                <span className="runs">{t.runs} departures · next {t.nextDate}</span>
              </div>
              <div className="trip-body">
                <div className="trip-code">{t.destinations.join(" / ")}</div>
                <h3 className="trip-name">{t.name}</h3>
                <div className="trip-segments">
                  {t.segments.map((s, i) => (
                  <span key={i} style={{display:"inline-flex", alignItems:"baseline", gap:6}}>
                    <span className="trip-seg">
                      {s.city} <span className="nights">{s.nights}N</span>
                    </span>
                    {i < t.segments.length - 1 && <span className="arrow">→</span>}
                  </span>
                ))}
                </div>
                <div className="trip-meta">
                  <div className="trip-from">From, per adult</div>
                  <div className="trip-price">
                    <span className="currency">{window.CUR}</span>{window.fmt(t.fromPrice)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div style={{margin:"60px 0 0"}}>
          <div className="hairline-key">Beyond the catalog</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginTop:24}}>
            {[
              { eyebrow:"Custom itinerary", title:"Need a date that's not listed?", body:"Request a private run for groups of 20+. We'll quote within 48 hours." },
              { eyebrow:"Rate card", title:"All twelve price points, per trip.", body:"Download the master PDF — single, double, triple, child × three tiers." },
              { eyebrow:"Partner support", title:"Talk to your account manager.", body:"Yasmine Khalil — ext. 207. Available 09:00–18:00 Cairo time, Sun–Thu." },
            ].map((c, i) => (
              <div key={i} className="block" style={{padding:"22px 24px", margin:0}}>
                <div className="trip-code" style={{margin:0, marginBottom:8}}>{c.eyebrow}</div>
                <h4 style={{margin:"0 0 8px", fontSize:17, fontWeight:500, letterSpacing:"-0.015em"}}>{c.title}</h4>
                <p style={{margin:"0 0 16px", color:"var(--ink-mute)", fontSize:13, lineHeight:1.55}}>{c.body}</p>
                <button className="btn btn-sm btn-ghost">Open <window.Icon name="arrowRight" size={12}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

window.CatalogScreen = CatalogScreen;
