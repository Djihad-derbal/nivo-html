// masriva-hotels.jsx — Global hotel catalogue. Hotels are inventory units
// (name, destination, stars, photo). Rates live on trip instances.

const { useState: useStateH } = React;

function MsrvHotels() {
  const cities = window.DESTINATIONS;
  const [city, setCity] = useStateH(cities[0]);
  const [modal, setModal] = useStateH(null); // null | { editing?: hotel } | "new"
  const inCity = window.hotelsByCity(city).sort((a, b) => b.stars - a.stars);

  return (
    <>
      <window.Topbar
        crumbs={["Inventory", "Hotels"]}
        actions={
          <button className="btn btn-gold" onClick={() => setModal("new")}>
            <window.Icon name="plus" size={13}/>Add hotel
          </button>
        }
      />

      <div className="page">
        <window.PageHead
          eyebrow="Inventory"
          title={<>Hotel <em>catalogue</em></>}
          lede="The global pool of hotels operations can assign to trip instances. Same hotel can appear on many instances — prices are set per instance, not here."
          meta={
            <>
              <span>{window.HOTELS.length} hotels</span>
              <span className="dot"/>
              <span>{cities.length} destinations</span>
              <span className="dot"/>
              <span>3 tiers · Comfort · Premium · Luxury</span>
            </>
          }
        />

        <div className="tabs">
          {cities.map(c => (
            <button key={c}
                    className={"tab " + (city === c ? "active" : "")}
                    onClick={() => setCity(c)}>
              {c}
              <span className="count">{window.hotelsByCity(c).length}</span>
            </button>
          ))}
        </div>

        {[5, 4, 3].map(tier => {
          const list = inCity.filter(h => h.stars === tier);
          if (list.length === 0) return null;
          const tierName = tier === 3 ? "Comfort" : tier === 4 ? "Premium" : "Luxury";
          return (
            <div key={tier} style={{marginBottom:28}}>
              <div className="sect-head">
                <h2>{window.stars(tier)} <span className="muted" style={{marginLeft:8, fontFamily:"var(--font-sans)", fontSize:14}}>{tierName}</span></h2>
                <span className="tag">{list.length} {list.length === 1 ? "hotel" : "hotels"}</span>
              </div>
              <div className="hotel-grid">
                {list.map(h => {
                  const usage = window.hotelUsageCount(h.id);
                  return (
                    <div key={h.id} className="hotel-card">
                      <div className="hotel-photo" style={{backgroundImage:`url(${h.photo})`}}>
                        <span className="stars">{window.stars(h.stars)}</span>
                      </div>
                      <div className="hotel-body">
                        <div className="hotel-name">{h.name}</div>
                        <div className="hotel-meta">{h.city} · {h.id.replace("h-","").toUpperCase()}</div>
                        <div className="hotel-foot">
                          <span className="hotel-usage">
                            <span className="dot"/> In {usage} {usage === 1 ? "instance" : "instances"}
                          </span>
                          <div className="hotel-actions">
                            <button className="row-action" title="Edit" onClick={() => setModal({ editing: h })}>
                              <window.Icon name="edit" size={12}/>
                            </button>
                            <button className="row-action danger" title="Remove">
                              <window.Icon name="close" size={12}/>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <HotelModal open={!!modal} onClose={() => setModal(null)} defaultCity={city}
                  editing={modal && modal.editing}/>
    </>
  );
}

function HotelModal({ open, onClose, defaultCity, editing }) {
  const cities = window.DESTINATIONS;
  const [name, setName]   = useStateH("");
  const [city, setCity]   = useStateH(defaultCity);
  const [tier, setTier]   = useStateH(4);
  const [photo, setPhoto] = useStateH(null);

  React.useEffect(() => {
    if (editing) {
      setName(editing.name); setCity(editing.city);
      setTier(editing.stars); setPhoto(editing.photo);
    } else {
      setName(""); setCity(defaultCity); setTier(4); setPhoto(null);
    }
  }, [editing, defaultCity, open]);

  function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setPhoto(ev.target.result);
    r.readAsDataURL(f);
  }

  return (
    <window.Modal open={open} onClose={onClose}
                  eyebrow={editing ? "Inventory · edit hotel" : "Inventory · new hotel"}
                  title={editing ? <>Edit <em>hotel</em></> : <>Add a <em>hotel</em></>}>
      <div className="form-grid">
        <div className="form-field full">
          <label>Hotel name<span className="req">*</span></label>
          <input type="text" placeholder="e.g. Four Seasons Cairo Plaza" value={name} onChange={(e) => setName(e.target.value)}/>
        </div>
        <div className="form-field">
          <label>Destination<span className="req">*</span></label>
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            {cities.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Star rating<span className="req">*</span></label>
          <select value={tier} onChange={(e) => setTier(parseInt(e.target.value))}>
            <option value="3">★★★ Comfort (3-star)</option>
            <option value="4">★★★★ Premium (4-star)</option>
            <option value="5">★★★★★ Luxury (5-star)</option>
          </select>
        </div>

        <div className="form-field full">
          <label>Photo</label>
          <div className="photo-upload">
            <div className="photo-preview" style={photo ? {backgroundImage:`url(${photo})`} : null}>
              {!photo && <window.Icon name="photo" size={22}/>}
            </div>
            <div className="flex-col" style={{gap:6, alignItems:"flex-start"}}>
              <label className="btn btn-ghost btn-sm" style={{cursor:"pointer"}}>
                <window.Icon name="upload" size={12}/>
                {photo ? "Replace photo" : "Upload photo"}
                <input type="file" accept="image/*" hidden onChange={pick}/>
              </label>
              {photo && (
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => setPhoto(null)}>
                  Remove
                </button>
              )}
              <div className="form-hint">
                JPG or PNG · landscape preferred · used across the agent-side catalogue and booking confirmations.
              </div>
            </div>
          </div>
        </div>

        <div className="form-field full">
          <div className="form-hint">
            Rates for this hotel are set per <strong>trip instance</strong>. The same hotel can carry different prices on different instances.
          </div>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-gold" onClick={onClose} disabled={!name}>
          <window.Icon name="check" size={13}/>{editing ? "Save changes" : "Add hotel"}
        </button>
      </div>
    </window.Modal>
  );
}

window.MsrvHotels = MsrvHotels;
