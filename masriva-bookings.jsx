// masriva-bookings.jsx — All bookings list + detail page (passengers, rooms,
// per-room pricing, status flow, manifest export).

const { useState: useStateB, Fragment } = React;

function MsrvBookings({ filter, setFilter, go }) {
  const focusRef = filter?.ref;

  // Filters
  const [search, setSearch] = useStateB("");
  const [agency, setAgency] = useStateB("any");
  const [template, setTemplate] = useStateB("any");
  const [instance, setInstance] = useStateB("any");
  const [status, setStatus] = useStateB("any");
  const [date,    setDate]    = useStateB("any");

  function clearFilters() {
    setSearch(""); setAgency("any"); setTemplate("any"); setInstance("any"); setStatus("any"); setDate("any");
  }

  const rows = window.BOOKINGS.filter(b => {
    if (search && !(b.ref + " " + b.lead).toLowerCase().includes(search.toLowerCase())) return false;
    if (agency !== "any" && b.agencyId !== agency) return false;
    if (template !== "any") {
      const inst = window.instanceById(b.instanceId);
      if (inst?.templateId !== template) return false;
    }
    if (instance !== "any" && b.instanceId !== instance) return false;
    if (status !== "any" && b.status !== status) return false;
    if (date !== "any") {
      const inst = window.instanceById(b.instanceId);
      if (inst?.departure !== date) return false;
    }
    return true;
  });

  // Departure date options derived from currently-visible instances.
  const dateOptions = Array.from(new Set(window.INSTANCES.map(i => i.departure)));

  if (focusRef) {
    return <BookingDetail bookingRef={focusRef} onBack={() => setFilter({})}/>;
  }

  return (
    <>
      <window.Topbar
        crumbs={["Operations", "Bookings"]}
        actions={
          <>
            <button className="btn btn-ghost btn-sm"><window.Icon name="download" size={12}/>Export CSV</button>
            <button className="btn btn-gold"><window.Icon name="plus" size={13}/>Manual entry</button>
          </>
        }
      />

      <div className="page">
        <window.PageHead
          eyebrow="Operations"
          title={<>All <em>bookings</em></>}
          lede="Every booking across all agencies. Filter by template, instance, agency, departure date, or status. Click a row to see passengers, room assignments and the full price breakdown."
          meta={
            <>
              <span>{window.BOOKINGS.length} total</span>
              <span className="dot"/>
              <span>{window.BOOKINGS.filter(b => ["submitted","docs","pending"].includes(b.status)).length} need attention</span>
              <span className="dot"/>
              <span>{window.BOOKINGS.filter(b => b.status === "confirmed").length} confirmed</span>
            </>
          }
        />

        {/* Filter bar */}
        <div className="filter-bar">
          <span className="muted mono" style={{fontSize:10.5, letterSpacing:0.12+'em', textTransform:"uppercase"}}>Filter</span>
          <input type="search" className="tb-search" placeholder="Reference or lead…" value={search} onChange={(e) => setSearch(e.target.value)}/>
          <select className="tb-select" value={agency} onChange={(e) => setAgency(e.target.value)}>
            <option value="any">All agencies</option>
            {window.AGENCIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="tb-select" value={template} onChange={(e) => { setTemplate(e.target.value); setInstance("any"); }}>
            <option value="any">All templates</option>
            {window.TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
          </select>
          <select className="tb-select" value={instance} onChange={(e) => setInstance(e.target.value)}>
            <option value="any">All instances</option>
            {window.INSTANCES.filter(i => template === "any" || i.templateId === template)
              .map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
          <select className="tb-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="any">All statuses</option>
            {window.STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select className="tb-select" value={date} onChange={(e) => setDate(e.target.value)}>
            <option value="any">Any departure</option>
            {dateOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn btn-quiet btn-sm" onClick={clearFilters}>Clear</button>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Agency</th>
                <th>Trip · Departure</th>
                <th className="num">Pax</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(b => {
                const inst = window.instanceById(b.instanceId);
                const tpl = window.templateById(inst?.templateId);
                const agc = window.agencyById(b.agencyId);
                return (
                  <tr key={b.ref} onClick={() => setFilter({ ref: b.ref })}>
                    <td>
                      <div className="cell-primary">{b.ref}</div>
                      <div className="cell-secondary">{b.lead}</div>
                    </td>
                    <td>
                      <div className="flex-row" style={{gap:8}}>
                        <window.AvatarInitials name={agc?.name || "?"}/>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:13}}>{agc?.name}</div>
                          <div className="cell-secondary">{agc?.country}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-primary">{tpl?.name}</div>
                      <div className="cell-secondary">{inst?.departure} · {inst?.label.split("·")[0].trim()}</div>
                    </td>
                    <td className="num">{b.pax.adults + b.pax.children}</td>
                    <td className="num">{window.fmtCurCompact(b.total)}</td>
                    <td><window.Pill status={b.status}/></td>
                    <td className="muted" style={{fontSize:12, fontFamily:"var(--font-mono)"}}>{b.submitted}</td>
                    <td>
                      <div className="row-actions">
                        <button className="row-action" title="View" onClick={(e) => { e.stopPropagation(); setFilter({ ref: b.ref }); }}>
                          <window.Icon name="eye" size={12}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty" style={{padding:"36px 0"}}>No bookings match your filters.</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Detail ────────────────────────────────────────────────────────
function BookingDetail({ bookingRef, onBack }) {
  const b = window.bookingByRef(bookingRef);
  if (!b) return <div className="empty">Booking not found.</div>;

  const inst = window.instanceById(b.instanceId);
  const tpl  = window.templateById(inst?.templateId);
  const agc  = window.agencyById(b.agencyId);
  const passengers = window.PASSENGER_LISTS[bookingRef] || [];
  const rooms      = window.ROOM_LISTS[bookingRef] || [];
  const [status, setStatus] = useStateB(b.status);

  // Compute breakdown from rooms × prices.
  const lines = rooms.map(r => {
    const a = inst?.assigned.find(x => x.hotelId === r.hotelId);
    const hotel = window.hotelById(r.hotelId);
    const occupants = r.paxRefs.map(idx => passengers[idx]).filter(Boolean);
    const adults = occupants.filter(p => isAdult(p)).length;
    const kids   = occupants.length - adults;
    const perAdult = a?.prices[r.roomType] || 0;
    const perKid   = a?.prices.child || 0;
    const subtotal = adults * perAdult + kids * perKid;
    return { ...r, hotel, occupants, adults, kids, perAdult, perKid, subtotal };
  });
  const grand = lines.reduce((s, l) => s + l.subtotal, 0);

  return (
    <>
      <window.Topbar
        crumbs={["Operations", "Bookings", b.ref]}
        actions={
          <>
            <button className="btn btn-ghost btn-sm" onClick={onBack}><window.Icon name="arrowL" size={11}/>All bookings</button>
            <button className="btn btn-ghost btn-sm"><window.Icon name="download" size={12}/>Manifest · PDF</button>
            <button className="btn btn-ghost btn-sm"><window.Icon name="download" size={12}/>Manifest · Excel</button>
          </>
        }
      />

      <div className="page">
        <window.PageHead
          eyebrow={`Reference · ${b.ref}`}
          title={tpl?.name}
          lede={<><strong style={{color:"var(--terracotta-deep)"}}>{inst?.departure}</strong> · {inst?.direction} · Agency {agc?.name} · Submitted {b.submitted} · Lead {b.lead}</>}
          right={
            <div className="flex-col" style={{alignItems:"flex-end", gap:10}}>
              <window.Pill status={status}/>
              <select className="status-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {window.STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          }
        />

        <div style={{display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:24, alignItems:"start"}}>
          {/* Left: passengers + rooms */}
          <div>
            {/* Trip info */}
            <div className="block" style={{padding:"16px 20px", marginBottom:18, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:24}}>
              <window.Kv label="Template" value={tpl?.code}/>
              <window.Kv label="Departure" value={inst?.departure}/>
              <window.Kv label="Direction" value={inst?.direction.length > 22 ? inst?.direction.slice(0, 20) + "…" : inst?.direction}/>
              <window.Kv label="Pax" value={`${b.pax.adults}A · ${b.pax.children}C`}/>
            </div>

            {/* Rooms + occupants */}
            <div className="sect-head">
              <h2>Rooms · <em>{rooms.length}</em></h2>
              <span className="tag">Each room maps a price column ({lines[0]?.hotel?.name || "—"})</span>
            </div>
            <div className="flex-col" style={{gap:10, marginBottom:24}}>
              {lines.map(l => (
                <div key={l.code} className="room-block">
                  <div className="room-head">
                    <div className="flex-row" style={{gap:10, minWidth:0, flex:1}}>
                      <div className="ins-thumb" style={{backgroundImage:`url(${l.hotel?.photo})`, width:48, height:48}}/>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:14, letterSpacing:"-0.005em"}}>{l.hotel?.name}</div>
                        <div className="cell-secondary">{l.code} · {l.roomType.toUpperCase()} ROOM · {l.adults}A {l.kids ? `· ${l.kids}C` : ""}</div>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ink-mute)", letterSpacing:0.06+'em'}}>
                        {l.adults}×{window.fmt(l.perAdult)}{l.kids ? ` + ${l.kids}×${window.fmt(l.perKid)}` : ""}
                      </div>
                      <div style={{fontFamily:"var(--font-serif)", fontSize:20, color:"var(--terracotta-deep)", letterSpacing:"-0.01em"}}>
                        {window.fmtCur(l.subtotal)}
                      </div>
                    </div>
                  </div>
                  <table className="room-pax-tbl">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Nationality</th>
                        <th>Passport</th>
                        <th>DOB</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {l.occupants.map((p, idx) => (
                        <tr key={idx}>
                          <td className="mono muted" style={{width:32}}>{idx + 1}</td>
                          <td>{p.first} {p.last}</td>
                          <td className="muted">{p.nat}</td>
                          <td className="mono" style={{fontSize:12}}>{p.passport}</td>
                          <td className="mono muted" style={{fontSize:12}}>{p.dob}</td>
                          <td>
                            {isAdult(p)
                              ? <span style={{fontSize:11, fontFamily:"var(--font-mono)", color:"var(--ink-mute)", letterSpacing:0.06+'em'}}>ADULT</span>
                              : <span style={{fontSize:11, fontFamily:"var(--font-mono)", color:"var(--terracotta-deep)", letterSpacing:0.06+'em'}}>CHILD</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              {lines.length === 0 && (
                <div className="empty" style={{padding:"40px 12px", background:"var(--paper)", border:"1px solid var(--sand-line)", borderRadius:"var(--r-md)"}}>
                  Passenger roster has not been submitted yet for this booking.
                </div>
              )}
            </div>

            {/* Full passenger list (independent of rooms) */}
            <div className="sect-head">
              <h2>Full <em>manifest</em></h2>
              <span className="tag">{passengers.length} passengers · {passengers.filter(isAdult).length}A {passengers.filter(p => !isAdult(p)).length}C</span>
              <div className="right">
                <button className="btn btn-sm btn-ghost"><window.Icon name="download" size={12}/>PDF</button>
                <button className="btn btn-sm btn-ghost"><window.Icon name="download" size={12}/>Excel</button>
              </div>
            </div>
            <div className="tbl-wrap" style={{marginBottom:20}}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="num">#</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Nationality</th>
                    <th>Passport</th>
                    <th>Date of birth</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {passengers.map((p, idx) => (
                    <tr key={idx}>
                      <td className="num mono muted">{idx + 1}</td>
                      <td>{p.first} {p.last}</td>
                      <td className="muted">{p.gender}</td>
                      <td className="muted">{p.nat}</td>
                      <td className="mono" style={{fontSize:12}}>{p.passport}</td>
                      <td className="mono muted" style={{fontSize:12}}>{p.dob}</td>
                      <td className="mono" style={{fontSize:12}}>{p.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: price breakdown + actions */}
          <aside className="detail-panel">
            <div style={{marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--sand-line)"}}>
              <div className="eyebrow">Booking</div>
              <h3>Price <em>breakdown</em></h3>
              <div className="cell-secondary" style={{margin:"4px 0 0"}}>Per pax × occupants per room</div>
            </div>

            <div className="detail-section" style={{paddingTop:0}}>
              <div className="price-summary">
                {lines.map(l => (
                  <span key={l.code} style={{display:"contents"}}>
                    <div className="lbl">
                      {l.hotel?.name}
                      <div className="cell-secondary">{l.code} · {l.adults}A{l.kids ? ` + ${l.kids}C` : ""} · {l.roomType}</div>
                    </div>
                    <div className="v">{window.fmt(l.subtotal)}</div>
                  </span>
                ))}
                <div className="lbl total">Total · {window.CUR}</div>
                <div className="v total">{window.fmt(grand || b.total)}</div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Status flow</h4>
              <div className="flex-col" style={{gap:6}}>
                {window.STATUSES.map(s => {
                  const here = s.key === status;
                  const past = stepsBefore(status).includes(s.key);
                  return (
                    <div key={s.key} className="status-step" data-here={here} data-past={past}>
                      <span className="dot"/>
                      <span className="lbl">{s.label}</span>
                      <span className="hint">{s.hint}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="detail-section">
              <h4>Actions</h4>
              <div className="flex-col" style={{gap:8}}>
                <button
                  className="btn btn-terra btn-sm"
                  style={{justifyContent:"center"}}
                  disabled={b.status === "confirmed" || b.status === "completed" || b.status === "cancelled"}
                  onClick={() => window.updateBookingStatus?.(b.ref, "confirmed")}>
                  <window.Icon name="check" size={12}/>Mark confirmed
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{justifyContent:"center"}}
                  disabled={b.status === "docs" || b.status === "cancelled" || b.status === "completed"}
                  onClick={() => window.updateBookingStatus?.(b.ref, "docs")}>
                  <window.Icon name="info" size={12}/>Request documents
                </button>
                <button className="btn btn-ghost btn-sm" style={{justifyContent:"center"}} onClick={() => window.open(`Voucher.html?ref=${encodeURIComponent(b.ref)}`, "_blank", "width=900,height=1100")}>
                  <window.Icon name="download" size={12}/>Voucher
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{justifyContent:"center", color:"var(--danger)"}}
                  disabled={b.status === "cancelled" || b.status === "completed"}
                  onClick={() => { if (confirm(`Cancel booking ${b.ref}?`)) window.updateBookingStatus?.(b.ref, "cancelled"); }}>
                  Cancel booking
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function isAdult(pax) {
  if (!pax?.dob) return true;
  const y = parseInt(pax.dob.slice(0, 4));
  return (2026 - y) >= 18;
}
function stepsBefore(status) {
  const order = ["submitted","docs","pending","confirmed","completed","cancelled"];
  const i = order.indexOf(status);
  return order.slice(0, i);
}

window.MsrvBookings = MsrvBookings;
