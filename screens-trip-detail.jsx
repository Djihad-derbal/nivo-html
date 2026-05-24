// screens-trip-detail.jsx — Pre-wizard trip detail (full pitch before booking).
// Opens when a partner clicks a trip card in the catalogue. Shows the full
// pitch: hero, blurb, segment-by-segment plan, hotels available per city,
// upcoming departures with availability, included/excluded, then a single CTA
// that hands off to the wizard.

function TripDetailScreen({ trip, go, startBooking }) {
  const departures = (window.instancesForTemplate ? window.instancesForTemplate(trip.id) : [])
    .slice()
    .sort((a, b) => new Date(a.departure) - new Date(b.departure));

  const liveDepartures = departures.filter(i => i.status !== "soldout");
  const nextDep = liveDepartures[0] || departures[0];

  const totalNights = trip.segments.reduce((s, x) => s + x.nights, 0);
  const fromDouble = liveDepartures
    .flatMap(i => i.assigned.map(a => a.prices.double))
    .filter(Boolean);
  const fromPrice = fromDouble.length ? Math.min(...fromDouble) : trip.fromPrice;

  // Hotels offered per city — union across all live instances. For each hotel
  // we record the minimum per-room-type price across every instance it appears
  // in, so the detail page can show "from DZD …" per hotel.
  const hotelsByCity = {};
  trip.segments.forEach(s => { hotelsByCity[s.city] = new Map(); });
  liveDepartures.forEach(inst => {
    inst.assigned.forEach(a => {
      const shortId = a.hotelId.replace(/^h-/, "");
      const hotel = Object.values(window.HOTELS || {}).flat().find(h => h.id === shortId);
      if (!hotel) return;
      const city = hotel.city
        || trip.segments.find(s => (window.HOTELS?.[s.city] || []).some(h => h.id === shortId))?.city;
      if (!city || !hotelsByCity[city]) return;
      const existing = hotelsByCity[city].get(hotel.id);
      const merged = {
        hotel,
        prices: {
          single: Math.min(existing?.prices.single ?? Infinity, a.prices?.single ?? Infinity),
          double: Math.min(existing?.prices.double ?? Infinity, a.prices?.double ?? Infinity),
          triple: Math.min(existing?.prices.triple ?? Infinity, a.prices?.triple ?? Infinity),
          child:  Math.min(existing?.prices.child  ?? Infinity, a.prices?.child  ?? Infinity),
        },
      };
      hotelsByCity[city].set(hotel.id, merged);
    });
  });

  const includes = [
    "Round-trip flights from Algiers · airline of operator's choice",
    "Hotel stays with daily breakfast at the selected room class",
    "All inter-city transfers in the official itinerary",
    "Guided day tours where indicated · entry tickets included",
    "Local 24/7 partner desk in Cairo and the destination city",
    "Standard travel insurance for the duration of the trip",
  ];
  const excludes = [
    "Visas (we handle the invitation letter; you handle the application)",
    "Lunch / dinner unless specifically included in a day tour",
    "Personal expenses, optional excursions, tips and gratuities",
    "Single-room supplement (priced at the Single rate on this page)",
  ];

  return (
    <>
      <button type="button" className="wiz-close-fab" onClick={() => go("trips")}>
        <window.Icon name="arrowLeft" size={14}/>
        <span>Back to trips</span>
      </button>

      <div className="page" style={{paddingBottom: 80}}>
        {/* Hero with photo */}
        <div style={{
          position:"relative",
          height:380,
          borderRadius: "var(--r-lg)",
          overflow:"hidden",
          marginBottom: 28,
          backgroundImage: `linear-gradient(180deg, rgba(14,30,54,0) 35%, rgba(14,30,54,0.65) 100%), url(${trip.photo})`,
          backgroundSize:"cover",
          backgroundPosition:"center",
          color:"#fff",
        }}>
          <div style={{
            position:"absolute", left: 36, bottom: 32, right: 36,
            display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap: 24,
          }}>
            <div style={{maxWidth: 640}}>
              <div style={{
                fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:0.16+'em', textTransform:"uppercase",
                color:"rgba(212,174,107,0.85)", marginBottom:8,
              }}>
                {trip.code}
              </div>
              <h1 style={{
                fontSize:46, fontWeight:600, letterSpacing:"-0.028em", lineHeight:1.05,
                margin:"0 0 10px", color:"#fff",
              }}>
                {trip.name.split(" + ").map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && <em style={{color:"var(--gold-soft)", fontStyle:"italic"}}> &amp; </em>}
                  </React.Fragment>
                ))}
              </h1>
              <p style={{color:"rgba(255,255,255,0.85)", fontSize:15.5, maxWidth: 540, margin:0, lineHeight:1.55}}>
                {trip.blurb}
              </p>
            </div>
            <div style={{textAlign:"right", flexShrink:0, color:"rgba(255,255,255,0.85)"}}>
              <div style={{fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:0.18+'em', textTransform:"uppercase", marginBottom:4}}>
                From / Double
              </div>
              <div style={{fontFamily:"var(--font-mono)", fontSize:30, color:"#fff", fontWeight:500, letterSpacing:"-0.01em"}}>
                {window.fmtCurCompact ? window.fmtCurCompact(fromPrice) : window.fmtCur(fromPrice)}
              </div>
              <div style={{fontSize:11.5, marginTop:4, opacity:0.75}}>per pax · full-stay</div>
            </div>
          </div>
        </div>

        {/* Top facts strip */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:18, marginBottom:36}}>
          <Fact label="Duration" value={`${totalNights} nights`}/>
          <Fact label="Destinations" value={trip.destinations.join(" · ")}/>
          <Fact label="Live departures" value={String(liveDepartures.length)} sub={nextDep ? `Next ${nextDep.departure}` : "—"}/>
          <Fact label="Hotel options" value={String(Object.values(hotelsByCity).reduce((s, m) => s + m.size, 0))} sub="across all cities"/>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:28, alignItems:"start"}}>
          {/* Left column */}
          <div style={{display:"flex", flexDirection:"column", gap:24}}>
            {/* Day-by-day plan from the editable template program */}
            <section className="block">
              <div className="block-title">
                <span className="index">01</span>
                <h3>Day-by-day program</h3>
                <span className="eyebrow" style={{marginLeft:"auto"}}>
                  {(window.templateProgram?.(trip.id) || []).length || totalNights} day{(window.templateProgram?.(trip.id) || []).length === 1 ? "" : "s"}
                </span>
              </div>
              {(() => {
                const program = window.templateProgram?.(trip.id) || [];
                if (program.length === 0) {
                  // Fall back to a per-segment plan if ops hasn't published a day-by-day yet.
                  return (
                    <div style={{position:"relative", paddingLeft:20, marginTop:14}}>
                      <div style={{position:"absolute", left:7, top:8, bottom:8, width:1, background:"var(--sand-line)"}}/>
                      {trip.segments.map((seg, i) => (
                        <div key={i} style={{position:"relative", paddingBottom: i === trip.segments.length - 1 ? 0 : 22}}>
                          <div style={{position:"absolute", left:-20, top:4, width:14, height:14, borderRadius:"50%", border:"2px solid var(--gold)", background:"var(--paper)"}}/>
                          <h4 style={{margin:0, fontWeight:600, letterSpacing:"-0.018em", fontSize:18}}>{seg.city} · {seg.nights} nights</h4>
                          <div style={{color:"var(--ink-mute)", fontSize:13.5, lineHeight:1.55, marginTop:4}}>{segmentBlurb(seg)}</div>
                        </div>
                      ))}
                    </div>
                  );
                }
                return (
                  <div style={{position:"relative", paddingLeft:24, marginTop:14}}>
                    <div style={{position:"absolute", left:9, top:8, bottom:8, width:1, background:"var(--sand-line)"}}/>
                    {program.map((d, i) => (
                      <div key={i} style={{position:"relative", paddingBottom: i === program.length - 1 ? 0 : 18}}>
                        <div style={{
                          position:"absolute", left:-22, top:2,
                          width:22, height:22, borderRadius:"50%",
                          background:"var(--gold)", color:"#fff",
                          display:"grid", placeItems:"center",
                          fontFamily:"var(--font-mono)", fontSize:10, fontWeight:600,
                        }}>{d.day}</div>
                        <h4 style={{margin:"0 0 4px", fontWeight:600, letterSpacing:"-0.015em", fontSize:15.5, lineHeight:1.25}}>
                          {d.title}
                        </h4>
                        {d.description && (
                          <div style={{color:"var(--ink-mute)", fontSize:13, lineHeight:1.5}}>{d.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>

            {/* Hotels by city */}
            <section className="block">
              <div className="block-title">
                <span className="index">02</span>
                <h3>Hotels you can choose</h3>
                <span className="eyebrow" style={{marginLeft:"auto"}}>per ops's published inventory</span>
              </div>
              {Object.entries(hotelsByCity).map(([city, map]) => {
                const hotels = [...map.values()].sort((a, b) => b.hotel.stars - a.hotel.stars);
                const isCairo = city === "Cairo";
                // Cairo is fixed — only the first published hotel is bookable.
                const visible = isCairo ? hotels.slice(0, 1) : hotels;
                return (
                  <div key={city} style={{marginTop:14, paddingTop:14, borderTop:"1px solid var(--sand-line)"}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10}}>
                      <strong style={{fontSize:14, letterSpacing:"-0.005em"}}>
                        {city}{isCairo ? " — fixed property" : ""}
                      </strong>
                      <span className="mono" style={{fontSize:11, color:"var(--ink-mute)", letterSpacing:0.06+'em'}}>
                        {isCairo ? "no price impact" : `${visible.length} option${visible.length === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    <div style={{display:"flex", flexDirection:"column", gap:10}}>
                      {visible.map(({ hotel: h, prices }) => (
                        <div key={h.id} style={{
                          display:"grid",
                          gridTemplateColumns:"56px 1.4fr 1fr 1fr 1fr 1fr",
                          alignItems:"center", gap:14,
                          padding:"10px 12px",
                          borderRadius:"var(--r-sm)",
                          border:"1px solid var(--sand-line)",
                          background:"var(--paper)",
                        }}>
                          <div style={{
                            width:56, height:42, borderRadius:"var(--r-xs)",
                            backgroundImage:`url(${h.photo})`, backgroundSize:"cover", backgroundPosition:"center",
                            border:"1px solid var(--sand-line)",
                          }}/>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:13, fontWeight:500, letterSpacing:"-0.005em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                              {h.name}
                            </div>
                            <div style={{fontSize:11, color:"var(--gold)", letterSpacing:0.02+'em', marginTop:2}}>
                              {window.stars(h.stars)}
                            </div>
                          </div>
                          {isCairo ? (
                            <div style={{gridColumn:"3 / -1", color:"var(--ink-mute)", fontStyle:"italic", fontSize:12.5}}>
                              Included in the trip base — same property for every departure.
                            </div>
                          ) : (
                            <>
                              <PriceCell label="Single" value={prices.single}/>
                              <PriceCell label="Double" value={prices.double} accent/>
                              <PriceCell label="Triple" value={prices.triple}/>
                              <PriceCell label="Child" value={prices.child}/>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Included / Excluded */}
            <section className="block">
              <div className="block-title">
                <span className="index">03</span>
                <h3>What's included</h3>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginTop:14}}>
                <div>
                  <div className="eyebrow" style={{marginBottom:8, color:"var(--ok)"}}>Included</div>
                  <ul style={{margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8}}>
                    {includes.map((line, i) => (
                      <li key={i} style={{display:"flex", gap:8, fontSize:13, lineHeight:1.5, color:"var(--ink-soft)"}}>
                        <span style={{color:"var(--ok)", flexShrink:0}}>✓</span>{line}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="eyebrow" style={{marginBottom:8, color:"var(--ink-mute)"}}>Not included</div>
                  <ul style={{margin:0, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8}}>
                    {excludes.map((line, i) => (
                      <li key={i} style={{display:"flex", gap:8, fontSize:13, lineHeight:1.5, color:"var(--ink-mute)"}}>
                        <span style={{color:"var(--ink-mute)", flexShrink:0}}>·</span>{line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Right column — sticky CTA + departures */}
          <aside style={{position:"sticky", top: 84, display:"flex", flexDirection:"column", gap:18}}>
            <div className="block" style={{padding:24}}>
              <div className="eyebrow" style={{marginBottom:14}}>Ready to book</div>
              <div style={{display:"flex", alignItems:"baseline", gap:8, marginBottom:6}}>
                <div className="kpi-val" style={{fontSize:32, lineHeight:1}}>{window.fmtCurCompact ? window.fmtCurCompact(fromPrice) : window.fmtCur(fromPrice)}</div>
              </div>
              <div style={{color:"var(--ink-mute)", fontSize:12, marginBottom:18}}>
                From price · per pax · double room · full stay
              </div>
              <button
                className="btn btn-primary btn-lg"
                style={{width:"100%", justifyContent:"center"}}
                onClick={() => startBooking(trip)}>
                Start booking <window.Icon name="arrowRight" size={14}/>
              </button>
              <div style={{marginTop:12, fontSize:11.5, color:"var(--ink-mute)", textAlign:"center"}}>
                Inventory is held during the wizard. No payment until you submit.
              </div>
            </div>

            <div className="block" style={{padding:18}}>
              <div className="block-title" style={{marginBottom:12}}>
                <h3 style={{fontSize:14, margin:0, fontWeight:500}}>Upcoming departures</h3>
                <span className="mono" style={{marginLeft:"auto", fontSize:10.5, color:"var(--ink-mute)", letterSpacing:0.1+'em'}}>{liveDepartures.length} OPEN</span>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:6, maxHeight:280, overflowY:"auto"}}>
                {departures.length === 0 && (
                  <div className="muted" style={{fontSize:12.5, padding:"10px 0"}}>Ops hasn't published any departures for this trip yet.</div>
                )}
                {departures.map((d, i) => {
                  const seats = Math.max(0, d.capacity - d.booked);
                  const sold = d.status === "soldout" || seats <= 0;
                  const tone = sold ? "var(--danger)" : seats <= 10 ? "var(--warn)" : "var(--ok)";
                  return (
                    <div key={d.id} style={{
                      display:"grid", gridTemplateColumns:"60px 1fr auto", gap:10, alignItems:"center",
                      padding:"8px 10px", borderRadius:"var(--r-sm)",
                      border:"1px solid var(--sand-line)",
                      background:"var(--paper)",
                      opacity: sold ? 0.55 : 1,
                    }}>
                      <div className="mono" style={{fontSize:11, color:"var(--ink-mute)", letterSpacing:0.06+'em'}}>{d.departure.split(" ").slice(0,2).join(" ").replace(",","")}</div>
                      <div style={{fontSize:12.5, color:"var(--ink-soft)"}}>{d.direction}</div>
                      <div style={{display:"flex", alignItems:"center", gap:6, fontSize:11.5, color: tone}}>
                        <span style={{width:6, height:6, borderRadius:"50%", background:"currentColor"}}/>
                        {sold ? "Sold out" : seats <= 10 ? `${seats} left` : "Open"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function PriceCell({ label, value, accent }) {
  return (
    <div style={{textAlign:"right"}}>
      <div className="mono" style={{fontSize:9.5, letterSpacing:0.14+'em', textTransform:"uppercase", color:"var(--ink-mute)"}}>
        {label}
      </div>
      <div style={{
        fontFamily:"var(--font-mono)", fontSize: accent ? 13 : 12,
        color: accent ? "var(--ink)" : "var(--ink-soft)",
        fontWeight: accent ? 500 : 400,
        marginTop:2,
      }}>
        {window.fmtCurCompact ? window.fmtCurCompact(value) : window.fmtCur(value)}
      </div>
    </div>
  );
}

function Fact({ label, value, sub }) {
  return (
    <div className="block" style={{padding:"16px 18px"}}>
      <div className="eyebrow" style={{marginBottom:6}}>{label}</div>
      <div style={{fontSize:20, fontWeight:600, letterSpacing:"-0.022em", lineHeight:1.1}}>{value}</div>
      {sub && <div className="muted" style={{fontSize:12, color:"var(--ink-mute)", marginTop:4}}>{sub}</div>}
    </div>
  );
}

const _SEG_BLURBS = {
  "Cairo": "Two to three days exploring Giza, the Sphinx, and downtown Cairo. The Cairo hotel is fixed for every instance — a four-star anchor near the museum district.",
  "Sharm el-Sheikh": "Resort time on Naama Bay. Snorkeling at Ras Mohamed, free time on the beach, optional dive packages add-on.",
  "Hurghada": "Calmer beach pace than Sharm. Reef trips on a private boat, El Gouna day-trip optional.",
  "Luxor": "The temples — Karnak, Luxor, Valley of the Kings. Nile-side hotel with sunset views.",
};
function segmentBlurb(seg) {
  return _SEG_BLURBS[seg.city] || `${seg.nights} nights in ${seg.city}.`;
}

window.TripDetailScreen = TripDetailScreen;
