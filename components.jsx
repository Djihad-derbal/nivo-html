// components.jsx — Shared UI primitives + Sidebar/Topbar

const { useState, useEffect, useMemo, useRef, Fragment } = React;

// ─── Icons (line, hairline style) ──────────────────────────────────
function Icon({ name, size = 16, stroke = 1.5 }) {
  const paths = {
    dashboard: <><path d="M3 13V3h8v10H3zm0 8v-6h8v6H3zm10 0V11h8v10h-8zm0-12V3h8v6h-8z" /></>,
    compass:   <><circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-4 1 2-6 4-1z"/></>,
    book:      <><path d="M4 4h12a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3V4z"/><path d="M4 4v14a3 3 0 0 0 3 3"/></>,
    users:     <><circle cx="9" cy="8" r="3"/><path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><circle cx="17" cy="9" r="2"/><path d="M15 21v-1a4 4 0 0 1 4-4h1a3 3 0 0 1 3 3v2"/></>,
    settings:  <><path d="M12 8.5v0a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0-5v2m0 14v2M3 12h2m14 0h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></>,
    arrowRight: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    arrowLeft: <><path d="M19 12H5m6-6-6 6 6 6"/></>,
    chevDown:  <><path d="m6 9 6 6 6-6"/></>,
    plus:      <><path d="M12 5v14M5 12h14"/></>,
    minus:     <><path d="M5 12h14"/></>,
    download:  <><path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/></>,
    upload:    <><path d="M12 20V8m-5 5 5-5 5 5M5 4h14"/></>,
    filter:    <><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></>,
    sort:      <><path d="M7 4v16m-3-3 3 3 3-3M17 20V4m-3 3 3-3 3 3"/></>,
    eye:       <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    check:     <><path d="m5 12 4 4L19 6"/></>,
    bell:      <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8zm3 12a3 3 0 0 0 6 0"/></>,
    map:       <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6zm6-3v15m6-12v15"/></>,
    star:      <><path d="m12 3 2.8 6 6.4.5-4.9 4.3 1.5 6.4L12 17l-5.8 3.2 1.5-6.4L2.8 9.5l6.4-.5L12 3z"/></>,
    calendar:  <><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 9h18M8 3v4m8-4v4"/></>,
    user:      <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    file:      <><path d="M6 3h9l4 4v14H6V3z"/><path d="M14 3v5h5"/></>,
    bed:       <><path d="M3 9V6h18v3M3 9v9m0-9h18m0 0v9M3 14h18M7 9V6"/></>,
    moon:      <><path d="M19 14a8 8 0 0 1-11-11 8.5 8.5 0 1 0 11 11z"/></>,
    pyramid:   <><path d="M12 3 3 21h18L12 3zm0 0v18M3 21l9-9 9 9"/></>,
    document:  <><path d="M5 3h11l3 3v15H5z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    edit:      <><path d="M4 20h4l11-11-4-4L4 16v4z"/></>,
    close:     <><path d="M6 6l12 12M18 6l-12 12"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ─── Pill ──────────────────────────────────────────────────────────
function Pill({ status, children }) {
  return <span className={"pill " + status}>{children || window.STATUS_LABEL[status]}</span>;
}

// ─── Sidebar ───────────────────────────────────────────────────────
function Sidebar({ route, go, badges }) {
  const items = [
    { id: "trips", label: "Browse trips", icon: "compass" },
    { id: "bookings", label: "Bookings", icon: "book", badge: badges?.bookings },
  ];
  const onDashboard = route === "dashboard";
  const items2 = [
    { id: "passengers", label: "Passengers", icon: "users" },
    { id: "vouchers", label: "Vouchers", icon: "file" },
    { id: "settings", label: "Account", icon: "settings" },
  ];
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-mark">N</div>
        <div>
          <div className="sb-brand-name">Nilvoya</div>
          <div className="sb-brand-sub">Egypt Organized Trips</div>
        </div>
      </div>

      <div className="sb-section">Workspace</div>
      <nav className="sb-nav">
        {items.map(i => (
          <a key={i.id}
             className={"sb-link " + (route === i.id ? "active" : "")}
             onClick={() => go(i.id)}>
            <Icon name={i.icon} size={15} />
            <span>{i.label}</span>
            {i.badge ? <span className="badge">{i.badge}</span> : null}
          </a>
        ))}
      </nav>

      <div className="sb-section">Records</div>
      <nav className="sb-nav">
        {items2.map(i => (
          <a key={i.id} className="sb-link" onClick={() => {}}>
            <Icon name={i.icon} size={15} />
            <span>{i.label}</span>
          </a>
        ))}
      </nav>

      <button
        type="button"
        className={"sb-foot sb-foot-btn " + (onDashboard ? "active" : "")}
        onClick={() => go("dashboard")}
        title="Open agency dashboard">
        <div className="sb-avatar">YB</div>
        <div className="sb-user-text">
          <div className="sb-user-name">Yacine Belaïd</div>
          <div className="sb-user-org">Voyages Méditerranée · ALG</div>
        </div>
        <span className="sb-foot-hint">
          <Icon name={onDashboard ? "check" : "dashboard"} size={13} />
        </span>
      </button>
    </aside>
  );
}

// ─── Topbar ────────────────────────────────────────────────────────
function Topbar({ crumbs, actions, showSearch = true }) {
  return (
    <div className="topbar">
      <nav className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{display:"inline-flex", alignItems:"center", gap:8}}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "here" : ""}>{c}</span>
          </span>
        ))}
      </nav>
      <div className="topbar-actions">
        {showSearch && (
          <input type="search" placeholder="Search bookings, trips, passengers…" className="search-input" />
        )}
        <button className="btn btn-icon btn-ghost" title="Notifications"><Icon name="bell" /></button>
        {actions}
      </div>
    </div>
  );
}

// ─── Sparkline ─────────────────────────────────────────────────────
function Sparkline({ data, width = 120, height = 28 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const dFill = d + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg className="stat-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={dFill} className="spark-fill" />
      <path d={d} className="spark-rect" />
    </svg>
  );
}

// ─── Page header ───────────────────────────────────────────────────
function PageHeader({ eyebrow, title, num, lede, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <h1 className="page-title">
          {num && <span className="num">{num}</span>}
          {title}
        </h1>
        {lede && <p className="page-lede">{lede}</p>}
      </div>
      {actions && <div style={{display:"flex", gap:10}}>{actions}</div>}
    </header>
  );
}

// Export to window
Object.assign(window, {
  Icon, Pill, Sidebar, Topbar, Sparkline, PageHeader
});
