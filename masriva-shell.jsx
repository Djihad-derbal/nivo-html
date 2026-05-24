// masriva-shell.jsx — Shell + reusable UI primitives (icons, sidebar,
// topbar, page header, modal). Self-contained for Nilvoya.

const { useState, useEffect, useMemo, useRef, Fragment } = React;

// ─── Icons ────────────────────────────────────────────────────────
function Icon({ name, size = 16, stroke = 1.6 }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="8" height="10" rx="1"/><rect x="3" y="15" width="8" height="6" rx="1"/><rect x="13" y="3" width="8" height="6" rx="1"/><rect x="13" y="11" width="8" height="10" rx="1"/></>,
    hotel:     <><path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18"/><path d="M9 21v-6h6v6"/><path d="M7 11h2m6 0h2M7 14h2m6 0h2"/></>,
    template:  <><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="11" width="11" height="9" rx="1"/><rect x="16" y="11" width="5" height="4" rx="1"/><rect x="16" y="17" width="5" height="3" rx="1"/></>,
    calendar:  <><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4m8-4v4"/></>,
    agency:    <><circle cx="9" cy="8" r="3"/><path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><circle cx="17" cy="8.5" r="2"/><path d="M15 21v-1a4 4 0 0 1 4-4h1a3 3 0 0 1 3 3v2"/></>,
    book:      <><path d="M5 4h11a3 3 0 0 1 3 3v14H8a3 3 0 0 1-3-3V4z"/><path d="M5 4v14a3 3 0 0 0 3 3"/></>,
    settings:  <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0-5v2m0 14v2M3 12h2m14 0h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></>,
    bell:      <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8zm3 12a3 3 0 0 0 6 0"/></>,
    chevron:   <><path d="m15 6-6 6 6 6"/></>,
    chevDown:  <><path d="m6 9 6 6 6-6"/></>,
    plus:      <><path d="M12 5v14M5 12h14"/></>,
    minus:     <><path d="M5 12h14"/></>,
    check:     <><path d="m5 12 4 4L19 6"/></>,
    close:     <><path d="M6 6l12 12M18 6l-12 12"/></>,
    edit:      <><path d="M4 20h4l11-11-4-4L4 16v4z"/></>,
    copy:      <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    eye:       <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    download:  <><path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/></>,
    upload:    <><path d="M12 20V8m-5 5 5-5 5 5M5 4h14"/></>,
    arrowR:    <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    arrowL:    <><path d="M19 12H5m6-6-6 6 6 6"/></>,
    logout:    <><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4m6-4 5-5-5-5m5 5H9"/></>,
    search:    <><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></>,
    star:      <><path d="m12 3 2.8 6 6.4.5-4.9 4.3 1.5 6.4L12 17l-5.8 3.2 1.5-6.4L2.8 9.5l6.4-.5L12 3z"/></>,
    pyramid:   <><path d="M12 3 3 21h18L12 3zm0 0v18M3 21l9-9 9 9"/></>,
    user:      <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    file:      <><path d="M6 3h9l4 4v14H6V3z"/><path d="M14 3v5h5"/></>,
    bed:       <><path d="M3 9V6h18v3M3 9v9m0-9h18m0 0v9M3 14h18M7 9V6"/></>,
    filter:    <><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></>,
    arrows:    <><path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4"/></>,
    photo:     <><rect x="3" y="6" width="18" height="14" rx="1"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></>,
    info:      <><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h2v5h1"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────
function Sidebar({ route, go, collapsed, setCollapsed }) {
  const pendingBookings = window.BOOKINGS.filter(b => ["submitted", "docs", "pending"].includes(b.status)).length;
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "templates", label: "Trip templates", icon: "template" },
    { id: "instances", label: "Trip instances", icon: "calendar" },
    { id: "hotels",    label: "Hotels",         icon: "hotel" },
    { id: "agencies",  label: "Agencies",       icon: "agency", badge: window.AGENCIES.length },
    { id: "bookings",  label: "Bookings",       icon: "book", badge: pendingBookings },
  ];
  const foot = [
    { id: "reports",  label: "Reports",   icon: "template" },
    { id: "audit",    label: "Audit log", icon: "file" },
    { id: "settings", label: "Settings",  icon: "settings" },
  ];
  return (
    <aside className="sidebar">
      <button type="button" className="sb-collapse" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand" : "Collapse"}>
        <Icon name="chevron" size={11}/>
      </button>

      <div className="sb-brand">
        <div className="sb-brand-mark">N</div>
        <div className="sb-brand-text">
          <div className="sb-brand-name">Nilvoya</div>
          <div className="sb-brand-sub">Admin</div>
        </div>
      </div>

      <div className="sb-section">Operations</div>
      <nav className="flex-col" style={{gap:2}}>
        {nav.map(i => (
          <a key={i.id}
             className={"sb-link " + (route === i.id ? "active" : "")}
             onClick={() => go(i.id)}
             title={collapsed ? i.label : undefined}>
            <Icon name={i.icon} size={15}/>
            <span>{i.label}</span>
            {i.badge ? <span className="badge">{i.badge}</span> : null}
          </a>
        ))}
      </nav>

      <div className="sb-section">Records</div>
      <nav className="flex-col" style={{gap:2}}>
        {foot.map(i => (
          <a key={i.id}
             className={"sb-link " + (route === i.id ? "active" : "")}
             onClick={() => go(i.id)}
             title={collapsed ? i.label : undefined}>
            <Icon name={i.icon} size={15}/>
            <span>{i.label}</span>
          </a>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="avatar">FA</div>
        <div className="sb-foot-text flex-grow">
          <div className="sb-foot-name">Fatima Aboud</div>
          <div className="sb-foot-role">Operations</div>
        </div>
        <Icon name="logout" size={13}/>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────
function Topbar({ crumbs = [], actions = null }) {
  return (
    <header className="topbar">
      <nav className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} className="crumb-step">
            <span className={i === crumbs.length - 1 ? "here" : ""}>{c}</span>
            {i < crumbs.length - 1 && <span className="sep">/</span>}
          </span>
        ))}
      </nav>
      <input type="search" placeholder="Search bookings, agencies, trips…" className="topbar-search"/>
      <div className="right">
        <button className="btn btn-ghost btn-icon" title="Notifications">
          <Icon name="bell" size={15}/>
        </button>
        {actions}
      </div>
    </header>
  );
}

// ─── Page header ──────────────────────────────────────────────────
function PageHead({ eyebrow, title, lede, meta, right }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {lede && <p className="page-lede">{lede}</p>}
        {meta && <div className="page-meta">{meta}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────
function Modal({ open, onClose, eyebrow, title, children, maxWidth }) {
  useEffect(() => {
    if (!open) return;
    function handle(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={maxWidth ? {maxWidth} : null}>
        <button className="modal-close" onClick={onClose} title="Close">
          <Icon name="close" size={14}/>
        </button>
        <div className="modal-head">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────
function Pill({ status, children }) {
  return <span className={"pill " + status}>{children || window.statusLabel(status)}</span>;
}

// ─── Tier badge (Bronze / Silver / Gold) ──────────────────────────
function TierBadge({ level }) {
  return <span className={"tier " + level.toLowerCase()}>{level}</span>;
}

// ─── Avatar from initials ─────────────────────────────────────────
function AvatarInitials({ name, size }) {
  const initials = name.split(/[\s-]+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
  const cls = size === "lg" ? "avatar lg" : "avatar";
  return <span className={cls}>{initials}</span>;
}

// ─── Kv tile (small label + mono value) ───────────────────────────
function Kv({ label, value, mono = true }) {
  return (
    <div>
      <div style={{fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:0.1+'em', textTransform:"uppercase", color:"var(--ink-mute)", marginBottom:4}}>{label}</div>
      <div style={{fontFamily: mono ? "var(--font-mono)" : "var(--font-serif)", fontSize: mono ? 15 : 20, letterSpacing: mono ? "-0.01em" : "-0.018em"}}>{value}</div>
    </div>
  );
}

Object.assign(window, {
  Icon, Sidebar, Topbar, PageHead, Modal, Pill, TierBadge, AvatarInitials, Kv,
});
