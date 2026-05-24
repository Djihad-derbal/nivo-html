// screens-wizard.jsx — 5-step booking flow
// Live inventory + pricing: dates, hotel options, and prices come from admin
// instances (window.INSTANCES), not from B2B-local seed data.

// Resolve the admin instances available for this trip (template).
function departuresForTrip(trip) {
  const instances = (window.instancesForTemplate ? window.instancesForTemplate(trip.id) : []) || [];
  // Sort soonest-first; sold-out items stay in the list, just disabled.
  return [...instances]
    .sort((a, b) => new Date(a.departure) - new Date(b.departure))
    .map(i => ({
      instance: i,
      date: i.departure,
      direction: i.direction,
      seats: Math.max(0, i.capacity - i.booked),
      status: i.status,
      nights: i.segments.reduce((s, x) => s + x.nights, 0),
    }));
}
function instanceForTrip(trip, dateIdx) {
  return departuresForTrip(trip)[dateIdx]?.instance || null;
}
// "May 28, 2026" + 9 nights → "Jun 06, 2026"
function addNightsToDate(dateStr, nights) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  d.setDate(d.getDate() + (nights || 0));
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
function addNightsShort(dateStr, nights) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  d.setDate(d.getDate() + (nights || 0));
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}
// Hotels assigned (in admin) to the selected instance for one city.
// Admin IDs are prefixed "h-"; B2B's HOTELS catalogue uses the short id.
function hotelOptionsForInstance(instance, city) {
  if (!instance) return [];
  const catalog = window.HOTELS?.[city] || [];
  return instance.assigned
    .map(a => {
      const shortId = a.hotelId.replace(/^h-/, "");
      const hotel = catalog.find(h => h.id === shortId);
      return hotel ? { assignment: a, hotel } : null;
    })
    .filter(Boolean);
}
// Per-pax full-stay rate for a hotel pick inside an instance segment.
// Cairo is the "fixed" hotel — it contributes nothing to per-pax price.
function ratePerPax(instance, hotelsByCity, city, roomType) {
  if (!instance) return 0;
  if (city === "Cairo") return 0;
  const hotelId = hotelsByCity?.[city];
  if (!hotelId) return 0;
  // hotelsByCity uses B2B's short IDs; admin assignments use "h-" prefix.
  const assigned = instance.assigned.find(a => a.hotelId === hotelId || a.hotelId === "h-" + hotelId);
  return assigned?.prices?.[roomType] || 0;
}
// Trip-level rate: sum across non-Cairo segments using instance prices.
// `state` is the wizard state — needs .dateIdx + .hotels.
function tripRate(trip, state, roomType) {
  const instance = instanceForTrip(trip, state?.dateIdx ?? 0);
  return trip.segments.reduce((sum, seg) => sum + ratePerPax(instance, state?.hotels, seg.city, roomType), 0);
}
function defaultHotelPicks(trip, instance) {
  const picks = {};
  trip.segments.forEach(seg => {
    const opts = hotelOptionsForInstance(instance, seg.city);
    // Pick the cheapest assigned hotel (by double price) per city, or fall back to first.
    const sorted = [...opts].sort((a, b) => (a.assignment.prices?.double || 0) - (b.assignment.prices?.double || 0));
    const pick = sorted[0] || opts[0];
    if (pick) picks[seg.city] = pick.hotel.id;
  });
  return picks;
}
function derivedTier(hotelsByCity) {
  let max = 3;
  Object.entries(hotelsByCity || {}).forEach(([city, id]) => {
    const h = window.hotelById(city, id);
    if (h && h.stars > max) max = h.stars;
  });
  return max;
}

const STEPS = [
  { id: 1, title: "Departure",   label: "Select run"      },
  { id: 2, title: "Passengers",  label: "Count & mix"     },
  { id: 3, title: "Passports",   label: "Travel documents"},
  { id: 4, title: "Rooms",       label: "Hotel & assign"  },
  { id: 5, title: "Review",      label: "Confirm & submit"},
];

// Availability rules:
//   seats > LOW_SEATS_THRESHOLD  → "Available" (green, no number)
//   1..LOW_SEATS_THRESHOLD       → "X seats left" (amber, exact count)
//   0                            → "Sold Out" (red)
const LOW_SEATS_THRESHOLD = 10;
function availability(seats) {
  if (seats <= 0)                    return { kind: "soldout", label: "Sold Out",         color: "var(--danger)" };
  if (seats <= LOW_SEATS_THRESHOLD)  return { kind: "low",     label: `${seats} seats left`, color: "var(--warn)"   };
  return                                    { kind: "ok",      label: "Available",         color: "var(--ok)"     };
}

function Stepper({ current }) {
  return (
    <div className="stepper">
      {STEPS.map(s => (
        <div key={s.id}
             className={"step " + (s.id === current ? "active" : s.id < current ? "done" : "")}>
          <span className="step-num">Step {String(s.id).padStart(2,"0")} {s.id < current ? "· done" : ""}</span>
          <span className="step-label">{s.title}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Step 1 — Departure ────────────────────────────────────────────
function Step1Departure({ trip, state, set }) {
  const departures = departuresForTrip(trip);
  const selectedInstance = departures[state.dateIdx]?.instance || null;
  return (
    <>
      <div className="wiz-section">
        <h2 className="wiz-section-title">Choose a departure date</h2>
        <p className="wiz-section-sub">
          Each run is a fixed itinerary direction. Inventory is live from ops — sold-out departures are dimmed.
        </p>

        {departures.length === 0 && (
          <div className="block" style={{padding:"22px 24px", color:"var(--ink-mute)"}}>
            No live departures for this trip. Ops hasn't published an instance yet.
          </div>
        )}

        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {departures.map((d, i) => {
            const sel = state.dateIdx === i;
            const av = availability(d.seats);
            const sold = av.kind === "soldout" || d.status === "soldout";
            return (
              <button key={i}
                disabled={sold}
                onClick={() => set({ dateIdx: i })}
                style={{
                  display:"grid",
                  gridTemplateColumns:"56px 1fr 1fr 1fr 24px",
                  alignItems:"center",
                  gap:18,
                  padding:"18px 22px",
                  border:"1px solid " + (sel ? "var(--ink)" : "var(--sand-line)"),
                  background: sel ? "var(--ivory-soft)" : "var(--paper)",
                  borderRadius:"var(--r-md)",
                  cursor: sold ? "not-allowed" : "pointer",
                  opacity: sold ? 0.5 : 1,
                  textAlign:"left",
                  font:"inherit",
                  color:"inherit"
                }}>
                <div style={{
                  width:48, height:48, borderRadius:"var(--r-sm)",
                  background: sel ? "var(--ink)" : "var(--cream)",
                  color: sel ? "var(--ivory)" : "var(--ink)",
                  display:"grid", placeItems:"center",
                  fontFamily:"var(--font-mono)", fontSize:11, lineHeight:1.1,
                  textAlign:"center"
                }}>
                  <div>
                    <div style={{fontSize:10, letterSpacing:0.1+'em'}}>{d.date.split(" ")[0].toUpperCase()}</div>
                    <div style={{fontSize:16, marginTop:1}}>{d.date.split(" ")[1].replace(",","")}</div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:15, letterSpacing:"-0.005em"}}>{d.date}</div>
                  <div style={{fontSize:11.5, fontFamily:"var(--font-mono)", color:"var(--ink-mute)", letterSpacing:0.04+'em', marginTop:2}}>
                    {d.nights} NIGHTS · RETURN {addNightsShort(d.date, d.nights).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="eyebrow" style={{marginBottom:4}}>Itinerary</div>
                  <div style={{fontSize:13.5}}>{d.direction}</div>
                </div>
                <div>
                  <div className="eyebrow" style={{marginBottom:4}}>Availability</div>
                  <div style={{fontSize:13.5, color: av.color, display:"inline-flex", alignItems:"center", gap:8}}>
                    <span style={{width:7, height:7, borderRadius:"50%", background:"currentColor", flexShrink:0, opacity: av.kind === "soldout" ? 1 : 0.85}}/>
                    {av.label}
                  </div>
                </div>
                <div style={{textAlign:"right", color:"var(--sand-deep)"}}>
                  {sel ? <window.Icon name="check" size={18}/> : <window.Icon name="arrowRight" size={16}/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="wiz-section">
        <h2 className="wiz-section-title">Hotels &amp; pricing</h2>
        <p className="wiz-section-sub">
          {trip.segments.length > 1
            ? "Pick one hotel per destination. Prices below are per-pax for that city's stay — totals sum across destinations."
            : "Pick a hotel. Prices below are per-pax for the full stay."}
        </p>

        {trip.segments.map((seg) => {
          let opts = hotelOptionsForInstance(selectedInstance, seg.city);
          const isCairo = seg.city === "Cairo";
          // The Cairo hotel is fixed — ops always slots one house property.
          if (isCairo && opts.length > 1) opts = opts.slice(0, 1);
          return (
          <div key={seg.city} className="hotel-seg">
            <div className="hotel-seg-head">
              <h3>{seg.city}{isCairo ? " · fixed hotel" : ""}</h3>
              <span className="eyebrow">{seg.nights} nights at this destination</span>
            </div>
            {opts.length === 0 && (
              <div className="block" style={{padding:"16px 18px", color:"var(--ink-mute)", fontSize:13.5}}>
                Ops hasn't assigned a hotel here yet for the selected departure.
              </div>
            )}
            <div className="hotel-list">
              {opts.map(({ hotel: h, assignment: a }) => {
                const sel = state.hotels[seg.city] === h.id;
                const tagName = h.stars === 3 ? "Comfort" : h.stars === 4 ? "Premium" : "Luxury";
                return (
                  <button key={h.id}
                    type="button"
                    className={"hotel-card " + (isCairo ? "selected" : (sel ? "selected" : ""))}
                    disabled={isCairo}
                    style={isCairo ? {cursor:"default", opacity: 0.95} : undefined}
                    onClick={() => { if (!isCairo) set({ hotels: { ...state.hotels, [seg.city]: h.id }}); }}>
                    <div className="hc-id">
                      <span className="hc-stars">{window.stars(h.stars)}</span>
                      <span className="hc-name">{h.name}</span>
                      <span className={"hc-tag s" + h.stars}>{tagName}</span>
                    </div>
                    {!isCairo ? (
                      <div className="hc-rates">
                        <div><span className="hcr-lbl">Single</span><span className="hcr-val">{window.fmtCur(a.prices.single)}</span></div>
                        <div><span className="hcr-lbl">Double, per pax</span><span className="hcr-val">{window.fmtCur(a.prices.double)}</span></div>
                        <div><span className="hcr-lbl">Triple, per pax</span><span className="hcr-val">{window.fmtCur(a.prices.triple)}</span></div>
                        <div className="child"><span className="hcr-lbl">Child (flat)</span><span className="hcr-val">{window.fmtCur(a.prices.child)}</span></div>
                      </div>
                    ) : (
                      <div className="hc-rates" style={{color:"var(--ink-mute)", fontStyle:"italic"}}>Included in the trip base — same property for every departure.</div>
                    )}
                    <div className="hc-state">
                      {isCairo
                        ? <span className="hc-sel" style={{color:"var(--gold-deep)"}}><window.Icon name="check" size={12}/>Fixed</span>
                        : sel
                          ? <span className="hc-sel"><window.Icon name="check" size={12}/>Selected</span>
                          : <span className="hc-pick">Pick</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );})}
      </div>
    </>
  );
}

// ─── Step 2 — Passengers ───────────────────────────────────────────
function Step2Pax({ state, set }) {
  function setAdults(n) { set({ adults: Math.max(1, Math.min(60, n)) }); }
  function setChildren(n) { set({ children: Math.max(0, Math.min(30, n)) }); }
  const total = state.adults + state.children;
  return (
    <div className="wiz-section">
      <h2 className="wiz-section-title">Confirm travelers</h2>
      <p className="wiz-section-sub">
        Adjust the count if needed — your pricing on the right updates live. By default, children share a Double with two adults at the flat child rate; you can switch any child to their own bed (Triple, adult rate) in Step 4.
      </p>

      <div className="block" style={{marginBottom:14}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", padding:"4px 0"}}>
          <div>
            <div style={{fontSize:16, fontWeight:500, letterSpacing:"-0.01em"}}>Adults</div>
            <div style={{fontSize:13, color:"var(--ink-mute)", marginTop:4}}>Age 12 and over. Each adult is priced by their assigned room type.</div>
          </div>
          <div className="stepper-input">
            <button onClick={() => setAdults(state.adults - 1)} disabled={state.adults <= 1}><window.Icon name="minus" size={14}/></button>
            <span className="v">{state.adults}</span>
            <button onClick={() => setAdults(state.adults + 1)}><window.Icon name="plus" size={14}/></button>
          </div>
        </div>
      </div>

      <div className="block" style={{marginBottom:20}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", padding:"4px 0"}}>
          <div>
            <div style={{fontSize:16, fontWeight:500, letterSpacing:"-0.01em"}}>Children</div>
            <div style={{fontSize:13, color:"var(--ink-mute)", marginTop:4}}>Under 12. Flat child rate when sharing a Double; adult triple rate if assigned their own bed.</div>
          </div>
          <div className="stepper-input">
            <button onClick={() => setChildren(state.children - 1)} disabled={state.children <= 0}><window.Icon name="minus" size={14}/></button>
            <span className="v">{state.children}</span>
            <button onClick={() => setChildren(state.children + 1)}><window.Icon name="plus" size={14}/></button>
          </div>
        </div>
      </div>

      {/* Room suggestion preview */}
      <div className="block">
        <div className="trip-code" style={{marginBottom:10}}>Preliminary room mix</div>
        <div style={{display:"flex", alignItems:"baseline", gap:8, marginBottom:14}}>
          <div style={{fontSize:34, letterSpacing:"-0.025em"}}>{total}</div>
          <div style={{color:"var(--ink-mute)", fontSize:13}}>travelers · {state.adults} adult, {state.children} children</div>
        </div>

        <RoomSuggestionPreview adults={state.adults} children={state.children}/>
      </div>
    </div>
  );
}

function suggestRooms(adults, kids) {
  // Pair adults into doubles. If odd count, absorb 3 into one triple
  // instead of leaving a lone single — lower per-pax rate, more economical.
  let triples = 0, doubles = 0, singles = 0;
  let a = adults;
  if (a % 2 === 1 && a >= 3) {
    triples = 1;
    a -= 3;
  }
  doubles = Math.floor(a / 2);
  if (a % 2 === 1) singles = 1;
  return { singles, doubles, triples };
}

function RoomSuggestionPreview({ adults, children }) {
  // Default placement: every child shares a Double with two adults. The
  // double is still a Double (2 beds + 1 child) — Step 4 lets the user
  // promote any individual child to a Triple with their own bed.
  const r = suggestRooms(adults, children);
  const sharingDoubles = Math.min(children, r.doubles);
  const plainDoubles = r.doubles - sharingDoubles;
  const extraKids = Math.max(0, children - r.doubles);
  return (
    <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
      {r.singles > 0       && <RoomChip type="Single" count={r.singles}/>}
      {plainDoubles > 0    && <RoomChip type="Double" count={plainDoubles}/>}
      {sharingDoubles > 0  && <RoomChip type="Double · +1 child sharing" count={sharingDoubles} child/>}
      {r.triples > 0       && <RoomChip type="Triple" count={r.triples}/>}
      {extraKids > 0       && <RoomChip type="Child, unpaired" count={extraKids} child/>}
    </div>
  );
}
function RoomChip({ type, count, child }) {
  return (
    <div style={{
      padding:"12px 16px", border:"1px solid var(--sand-line)",
      borderRadius:"var(--r-sm)", background:"var(--cream)",
      display:"flex", alignItems:"baseline", gap:10
    }}>
      <span style={{fontFamily:"var(--font-mono)", fontSize:18, color: child ? "var(--gold)" : "var(--ink)"}}>{count}×</span>
      <span style={{fontSize:13}}>{type}</span>
    </div>
  );
}

// ─── Step 3 — Passports ────────────────────────────────────────────
// Mock OCR — pretends to read a passport image and pre-fills the row.
// Deterministic by file name+size so repeated uploads of the same image
// produce the same fields (helps demo). The wizard sees nothing async beyond
// the delay and the resulting setPassenger call.
function mockOcr(file, role, depDate) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      // Seed off filename + size for stability.
      let seed = (file.name + "|" + file.size).split("").reduce((s,c)=>s+c.charCodeAt(0), 0) || 1;
      const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      const FN = ["Yacine","Amina","Karim","Nora","Sami","Hafsa","Mehdi","Rania","Tarek","Lila","Adel","Sofia","Ilyes","Yasmine","Anis","Salma","Bilal","Imen","Reda","Kahina"];
      const LN = ["Belaïd","Ould-Ali","Belkacem","Haddad","Brahimi","Mansouri","Cherif","Saadi","Ziani","Bouzid","Reza","Khelifi","Bensaid","Ait-Ali"];
      const fn = FN[Math.floor(rng() * FN.length)];
      const ln = LN[Math.floor(rng() * LN.length)];
      const passLetters = String.fromCharCode(65 + Math.floor(rng() * 26)) + String.fromCharCode(65 + Math.floor(rng() * 26));
      const passNum = 1000000 + Math.floor(rng() * 9000000);
      const isChild = role === "child";
      const yearLow  = isChild ? 2015 : 1970;
      const yearSpan = isChild ? 8 : 30;
      const year = yearLow + Math.floor(rng() * yearSpan);
      const month = 1 + Math.floor(rng() * 12);
      const day = 1 + Math.floor(rng() * 28);
      // Expiry: 60% are >2 years out, 30% are 1-2 years out, 10% are < 6 months out (to demo the warning).
      const depTs = depDate ? new Date(depDate).getTime() : Date.now();
      const offsetDays = rng() < 0.1 ? 90 + Math.floor(rng() * 90)
                        : rng() < 0.4 ? 365 + Math.floor(rng() * 365)
                        : 730 + Math.floor(rng() * 1095);
      const expiryTs = depTs + offsetDays * 24 * 60 * 60 * 1000;
      const exp = new Date(expiryTs);
      const dob = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const expIso = `${exp.getUTCFullYear()}-${String(exp.getUTCMonth()+1).padStart(2,'0')}-${String(exp.getUTCDate()).padStart(2,'0')}`;
      // Brief simulated delay so the "Scanning…" badge is visible.
      setTimeout(() => resolve({
        name: `${fn} ${ln}`,
        passport: `${passLetters}${passNum}`,
        nationality: "Algerian",
        dob,
        expiry: expIso,
        photo: dataUrl,
      }), 700);
    };
    reader.readAsDataURL(file);
  });
}
// Returns months remaining until the passport expires (from the trip departure).
function monthsUntilExpiry(expiryStr, depStr) {
  if (!expiryStr) return null;
  const exp = new Date(expiryStr);
  const dep = depStr ? new Date(depStr) : new Date();
  if (isNaN(exp.getTime()) || isNaN(dep.getTime())) return null;
  return (exp.getTime() - dep.getTime()) / (30 * 24 * 60 * 60 * 1000);
}

function Step3Passports({ trip, state, set }) {
  const passengers = state.passengers;
  const dep = trip ? (instanceForTrip(trip, state.dateIdx)?.departure || "") : "";
  const [scanningIdx, setScanningIdx] = React.useState(null);
  function update(i, patch) {
    const next = passengers.map((p, idx) => idx === i ? { ...p, ...patch } : p);
    set({ passengers: next });
  }
  async function handleFile(i, file, role) {
    if (!file) return;
    setScanningIdx(i);
    try {
      const fields = await mockOcr(file, role, dep);
      update(i, fields);
    } finally {
      setScanningIdx(null);
    }
  }

  return (
    <div className="wiz-section">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24}}>
        <div>
          <h2 className="wiz-section-title">Passport details</h2>
          <p className="wiz-section-sub">
            {passengers.length} passengers · upload a passport photo per traveler and we'll auto-fill the row. Names must match the passport exactly.
          </p>
        </div>
        <div style={{display:"flex", gap:10}}>
          <button className="btn btn-ghost"><window.Icon name="download" size={14}/>CSV template</button>
          <button className="btn btn-ghost"><window.Icon name="upload" size={14}/>Bulk upload</button>
        </div>
      </div>

      <div className="pax-list">
        <div className="pax-row head" style={{gridTemplateColumns:"32px 60px 1.4fr 1fr 1fr 1.1fr 70px"}}>
          <div>#</div>
          <div>Photo</div>
          <div>Full name (as on passport)</div>
          <div>Passport no.</div>
          <div>Nationality</div>
          <div>DOB · Expiry</div>
          <div style={{textAlign:"right"}}>Role</div>
        </div>
        {passengers.map((p, i) => {
          const months = monthsUntilExpiry(p.expiry, dep);
          const expiringSoon = months != null && months < 6;
          const isScanning = scanningIdx === i;
          return (
            <div key={i} className="pax-row" style={{gridTemplateColumns:"32px 60px 1.4fr 1fr 1fr 1.1fr 70px", alignItems:"center"}}>
              <div className="pax-idx">{String(i+1).padStart(2,"0")}</div>
              <div>
                <label style={{
                  display:"grid", placeItems:"center",
                  width:48, height:48,
                  border:"1px dashed var(--sand-line)",
                  borderRadius:"var(--r-sm)",
                  background: p.photo ? "transparent" : "var(--cream)",
                  cursor: isScanning ? "wait" : "pointer",
                  backgroundImage: p.photo ? `url(${p.photo})` : undefined,
                  backgroundSize:"cover", backgroundPosition:"center",
                  position:"relative",
                  opacity: isScanning ? 0.7 : 1,
                }}
                title={p.photo ? "Replace passport photo" : "Upload passport photo"}>
                  <input type="file" accept="image/*" style={{display:"none"}}
                         onChange={(e) => handleFile(i, e.target.files?.[0], p.role)}/>
                  {!p.photo && !isScanning && <window.Icon name="upload" size={14}/>}
                  {isScanning && (
                    <span className="mono" style={{
                      fontSize:9, letterSpacing:0.1+'em',
                      textTransform:"uppercase",
                      color:"var(--gold-deep)",
                      background:"rgba(255,255,255,0.85)",
                      padding:"2px 6px", borderRadius:3,
                    }}>OCR…</span>
                  )}
                  {p.photo && !isScanning && (
                    <span style={{
                      position:"absolute", bottom:-2, right:-2,
                      width:14, height:14, borderRadius:"50%",
                      background:"var(--ok)", color:"#fff",
                      display:"grid", placeItems:"center",
                      fontSize:9, border:"1.5px solid var(--paper)",
                    }}>✓</span>
                  )}
                </label>
              </div>
              <input className="ghost" placeholder={p.placeholder?.name || (p.role === "child" ? "Child name…" : "First Middle Last")}
                     value={p.name || ""} onChange={(e)=>update(i,{name:e.target.value})}/>
              <input className="ghost mono" placeholder={p.placeholder?.pass || "AB1234567"} value={p.passport || ""} onChange={(e)=>update(i,{passport:e.target.value})}/>
              <select className="ghost" value={p.nationality || ""} onChange={(e)=>update(i,{nationality:e.target.value})}>
                <option value="" disabled>—</option>
                {window.NATIONALITIES.map(n => <option key={n}>{n}</option>)}
              </select>
              <div style={{display:"flex", flexDirection:"column", gap:2}}>
                <input className="ghost mono" placeholder={p.placeholder?.dob || "YYYY-MM-DD"} value={p.dob || ""} onChange={(e)=>update(i,{dob:e.target.value})}/>
                <input className="ghost mono" placeholder="Expiry YYYY-MM-DD" value={p.expiry || ""} onChange={(e)=>update(i,{expiry:e.target.value})}/>
                {expiringSoon && (
                  <div className="mono" style={{
                    fontSize:9.5, letterSpacing:0.08+'em', textTransform:"uppercase",
                    color:"var(--danger)", marginTop:2,
                  }}>
                    ⚠ expires in {Math.max(0, Math.round(months))} months
                  </div>
                )}
              </div>
              <div style={{textAlign:"right"}}>
                <span className="role-tag" style={{color: p.role === "child" ? "var(--gold)" : "var(--ink-mute)"}}>{p.role}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4 — Rooms & Hotel ────────────────────────────────────────
// Room beds = physical beds. Adult-capacity is the same. Doubles allow ONE
// extra child sharing a bed (counted as a 3rd occupant for total/billing but
// not for adult capacity).
const ROOM_BEDS = { single: 1, double: 2, triple: 3 };
const ADULT_CAP = { single: 1, double: 2, triple: 3 };
// Compute how many MORE occupants a room can accept of a given role.
function spaceFor(room, role) {
  const adults = room.occupants.filter(o => o.role === "adult").length;
  const children = room.occupants.filter(o => o.role === "child").length;
  if (role === "adult") return Math.max(0, ADULT_CAP[room.type] - adults);
  // Children:
  if (room.type === "triple") return Math.max(0, 3 - room.occupants.length);
  if (room.type === "double") return Math.max(0, 1 - children); // one child sharing
  return 0; // singles never accept children
}
// Total occupancy cap (visible in /N chip). A Double = 2 adults + 1 sharing child.
const ROOM_CAP = { single: 1, double: 3, triple: 3 };
// Billing rules per the agency-facing model:
//   • Triple → ALL occupants bill at the triple rate (children in a Triple
//     are treated as adults — the agency doesn't need to think about it).
//   • Double → adults pay the double rate; a child sharing the Double pays
//     the flat child rate (the only place "child" rate applies).
//   • Single → 1 adult at the single rate.
function recomputeBilling(rooms) {
  return rooms.map(r => ({
    ...r,
    variant: r.type,
    occupants: r.occupants.map(o => ({
      ...o,
      billRate: r.type === "triple" ? "triple"
              : r.type === "single" ? "single"
              : (o.role === "child" ? "child" : "double"),
    })),
  }));
}
// Compute the unassigned pool — passengers not yet placed in any room.
function unassignedPool(state) {
  const placed = new Set();
  (state.rooms || []).forEach(r => r.occupants.forEach(o => placed.add(o.paxIdx)));
  return state.passengers
    .map((p, paxIdx) => ({ ...p, paxIdx }))
    .filter(p => !placed.has(p.paxIdx));
}
// Block the Continue button on Step 4 until everyone is placed and there are
// no per-room capacity / role errors.
function step4Ready(state) {
  if (unassignedPool(state).length > 0) return false;
  return (state.rooms || []).every(r => {
    const adults = r.occupants.filter(o => o.role === "adult").length;
    const children = r.occupants.filter(o => o.role === "child").length;
    const n = r.occupants.length;
    if (n === 0) return false;
    if (r.type === "single" && (n > 1 || children > 0)) return false;
    if (r.type === "double" && (adults > 2 || children > 1 || (children > 0 && adults < 2))) return false;
    if (r.type === "triple" && n > 3) return false;
    return true;
  });
}

function Step4Rooms({ trip, state, set }) {
  const tier = derivedTier(state.hotels);
  const rate = {
    single: tripRate(trip, state, "single"),
    double: tripRate(trip, state, "double"),
    triple: tripRate(trip, state, "triple"),
    child:  tripRate(trip, state, "child"),
  };
  const rooms = state.rooms || generateRooms(state.passengers);

  function commit(nextRooms) { set({ rooms: recomputeBilling(nextRooms) }); }
  function changeType(roomIdx, type) {
    commit(rooms.map((r, i) => i === roomIdx ? { ...r, type } : r));
  }
  function moveOccupant(paxIdx, fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    let moving = null;
    const next = rooms.map((r, i) => {
      if (i !== fromIdx) return r;
      const remaining = [];
      for (const o of r.occupants) {
        if (o.paxIdx === paxIdx) moving = o; else remaining.push(o);
      }
      return { ...r, occupants: remaining };
    });
    if (!moving) return;
    next[toIdx] = { ...next[toIdx], occupants: [...next[toIdx].occupants, moving] };
    commit(next);
  }
  function addRoom(type = "double") {
    commit([...rooms, { type, variant: type, occupants: [] }]);
  }
  // Apply a quick preset layout to the current passengers.
  function applyPreset(preset) {
    const list = state.passengers;
    if (preset === "auto") { commit(generateRooms(list).map(r => r).map(r => r)); return; }
    if (preset === "doubles") {
      // Adults paired in doubles + kids shared one per double; odd adult → triple.
      const adults = list.map((p, i) => ({...p, paxIdx: i})).filter(p => p.role === "adult");
      const kids = list.map((p, i) => ({...p, paxIdx: i})).filter(p => p.role === "child");
      const out = [];
      let ai = 0, ki = 0;
      while (adults.length - ai >= 2) {
        const room = { type: "double", variant: "double", occupants: [toOcc(adults[ai]), toOcc(adults[ai+1])] };
        ai += 2;
        if (ki < kids.length) { room.occupants.push(toOcc(kids[ki])); ki++; }
        out.push(room);
      }
      if (ai < adults.length) out.push({ type: "double", variant: "double", occupants: [toOcc(adults[ai])] });
      while (ki < kids.length) {
        const batch = kids.slice(ki, ki + 3);
        out.push({ type: "triple", variant: "triple", occupants: batch.map(toOcc) });
        ki += batch.length;
      }
      commit(out);
      return;
    }
    if (preset === "triples") {
      // Pack everyone into triples — children fill in as adults.
      const all = list.map((p, i) => ({...p, paxIdx: i}));
      const out = [];
      for (let i = 0; i < all.length; i += 3) {
        out.push({ type: "triple", variant: "triple", occupants: all.slice(i, i + 3).map(toOcc) });
      }
      commit(out);
      return;
    }
    if (preset === "singles") {
      // One person per room — adults in singles, children must share so any
      // remaining children get grouped into doubles/triples.
      const adults = list.map((p, i) => ({...p, paxIdx: i})).filter(p => p.role === "adult");
      const kids = list.map((p, i) => ({...p, paxIdx: i})).filter(p => p.role === "child");
      const out = adults.map(a => ({ type: "single", variant: "single", occupants: [toOcc(a)] }));
      // Children: distribute into doubles, max 1 per double; assign to existing adult singles by converting them.
      let ki = 0;
      for (const room of out) {
        if (ki < kids.length && room.type === "single") {
          room.type = "double"; room.variant = "double";
          room.occupants.push(toOcc(kids[ki]));
          ki++;
        }
      }
      while (ki < kids.length) {
        const batch = kids.slice(ki, ki + 3);
        out.push({ type: "triple", variant: "triple", occupants: batch.map(toOcc) });
        ki += batch.length;
      }
      commit(out);
      return;
    }
  }
  function removeRoom(idx) {
    if (rooms.length <= 1) return;
    const removed = rooms[idx];
    const survivors = rooms.filter((_, i) => i !== idx);
    if (removed.occupants.length) {
      survivors[0] = { ...survivors[0], occupants: [...survivors[0].occupants, ...removed.occupants] };
    }
    commit(survivors);
  }
  function resetAuto() { commit(generateRooms(state.passengers)); }

  // Agency-friendly validation:
  //   • Single must hold exactly 1 adult — no children, no extras.
  //   • Double holds 2 adults; one child may share (3 occupants, 2 beds).
  //   • Triple holds 3 occupants (any mix; children count as adults here).
  const issues = rooms.map(r => {
    const adults = r.occupants.filter(o => o.role === "adult").length;
    const children = r.occupants.filter(o => o.role === "child").length;
    const n = r.occupants.length;
    if (n === 0) return { kind: "empty", msg: "Empty room — move someone in or remove the room.", tone: "info" };
    if (r.type === "single") {
      if (n > 1) return { kind: "over", msg: `Singles hold one adult — move ${n - 1} occupant${n - 1 === 1 ? "" : "s"} out or change this to a Double or Triple.`, tone: "error" };
      if (children > 0) return { kind: "child", msg: "Children can't stay alone in a Single — move them into a Double or Triple.", tone: "error" };
    }
    if (r.type === "double") {
      if (adults > 2) return { kind: "over", msg: `A Double holds 2 adults — move ${adults - 2} adult${adults - 2 === 1 ? "" : "s"} into a Triple.`, tone: "error" };
      if (children > 1) return { kind: "child", msg: "Only one child can share a Double — move extras to a Triple.", tone: "error" };
      if (children > 0 && adults < 2) return { kind: "child", msg: "A child sharing a Double needs two adults in the room.", tone: "warn" };
    }
    if (r.type === "triple") {
      if (n > 3) return { kind: "over", msg: `A Triple holds 3 occupants — currently ${n}/3.`, tone: "error" };
    }
    return null;
  });

  // Pool of travelers not yet placed in any room. Step 4 advances only when
  // this is empty AND no rooms have validation issues.
  const pool = unassignedPool(state);
  const counts = billCounts(rooms);
  const totalSoFar =
    counts.single * rate.single +
    counts.double * rate.double +
    counts.triple * rate.triple +
    counts.child  * rate.child;
  const typeCounts = rooms.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, { single: 0, double: 0, triple: 0 });
  const totalBeds = rooms.reduce((s, r) => s + (ROOM_BEDS[r.type] || 0), 0);
  const totalCap  = rooms.reduce((s, r) => s + (ROOM_CAP[r.type]  || 0), 0);
  const totalAssigned = rooms.reduce((s, r) => s + r.occupants.length, 0);
  const totalNeeded = state.passengers.length;
  const ready = pool.length === 0 && rooms.every((_, i) => !issues[i] || issues[i].tone === "info");

  function placeInPool(roomIdx, paxIdx) {
    // Send a placed occupant back to the unassigned pool.
    commit(rooms.map((r, i) => i === roomIdx
      ? { ...r, occupants: r.occupants.filter(o => o.paxIdx !== paxIdx) }
      : r
    ));
  }
  function placeInRoom(paxIdx, roomIdx) {
    const pax = pool.find(p => p.paxIdx === paxIdx);
    if (!pax) return;
    commit(rooms.map((r, i) => i === roomIdx
      ? { ...r, occupants: [...r.occupants, toOcc(pax)] }
      : r
    ));
  }
  function autoPlaceFromPool() {
    // Honour the agency's chosen layout. Fill adults into rooms first (respecting
    // each room's ADULT_CAP), then slot children: one child per Double as a
    // sharing +1, remaining children into Triples.
    let working = rooms.map(r => ({ ...r, occupants: [...r.occupants] }));
    let adults = pool.filter(p => p.role === "adult");
    let kids   = pool.filter(p => p.role === "child");

    // Pass 1 — seat adults
    for (const r of working) {
      while (spaceFor(r, "adult") > 0 && adults.length > 0) {
        const pax = adults.shift();
        r.occupants.push(toOcc(pax));
      }
    }
    // Pass 2 — slot kids
    // Prefer triples first (they don't require an adult anchor), then doubles with 2 adults.
    for (const r of working) {
      if (r.type !== "triple") continue;
      while (spaceFor(r, "child") > 0 && kids.length > 0) {
        r.occupants.push(toOcc(kids.shift()));
      }
    }
    for (const r of working) {
      if (r.type !== "double") continue;
      const adultsInRoom = r.occupants.filter(o => o.role === "adult").length;
      if (adultsInRoom < 2) continue; // child sharing needs 2 adults
      while (spaceFor(r, "child") > 0 && kids.length > 0) {
        r.occupants.push(toOcc(kids.shift()));
      }
    }
    // If pax still remain, fall through to the auto algorithm on those.
    const remaining = [...adults, ...kids];
    if (remaining.length > 0) {
      const extras = generateRooms(remaining.map(p => ({ name: p.name, role: p.role, paxIdx: p.paxIdx })));
      working = [...working, ...extras];
    }
    commit(working);
  }

  return (
    <div className="wiz-section">
      <h2 className="wiz-section-title">Room assignment</h2>
      <p className="wiz-section-sub">
        Build your room layout first, then place each traveler into a room. A <strong>Triple</strong> holds 3 occupants; a child filling the third bed is billed at the triple rate. A <strong>Double</strong> holds 2 adults plus 1 optional child sharing.
      </p>

      {/* Picked hotels summary — chosen in step 1 */}
      <div className="block">
        <div className="block-title">
          <span className="index">A.</span>
          <h3>Hotels</h3>
          <span className="eyebrow" style={{marginLeft:"auto"}}>{window.stars(tier)} {tier === 3 ? "Comfort" : tier === 4 ? "Premium" : "Luxury"} overall</span>
        </div>
        <div className="selected-hotels">
          {trip.segments.map(seg => {
            const h = window.hotelById(seg.city, state.hotels[seg.city]);
            if (!h) return null;
            return (
              <div key={seg.city} className="selected-hotel-row">
                <div className="sh-city">
                  <div className="sh-city-name">{seg.city}</div>
                  <div className="sh-city-nights">{seg.nights} nights</div>
                </div>
                <div className="sh-hotel">
                  <div className="sh-hotel-name">
                    <span className="hc-stars">{window.stars(h.stars)}</span>
                    {h.name}
                  </div>
                  <div className="sh-hotel-rate">
                    {window.fmtCur(h.perNight.double * seg.nights)} <span style={{color:"var(--ink-mute)"}}>per pax, double</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:12, fontSize:12, color:"var(--ink-mute)"}}>
          To change a hotel, return to <strong style={{color:"var(--ink)"}}>Step 1</strong>. Pricing updates live across all steps.
        </div>
      </div>

      {/* Step B.1 — Build room layout */}
      <div className="block">
        <div className="block-title" style={{alignItems:"center"}}>
          <span className="index">B.</span>
          <h3>Build your room layout</h3>
          <span className="eyebrow" style={{marginLeft:"auto"}}>
            {totalBeds} beds · {totalCap} occupancy · {totalAssigned}/{totalNeeded} placed
          </span>
        </div>
        <p className="form-hint" style={{margin:"6px 0 14px"}}>
          Decide how many rooms of each type you need, then place each traveler into a room below. Counts must cover your {totalNeeded} traveler{totalNeeded === 1 ? "" : "s"}.
        </p>

        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12, marginBottom:14}}>
          {[
            { id: "single", label: "Single",  beds: 1, hint: "1 adult, 1 bed" },
            { id: "double", label: "Double",  beds: 2, hint: "2 adults · +1 child can share" },
            { id: "triple", label: "Triple",  beds: 3, hint: "3 occupants · cheapest per pax" },
          ].map(t => (
            <div key={t.id} style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"14px 16px",
              border:"1px solid var(--sand-line)",
              borderRadius:"var(--r-sm)",
              background:"var(--paper)",
            }}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:14, fontWeight:500, letterSpacing:"-0.005em"}}>{t.label}</div>
                <div className="muted" style={{fontSize:11.5, color:"var(--ink-mute)", marginTop:2}}>{t.hint}</div>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <button
                  type="button"
                  onClick={() => {
                    // Remove an empty room of this type first; else send the first room's
                    // occupants to the pool and drop the room.
                    const idx = rooms.findIndex(r => r.type === t.id && r.occupants.length === 0);
                    if (idx >= 0) commit(rooms.filter((_, i) => i !== idx));
                    else {
                      const fallback = rooms.findIndex(r => r.type === t.id);
                      if (fallback >= 0) commit(rooms.filter((_, i) => i !== fallback));
                    }
                  }}
                  disabled={(typeCounts[t.id] || 0) === 0}
                  className="row-action"
                  style={{borderRadius:"50%"}}
                  title={`Remove a ${t.label}`}>
                  <window.Icon name="minus" size={12}/>
                </button>
                <span className="mono" style={{
                  minWidth:24, textAlign:"center",
                  fontSize:15, fontWeight:600, fontFamily:"var(--font-mono)",
                  color: (typeCounts[t.id] || 0) > 0 ? "var(--ink)" : "var(--ink-faint)",
                }}>
                  {typeCounts[t.id] || 0}
                </span>
                <button
                  type="button"
                  onClick={() => addRoom(t.id)}
                  className="row-action"
                  style={{borderRadius:"50%"}}
                  title={`Add a ${t.label}`}>
                  <window.Icon name="plus" size={12}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:6}}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={autoPlaceFromPool} disabled={pool.length === 0}>
            <window.Icon name="check" size={11}/>Auto-place pool
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={resetAuto} title="Discard the current layout and let the system build a default mix.">
            Suggested layout
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => commit([])} disabled={rooms.length === 0}>
            Clear all rooms
          </button>
          <div style={{flex:1}}/>
          <span className="mono" style={{fontSize:10.5, letterSpacing:0.16+'em', textTransform:"uppercase", color:"var(--ink-mute)", alignSelf:"center"}}>
            Quick layouts
          </span>
          {[
            { id: "auto",    label: "Auto",          hint: "Recommended mix" },
            { id: "doubles", label: "All doubles",   hint: "Pair adults; kids share" },
            { id: "triples", label: "Pack triples",  hint: "3 per room, cheaper per pax" },
          ].map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              title={preset.hint}
              style={{
                font:"inherit", fontSize:12,
                padding:"6px 12px",
                border:"1px solid var(--sand-line)", borderRadius:999,
                background:"var(--paper)", color:"var(--ink-soft)",
                cursor:"pointer",
              }}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step B.2 — Unassigned travelers */}
      <div className="block" style={{marginTop:14}}>
        <div className="block-title" style={{alignItems:"center"}}>
          <span className="index">C.</span>
          <h3>Unassigned travelers</h3>
          <span className="eyebrow" style={{marginLeft:"auto", color: pool.length > 0 ? "var(--warn)" : "var(--ok)"}}>
            {pool.length} of {totalNeeded} not placed
          </span>
        </div>
        {pool.length === 0 ? (
          <div className="empty" style={{padding:"24px 0", color:"var(--ok)"}}>
            <window.Icon name="check" size={14}/> All travelers placed — ready to continue.
          </div>
        ) : rooms.length === 0 ? (
          <div className="empty" style={{padding:"24px 0", color:"var(--ink-mute)"}}>
            No rooms yet. Add a Single, Double, or Triple above, then come back here to place each traveler.
          </div>
        ) : (
          <div style={{display:"flex", flexWrap:"wrap", gap:8, padding:"6px 0"}}>
            {pool.map(p => (
              <div key={p.paxIdx} style={{
                display:"inline-flex", alignItems:"center", gap:8,
                padding:"6px 12px",
                border:"1px solid var(--sand-line)",
                borderRadius:999,
                background: p.role === "child" ? "rgba(176,130,58,0.06)" : "var(--paper)",
              }}>
                <span style={{
                  width:24, height:24, borderRadius:"50%",
                  background:"var(--ink)", color:"var(--parchment)",
                  display:"grid", placeItems:"center",
                  fontSize:10.5, fontFamily:"var(--font-mono)", letterSpacing:0.02+'em',
                }}>
                  {toOcc(p).initials}
                </span>
                <span style={{fontSize:13}}>{p.name}</span>
                <span className="mono" style={{
                  fontSize:9.5, letterSpacing:0.12+'em', textTransform:"uppercase",
                  color: p.role === "child" ? "var(--gold-deep)" : "var(--ink-mute)",
                }}>
                  {p.role === "child" ? "Child" : "Adult"}
                </span>
                <select
                  value=""
                  onChange={(e) => placeInRoom(p.paxIdx, parseInt(e.target.value))}
                  style={{
                    font:"inherit", fontSize:11,
                    border:"1px solid var(--sand-line)",
                    borderRadius:999,
                    padding:"3px 22px 3px 10px",
                    background:"var(--cream)", color:"var(--ink)", cursor:"pointer",
                    appearance:"none",
                    backgroundImage:"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5'><path fill='%235E6B82' d='M0 0h8L4 5z'/></svg>\")",
                    backgroundRepeat:"no-repeat", backgroundPosition:"right 7px center",
                  }}>
                  <option value="" disabled>Place in…</option>
                  {rooms.map((r, ri) => {
                    const cap = ROOM_CAP[r.type] || 2;
                    const noSpace = spaceFor(r, p.role) === 0;
                    const label = `Room ${String(ri+1).padStart(2,'0')} · ${r.type[0].toUpperCase()}${r.type.slice(1)} (${r.occupants.length}/${cap})`;
                    let suffix = "";
                    if (noSpace) {
                      if (r.type === "single") suffix = p.role === "child" ? " · adults only" : " · full";
                      else if (r.type === "double" && p.role === "child") suffix = " · child seat used";
                      else suffix = " · full";
                    }
                    return <option key={ri} value={ri} disabled={noSpace}>{label}{suffix}</option>;
                  })}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step B.3 — Built rooms */}
      <div className="block" style={{marginTop:14}}>
        <div className="block-title" style={{alignItems:"center"}}>
          <span className="index">D.</span>
          <h3>Your rooms</h3>
          <span className="eyebrow" style={{marginLeft:"auto"}}>
            running total · <strong style={{color:"var(--ink)"}}>{window.fmtCur(totalSoFar)}</strong>
          </span>
        </div>
        {rooms.length === 0 ? (
          <div className="empty" style={{padding:"40px 0"}}>
            No rooms in the layout yet. Use <strong>Build your room layout</strong> above or click <strong>Suggested layout</strong> to seed a default mix.
          </div>
        ) : (
        <>
        <div className="rooms">
          {rooms.map((room, i) => {
            const cap = ROOM_CAP[room.type] || 2;
            const typeLabel = room.type[0].toUpperCase() + room.type.slice(1);
            const occCount = room.occupants.length;
            const total = room.occupants.reduce((s, o) => s + rate[o.billRate], 0);
            const overCap = occCount > cap;
            const issue = issues[i];
            const tripleHasChild = room.type === "triple" && room.occupants.some(o => o.role === "child");
            return (
              <div key={i} className={"room " + (tripleHasChild ? "room-warn-mode" : "") + (issue?.tone === "error" ? " room-error" : "")}>
                <div className="room-type" style={{display:"flex", alignItems:"center", gap:10}}>
                  <span className="room-type-label">Room {String(i+1).padStart(2,"0")}</span>
                  <select
                    value={room.type}
                    onChange={(e) => changeType(i, e.target.value)}
                    style={{
                      font:"inherit", fontSize:13.5, fontWeight:500, letterSpacing:"-0.005em",
                      padding:"4px 26px 4px 10px",
                      border:"1px solid var(--sand-line)",
                      borderRadius:"var(--r-sm)",
                      background:"var(--paper)", color:"var(--ink)", cursor:"pointer",
                      appearance:"none",
                      backgroundImage:"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path fill='%235E6B82' d='M0 0h10L5 6z'/></svg>\")",
                      backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
                    }}>
                    <option value="single">Single (1 bed)</option>
                    <option value="double">Double (2 beds)</option>
                    <option value="triple">Triple (3 beds)</option>
                  </select>
                  <span className="muted mono" style={{fontSize:11, letterSpacing:0.06+'em', color: overCap ? "var(--danger)" : "var(--ink-mute)"}}>
                    {occCount}/{cap}
                  </span>
                  <button
                    type="button"
                    className="row-action danger"
                    style={{marginLeft:"auto"}}
                    title="Remove this room — occupants return to the unassigned pool."
                    onClick={() => {
                      // Drop the room; occupants land in the pool automatically.
                      commit(rooms.filter((_, idx) => idx !== i));
                    }}>
                    <window.Icon name="close" size={12}/>
                  </button>
                </div>
                <div className="room-occupants">
                  {room.occupants.length === 0 && (
                    <span className="muted" style={{fontSize:12.5, fontStyle:"italic", color:"var(--ink-mute)"}}>
                      Empty {cap === 1 ? "single" : `· ${cap} seat${cap === 1 ? "" : "s"} open`} — pick someone from the pool above.
                    </span>
                  )}
                  {room.occupants.map((o, j) => {
                    const showAsAdult = room.type === "triple";
                    const displayRole = showAsAdult ? "adult" : o.role;
                    return (
                    <span key={`${o.paxIdx}-${j}`} className={"occupant " + (displayRole === "child" ? "child" : "")}>
                      <span className="occupant-dot">{o.initials}</span>
                      <span className="occupant-name">{o.name}</span>
                      <span style={{
                        fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:0.08+'em',
                        textTransform:"uppercase", color: displayRole === "child" ? "var(--gold-deep)" : "var(--ink-mute)",
                        marginLeft:6,
                      }}>
                        {displayRole === "child" ? "Child" : "Adult"}
                      </span>
                      <button
                        type="button"
                        title="Remove from this room (returns to the pool)"
                        onClick={(e) => { e.stopPropagation(); placeInPool(i, o.paxIdx); }}
                        style={{
                          marginLeft:6, border:"none", background:"transparent",
                          color:"var(--ink-faint)", cursor:"pointer", padding:2,
                          display:"inline-flex", alignItems:"center",
                        }}>
                        <window.Icon name="close" size={11}/>
                      </button>
                    </span>
                    );
                  })}
                </div>
                <div className="room-price">
                  <span className="total">{window.fmtCur(total)}</span>
                  <span>{occCount} &times; occupants</span>
                </div>
                {issue && (
                  <div className="room-warn" role="note" style={issue.tone === "error" ? {color:"var(--danger)"} : undefined}>
                    <span className="room-warn-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <circle cx="12" cy="12" r="9"/>
                        <path d="M12 8v4"/>
                        <circle cx="12" cy="16" r="0.6" fill="currentColor"/>
                      </svg>
                    </span>
                    <span>{issue.msg}</span>
                  </div>
                )}
                {!issue && room.type === "triple" && room.occupants.some(o => o.role === "child") && (
                  <div className="room-warn" role="note">
                    <span className="room-warn-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <circle cx="12" cy="12" r="9"/>
                        <path d="M12 8v4"/>
                        <circle cx="12" cy="16" r="0.6" fill="currentColor"/>
                      </svg>
                    </span>
                    <span>Triple rooms count children as adults &middot; everyone in this room bills at the triple rate ({window.fmtCur(rate.triple)}).</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{marginTop:14, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12}}>
          <button type="button" className="btn btn-quiet btn-sm" onClick={addRoom}>
            <window.Icon name="plus" size={11}/>Add a Double
          </button>
          <div className="muted" style={{fontSize:12, color:"var(--ink-mute)"}}>
            Use the room-type counters at the top to build the layout exactly to your group's needs.
          </div>
        </div>
        </>
        )}
      </div>

      {/* Continue gate */}
      {!ready && (
        <div className="block" style={{
          marginTop:14, padding:"14px 18px",
          background:"rgba(162,106,31,0.06)",
          borderColor:"rgba(162,106,31,0.30)",
        }}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <span style={{
              width:8, height:8, borderRadius:"50%", background:"var(--warn)", flexShrink:0,
            }}/>
            <div style={{flex:1, fontSize:13, color:"var(--ink-soft)"}}>
              {pool.length > 0
                ? <>You still have <strong>{pool.length} traveler{pool.length === 1 ? "" : "s"}</strong> to place in a room before you can continue.</>
                : "Fix the highlighted room issues above to continue."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Room placement rules:
//
//   • A child WITHOUT their own bed (`ownBed=false`, default) is placed in a
//     Double together with two adults. The room is still called a Double
//     (2 beds) — the child shares — and the child is billed at the flat
//     child rate; the two adults pay the per-pax double rate.
//
//   • A child WITH their own bed (`ownBed=true`) must be placed in a Triple
//     alongside two adults. In that room the child is counted and priced
//     as an adult at the triple rate — NOT the child rate. Step 4 surfaces
//     this with a warning note on the room.
//
//   • Remaining adults pair into Doubles; an odd remainder becomes a Triple
//     of three adults rather than leaving a lone Single.
//
// Each occupant carries a `billRate` so price aggregation downstream is a
// straight sum: single | double | triple | child. A child in own-bed mode
// gets `billRate: "triple"` so the line items reflect adult-triple billing.
// Auto layout: adults pair into doubles (with one child slotted in per double
// as a +1 sharing). Odd adult starts a triple. Leftover children fill triples.
function generateRooms(passengers) {
  const indexed = passengers.map((p, paxIdx) => ({ ...p, paxIdx }));
  const adults  = indexed.filter(p => p.role === "adult");
  const kids    = indexed.filter(p => p.role === "child");

  const rooms = [];
  let ai = 0, ki = 0;

  // 1) Pair adults into Doubles; slot a sharing child in if any are left.
  while (adults.length - ai >= 2) {
    const room = { type: "double", variant: "double", occupants: [toOcc(adults[ai]), toOcc(adults[ai+1])] };
    ai += 2;
    if (ki < kids.length) { room.occupants.push(toOcc(kids[ki])); ki++; }
    rooms.push(room);
  }

  // 2) Odd adult remaining → start a Triple, fill the other two seats with
  //    leftover children (each child counts as adult-billed in a Triple).
  if (ai < adults.length) {
    const room = { type: "triple", variant: "triple", occupants: [toOcc(adults[ai])] };
    ai++;
    while (room.occupants.length < 3 && ki < kids.length) {
      room.occupants.push(toOcc(kids[ki]));
      ki++;
    }
    rooms.push(room);
  }

  // 3) Any kids left → group three at a time into Triples (still adult-billed).
  while (ki < kids.length) {
    const batch = kids.slice(ki, ki + 3);
    rooms.push({ type: "triple", variant: "triple", occupants: batch.map(toOcc) });
    ki += batch.length;
  }

  return recomputeBilling(rooms);
}

// Aggregate occupant counts by their billing bucket. Triples roll every
// occupant (including children) into the `triple` bucket — agencies see a
// single Triple line item, never a "child in triple" caveat.
function billCounts(rooms) {
  const c = { single: 0, double: 0, triple: 0, child: 0 };
  rooms.forEach(r => r.occupants.forEach(o => { c[o.billRate]++; }));
  return c;
}

function toOcc(p) {
  const initials = (p.name || (p.role === "child" ? "Ch" : "Ad"))
    .split(/\s+/).map(s => s[0] || "").join("").slice(0,2).toUpperCase();
  return {
    name: p.name || (p.role === "child" ? "Child" : "Adult"),
    role: p.role,
    initials,
    paxIdx: p.paxIdx,   // index into state.passengers — drives the bed-mode toggle
    ownBed: p.ownBed,
  };
}

// ─── Step 5 — Review ───────────────────────────────────────────────
function Step5Review({ trip, state, bookingRef }) {
  const tier = derivedTier(state.hotels);
  const rooms = state.rooms || generateRooms(state.passengers);
  const rate = {
    single: tripRate(trip, state, "single"),
    double: tripRate(trip, state, "double"),
    triple: tripRate(trip, state, "triple"),
    child:  tripRate(trip, state, "child"),
  };

  // Aggregate by billing bucket. Triples roll children into the adult-triple
  // bucket so the line items stay simple.
  const counts = billCounts(rooms);

  const lines = [
    { lbl: "Single rooms",                     n: counts.single, rate: rate.single },
    { lbl: "Double rooms (per adult)",         n: counts.double, rate: rate.double },
    { lbl: "Triple rooms (per occupant)",      n: counts.triple, rate: rate.triple },
    { lbl: "Children sharing in a Double",     n: counts.child,  rate: rate.child  },
  ].filter(l => l.n > 0);

  const total = lines.reduce((s,l) => s + l.n * l.rate, 0);
  const _dep = departuresForTrip(trip)[state.dateIdx] || null;
  const date = _dep?.date || "—";

  return (
    <div className="wiz-section">
      <h2 className="wiz-section-title">Review &amp; submit</h2>
      <p className="wiz-section-sub">
        On submission, a hold is placed against the run inventory and a booking reference is generated. Payment is handled offline.
      </p>

      {/* Snapshot */}
      <div className="block">
        <div className="block-title">
          <span className="index">A.</span>
          <h3>Trip snapshot</h3>
          <button className="btn btn-sm btn-quiet" style={{marginLeft:"auto"}}><window.Icon name="edit" size={12}/>Edit</button>
        </div>
        <div className="kv">
          <div><div className="lbl">Trip</div><div className="v">{trip.name}</div></div>
          <div><div className="lbl">Reference, pending</div><div className="v mono">{bookingRef}</div></div>
          <div><div className="lbl">Departure</div><div className="v">{date}</div></div>
          <div><div className="lbl">Return</div><div className="v">{_dep ? addNightsToDate(_dep.date, _dep.nights) : "—"}</div></div>
          <div><div className="lbl">Itinerary</div><div className="v">{_dep?.direction || "—"}</div></div>
          <div><div className="lbl">Travelers</div><div className="v">{state.adults} adults, {state.children} children</div></div>
          <div><div className="lbl">Hotel mix</div><div className="v">{window.stars(tier)} overall · {trip.segments.map(s => { const h = window.hotelById(s.city, state.hotels[s.city]); return h ? h.name : "—"; }).join(" · ")}</div></div>
        </div>
      </div>

      <div className="block">
        <div className="block-title">
          <span className="index">B.</span>
          <h3>Price breakdown</h3>
        </div>

        <table className="tbl" style={{borderRadius:0}}>
          <thead>
            <tr>
              <th>Line</th>
              <th className="num">Pax</th>
              <th className="num">Rate</th>
              <th className="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} style={{cursor:"default"}}>
                <td>{l.lbl}</td>
                <td className="num">{l.n}</td>
                <td className="num">{window.fmtCur(l.rate)}</td>
                <td className="num">{window.fmtCur(l.n * l.rate)}</td>
              </tr>
            ))}
            <tr style={{background:"var(--ivory-soft)", cursor:"default"}}>
              <td style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:0.1+'em', textTransform:"uppercase", color:"var(--ink-mute)"}}>Grand total</td>
              <td></td>
              <td></td>
              <td className="num" style={{fontSize:20, letterSpacing:"-0.02em"}}>{window.fmtCur(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="block" style={{display:"flex", gap:12, alignItems:"flex-start"}}>
        <div style={{width:24, height:24, marginTop:1, borderRadius:6, border:"1.5px solid var(--ink)", display:"grid", placeItems:"center", flexShrink:0}}>
          <window.Icon name="check" size={14}/>
        </div>
        <div>
          <div style={{fontSize:14, fontWeight:500, marginBottom:4}}>I confirm the passport details are accurate.</div>
          <div style={{fontSize:13, color:"var(--ink-mute)", lineHeight:1.5}}>
            Booking reference and voucher will be generated on submission. The Nilvoya team will verify documents and confirm within one business day.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Wizard host ───────────────────────────────────────────────────
function WizardScreen({ trip, go, openBookingFromWizard }) {
  const [step, setStep] = React.useState(1);
  const [submitted, setSubmitted] = React.useState(false);
  const [state, setState] = React.useState(() => {
    const firstInstance = instanceForTrip(trip, 0);
    // Default to an empty group — the agency increments adults/children in Step 2.
    const passengers = makePassengers(0, 0);
    return {
      dateIdx: 0,
      adults: 0,
      children: 0,
      hotels: defaultHotelPicks(trip, firstInstance),
      passengers,
      rooms: [], // Agency builds the room layout in Step 4 and assigns pax to slots.
    };
  });
  const ref = React.useMemo(() => (window.generateBookingRef ? window.generateBookingRef() : "NLV-" + Math.random().toString(36).slice(2,6).toUpperCase() + "-" + Math.floor(100 + Math.random()*900)), [trip]);

  function set(patch) {
    setState(s => {
      const next = { ...s, ...patch };
      if (patch.adults !== undefined || patch.children !== undefined) {
        next.passengers = makePassengers(next.adults, next.children, s.passengers);
        // Pax count changed → strip any room placements that reference removed
        // passengers, but keep the room slots the agency built. New pax land in
        // the unassigned pool until the agency places them.
        const validIdxs = new Set(next.passengers.map((_, i) => i));
        next.rooms = (s.rooms || []).map(r => ({
          ...r,
          occupants: r.occupants.filter(o => validIdxs.has(o.paxIdx)),
        }));
      }
      if (patch.dateIdx !== undefined && patch.dateIdx !== s.dateIdx) {
        // Re-default the hotel picks to ones actually assigned in the new instance.
        const newInstance = instanceForTrip(trip, patch.dateIdx);
        next.hotels = defaultHotelPicks(trip, newInstance);
      }
      return next;
    });
  }

  // Shared builder: returns the booking record for either submit or hold.
  function buildBookingRecord({ status, holdExpiresAt }) {
    const tier = derivedTier(state.hotels);
    const rooms = state.rooms || generateRooms(state.passengers);
    const rate = {
      single: tripRate(trip, state, "single"),
      double: tripRate(trip, state, "double"),
      triple: tripRate(trip, state, "triple"),
      child:  tripRate(trip, state, "child"),
    };
    const counts = billCounts(rooms);
    const total = counts.single * rate.single
                + counts.double * rate.double
                + counts.triple * rate.triple
                + counts.child  * rate.child;
    const instances = (window.instancesForTemplate ? window.instancesForTemplate(trip.id) : []) || [];
    const instance = instances[state.dateIdx] || instances[0] || null;
    const SESSION = { agencyId: "agc-001", lead: "Yacine Belaïd" };
    const today = (() => {
      const d = new Date(2026, 4, 21);
      return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    })();
    return {
      ref,
      agencyId: SESSION.agencyId,
      instanceId: instance?.id || trip.id,
      pax: { adults: state.adults, children: state.children },
      status,
      total,
      submitted: today,
      lead: SESSION.lead,
      ...(holdExpiresAt ? { holdExpiresAt } : {}),
    };
  }
  function handleSubmit() {
    try {
      const booking = buildBookingRecord({ status: "submitted" });
      if (window.saveBooking) window.saveBooking(booking);
    } catch (err) {
      console.error("[wizard] failed to persist booking", err);
    }
    setSubmitted({ kind: "submitted" });
  }
  // Pre-reserve: soft 48-hour hold. Auto-cancels server-side if not promoted to
  // submitted before the timer runs out (handled by masriva-data on next load).
  function handlePreReserve() {
    try {
      const holdMs = (window.HOLD_MS != null) ? window.HOLD_MS : 48 * 60 * 60 * 1000;
      const holdExpiresAt = Date.now() + holdMs;
      const booking = buildBookingRecord({ status: "hold", holdExpiresAt });
      if (window.saveBooking) window.saveBooking(booking);
      setSubmitted({ kind: "hold", holdExpiresAt });
    } catch (err) {
      console.error("[wizard] failed to persist pre-reservation", err);
      setSubmitted({ kind: "hold" });
    }
  }

  if (submitted) {
    return <Confirmation
      trip={trip}
      bookingRef={ref}
      state={state}
      go={go}
      openBookingFromWizard={openBookingFromWizard}
      submission={submitted}
    />;
  }

  return (
    <>
      {/* Floating exit — no nav bar, single way back. */}
      <button type="button" className="wiz-close-fab" onClick={() => go("trips")} title="Cancel and return to trips">
        <window.Icon name="close" size={14}/>
        <span>Exit booking</span>
      </button>

      <div className="page">
        <window.PageHeader
          eyebrow={`Booking · ${ref}`}
          num={"03"}
          title={trip.name}
          lede={
            <>Configure the booking step-by-step. Held inventory expires after 30 minutes of inactivity.</>
          }
        />

        <div className="wiz">
          <div className="wiz-main">
            <Stepper current={step}/>

            {step === 1 && <Step1Departure trip={trip} state={state} set={set}/>}
            {step === 2 && <Step2Pax state={state} set={set}/>}
            {step === 3 && <Step3Passports trip={trip} state={state} set={set}/>}
            {step === 4 && <Step4Rooms trip={trip} state={state} set={set}/>}
            {step === 5 && <Step5Review trip={trip} state={state} bookingRef={ref}/>}

            <div className="wiz-foot">
              <button className="btn btn-quiet" onClick={() => step > 1 ? setStep(step-1) : go("trips")}>
                <window.Icon name="arrowLeft" size={14}/>{step > 1 ? "Back" : "Cancel"}
              </button>
              {step < 5 ? (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => setStep(step+1)}
                  disabled={
                    (step === 2 && (state.adults + state.children) === 0) ||
                    (step === 4 && !step4Ready(state))
                  }>
                  Continue to {STEPS[step].title.toLowerCase()} <window.Icon name="arrowRight" size={14}/>
                </button>
              ) : (
                <div style={{display:"flex", gap:10}}>
                  <button className="btn btn-ghost btn-lg" onClick={handlePreReserve} title="Reserve the inventory for 48 hours without committing. Confirm or it auto-releases.">
                    <window.Icon name="bell" size={14}/>Pre-reserve · 48h hold
                  </button>
                  <button className="btn btn-gold btn-lg" onClick={handleSubmit}>
                    Submit booking <window.Icon name="check" size={14}/>
                  </button>
                </div>
              )}
            </div>
          </div>

          <aside className="wiz-aside">
            <WizardSummary
              trip={trip}
              state={state}
              bookingRef={ref}
              step={step}
              set={set}
              onContinue={() => setStep(step + 1)}
              onSubmit={handleSubmit}
              onPreReserve={handlePreReserve}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

function WizardSummary({ trip, state, bookingRef, step, set, onContinue, onSubmit }) {
  const tier = derivedTier(state.hotels);
  const rooms = state.rooms || generateRooms(state.passengers);
  const rate = {
    single: tripRate(trip, state, "single"),
    double: tripRate(trip, state, "double"),
    triple: tripRate(trip, state, "triple"),
    child:  tripRate(trip, state, "child"),
  };
  const counts = billCounts(rooms);
  const total =
    counts.single * rate.single +
    counts.double * rate.double +
    counts.triple * rate.triple +
    counts.child  * rate.child;
  // Room totals (S/D/T) for the summary chip — counts rooms, not occupants.
  const roomTotals = { single: 0, double: 0, triple: 0 };
  rooms.forEach(r => { roomTotals[r.type]++; });
  const date = departuresForTrip(trip)[state.dateIdx]?.date || "—";
  const nights = trip.segments.reduce((s,x)=>s+x.nights,0);

  function setAdults(n) { set({ adults: Math.max(1, Math.min(60, n)) }); }
  function setChildren(n) { set({ children: Math.max(0, Math.min(30, n)) }); }

  // Wizard footer CTAs live in the summary now — they were the user's primary action all along.
  const cta = (() => {
    if (step === 1) return { label: "Continue to passengers", action: onContinue };
    if (step === 2) return { label: "Continue to passports", action: onContinue };
    if (step === 3) return { label: "Continue to rooms", action: onContinue };
    if (step === 4) return { label: "Continue to review", action: onContinue };
    if (step === 5) return { label: "Submit booking", action: onSubmit, gold: true };
    return null;
  })();

  return (
    <div className="summary">
      <div className="summary-hd">
        <div className="eyebrow">Live order summary</div>
        <h4>{trip.name}</h4>
      </div>
      <div className="summary-bd">
        <div className="summary-row"><span className="lbl">Reference, pending</span><span className="v">{bookingRef}</span></div>
        <div className="summary-row"><span className="lbl">Departure</span><span className="v">{date.replace(", 2026","")}</span></div>
        <div className="summary-row"><span className="lbl">Duration</span><span className="v">{nights}N</span></div>
        <div className="summary-row"><span className="lbl">Hotel mix</span><span className="v">{window.stars(tier)}</span></div>
        <div className="summary-divider"/>

        {/* Inline pax steppers — adjust travelers right here, on any step. */}
        <div className="summary-pax">
          <div className="summary-pax-row">
            <div>
              <div className="spr-name">Adults</div>
              <div className="spr-sub">Age 12 and over</div>
            </div>
            <div className="stepper-input sm">
              <button onClick={() => setAdults(state.adults - 1)} disabled={state.adults <= 1}><window.Icon name="minus" size={12}/></button>
              <span className="v">{state.adults}</span>
              <button onClick={() => setAdults(state.adults + 1)}><window.Icon name="plus" size={12}/></button>
            </div>
          </div>
          <div className="summary-pax-row">
            <div>
              <div className="spr-name">Children</div>
              <div className="spr-sub">Under 12</div>
            </div>
            <div className="stepper-input sm">
              <button onClick={() => setChildren(state.children - 1)} disabled={state.children <= 0}><window.Icon name="minus" size={12}/></button>
              <span className="v">{state.children}</span>
              <button onClick={() => setChildren(state.children + 1)}><window.Icon name="plus" size={12}/></button>
            </div>
          </div>
        </div>

        <div className="summary-divider"/>
        <div className="summary-row">
          <span className="lbl">Rooms</span>
          <span className="v">{`${roomTotals.single}/${roomTotals.double}/${roomTotals.triple} S·D·T`}</span>
        </div>

        {counts.single > 0 && (
          <div className="summary-row"><span className="lbl">{counts.single} × single</span><span className="v">{window.fmtCur(counts.single * rate.single)}</span></div>
        )}
        {counts.double > 0 && (
          <div className="summary-row"><span className="lbl">{counts.double} × double</span><span className="v">{window.fmtCur(counts.double * rate.double)}</span></div>
        )}
        {counts.triple > 0 && (
          <div className="summary-row"><span className="lbl">{counts.triple} × triple</span><span className="v">{window.fmtCur(counts.triple * rate.triple)}</span></div>
        )}
        {counts.child > 0 && (
          <div className="summary-row"><span className="lbl">{counts.child} × child</span><span className="v">{window.fmtCur(counts.child * rate.child)}</span></div>
        )}
      </div>
      <div className="summary-total">
        <span className="lbl">Grand total</span>
        <span className="v">
          <span className="cur">{window.CUR}</span>
          {window.fmt(total)}
        </span>
      </div>
      {cta && (
        <div className="summary-cta">
          <button
            type="button"
            className={"btn btn-lg " + (cta.gold ? "btn-gold" : "btn-primary")}
            onClick={cta.action}
            style={{width:"100%", justifyContent:"center"}}>
            {cta.label} <window.Icon name={cta.gold ? "check" : "arrowRight"} size={14}/>
          </button>
        </div>
      )}
    </div>
  );
}

function Confirmation({ trip, bookingRef, state, go, openBookingFromWizard, submission }) {
  const rooms = state.rooms || generateRooms(state.passengers);
  const rate = {
    single: tripRate(trip, state, "single"),
    double: tripRate(trip, state, "double"),
    triple: tripRate(trip, state, "triple"),
    child:  tripRate(trip, state, "child"),
  };
  const counts = billCounts(rooms);
  const total =
    counts.single * rate.single +
    counts.double * rate.double +
    counts.triple * rate.triple +
    counts.child  * rate.child;

  const isHold = submission?.kind === "hold";
  const expiry = submission?.holdExpiresAt
    ? new Date(submission.holdExpiresAt).toLocaleString("en-US", { month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" })
    : null;

  return (
    <>
      <button type="button" className="wiz-close-fab" onClick={() => go("trips")} title="Back to trips">
        <window.Icon name="arrowLeft" size={14}/>
        <span>Back to trips</span>
      </button>
      <div className="page" style={{maxWidth:760, margin:"0 auto"}}>
        <div style={{padding:"80px 0 40px", textAlign:"center"}}>
          <div style={{
            width:64, height:64, borderRadius:"50%",
            border:"1px solid var(--gold)", color:"var(--gold)",
            display:"grid", placeItems:"center", margin:"0 auto 28px"
          }}>
            <window.Icon name={isHold ? "bell" : "check"} size={26} stroke={1.2}/>
          </div>
          <div className="page-eyebrow" style={{justifyContent:"center", marginBottom:14}}>
            {isHold ? "Pre-reserved · 48-hour hold" : "Booking submitted"}
          </div>
          <h1 className="page-title" style={{fontSize:48, marginBottom:14}}>{bookingRef}</h1>
          <p style={{color:"var(--ink-mute)", maxWidth:520, margin:"0 auto", fontSize:15, lineHeight:1.55}}>
            {trip.name} · {state.adults + state.children} travelers · {window.fmtCur(total)} {isHold ? "held softly" : "held"}.
            {isHold
              ? <> Inventory locked until <strong style={{color:"var(--ink)"}}>{expiry}</strong>. Confirm before then or the hold auto-releases.</>
              : <> We'll verify the passport documents and confirm within one business day.</>}
          </p>
          {isHold && (
            <div style={{
              maxWidth:520, margin:"22px auto 0",
              padding:"12px 18px",
              border:"1px solid var(--gold-soft)",
              borderRadius:"var(--r-sm)",
              background:"rgba(176,130,58,0.06)",
              color:"var(--ink-soft)",
              fontSize:13,
            }}>
              <strong style={{color:"var(--gold-deep)"}}>Convert to a firm booking</strong> from the Bookings list any time before the hold expires.
            </div>
          )}
        </div>
        <div style={{display:"flex", gap:12, justifyContent:"center", padding:"0 0 48px", flexWrap:"wrap"}}>
          <button className="btn btn-ghost btn-lg" onClick={() => go("dashboard")}><window.Icon name="arrowLeft" size={14}/>Back to dashboard</button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => {
              const fresh = window.bookingByRef?.(bookingRef);
              if (fresh && openBookingFromWizard) openBookingFromWizard(fresh);
              else go("dashboard");
            }}>
            <window.Icon name="arrowRight" size={14}/>Track this booking
          </button>
          <button
            className="btn btn-ghost btn-lg"
            onClick={() => window.open(`Voucher.html?ref=${encodeURIComponent(bookingRef)}`, "_blank", "width=900,height=1100")}>
            <window.Icon name="download" size={14}/>Voucher
          </button>
        </div>
      </div>
    </>
  );
}

// Generate placeholder passenger list
function makePassengers(adults, children, prev = []) {
  const names = ["Yacine Belaïd", "Amina Ould-Ali", "Karim Belkacem", "Nora Haddad", "Sami Brahimi",
                 "Hafsa Mansouri", "Mehdi Cherif", "Rania Saadi", "Tarek Ziani", "Lila Bouzid",
                 "Adel Reza", "Sofia Khelifi", "Ilyes Bensaid", "Yasmine Ait-Ali"];
  const passes = ["18AB14592", "20CC09711", "19BD23344", "21AE47820", "22FK10566",
                  "20RM44907", "18GD20013", "21NK33871", "19TL56102", "22BZ91044",
                  "23AR05518", "20SK11829", "19IB73450", "22YA38221"];
  const list = [];
  for (let i = 0; i < adults; i++) {
    const p = prev[i] || {};
    list.push({
      role: "adult",
      name: p.name ?? (i < 3 ? names[i] : ""),
      passport: p.passport ?? (i < 3 ? passes[i] : ""),
      nationality: p.nationality ?? (i < 3 ? "Algerian" : ""),
      dob: p.dob ?? (i < 3 ? "1989-04-12 / 2031-09-30" : ""),
      placeholder: {
        name: i < 3 ? "" : "First Middle Last",
        pass: i < 3 ? "" : "AB1234567",
        dob: i < 3 ? "" : "YYYY-MM-DD / YYYY-MM-DD",
      }
    });
  }
  for (let i = 0; i < children; i++) {
    const p = prev[adults + i] || {};
    list.push({
      role: "child",
      // Bed assignment — `ownBed=false` (default) means the child shares a
      // Double with two adults at the flat child rate. Toggling to `true` in
      // Step 4 promotes the placement to a Triple, billed at the adult triple rate.
      ownBed: p.ownBed ?? false,
      name: p.name ?? "",
      passport: p.passport ?? "",
      nationality: p.nationality ?? "",
      dob: p.dob ?? "",
      placeholder: { name: "Child name…", pass: "AB1234567", dob: "YYYY-MM-DD / YYYY-MM-DD" }
    });
  }
  return list;
}

window.WizardScreen = WizardScreen;
