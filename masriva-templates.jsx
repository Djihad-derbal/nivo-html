// masriva-templates.jsx — Level-1 trip catalogue: the name + destination
// combinations agencies see in their browse list. Instances live under each.

const { useState: useStateT } = React;

function MsrvTemplates({ go }) {
  const [search, setSearch] = useStateT("");
  const [showInactive, setShowInactive] = useStateT(true);
  const [modalOpen, setModalOpen] = useStateT(false);
  const [programOpenId, setProgramOpenId] = useStateT(null);

  const rows = window.TEMPLATES.filter(t => {
    if (search && !(t.name + " " + t.code).toLowerCase().includes(search.toLowerCase())) return false;
    if (!showInactive && t.status === "inactive") return false;
    return true;
  });

  return (
    <>
      <window.Topbar
        crumbs={["Operations", "Trip templates"]}
        actions={
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}>
            <window.Icon name="plus" size={13}/>New template
          </button>
        }
      />

      <div className="page">
        <window.PageHead
          eyebrow="Catalogue · Level 1"
          title={<>Trip <em>templates</em></>}
          lede="A template is a destination combination — the high-level category agencies browse. Departure dates, segments, hotels and prices belong to the trip instances created under each template."
          meta={
            <>
              <span>{window.TEMPLATES.length} templates</span>
              <span className="dot"/>
              <span>{window.TEMPLATES.filter(t => t.status === "active").length} active</span>
              <span className="dot"/>
              <span>{window.INSTANCES.length} live instances across all templates</span>
            </>
          }
        />

        <div className="toolbar">
          <input type="search" className="tb-search" placeholder="Search template…"
                 value={search} onChange={(e) => setSearch(e.target.value)}/>
          <label className="flex-row" style={{gap:6, fontSize:12, color:"var(--ink-mute)", marginLeft:4}}>
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)}/>
            Show inactive
          </label>
          <span className="muted" style={{marginLeft:"auto", fontSize:12, fontFamily:"var(--font-mono)", letterSpacing:0.06+'em'}}>
            {rows.length} {rows.length === 1 ? "template" : "templates"}
          </span>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Code · Name</th>
                <th>Destinations</th>
                <th className="num">Instances</th>
                <th className="num">Bookings</th>
                <th>Created</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => {
                const instances = window.instancesForTemplate(t.id);
                const bookings  = window.BOOKINGS.filter(b => instances.some(i => i.id === b.instanceId)).length;
                return (
                  <tr key={t.id}
                      className={t.status === "inactive" ? "inactive" : ""}
                      onClick={() => go("instances", { templateId: t.id })}>
                    <td>
                      <div className="cell-primary">{t.name}</div>
                      <div className="cell-secondary">{t.code}</div>
                    </td>
                    <td>
                      <div className="flex-row" style={{flexWrap:"wrap", gap:6}}>
                        {t.destinations.map((d, i) => (
                          <span key={i} style={{fontSize:12, color:"var(--ink-soft)", display:"inline-flex", alignItems:"center", gap:6}}>
                            {d}
                            {i < t.destinations.length - 1 && <span style={{color:"var(--terracotta-soft)", fontStyle:"italic"}}>·</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="num">{instances.length}</td>
                    <td className="num">{bookings}</td>
                    <td className="muted" style={{fontSize:12, fontFamily:"var(--font-mono)"}}>{t.created}</td>
                    <td><window.Pill status={t.status}>{t.status === "active" ? "Active" : "Inactive"}</window.Pill></td>
                    <td>
                      <div className="row-actions">
                        <button className="row-action terra" title="Manage instances"
                                onClick={(e) => { e.stopPropagation(); go("instances", { templateId: t.id }); }}>
                          <window.Icon name="calendar" size={12}/>
                        </button>
                        <button className="row-action" title="Edit day-by-day program"
                                onClick={(e) => { e.stopPropagation(); setProgramOpenId(t.id); }}>
                          <window.Icon name="template" size={12}/>
                        </button>
                        <button className="row-action" title="Edit" onClick={(e) => e.stopPropagation()}>
                          <window.Icon name="edit" size={12}/>
                        </button>
                        <button className="row-action danger" title="Deactivate" onClick={(e) => e.stopPropagation()}>
                          <window.Icon name="close" size={12}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="muted" style={{fontSize:11.5, marginTop:14, fontFamily:"var(--font-mono)", letterSpacing:0.08+'em', textTransform:"uppercase"}}>
          Templates rarely change · Departure dates and prices live one level down, on instances
        </div>
      </div>

      <NewTemplateModal open={modalOpen} onClose={() => setModalOpen(false)}/>
      <ProgramEditorModal
        open={!!programOpenId}
        templateId={programOpenId}
        onClose={() => setProgramOpenId(null)}
      />
    </>
  );
}

// ─── Day-by-day program editor ────────────────────────────────────
function ProgramEditorModal({ open, templateId, onClose }) {
  const tpl = templateId ? window.templateById?.(templateId) : null;
  const [days, setDays] = useStateT([]);
  React.useEffect(() => {
    if (open && templateId) setDays(window.templateProgram?.(templateId) || []);
  }, [open, templateId]);

  function update(i, patch) {
    setDays(d => d.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= days.length) return;
    const next = [...days];
    [next[i], next[j]] = [next[j], next[i]];
    // Re-number day fields so they stay 1..N
    setDays(next.map((d, k) => ({ ...d, day: k + 1 })));
  }
  function remove(i) {
    setDays(d => d.filter((_, k) => k !== i).map((x, k) => ({ ...x, day: k + 1 })));
  }
  function add() {
    setDays(d => [...d, { day: d.length + 1, title: "", description: "" }]);
  }
  function save() {
    window.updateTemplateProgram?.(templateId, days);
    onClose();
  }
  if (!open || !tpl) return null;

  return (
    <window.Modal open={open} onClose={onClose}
                  eyebrow={`Catalogue · ${tpl.code}`}
                  title={<>Day-by-day <em>program</em></>}
                  maxWidth={760}>
      <div className="form-hint" style={{marginBottom:14}}>
        Each day appears on the trip-detail page (partner browse), on the voucher, and on any embed widget. Reorder with the arrows.
      </div>
      <div className="flex-col" style={{gap:10, maxHeight:"min(60vh, 480px)", overflowY:"auto", padding:"4px"}}>
        {days.map((d, i) => (
          <div key={i} style={{
            display:"grid", gridTemplateColumns:"42px 1fr auto", gap:10,
            padding:"12px 14px", border:"1px solid var(--sand-line)",
            borderRadius:"var(--r-sm)", background:"var(--paper)",
          }}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"var(--font-mono)", fontSize:9.5, letterSpacing:0.16+'em', textTransform:"uppercase", color:"var(--ink-mute)"}}>Day</div>
              <div style={{fontFamily:"var(--font-mono)", fontSize:18, fontWeight:600, color:"var(--ink)"}}>{d.day}</div>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:6, minWidth:0}}>
              <input type="text" value={d.title} placeholder="Day title…"
                     onChange={(e) => update(i, { title: e.target.value })}
                     style={{font:"inherit", fontSize:14, fontWeight:500, letterSpacing:"-0.005em", border:"none", padding:"4px 0", outline:"none", background:"transparent", color:"var(--ink)"}}/>
              <textarea value={d.description} placeholder="What happens this day…"
                        onChange={(e) => update(i, { description: e.target.value })}
                        rows={2}
                        style={{font:"inherit", fontSize:12.5, color:"var(--ink-soft)", border:"1px solid var(--sand-line)", borderRadius:"var(--r-sm)", padding:"6px 8px", resize:"vertical", outline:"none", background:"var(--cream)"}}/>
            </div>
            <div className="flex-col" style={{gap:4}}>
              <button className="row-action" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                <window.Icon name="chevron" size={10} stroke={2}/>
              </button>
              <button className="row-action" title="Move down" onClick={() => move(i, +1)} disabled={i === days.length - 1}>
                <window.Icon name="chevDown" size={10} stroke={2}/>
              </button>
              <button className="row-action danger" title="Remove" onClick={() => remove(i)}>
                <window.Icon name="close" size={11}/>
              </button>
            </div>
          </div>
        ))}
        {days.length === 0 && (
          <div className="empty" style={{padding:"30px 0"}}>
            No program yet — click <strong>Add a day</strong> to start the itinerary.
          </div>
        )}
      </div>
      <div style={{display:"flex", justifyContent:"space-between", marginTop:14, alignItems:"center"}}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={add}>
          <window.Icon name="plus" size={11}/>Add a day
        </button>
        <div className="muted mono" style={{fontSize:11, letterSpacing:0.06+'em', color:"var(--ink-mute)"}}>
          {days.length} day{days.length === 1 ? "" : "s"} planned
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-gold" onClick={save}>
          <window.Icon name="check" size={13}/>Save program
        </button>
      </div>
    </window.Modal>
  );
}

function NewTemplateModal({ open, onClose }) {
  const cities = window.DESTINATIONS;
  const [name, setName] = useStateT("");
  const [code, setCode] = useStateT("");
  const [picked, setPicked] = useStateT([]);

  React.useEffect(() => { if (open) { setName(""); setCode(""); setPicked([]); } }, [open]);

  function toggle(c) {
    setPicked(picked.includes(c) ? picked.filter(x => x !== c) : [...picked, c]);
  }

  return (
    <window.Modal open={open} onClose={onClose}
                  eyebrow="Catalogue · new template"
                  title={<>Create a new <em>template</em></>}>
      <div className="form-grid">
        <div className="form-field">
          <label>Display name<span className="req">*</span></label>
          <input type="text" placeholder="e.g. Cairo + Hurghada" value={name} onChange={(e) => setName(e.target.value)}/>
        </div>
        <div className="form-field">
          <label>Template code<span className="req">*</span></label>
          <input type="text" placeholder="e.g. CR · HR" value={code} onChange={(e) => setCode(e.target.value)}/>
        </div>
        <div className="form-field full">
          <label>Destinations<span className="req">*</span></label>
          <div className="chips" style={{marginTop:4}}>
            {cities.map(c => (
              <button key={c} type="button"
                      className={"chip " + (picked.includes(c) ? "active" : "")}
                      onClick={() => toggle(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="form-hint" style={{marginTop:6}}>Pick all cities this template covers, in any order. Itinerary direction is set per instance.</div>
        </div>
        <div className="form-field full">
          <div className="form-hint">
            A template by itself isn't bookable. After creating it, you'll add <strong>instances</strong> — actual departures with dates, segments, hotels and prices.
          </div>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-gold" onClick={onClose} disabled={!name || !code || picked.length === 0}>
          <window.Icon name="check" size={13}/>Create template
        </button>
      </div>
    </window.Modal>
  );
}

window.MsrvTemplates = MsrvTemplates;
