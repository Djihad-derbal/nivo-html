// masriva-agencies.jsx — Partner agencies list + detail (level progress, users,
// booking history).

const { useState: useStateA } = React;

function MsrvAgencies() {
  const [search, setSearch] = useStateA("");
  const [level,  setLevel]  = useStateA("any");
  const [activeId, setActiveId] = useStateA(null);
  const [modalOpen, setModalOpen] = useStateA(false);

  const rows = window.AGENCIES.filter(a => {
    if (search && !(a.name + " " + a.city + " " + a.country + " " + a.contact).toLowerCase().includes(search.toLowerCase())) return false;
    if (level !== "any" && a.level !== level) return false;
    return true;
  });
  const selected = rows.find(a => a.id === activeId) || rows[0];

  return (
    <>
      <window.Topbar
        crumbs={["Partners", "Agencies"]}
        actions={
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}>
            <window.Icon name="plus" size={13}/>New agency
          </button>
        }
      />

      <div className="page">
        <window.PageHead
          eyebrow="Partners"
          title={<>Partner <em>agencies</em></>}
          lede="Agencies who resell Nilvoya trips. Level (Bronze / Silver / Gold) is earned by booking volume — visible to agents as a badge in their dashboard."
          meta={
            <>
              <span>{window.AGENCIES.length} agencies</span>
              <span className="dot"/>
              <span>{window.AGENCIES.filter(a => a.active).length} active</span>
              <span className="dot"/>
              <span>{window.AGENCIES.filter(a => a.level === "Gold").length} Gold · {window.AGENCIES.filter(a => a.level === "Silver").length} Silver · {window.AGENCIES.filter(a => a.level === "Bronze").length} Bronze</span>
            </>
          }
        />

        <div className="split">
          {/* List */}
          <div>
            <div className="toolbar">
              <input type="search" className="tb-search" placeholder="Search agency…"
                     value={search} onChange={(e) => setSearch(e.target.value)}/>
              <select className="tb-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="any">All levels</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Agency</th>
                    <th>Country</th>
                    <th>Level</th>
                    <th className="num">Bookings</th>
                    <th>Last booking</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(a => (
                    <tr key={a.id}
                        className={(a.active ? "" : "inactive ") + (selected?.id === a.id ? "selected" : "")}
                        onClick={() => setActiveId(a.id)}>
                      <td>
                        <div className="flex-row" style={{gap:10}}>
                          <window.AvatarInitials name={a.name}/>
                          <div style={{minWidth:0}}>
                            <div className="cell-primary">{a.name}</div>
                            <div className="cell-secondary">{a.contact} · {a.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted" style={{fontSize:12.5}}>{a.country}</td>
                      <td><window.TierBadge level={a.level}/></td>
                      <td className="num">{a.bookings}</td>
                      <td className="muted" style={{fontSize:12, fontFamily:"var(--font-mono)"}}>{a.lastBooking}</td>
                      <td>
                        <window.Pill status={a.active ? "active" : "inactive"}>{a.active ? "Active" : "Suspended"}</window.Pill>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="row-action" title="Edit" onClick={(e) => e.stopPropagation()}>
                            <window.Icon name="edit" size={12}/>
                          </button>
                          <button className="row-action danger" title={a.active ? "Suspend" : "Reactivate"} onClick={(e) => e.stopPropagation()}>
                            <window.Icon name="close" size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail */}
          <aside className="detail-panel">
            {selected ? <AgencyDetail agency={selected}/> : (
              <div className="empty">
                <div className="empty-glyph"><window.Icon name="agency" size={20}/></div>
                Select an agency to view team, level progress and booking history.
              </div>
            )}
          </aside>
        </div>
      </div>

      <NewAgencyModal open={modalOpen} onClose={() => setModalOpen(false)}/>
    </>
  );
}

function AgencyDetail({ agency }) {
  const history = window.BOOKINGS.filter(b => b.agencyId === agency.id).slice(0, 5);
  const totalRev = window.BOOKINGS.filter(b => b.agencyId === agency.id).reduce((s, b) => s + b.total, 0);
  const nextDef = window.LEVELS[agency.level];
  const progress = nextDef.next ? Math.min(100, Math.round((agency.bookings / nextDef.at) * 100)) : 100;

  return (
    <>
      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--sand-line)"}}>
        <div style={{minWidth:0}}>
          <div className="eyebrow">{agency.country.toUpperCase()} · {agency.city.toUpperCase()}</div>
          <h3>{agency.name}</h3>
          <div className="cell-secondary" style={{margin:"4px 0 0"}}>{agency.contact} · Since {agency.joined}</div>
        </div>
        <div style={{marginTop:18, flex:"0 0 auto"}}>
          <window.TierBadge level={agency.level}/>
        </div>
      </div>

      {/* Level progress */}
      <div className="detail-section" style={{paddingTop:0}}>
        <h4>Level progress</h4>
        <div className="level-bar">
          <div className="track"><div className="fill" style={{width: `${progress}%`}}/></div>
          <div className="meta">
            <span><strong>{agency.bookings}</strong> bookings · {agency.level}</span>
            <span>{nextDef.next ? `${nextDef.at - agency.bookings} to ${nextDef.next}` : "Top tier"}</span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="detail-section">
        <h4>At a glance</h4>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
          <window.Kv label="Lifetime revenue" value={window.fmtCurCompact(totalRev)}/>
          <window.Kv label="Last booking" value={agency.lastBooking}/>
          <window.Kv label="Users" value={agency.users.length}/>
        </div>
      </div>

      {/* Contact */}
      <div className="detail-section">
        <h4>Contact</h4>
        <div className="flex-col" style={{gap:6, fontSize:12.5}}>
          <div>{agency.email}</div>
          <div className="muted">{agency.phone}</div>
        </div>
      </div>

      {/* White-label branding */}
      <BrandingPanel agency={agency}/>

      {/* Users */}
      <div className="detail-section">
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
          <h4 style={{margin:0}}>Users · {agency.users.length}</h4>
          <button className="btn btn-sm btn-ghost"><window.Icon name="plus" size={11}/>Add</button>
        </div>
        <div className="flex-col" style={{gap:0}}>
          {agency.users.map((u, i) => (
            <div key={i} className="user-row">
              <window.AvatarInitials name={u.name}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13.5, letterSpacing:"-0.005em"}}>{u.name}</div>
                <div className="cell-secondary">{u.email}</div>
              </div>
              <div style={{textAlign:"right", whiteSpace:"nowrap"}}>
                <div style={{fontSize:11.5, color:"var(--ink-mute)", fontFamily:"var(--font-mono)", letterSpacing:0.06+'em', textTransform:"uppercase"}}>{u.role}</div>
                <div className="cell-secondary">{u.last}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking history */}
      <div className="detail-section">
        <h4>Recent bookings · {history.length}</h4>
        {history.length === 0 && <div className="form-hint">No bookings yet.</div>}
        <div className="flex-col" style={{gap:0}}>
          {history.map(b => {
            const inst = window.instanceById(b.instanceId);
            const tpl = window.templateById(inst?.templateId);
            return (
              <div key={b.ref} className="mini-booking-row">
                <div style={{minWidth:0, flex:1}}>
                  <div style={{fontSize:13, letterSpacing:"-0.005em"}}>{tpl?.name}</div>
                  <div className="cell-secondary">{b.ref} · {inst?.departure}</div>
                </div>
                <window.Pill status={b.status}/>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detail-section">
        <div style={{display:"flex", gap:8}}>
          <button className="btn btn-ghost btn-sm" style={{flex:1, justifyContent:"center"}}><window.Icon name="edit" size={12}/>Edit</button>
          <button className="btn btn-ghost btn-sm" style={{flex:1, justifyContent:"center", color:"var(--danger)"}}>
            {agency.active ? "Suspend" : "Reactivate"}
          </button>
        </div>
      </div>
    </>
  );
}

function NewAgencyModal({ open, onClose }) {
  const [form, setForm] = useStateA({ name: "", contact: "", email: "", phone: "", country: "Algeria", city: "" });
  React.useEffect(() => { if (open) setForm({ name: "", contact: "", email: "", phone: "", country: "Algeria", city: "" }); }, [open]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const ok = form.name && form.contact && form.email;

  return (
    <window.Modal open={open} onClose={onClose}
                  eyebrow="Partners · new agency"
                  title={<>Add a new <em>agency</em></>}>
      <div className="form-grid">
        <div className="form-field full">
          <label>Agency name<span className="req">*</span></label>
          <input type="text" placeholder="e.g. Atlas Travel Group" value={form.name} onChange={set("name")}/>
        </div>
        <div className="form-field">
          <label>Primary contact<span className="req">*</span></label>
          <input type="text" placeholder="Full name" value={form.contact} onChange={set("contact")}/>
        </div>
        <div className="form-field">
          <label>Email<span className="req">*</span></label>
          <input type="email" placeholder="name@agency.com" value={form.email} onChange={set("email")}/>
        </div>
        <div className="form-field">
          <label>Phone</label>
          <input type="tel" placeholder="+213 …" value={form.phone} onChange={set("phone")}/>
        </div>
        <div className="form-field">
          <label>Country</label>
          <select value={form.country} onChange={set("country")}>
            {["Algeria","Tunisia","Morocco","France","Lebanon","Saudi Arabia","Jordan","UAE"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field full">
          <label>City</label>
          <input type="text" placeholder="e.g. Algiers" value={form.city} onChange={set("city")}/>
        </div>
        <div className="form-field full">
          <div className="form-hint">
            New agencies start at <strong>Bronze</strong>. Levels are earned automatically by booking count — 15 bookings to Silver, 30 to Gold.
          </div>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-gold" onClick={onClose} disabled={!ok}>
          <window.Icon name="check" size={13}/>Create agency
        </button>
      </div>
    </window.Modal>
  );
}

// ─── Branding panel — accent color + logo + tagline ───────────────
function BrandingPanel({ agency }) {
  const branded = window.agencyWithBrand?.(agency.id) || agency;
  const [accent, setAccent] = useStateA(branded.accent || "#B0823A");
  const [accentDeep, setAccentDeep] = useStateA(branded.accentDeep || "#8B6326");
  const [logo, setLogo] = useStateA(branded.logo || "");
  const [tagline, setTagline] = useStateA(branded.tagline || "");
  const [, bump] = useStateA(0);

  React.useEffect(() => {
    const b = window.agencyWithBrand?.(agency.id) || agency;
    setAccent(b.accent || "#B0823A");
    setAccentDeep(b.accentDeep || "#8B6326");
    setLogo(b.logo || "");
    setTagline(b.tagline || "");
  }, [agency.id]);

  function save() {
    window.updateAgencyBranding?.(agency.id, { accent, accentDeep, logo: logo || null, tagline });
    bump(n => n + 1);
  }
  function pickLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setLogo(reader.result); };
    reader.readAsDataURL(file);
  }

  return (
    <div className="detail-section">
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
        <h4 style={{margin:0}}>White-label branding</h4>
        <button className="btn btn-sm btn-terra" onClick={save}>
          <window.Icon name="check" size={11}/>Save
        </button>
      </div>
      <div className="form-hint" style={{marginBottom:14}}>
        These render on the voucher, invoice, and any embeddable widget the agency uses on their own site.
      </div>
      {/* Live preview swatch */}
      <div style={{
        display:"flex", alignItems:"center", gap:14,
        padding:"14px 16px",
        background: accentDeep, color:"#fff",
        borderRadius:"var(--r-sm)",
        marginBottom:14,
      }}>
        {logo
          ? <img src={logo} alt="" style={{width:36, height:36, borderRadius:4, objectFit:"cover", background:accent}}/>
          : <div style={{
              width:36, height:36, borderRadius:4,
              background:`linear-gradient(135deg, ${accent} 0%, ${accentDeep} 100%)`,
              display:"grid", placeItems:"center",
              fontFamily:"var(--font-serif)", fontWeight:700, fontSize:16, fontStyle:"italic",
              color:"#fff", border:`1px solid ${accent}`,
            }}>{(agency.name || "AG").split(/\s+/).map(w=>w[0]||"").join("").slice(0,2).toUpperCase()}</div>
        }
        <div style={{minWidth:0}}>
          <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.005em"}}>{agency.name}</div>
          <div style={{fontSize:11.5, opacity:0.8, marginTop:2}}>{tagline || `${agency.city || ""}${agency.country ? " · " + agency.country : ""}`}</div>
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12}}>
        <div className="form-field">
          <label>Accent color</label>
          <div style={{display:"flex", gap:8}}>
            <input type="color" value={accent} onChange={(e)=>setAccent(e.target.value)} style={{width:36, height:36, padding:0, border:"1px solid var(--sand-line)", borderRadius:"var(--r-sm)", background:"none", cursor:"pointer"}}/>
            <input type="text" value={accent} onChange={(e)=>setAccent(e.target.value)} style={{flex:1, fontFamily:"var(--font-mono)", fontSize:12}}/>
          </div>
        </div>
        <div className="form-field">
          <label>Accent (deep)</label>
          <div style={{display:"flex", gap:8}}>
            <input type="color" value={accentDeep} onChange={(e)=>setAccentDeep(e.target.value)} style={{width:36, height:36, padding:0, border:"1px solid var(--sand-line)", borderRadius:"var(--r-sm)", background:"none", cursor:"pointer"}}/>
            <input type="text" value={accentDeep} onChange={(e)=>setAccentDeep(e.target.value)} style={{flex:1, fontFamily:"var(--font-mono)", fontSize:12}}/>
          </div>
        </div>
      </div>
      <div className="form-field" style={{marginBottom:12}}>
        <label>Tagline</label>
        <input type="text" placeholder="e.g. From the Atlas to the Red Sea" value={tagline} onChange={(e)=>setTagline(e.target.value)}/>
      </div>
      <div className="form-field">
        <label>Logo (square, 256×256 recommended)</label>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <input type="file" accept="image/*" onChange={pickLogoFile} style={{flex:1, fontSize:12, padding:"6px 4px"}}/>
          {logo && (
            <button type="button" className="row-action danger" onClick={() => setLogo("")} title="Remove logo">
              <window.Icon name="close" size={11}/>
            </button>
          )}
        </div>
        <div className="form-hint">If empty, the voucher uses the agency's initials inside the accent gradient.</div>
      </div>
    </div>
  );
}

window.MsrvAgencies = MsrvAgencies;
