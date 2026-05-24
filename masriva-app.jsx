// masriva-app.jsx — Router root for the Nilvoya admin.

const { useState: useStateMs } = React;

function NilvoyaAdmin() {
  // route: dashboard | templates | instances | hotels | agencies | bookings | reports | settings
  // each route can have an optional filter object (e.g. {templateId} or {ref})
  const [route, setRoute] = useStateMs("dashboard");
  const [filter, setFilter] = useStateMs({});
  const [collapsed, setCollapsed] = useStateMs(false);
  const [bookingsBump, setBookingsBump] = useStateMs(0);
  const [toasts, setToasts] = useStateMs([]);

  function go(r, f = {}) {
    setRoute(r);
    setFilter(f || {});
    window.scrollTo(0, 0);
  }

  function pushToast(msg, kind = "info") {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5200);
  }

  React.useEffect(() => {
    document.body.dataset.sb = collapsed ? "collapsed" : "open";
  }, [collapsed]);

  // Live update bridge — same tab or cross-tab.
  React.useEffect(() => {
    function onUpdate(e) {
      setBookingsBump(b => b + 1);
      const b = e?.detail;
      if (b?.status === "submitted") {
        pushToast(`New booking · ${b.ref}`, "info");
      }
    }
    function onStorage(e) {
      if (e.key === "nilvoya:bookings") setBookingsBump(b => b + 1);
    }
    window.addEventListener("nilvoya:bookings:updated", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("nilvoya:bookings:updated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  let screen;
  switch (route) {
    case "templates": screen = <window.MsrvTemplates go={go}/>; break;
    case "instances": screen = <window.MsrvInstances filter={filter} setFilter={setFilter} go={go}/>; break;
    case "hotels":    screen = <window.MsrvHotels go={go}/>; break;
    case "agencies":  screen = <window.MsrvAgencies go={go}/>; break;
    case "bookings":  screen = <window.MsrvBookings filter={filter} setFilter={setFilter} go={go}/>; break;
    case "reports":   screen = <window.MsrvReports go={go}/>; break;
    case "audit":     screen = <window.MsrvAudit go={go}/>; break;
    case "settings":  screen = <SettingsStub/>; break;
    default:          screen = <window.MsrvDashboard go={go}/>;
  }

  return (
    <div className="app" data-bookings-bump={bookingsBump}>
      <window.Sidebar route={route} go={go} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <main>{screen}</main>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))}/>
    </div>
  );
}

// Toast stack — fixed bottom-right, soft slide-in.
function ToastStack({ toasts, onDismiss }) {
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:200,
      display:"flex", flexDirection:"column", gap:10,
      pointerEvents:"none",
    }}>
      {toasts.map(t => (
        <div key={t.id}
             onClick={() => onDismiss(t.id)}
             style={{
               pointerEvents:"auto",
               background:"var(--ink)", color:"var(--parchment)",
               padding:"12px 18px",
               borderRadius:"var(--r-sm)",
               boxShadow:"var(--shadow-lg)",
               fontSize:13,
               minWidth:240,
               display:"flex", alignItems:"center", gap:10,
               cursor:"pointer",
               animation:"toast-slide-in 220ms cubic-bezier(.22,.61,.36,1)",
             }}>
          <span style={{
            width:8, height:8, borderRadius:"50%",
            background: t.kind === "error" ? "var(--danger)" : t.kind === "ok" ? "var(--ok)" : "var(--gold-soft)",
            flexShrink:0,
          }}/>
          <span>{t.msg}</span>
          <span style={{marginLeft:"auto", color:"rgba(247,245,240,0.5)", fontSize:11, fontFamily:"var(--font-mono)", letterSpacing:0.06+'em'}}>Dismiss</span>
        </div>
      ))}
    </div>
  );
}

// Minimal stub for settings — keeps the route honest without bloating scope.
function SettingsStub() {
  return (
    <>
      <window.Topbar crumbs={["Account", "Settings"]}/>
      <div className="page">
        <window.PageHead
          eyebrow="Account"
          title={<>Operator <em>settings</em></>}
          lede="Workspace, currency, voucher templates, and notifications. Configuration screens are out of scope for this stage."
        />
        <div className="block" style={{padding:"40px 24px", textAlign:"center"}}>
          <div className="empty-glyph" style={{margin:"0 auto 14px"}}><window.Icon name="settings" size={20}/></div>
          <div className="muted">Settings are configured separately by IT — contact us if you need a workspace change.</div>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<NilvoyaAdmin/>);
