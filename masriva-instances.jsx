// masriva-instances.jsx — Level-2 trip instances. List → detail (segments,
// assigned hotels with 4-column per-instance pricing).
//
// Three layouts:
//   1) Instance list (filterable by template + status)
//   2) Instance detail (sticky right panel) — header, segments, hotels rate sheet
//   3) New / duplicate instance modal
//
// State is local; this is a mock. The visual model is the source of truth
// the user wants to commit to.

const { useState: useStateI, Fragment } = React;

function MsrvInstances({ filter, setFilter, go }) {
  const tplId = filter?.templateId || "all";
  const [search, setSearch]   = useStateI("");
  const [status, setStatus]   = useStateI("any");
  const [activeId, setActiveId] = useStateI(null);
  const [modal, setModal]     = useStateI(null);  // null | { mode: 'new'|'dup', source? }

  // Build instance list with filters applied.
  const filtered = window.INSTANCES.filter(i => {
    if (tplId !== "all" && i.templateId !== tplId) return false;
    if (status !== "any" && i.status !== status) return false;
    if (search) {
      const tpl = window.templateById(i.templateId);
      const s = (i.label + " " + tpl?.name + " " + i.departure).toLowerCase();
      if (!s.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  // Pick selection: respects filter; falls back to first row.
  const selected = (activeId && filtered.find(i => i.id === activeId))
    || filtered[0]
    || null;

  // Reset selection when filter scope changes (e.g. user picks another template).
  React.useEffect(() => { setActiveId(null); }, [tplId]);

  const scopeName = tplId === "all" ? "All templates" : window.templateById(tplId)?.name;

  return (
    <>
      <window.Topbar
        crumbs={["Operations", "Trip instances", tplId === "all" ? "All" : window.templateById(tplId)?.code]}
        actions={
          <>
            {tplId !== "all" && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFilter({})}>
                <window.Icon name="arrowL" size={11}/>All templates
              </button>
            )}
            <button className="btn btn-gold" onClick={() => setModal({ mode: "new" })}>
              <window.Icon name="plus" size={13}/>New instance
            </button>
          </>
        }
      />

      <div className="page">
        <window.PageHead
          eyebrow={`Catalogue · Level 2 · ${scopeName}`}
          title={<>Trip <em>instances</em></>}
          lede="A trip instance is one departure — its own segments, hotels, and prices. Same template, different instance = different prices. Multiple instances on the same date are independent."
          meta={
            <>
              <span>{filtered.length} of {window.INSTANCES.length} instances</span>
              <span className="dot"/>
              <span>{filtered.filter(i => i.status === "open").length} open</span>
              <span className="dot"/>
              <span>{filtered.filter(i => i.status === "filling").length} filling</span>
              <span className="dot"/>
              <span>{filtered.filter(i => i.status === "soldout").length} sold out</span>
            </>
          }
        />

        <div className="split">
          {/* List */}
          <div>
            <div className="toolbar">
              <input type="search" className="tb-search" placeholder="Search by label, template, date…"
                     value={search} onChange={(e) => setSearch(e.target.value)}/>
              <select className="tb-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="any">All statuses</option>
                <option value="open">Open</option>
                <option value="filling">Filling fast</option>
                <option value="soldout">Sold out</option>
              </select>
              <select className="tb-select" value={tplId} onChange={(e) => setFilter({ templateId: e.target.value === "all" ? undefined : e.target.value })}>
                <option value="all">All templates</option>
                {window.TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
              </select>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Departure</th>
                    <th>Instance · Template</th>
                    <th>Segments</th>
                    <th className="num">Hotels</th>
                    <th className="num">Filled</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(i => {
                    const tpl = window.templateById(i.templateId);
                    const isSel = selected?.id === i.id;
                    const fillPct = Math.round((i.booked / i.capacity) * 100);
                    return (
                      <tr key={i.id} className={isSel ? "selected" : ""} onClick={() => setActiveId(i.id)}>
                        <td>
                          <div className="flex-row" style={{gap:10}}>
                            <div className="date-chip">
                              <div>{i.departure.split(" ")[0]}</div>
                              <strong>{i.departure.split(" ")[1].replace(",", "")}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="cell-primary">{i.label}</div>
                          <div className="cell-secondary">{tpl?.code}</div>
                        </td>
                        <td>
                          <div className="itin-mini" style={{fontSize:12}}>
                            {i.segments.map((s, k) => (
                              <span key={k} style={{display:"contents"}}>
                                <span className="leg">{s.city.split(" ")[0]} <span className="n">{s.nights}N</span></span>
                                {k < i.segments.length - 1 && <span className="arrow">→</span>}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="num">{i.assigned.length}</td>
                        <td className="num">{fillPct}%</td>
                        <td>
                          <window.Pill status={i.status === "open" ? "open" : i.status === "filling" ? "filling" : "soldout"}>
                            {i.status === "open" ? "Open" : i.status === "filling" ? "Filling" : "Sold out"}
                          </window.Pill>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="row-action" title="Duplicate" onClick={(e) => { e.stopPropagation(); setModal({ mode: "dup", source: i }); }}>
                              <window.Icon name="copy" size={12}/>
                            </button>
                            <button className="row-action" title="Edit" onClick={(e) => e.stopPropagation()}>
                              <window.Icon name="edit" size={12}/>
                            </button>
                            <button className="row-action danger" title="Cancel" onClick={(e) => e.stopPropagation()}>
                              <window.Icon name="close" size={12}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7}>
                      <div className="empty" style={{padding:"40px 0"}}>
                        No instances match your filters.
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail */}
          <aside className="detail-panel">
            {selected ? (
              <InstanceDetail instance={selected} onDuplicate={() => setModal({ mode: "dup", source: selected })}/>
            ) : (
              <div className="empty">
                <div className="empty-glyph"><window.Icon name="calendar" size={20}/></div>
                Select an instance to view segments, assigned hotels, and prices.
              </div>
            )}
          </aside>
        </div>
      </div>

      <InstanceModal open={!!modal} onClose={() => setModal(null)} mode={modal?.mode} source={modal?.source}/>
    </>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────
function InstanceDetail({ instance, onDuplicate }) {
  const [data, setData] = useStateI(instance);
  const [pickerCity, setPickerCity] = useStateI(null);
  const [dirty, setDirty] = useStateI({});

  React.useEffect(() => {
    setData(instance);
    setDirty({});
  }, [instance.id]);

  const tpl = window.templateById(data.templateId);
  const totalNights = data.segments.reduce((s, x) => s + x.nights, 0);
  const fillPct = (data.booked / data.capacity) * 100;

  function setPrice(hotelId, col, val) {
    const num = parseInt(val.toString().replace(/[^0-9]/g, "")) || 0;
    setData({ ...data, assigned: data.assigned.map(a => a.hotelId === hotelId ? { ...a, prices: { ...a.prices, [col]: num } } : a) });
    const orig = instance.assigned.find(a => a.hotelId === hotelId);
    const k = `${hotelId}-${col}`;
    if (!orig || orig.prices[col] !== num) setDirty({ ...dirty, [k]: true });
    else { const d = { ...dirty }; delete d[k]; setDirty(d); }
  }
  function unassign(hotelId) {
    setData({ ...data, assigned: data.assigned.filter(a => a.hotelId !== hotelId) });
    setDirty({ ...dirty, [`${hotelId}-removed`]: true });
  }
  function assignHotel(h, city) {
    if (data.assigned.some(a => a.hotelId === h.id)) return;
    // Seed prices: rough estimate from tier and nights in that segment.
    const seg = data.segments.find(s => s.city === city);
    const nights = seg?.nights || 1;
    const seedPer = h.stars === 5 ? 27000 : h.stars === 4 ? 17500 : 12500;
    setData({
      ...data,
      assigned: [...data.assigned, {
        hotelId: h.id,
        prices: {
          single: Math.round(seedPer * 1.25 * nights),
          double: Math.round(seedPer * nights),
          triple: Math.round(seedPer * 0.88 * nights),
          child:  Math.round(seedPer * 0.6  * nights),
        },
      }],
    });
    setDirty({ ...dirty, [`${h.id}-added`]: true });
  }

  // Group assigned hotels by segment city.
  const byCity = {};
  data.segments.forEach(s => { byCity[s.city] = []; });
  data.assigned.forEach(a => {
    const h = window.hotelById(a.hotelId);
    if (!h) return;
    (byCity[h.city] = byCity[h.city] || []).push(a);
  });

  const dirtyCount = Object.keys(dirty).length;

  return (
    <>
      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--sand-line)"}}>
        <div style={{minWidth:0}}>
          <div className="eyebrow">{tpl?.code}</div>
          <h3>{data.label}</h3>
          <div className="cell-secondary" style={{margin:"4px 0 0"}}>{tpl?.name} · {totalNights}N total</div>
        </div>
        <window.Pill status={data.status === "open" ? "open" : data.status === "filling" ? "filling" : "soldout"}>
          {data.status === "open" ? "Open" : data.status === "filling" ? "Filling" : "Sold out"}
        </window.Pill>
      </div>

      {/* Quick facts */}
      <div className="detail-section" style={{paddingTop:0}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
          <window.Kv label="Departure" value={data.departure}/>
          <window.Kv label="Direction" value={data.direction.length > 22 ? data.direction.slice(0, 20) + "…" : data.direction}/>
          <window.Kv label="Capacity" value={`${data.booked}/${data.capacity}`}/>
        </div>
        <div style={{marginTop:12}}>
          <div style={{height:5, borderRadius:999, background:"var(--parchment-deep)", border:"1px solid var(--sand-line)", overflow:"hidden"}}>
            <div style={{height:"100%", width:`${fillPct}%`, background: data.status === "soldout" ? "var(--danger)" : data.status === "filling" ? "var(--warn)" : "var(--ok)"}}/>
          </div>
          <div style={{fontFamily:"var(--font-mono)", fontSize:10.5, color:"var(--ink-mute)", marginTop:6, letterSpacing:0.06+'em'}}>
            {data.booked} BOOKED · {data.capacity - data.booked} OPEN · {Math.round(fillPct)}% FILLED
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h4>Segments</h4>
        <div className="itin-mini" style={{fontSize:13.5}}>
          {data.segments.map((s, i) => (
            <span key={i} style={{display:"contents"}}>
              <span className="leg">{s.city} <span className="n">{s.nights}N</span></span>
              {i < data.segments.length - 1 && <span className="arrow">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Hotels + prices */}
      <div className="detail-section">
        <h4>Assigned hotels</h4>
        <div className="form-hint" style={{marginBottom:10}}>
          The <strong>Cairo hotel</strong> is fixed for every instance — pick one, no pricing needed. The <strong>destination hotel</strong> (Sharm, Hurghada, Luxor…) drives the trip price: four columns per pax — <strong>Single</strong> (adult solo), <strong>Double</strong> (per adult), <strong>Triple</strong> (per adult), <strong>Child</strong> (flat, any room).
        </div>
        {data.segments.map(seg => {
          const rows = byCity[seg.city] || [];
          const isCairo = seg.city === "Cairo";
          return (
            <div key={seg.city} style={{marginBottom:18}}>
              <div className="ins-city-head">
                <div>
                  <strong>{seg.city}</strong>
                  <span className="muted" style={{marginLeft:6, fontFamily:"var(--font-mono)", fontSize:11}}>{seg.nights}N</span>
                  {isCairo && (
                    <span className="muted mono" style={{marginLeft:8, fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--gold-deep)"}}>
                      Fixed · no price
                    </span>
                  )}
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => setPickerCity(seg.city)}>
                  <window.Icon name="plus" size={11}/>{isCairo ? "Pick" : "Assign"}
                </button>
              </div>
              {rows.length === 0 && (
                <div className="form-hint" style={{padding:"14px 0"}}>
                  {isCairo
                    ? <>No Cairo hotel picked. Click <strong>Pick</strong> to select from the catalogue.</>
                    : <>No {seg.city} hotels assigned. Click <strong>Assign</strong> to add from the catalogue.</>}
                </div>
              )}
              {rows.map(a => {
                const h = window.hotelById(a.hotelId);
                return (
                  <div key={a.hotelId} className="ins-hotel-row">
                    <div className="ins-hotel-head">
                      <div className="ins-thumb" style={{backgroundImage:`url(${h.photo})`}}/>
                      <div style={{minWidth:0, flex:1}}>
                        <div className="ins-name">{h.name}</div>
                        <div className="starline" style={{fontSize:11, marginTop:2}}>{window.stars(h.stars)} <span style={{color:"var(--ink-faint)", marginLeft:4}}>{h.id.replace("h-","").toUpperCase()}</span></div>
                      </div>
                      <button className="row-action danger" title={isCairo ? "Remove" : "Unassign"} onClick={() => unassign(a.hotelId)}>
                        <window.Icon name="close" size={12}/>
                      </button>
                    </div>
                    {!isCairo && (
                      <div className="ins-price-grid">
                        {["single","double","triple","child"].map(col => {
                          const isDirty = !!dirty[`${a.hotelId}-${col}`];
                          return (
                            <div key={col} className={"ins-price-cell " + (isDirty ? "dirty" : "")}>
                              <div className="ins-price-lbl">{col === "single" ? "Single" : col === "double" ? "Double" : col === "triple" ? "Triple" : "Child"}</div>
                              <div className="ins-price-input">
                                <input type="text" value={window.fmt(a.prices[col])} onChange={(e) => setPrice(a.hotelId, col, e.target.value)}/>
                                <span className="ins-price-cur">DZD</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="detail-section">
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8}}>
          <button className="btn btn-ghost btn-sm" style={{justifyContent:"center"}}><window.Icon name="edit" size={12}/>Edit metadata</button>
          <button className="btn btn-ghost btn-sm" style={{justifyContent:"center"}} onClick={onDuplicate}><window.Icon name="copy" size={12}/>Duplicate</button>
        </div>
        <button className="btn btn-terra btn-sm" style={{width:"100%", justifyContent:"center"}} disabled={dirtyCount === 0}>
          {dirtyCount === 0 ? "No changes to save" : <><window.Icon name="check" size={12}/>Save {dirtyCount} {dirtyCount === 1 ? "change" : "changes"}</>}
        </button>
      </div>

      {pickerCity && (
        <AssignPicker city={pickerCity}
                      already={data.assigned.map(a => a.hotelId)}
                      onPick={(h) => { assignHotel(h, pickerCity); setPickerCity(null); }}
                      onClose={() => setPickerCity(null)}/>
      )}
    </>
  );
}

// ─── Hotel picker (modal) ─────────────────────────────────────────
function AssignPicker({ city, already, onPick, onClose }) {
  const all = window.hotelsByCity(city);
  const [q, setQ] = useStateI("");
  const list = all
    .filter(h => !already.includes(h.id))
    .filter(h => !q || h.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.stars - a.stars);

  return (
    <window.Modal open={true} onClose={onClose}
                  eyebrow={`Assign · ${city}`}
                  title={<>Pick from <em>catalogue</em></>}>
      <div className="form-hint" style={{marginBottom:14}}>
        Hotels not yet assigned to this instance. Picking one seeds 4 prices from the tier — adjust them after.
      </div>
      <input type="search" className="tb-search" style={{width:"100%", marginBottom:14}}
             placeholder={`Search ${city} hotels…`}
             value={q} onChange={(e) => setQ(e.target.value)}/>
      {list.length === 0 && (
        <div className="empty" style={{padding:"36px 12px"}}>
          {already.filter(id => all.some(h => h.id === id)).length === all.length
            ? `Every ${city} hotel in the catalogue is already assigned.`
            : "No matches."}
        </div>
      )}
      <div className="pick-list">
        {list.map(h => (
          <button key={h.id} className="pick-row" onClick={() => onPick(h)}>
            <div className="pick-thumb" style={{backgroundImage:`url(${h.photo})`}}/>
            <div style={{flex:1, minWidth:0, textAlign:"left"}}>
              <div className="pick-name">{h.name}</div>
              <div className="starline" style={{fontSize:11, marginTop:2}}>{window.stars(h.stars)}<span style={{color:"var(--ink-faint)", marginLeft:6}}>{h.id.replace("h-","").toUpperCase()}</span></div>
            </div>
            <span className="pick-cta">Assign <window.Icon name="arrowR" size={11}/></span>
          </button>
        ))}
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-quiet" onClick={onClose}>Done</button>
      </div>
    </window.Modal>
  );
}

// ─── New / duplicate instance modal ───────────────────────────────
function InstanceModal({ open, onClose, mode, source }) {
  const isDup = mode === "dup";
  const tplOpts = window.TEMPLATES.filter(t => t.status === "active");
  const [tplId, setTplId]   = useStateI(source?.templateId || tplOpts[0]?.id || "");
  const [label, setLabel]   = useStateI("");
  const [direction, setDirection] = useStateI("");
  const [date, setDate]     = useStateI("");
  const [cap, setCap]       = useStateI(60);
  const [segments, setSegments] = useStateI([]);

  React.useEffect(() => {
    if (!open) return;
    if (isDup && source) {
      setTplId(source.templateId);
      setLabel("Copy of " + source.label);
      setDirection(source.direction);
      setDate("");
      setCap(source.capacity);
      setSegments(JSON.parse(JSON.stringify(source.segments)));
    } else {
      const tpl = window.templateById(tplId);
      setLabel("");
      setDirection(tpl?.destinations.join(" → ") || "");
      setDate("");
      setCap(60);
      setSegments((tpl?.destinations || []).map(c => ({ city: c, nights: c === "Cairo" ? 3 : 5 })));
    }
  }, [open, isDup, source?.id]);

  // When user changes template, re-seed segments.
  React.useEffect(() => {
    if (!open || isDup) return;
    const tpl = window.templateById(tplId);
    if (!tpl) return;
    setDirection(tpl.destinations.join(" → "));
    setSegments(tpl.destinations.map(c => ({ city: c, nights: c === "Cairo" ? 3 : 5 })));
  }, [tplId]);

  function updateSeg(i, field, val) {
    setSegments(segments.map((s, idx) => idx === i ? { ...s, [field]: field === "nights" ? parseInt(val) || 0 : val } : s));
  }

  const totalN = segments.reduce((s, x) => s + x.nights, 0);

  return (
    <window.Modal open={open} onClose={onClose}
                  eyebrow={isDup ? "Catalogue · duplicate instance" : "Catalogue · new instance"}
                  title={isDup ? <>Duplicate <em>instance</em></> : <>Create a new <em>instance</em></>}
                  maxWidth={680}>
      {isDup && (
        <div className="form-hint" style={{marginBottom:14, padding:"10px 12px", background:"var(--parchment-soft)", borderLeft:"2px solid var(--terracotta-soft)", borderRadius:"var(--r-sm)"}}>
          Duplicating <strong>{source?.label}</strong>. All segments, assigned hotels, and per-instance prices will be cloned — adjust as needed.
        </div>
      )}
      <div className="form-grid">
        <div className="form-field">
          <label>Template<span className="req">*</span></label>
          <select value={tplId} onChange={(e) => setTplId(e.target.value)} disabled={isDup}>
            {tplOpts.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Internal label<span className="req">*</span></label>
          <input type="text" placeholder="e.g. Cairo→Sharm · Jun 18" value={label} onChange={(e) => setLabel(e.target.value)}/>
        </div>

        <div className="form-field">
          <label>Departure date<span className="req">*</span></label>
          <input type="text" placeholder="e.g. Jun 18, 2026" value={date} onChange={(e) => setDate(e.target.value)}/>
        </div>
        <div className="form-field">
          <label>Capacity</label>
          <input type="number" min="1" max="300" value={cap} onChange={(e) => setCap(parseInt(e.target.value) || 0)}/>
        </div>

        <div className="form-field full">
          <label>Itinerary direction</label>
          <input type="text" placeholder="e.g. Cairo → Sharm" value={direction} onChange={(e) => setDirection(e.target.value)}/>
          <div className="form-hint">Free text label shown on agency-side cards. Two instances can share a date and template; they remain independent.</div>
        </div>

        <div className="full">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
            <label className="form-field-label">SEGMENTS · {totalN} NIGHTS TOTAL</label>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSegments([...segments, { city: "Cairo", nights: 2 }])}>
              <window.Icon name="plus" size={11}/>Add segment
            </button>
          </div>
          {segments.map((s, i) => (
            <div key={i} className="seg-row">
              <select value={s.city} onChange={(e) => updateSeg(i, "city", e.target.value)}>
                {window.DESTINATIONS.map(c => <option key={c}>{c}</option>)}
              </select>
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <input type="number" min="1" max="30" value={s.nights} onChange={(e) => updateSeg(i, "nights", e.target.value)} style={{width:80}}/>
                <span className="muted mono" style={{fontSize:11, letterSpacing:0.06+'em'}}>NIGHTS</span>
              </div>
              <button type="button" className="row-action danger" onClick={() => setSegments(segments.filter((_, idx) => idx !== i))}>
                <window.Icon name="close" size={12}/>
              </button>
            </div>
          ))}
        </div>

        <div className="form-field full">
          <div className="form-hint">
            {isDup
              ? "After creating, hotels and prices are already cloned. Adjust them in the right-side panel."
              : "After creating, the next step is to assign hotels from the catalogue and set the four prices per hotel — done in the detail panel."}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-gold" onClick={onClose} disabled={!label || !date}>
          <window.Icon name="check" size={13}/>{isDup ? "Duplicate" : "Create instance"}
        </button>
      </div>
    </window.Modal>
  );
}

window.MsrvInstances = MsrvInstances;
