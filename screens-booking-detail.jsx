// screens-booking-detail.jsx

function BookingDetailScreen({ booking, go }) {
  const b = booking || window.BOOKINGS[0];

  // Resolve trip/instance from the booking — supports both seed (b.trip) and
  // admin-shaped records (b.instanceId).
  const inst = b.instanceId ? window.instanceById?.(b.instanceId) : null;
  const tpl = inst ? window.templateById?.(inst.templateId) : null;
  const tripObj =
    window.TRIPS.find(t => t.name === (b.trip || tpl?.name)) ||
    window.TRIPS.find(t => t.id === inst?.templateId) ||
    window.TRIPS[0];
  const segments = inst?.segments || tripObj.segments;
  const tripName = b.trip || tpl?.name || tripObj.name;
  const departure = departure || inst?.departure || "—";
  // Tier may not exist on admin-shaped bookings — derive from highest assigned star.
  const derivedTier = (inst?.assigned || []).reduce((m, a) => {
    const h = window.hotelById?.(null, a.hotelId.replace(/^h-/, ""))
      || Object.values(window.HOTELS || {}).flat().find(h => h.id === a.hotelId.replace(/^h-/, ""));
    return Math.max(m, h?.stars || 0);
  }, 0);
  const tier = b.tier || derivedTier || 4;

  // Mock hotels chosen per segment
  const hotelsChosen = segments.map(s => window.hotelsByTier(s.city, tier)[0] || "—");
  const totalPax = b.pax.adults + b.pax.children;
  const grid = (window.PRICING?.default && window.PRICING.default[tier]) || { single:0, double:0, triple:0, child:0 };
  const roomMix = roomMixFromPax(b.pax.adults, b.pax.children);

  const statusOrder = ["submitted", "verified", "confirmed", "completed"];
  const currentIdx = statusOrder.indexOf(b.status === "pending" ? "submitted" : b.status);

  return (
    <>
      <window.Topbar crumbs={["Workspace", "Bookings", b.ref]}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => window.open(`Voucher.html?ref=${encodeURIComponent(b.ref)}`, "_blank", "width=900,height=1100")}>
              <window.Icon name="download" size={14}/>Voucher
            </button>
            <button className="btn btn-ghost"><window.Icon name="document" size={14}/>Manifest</button>
          </>
        }
      />

      <div className="page">
        {/* Hero strip */}
        <div className="detail-hero">
          <div className="detail-hero-eyebrow">{b.ref} · {window.STATUS_LABEL[b.status]}</div>
          <h1>{tripName}</h1>
          <div className="detail-hero-meta">
            <div>
              <div className="eyebrow" style={{color:"rgba(212,174,107,0.6)", marginBottom:4}}>Departure</div>
              <span className="v">{departure}</span>
            </div>
            <div>
              <div className="eyebrow" style={{color:"rgba(212,174,107,0.6)", marginBottom:4}}>Travelers</div>
              <span className="v">{b.pax.adults} adults · {b.pax.children} children</span>
            </div>
            <div>
              <div className="eyebrow" style={{color:"rgba(212,174,107,0.6)", marginBottom:4}}>Hotel tier</div>
              <span className="v">{window.stars(tier)} {tier === 3 ? "Comfort" : tier === 4 ? "Premium" : "Luxury"}</span>
            </div>
            <div>
              <div className="eyebrow" style={{color:"rgba(212,174,107,0.6)", marginBottom:4}}>Total held</div>
              <span className="v" style={{fontSize:20}}>{window.fmtCur(b.total)}</span>
            </div>
          </div>
        </div>

        <div className="detail-cols">
          {/* Left column */}
          <div style={{display:"flex", flexDirection:"column", gap:20}}>

            <div className="block">
              <div className="block-title">
                <span className="index">A.</span>
                <h3>Itinerary</h3>
                <span className="eyebrow" style={{marginLeft:"auto"}}>{segments.reduce((s,x)=>s+x.nights,0)} nights total</span>
              </div>
              <div className="itin">
                {segments.map((s, i) => (
                  <div key={i} className="itin-stop">
                    <div className="itin-marker">{i+1}</div>
                    <div className="itin-content">
                      <h4>{s.city}</h4>
                      <div className="meta">{s.nights} NIGHTS · CHECK-IN {addDays(departure, i === 0 ? 0 : segments.slice(0,i).reduce((acc,x)=>acc+x.nights,0))}</div>
                      <div className="hotel">{hotelsChosen[i]} · {window.stars(tier)}</div>
                    </div>
                  </div>
                ))}
                <div className="itin-stop">
                  <div className="itin-marker" style={{borderColor:"var(--sand-deep)", color:"var(--ink-mute)"}}>→</div>
                  <div className="itin-content">
                    <h4 style={{color:"var(--ink-mute)"}}>Return</h4>
                    <div className="meta">{addDays(departure, segments.reduce((s,x)=>s+x.nights,0))}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="block">
              <div className="block-title">
                <span className="index">B.</span>
                <h3>Passenger manifest</h3>
                <span className="eyebrow" style={{marginLeft:"auto"}}>{totalPax} on record</span>
                <button className="btn btn-sm btn-ghost" style={{marginLeft:12}}><window.Icon name="download" size={12}/>CSV</button>
              </div>
              <ManifestTable count={totalPax} adults={b.pax.adults}/>
            </div>

            <div className="block">
              <div className="block-title">
                <span className="index">C.</span>
                <h3>Price breakdown</h3>
              </div>
              <table className="tbl" style={{borderRadius:0}}>
                <thead>
                  <tr><th>Line</th><th className="num">Pax</th><th className="num">Rate</th><th className="num">Subtotal</th></tr>
                </thead>
                <tbody>
                  {roomMix.single > 0 && <tr style={{cursor:"default"}}><td>Adults · single rooms</td><td className="num">{roomMix.single}</td><td className="num">{window.fmtCur(grid.single)}</td><td className="num">{window.fmtCur(roomMix.single * grid.single)}</td></tr>}
                  {roomMix.double > 0 && <tr style={{cursor:"default"}}><td>Adults · double rooms</td><td className="num">{roomMix.double}</td><td className="num">{window.fmtCur(grid.double)}</td><td className="num">{window.fmtCur(roomMix.double * grid.double)}</td></tr>}
                  {roomMix.triple > 0 && <tr style={{cursor:"default"}}><td>Adults · triple rooms</td><td className="num">{roomMix.triple}</td><td className="num">{window.fmtCur(grid.triple)}</td><td className="num">{window.fmtCur(roomMix.triple * grid.triple)}</td></tr>}
                  {b.pax.children > 0 && <tr style={{cursor:"default"}}><td>Children</td><td className="num">{b.pax.children}</td><td className="num">{window.fmtCur(grid.child)}</td><td className="num">{window.fmtCur(b.pax.children * grid.child)}</td></tr>}
                  <tr style={{background:"var(--ivory-soft)", cursor:"default"}}>
                    <td style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:0.1+'em', textTransform:"uppercase", color:"var(--ink-mute)"}}>Grand total</td>
                    <td></td><td></td>
                    <td className="num" style={{fontSize:20, letterSpacing:"-0.02em"}}>{window.fmtCur(b.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div style={{display:"flex", flexDirection:"column", gap:20}}>
            <div className="block">
              <div className="trip-code" style={{margin:0, marginBottom:14}}>Status timeline</div>
              <div className="status-line">
                {statusOrder.map((s, i) => {
                  const cls = i < currentIdx ? "done" : i === currentIdx ? "current" : "pending";
                  return (
                    <div key={s} className={"status-step " + cls}>
                      <span className="dot"></span>
                      <span className="name">{window.STATUS_LABEL[s]}</span>
                      <span className="when">{statusTimestamp(s, b)}</span>
                    </div>
                  );
                })}
              </div>
              {b.status === "pending" && (
                <div style={{marginTop:16, padding:"12px 14px", background:"rgba(162,106,31,0.08)", border:"1px solid rgba(162,106,31,0.25)", borderRadius:"var(--r-sm)", fontSize:12.5, color:"var(--warn)", lineHeight:1.5}}>
                  Three passport scans illegible. Please re-upload via the manifest panel.
                </div>
              )}
            </div>

            <div className="block">
              <div className="trip-code" style={{margin:0, marginBottom:14}}>Booked by</div>
              <div style={{display:"flex", gap:10, alignItems:"center", marginBottom:14}}>
                <div className="sb-avatar" style={{background:"var(--gold-deep)"}}>{(b.lead || "").split(" ").map(s => s[0]).join("").slice(0,2)}</div>
                <div>
                  <div style={{fontSize:14, fontWeight:500}}>{b.lead}</div>
                  <div style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ink-mute)"}}>Voyages Méditerranée · ALG</div>
                </div>
              </div>
              <div className="kv" style={{gridTemplateColumns:"1fr", gap:14}}>
                <div><div className="lbl">Submitted</div><div className="v">{b.submitted}, 2026</div></div>
                <div><div className="lbl">Confirmation due</div><div className="v">May 16, 2026 · 18:00 CAI</div></div>
                <div style={{borderBottom:"none", paddingBottom:0}}><div className="lbl">Account manager, Nilvoya</div><div className="v">Yasmine Khalil · ext. 207</div></div>
              </div>
            </div>

            <div className="block">
              <div className="trip-code" style={{margin:0, marginBottom:14}}>Files</div>
              {[
                { name: "Voucher_EGP-2H8K-441.pdf", size: "182 KB", icon: "file" },
                { name: "Manifest_passenger.csv", size: "8 KB", icon: "document" },
                { name: "passports_scan_zip.zip", size: "12.4 MB", icon: "file" },
              ].map((f, i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 0",
                  borderBottom: i < 2 ? "1px solid var(--sand-line)" : "none"
                }}>
                  <div style={{width:32, height:32, borderRadius:"var(--r-xs)", background:"var(--cream)", border:"1px solid var(--sand-line)", display:"grid", placeItems:"center", color:"var(--ink-mute)"}}>
                    <window.Icon name={f.icon} size={14}/>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:12.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{f.name}</div>
                    <div style={{fontFamily:"var(--font-mono)", fontSize:10.5, color:"var(--ink-mute)"}}>{f.size}</div>
                  </div>
                  <button className="btn btn-icon btn-sm btn-quiet"><window.Icon name="download" size={12}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ManifestTable({ count, adults }) {
  const sample = [
    ["Yacine Belaïd", "18AB14592", "Algerian", "1989-04-12", "2031-09-30"],
    ["Amina Ould-Ali", "20CC09711", "Algerian", "1992-08-22", "2030-05-14"],
    ["Karim Belkacem", "19BD23344", "Algerian", "1985-02-03", "2029-11-09"],
    ["Nora Haddad", "21AE47820", "Algerian", "1990-12-30", "2031-07-21"],
    ["Sami Brahimi", "22FK10566", "Algerian", "1987-09-15", "2032-03-05"],
    ["Hafsa Mansouri", "20RM44907", "Algerian", "1995-04-18", "2030-10-02"],
  ];
  const shown = Math.min(count, 6);
  return (
    <div className="pax-list">
      <div className="pax-row head">
        <div>#</div>
        <div>Full name</div>
        <div>Passport</div>
        <div>Nationality</div>
        <div>DOB / Expiry</div>
        <div style={{textAlign:"right"}}>Role</div>
      </div>
      {Array.from({length: shown}).map((_, i) => {
        const data = sample[i % sample.length];
        const isChild = i >= adults;
        return (
          <div key={i} className="pax-row">
            <div className="pax-idx">{String(i+1).padStart(2,"0")}</div>
            <div style={{fontSize:13.5}}>{isChild ? "Yara Belaïd" : data[0]}</div>
            <div style={{fontFamily:"var(--font-mono)", fontSize:12}}>{isChild ? "24KD11008" : data[1]}</div>
            <div style={{fontSize:13}}>{data[2]}</div>
            <div style={{fontFamily:"var(--font-mono)", fontSize:11.5, color:"var(--ink-mute)"}}>{isChild ? "2017-06-04 / 2032-01-12" : data[3] + " / " + data[4]}</div>
            <div style={{textAlign:"right"}}>
              <span className="role-tag" style={{color: isChild ? "var(--gold)" : "var(--ink-mute)"}}>{isChild ? "child" : "adult"}</span>
            </div>
          </div>
        );
      })}
      {count > 6 && (
        <div className="pax-row" style={{background:"var(--cream)", gridTemplateColumns:"1fr"}}>
          <div style={{textAlign:"center", color:"var(--ink-mute)", fontSize:12.5}}>
            + {count - 6} more passengers · <a style={{color:"var(--gold)", textDecoration:"underline", cursor:"pointer"}}>view full manifest</a>
          </div>
        </div>
      )}
    </div>
  );
}

function roomMixFromPax(adults, children) {
  let triplePax = 0, doublePax = 0, singlePax = 0;
  if (adults % 2 === 1 && adults >= 3) {
    triplePax = 3;
    doublePax = adults - 3;
  } else if (adults % 2 === 1) {
    singlePax = 1;
    doublePax = adults - 1;
  } else {
    doublePax = adults;
  }
  return { single: singlePax, double: doublePax, triple: triplePax };
}

function addDays(dateStr, n) {
  const parts = dateStr.split(" ");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let m = months.indexOf(parts[0]);
  let d = parseInt(parts[1]);
  d += n;
  // simple overflow
  const dim = [31,28,31,30,31,30,31,31,30,31,30,31];
  while (d > dim[m]) { d -= dim[m]; m = (m+1) % 12; }
  return `${months[m]} ${String(d).padStart(2,"0")}`.toUpperCase();
}

function statusTimestamp(s, b) {
  const order = ["submitted", "verified", "confirmed", "completed"];
  const i = order.indexOf(s);
  const ci = order.indexOf(b.status === "pending" ? "submitted" : b.status);
  if (i > ci) return "—";
  if (i === ci) return "current";
  const days = ["Apr 28", "May 02", "May 06", "May 10"];
  return days[i] || "—";
}

window.BookingDetailScreen = BookingDetailScreen;
