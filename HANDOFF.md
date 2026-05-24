# Nilvoya — Handoff document

A B2B platform for an Egypt-based tour operator. Partner travel agencies in the MENA region browse organized trips, book groups of 1–60+ travelers, manage passports + rooms, and print branded vouchers. Internal ops manages trip templates, departure instances, hotels, agency relationships, and bookings.

This file captures every decision, file, and feature in the prototype. Read it before you make changes — there are subtle data bridges and cache rules that will bite you otherwise.

---

## 1 · What's in the box

Three apps + a print artifact + one shared data layer, all in `C:\nilvoya`:

| File | Role | Audience |
|---|---|---|
| `Nilvoya Landing.html` | Public marketing site (self-contained) | Anyone, SEO |
| `Nilvoya B2B.html` | Partner portal — login, catalog, trip detail, wizard, dashboard, booking detail | Logged-in agency users |
| `Nilvoya Admin.html` | Internal admin — templates, instances, hotels, agencies, bookings, reports, audit | Operator staff (Fatima Aboud) |
| `Voucher.html?ref=NLV-…` | Standalone printable travel voucher | Travellers + agency stamp |

All three are served as **static HTML + React/Babel-standalone**. No build step. No backend. Persistence is pure `localStorage`. The full path from clicking a trip card → submitting a booking → seeing it in admin → printing a voucher works end-to-end inside the same browser session.

**Stack:**
- React 18 (UMD CDN)
- Babel Standalone 7.29 — compiles `<script type="text/babel">` on the fly
- Poppins (display + body) + JetBrains Mono (data / numbers), via Google Fonts
- No build tooling, no npm install. Open the HTML.

**Serving locally:** Python static server registered in `C:\.claude\launch.json` as `nilvoya`, port `8765`:
```
python -m http.server 8765 --directory C:/nilvoya
```

Then visit:
- http://localhost:8765/Nilvoya%20Landing.html
- http://localhost:8765/Nilvoya%20B2B.html
- http://localhost:8765/Nilvoya%20Admin.html
- http://localhost:8765/Voucher.html?ref=NLV-2H8K-441

---

## 2 · File map

```
C:\nilvoya
├── Nilvoya Landing.html      (self-contained, inline CSS, links to B2B)
├── Nilvoya B2B.html          (loads styles.css + several JSX files)
├── Nilvoya Admin.html        (loads masriva-tokens.css + masriva-*.jsx)
├── Voucher.html              (self-contained, loads masriva-data.jsx for booking lookup)
│
├── styles.css                (B2B portal — ivory/navy/gold tokens, all classes)
├── masriva-tokens.css        (Admin — same token palette, different class names)
│
├── data.jsx                  (B2B-side data: derived TRIPS, HOTELS catalog, PRICING)
├── masriva-data.jsx          (THE SOURCE OF TRUTH — see "Data architecture" below)
│
├── components.jsx            (B2B shared: Icon, Pill, Sidebar, Topbar, Sparkline)
├── masriva-shell.jsx         (Admin shared: Icon, Pill, Sidebar, Topbar, PageHead, Modal)
│
├── app.jsx                   (B2B router root)
├── masriva-app.jsx           (Admin router root)
│
├── screens-login.jsx         (B2B login)
├── screens-catalog.jsx       (B2B trip catalog — featured + grid, search/sort/filter)
├── screens-trip-detail.jsx   (B2B pre-wizard trip detail with day-by-day, hotels w/ prices)
├── screens-wizard.jsx        (B2B 5-step booking wizard — date/pax/passports/rooms/review)
├── screens-booking-detail.jsx (B2B booking detail screen with itinerary, manifest, pricing)
├── screens-dashboard.jsx     (B2B "My bookings" — filtered to logged-in agency)
│
├── masriva-dashboard.jsx     (Admin overview)
├── masriva-templates.jsx     (Admin templates list + day-by-day program editor modal)
├── masriva-instances.jsx     (Admin instances list + detail panel with hotel assignment + per-instance prices)
├── masriva-hotels.jsx        (Admin hotel catalog)
├── masriva-agencies.jsx      (Admin agencies list + detail with users + white-label branding panel)
├── masriva-bookings.jsx      (Admin bookings inbox + detail panel with status transitions)
├── masriva-reports.jsx       (Admin live KPIs + revenue by month + fill rate + top trips + agency leaderboard)
├── masriva-audit.jsx         (Admin audit log — read-only event stream)
│
├── tweaks-panel.jsx          (B2B dev-only tweaks corner — quick-jump nav)
│
├── screenshots/              (reference shots from the original design handoff bundle)
└── uploads/                  (reference uploads from the original handoff bundle)
```

---

## 3 · Data architecture (read this carefully)

There are **two data files** that overlap awkwardly. The rule:

> **`masriva-data.jsx` is the source of truth.** `data.jsx` is a B2B-only adapter that *derives* B2B's `TRIPS` array from the admin's `TEMPLATES` + `INSTANCES`.

Both files are loaded by the B2B portal (admin loads only `masriva-data.jsx`). They both assign things to `window.*` but `masriva-data.jsx` loads first, so its values stand unless explicitly overridden.

### `masriva-data.jsx` (loaded by BOTH apps)

Defines and exposes on `window`:

| Symbol | Shape | What |
|---|---|---|
| `TEMPLATES` | `[{id, code, name, destinations[], status, created, blurb, photo}]` | Level 1 — products the agency sells |
| `INSTANCES` | `[{id, templateId, label, departure, direction, status, capacity, booked, segments[], assigned[{hotelId, prices}]}]` | Level 2 — specific departures with full-stay prices per hotel |
| `HOTELS` | `[{id, name, city, stars, photo, seed, perNight}]` | flat array. Note: `data.jsx` overrides this with a `{city: [hotels]}` shape for B2B |
| `AGENCIES` | `[{id, name, country, city, contact, email, phone, level, joined, users[]}]` | Partner agencies |
| `BOOKINGS` | `[{ref, agencyId, instanceId, pax:{adults,children}, status, total, submitted, lead, holdExpiresAt?}]` | All booking records — mutated by both apps |
| `STATUSES` | `[{key, label, hint}]` | Booking lifecycle states |
| `TEMPLATE_PROGRAMS` | `{templateId: [{day, title, description}]}` | Day-by-day itinerary editor data |
| `AGENCY_BRANDING` | `{agencyId: {accent, accentDeep, logo, tagline}}` | White-label palette per agency |
| `AUDIT_LOG` | `[{id, ts, actor, actorRole, kind, target, from, to, reason}]` | Append-only event stream |

**Helpers exposed on window:**
- `templateById(id)`, `instancesForTemplate(tplId)`, `instanceById(id)`, `hotelById(id)`, `agencyById(id)`
- `agencyWithBrand(id|agency)` — merges agency + its branding overrides
- `templateProgram(id)` / `updateTemplateProgram(id, days)`
- `updateAgencyBranding(id, patch)`
- `saveBooking(b)` — appends to BOOKINGS + persists to `localStorage["nilvoya:bookings"]` + dispatches `nilvoya:bookings:updated` event + audit-logs `booking.created`
- `updateBookingStatus(ref, newStatus)` — mutates in-memory + persisted + event + audit
- `generateBookingRef()` — `NLV-XXXX-NNN` format
- `HOLD_MS`, `isHoldExpired(b)`, `holdHoursLeft(b)`
- `logEvent({actor, actorRole, kind, target, from, to, reason})`
- `auditAll()` / `auditByTarget(target)` / `AUDIT_KIND_LABEL`
- `fmt(n)`, `fmtCur(n)`, `fmtCurCompact(n)`, `stars(n)`, `statusLabel(key)`

### `data.jsx` (loaded ONLY by B2B portal)

- Derives `window.TRIPS` from `window.TEMPLATES` + `window.INSTANCES` via `deriveTrips()`. One trip card per active template.
- Overrides `window.HOTELS` with a city-keyed `{city: [hotels]}` shape that the B2B catalog and wizard expect.
- **Does NOT export `BOOKINGS`** — that part is wrapped in an IIFE archive so it doesn't leak onto window and clobber masriva's BOOKINGS.

### LocalStorage keys

| Key | Holder | Purpose |
|---|---|---|
| `nilvoya:bookings` | masriva-data | New bookings persisted from B2B submit. Survives page reload + cross-tab. |
| `nilvoya:audit` | masriva-data | Audit log (capped at 500). |
| `nilvoya:branding:<agencyId>` | masriva-data | Per-agency branding overrides. |
| `nilvoya:program:<templateId>` | masriva-data | Per-template day-by-day program. |

### Cross-tab + cross-app events

| Event | Dispatched when | Listened by |
|---|---|---|
| `nilvoya:bookings:updated` | `saveBooking()` / `updateBookingStatus()` | Admin app → re-renders + toasts new "submitted" |
| `nilvoya:audit:appended` | `logEvent()` | Audit log screen — live re-render |
| `nilvoya:branding:updated` | `updateAgencyBranding()` | (Available — voucher reload pulls fresh) |
| `nilvoya:program:updated` | `updateTemplateProgram()` | (Available — trip-detail reload pulls fresh) |
| `storage` (native) | Cross-tab localStorage write | Both apps — generic re-render |

Hold expiry sweep — on `masriva-data.jsx` load, any booking with `status: "hold"` and `holdExpiresAt < now` is auto-cancelled (`status: "cancelled", _expiredHold: true`) and the change is mirrored to localStorage.

---

## 4 · The visual system

**Tokens** (in `styles.css` and `masriva-tokens.css`):

```
--ink:       #0E1E36    (deep navy — primary text + nav)
--ink-soft:  #2A3B58
--ink-mute:  #5E6B82
--ink-faint: #8A93A4
--gold:      #B0823A    (default accent — overridden per-agency on voucher)
--gold-deep: #8B6326
--gold-soft: #D4AE6B
--paper:     #FFFFFF
--cream:     #F2F4F7 (B2B) / --parchment-soft: #FBF8F1 (Admin)
--sand-line: #E6E8EC    (cool slate border)
--font-sans: "Poppins"  body 400, headings 500/600 with -0.022em+ tracking
--font-mono: "JetBrains Mono"  refs, prices, dates
```

**Elevation tokens** (added in both stylesheets):
```
--shadow-xs:  0 1px 2px rgba(14,30,54,0.04)
--shadow-sm:  + 0 2px 8px -2px rgba(14,30,54,0.06)
--shadow-md:  0 4px 16px -4px rgba(14,30,54,0.10)
--shadow-lg:  0 24px 48px -12px rgba(14,30,54,0.18)
```

**Status pills:**
- `confirmed` → green
- `submitted` → gold-deep
- `docs` / `pending` → warn amber
- `hold` → soft gold tint
- `completed` → cool gray
- `cancelled` → danger

---

## 5 · Features implemented (themed)

### 5.1 · Brand + design (tasks #1–11, #27, #32)
- Three apps copied + unified under "Nilvoya" name + brand mark
- Re-skinned Masriva (originally warm parchment+terracotta+Amiri) to the B2B editorial style (cream → white, navy + gold + Poppins)
- White background + Poppins everywhere (body weight 400, headings 500/600 with tight tracking)
- Cool slate borders replaced warm beige
- Subtle shadows on cards / modals / detail panels
- Featured trip card downsized twice (now a horizontal strip — 280px photo + body)

### 5.2 · Data unification (tasks #13, #19)
- Admin TEMPLATES + INSTANCES became the single source of truth
- B2B `TRIPS` derived live via `deriveTrips()` — admin edits flow through immediately
- B2B `BOOKINGS` wrapped in IIFE so it doesn't leak; admin's BOOKINGS is what both apps read
- B2B dashboard now filters to the logged-in agency (`agc-001` hardcoded for prototype)
- B2B booking detail handles both old (seed) and new (admin-shape) bookings

### 5.3 · Wizard depth (tasks #15, #18, #24, #25, #26)
- Step 1 uses real admin INSTANCES sorted by date with sold-out states and capacity counts
- Step 1 hotel picker uses admin's per-instance assigned hotels with real prices
- Cairo is "fixed" — Step 1 shows just one Cairo hotel locked + no price grid
- Step 2 defaults to 0 adults / 0 children — Continue blocked until pax > 0
- Step 4 redesigned twice:
  - First as auto-layout with preset bar (Auto / All doubles / Pack triples / Mostly singles)
  - Then as **type-first**: agency adds Single/Double/Triple slots via +/- counters, then drops travelers from an Unassigned pool into rooms. Continue blocked until pool is empty + all rooms valid.
- Step 5 → two actions: **Submit booking** (gold) or **Pre-reserve · 48h hold** (ghost)
- Confirmation screen detects hold vs submitted and adjusts copy + icon

### 5.4 · Room billing model (tasks #18, #24)
- Triple = 3 occupants, **all bill at triple rate** (children in a Triple become adult-equivalent — agency doesn't need to think about "own bed" anymore)
- Double = 2 adults + optional 1 child sharing at the flat child rate
- Single = 1 adult only (children blocked)
- Validation rewritten in agency-friendly language
- `step4Ready(state)` gates the Continue button

### 5.5 · Trip showcase (tasks #22, #23, #28)
- New `screens-trip-detail.jsx` — full pre-wizard pitch (hero with gradient + photo, 4-fact strip, day-by-day timeline, hotels-per-city, included/excluded, sticky Ready-to-book rail)
- Trip cards in catalog click into the detail page first (not straight to wizard)
- Catalog: working search input with × to clear, sort by popular/price/duration/next-date, active-filter pills with × to remove, **Clear all** link
- Trip detail page lists hotels with per-room-type "from" prices (4-column rail per hotel)

### 5.6 · Bookings loop closed (tasks #14, #19, #20)
- B2B wizard submit → `saveBooking()` → admin sees it immediately
- B2B confirmation page has **Track this booking** button → opens the freshly-submitted booking in detail
- Admin app listens for `nilvoya:bookings:updated` + cross-tab `storage` event → re-renders + shows toast for new submissions
- Admin booking detail buttons work: **Mark confirmed**, **Request documents**, **Cancel booking** (with confirm dialog) — all call `updateBookingStatus()` which mutates state, persists, fires the event, audit-logs.

### 5.7 · Voucher (tasks #16, #21, #30, #31)
Standalone `Voucher.html?ref=…`. Loads `masriva-data.jsx`, finds the booking, renders a print-ready document with:
- Header with **agency** brand mark (uploaded logo if present, else initials in agency-accent gradient) + agency name + tagline
- Hero — trip name, blurb, ref + status, **QR code** (api.qrserver.com)
- **Issued to** the lead traveler / **Issued by** the agency (Nilvoya is invisible to the end customer)
- Trip facts strip — Departure / Return / Direction · Travellers / Total nights / Status
- **Flights** — 2 cards (Outbound + Return). Mock airline + flight number + IATA codes + dep/arr times + date. (Generates from instance.direction)
- **Passenger manifest** — full table with # / Name / Passport / Nationality / DOB / Role tag. Names deterministic per booking ref via seeded RNG.
- **Day-by-day program** — pulls from the template's program editor
- **Accommodation** — per-leg hotel card with photo, name+stars, mock address, mock phone, check-in/check-out dates (computed from `instance.departure + cumulative nights`), big nights number
- Price summary, conditions, dual signature block (Authorised signature + Agency stamp)
- Footer: agency name + country
- Print-ready: `@media print` rules, A4 with 16mm margins, watermark

Brand colors injected at render time via inline CSS vars on the `<article>` element so `var(--gold*)` references inherit per-voucher.

Open with `?print=1` to auto-trigger the print dialog.

### 5.8 · Admin Reports (task #17)
`/Reports` route. Live-derived from `BOOKINGS + INSTANCES + AGENCIES + TEMPLATES`:
- KPI strip: Revenue this month, Fill rate, Top destination, Pending review
- Revenue-by-month horizontal bar chart
- "Needs attention" sidebar (top 6 submitted/docs/pending bookings)
- Trips by fill rate table — clickable rows route to that template's instances
- Top agencies leaderboard ranked by lifetime revenue

### 5.9 · Audit log (task #34)
`/Audit log` route. Live-streaming events grouped by date. Each row: time · kind label (color-tinted by tone) · actor + role · target chip · from→to badges · reason. Filters by kind / actor / search. **CSV export**.

Hooks into: `saveBooking`, `updateBookingStatus`, `updateAgencyBranding`, `updateTemplateProgram`. Seeded with 6 mock events on first load.

### 5.10 · White-label per agency (task #32)
- New `AGENCY_BRANDING` map per agency: `{accent, accentDeep, logo, tagline}`
- Admin Agencies → BrandingPanel with live preview swatch, 2 color pickers, tagline field, **logo file upload** (data URL)
- Voucher reads branding via `agencyWithBrand(id)` and applies it as inline CSS vars + replaces the brand mark + tints the "Issued by" panel
- Voyages Méditerranée default = teal `#0E5E6F`, Atlas = Moroccan red, Carthage = Tunisian terracotta, etc.

### 5.11 · Day-by-day program (task #33)
- New `TEMPLATE_PROGRAMS` map with seeded 6–12 day itineraries per template
- Admin Templates row gets a "template" icon button → opens `ProgramEditorModal`: add/remove/reorder days, per-day title + description, persists to localStorage + audit-logs
- B2B trip detail page renders the program as a gold-numbered timeline (1, 2, 3 …)
- Voucher includes the program between Manifest and Accommodation
- Fallback: if no program is published, trip detail shows a per-segment plan

### 5.12 · Passport upload + mock OCR (task #35)
- Step 3 Passports row gets a 48×48 dashed upload zone
- On file selected → `mockOcr(file, role, depDate)` simulates 700ms scan, deterministic by file name+size, returns `{name, passport, nationality, dob, expiry, photo (data URL)}`
- "OCR…" badge in gold while scanning, green check badge after success
- New **Expiry** field below DOB — flagged red if expiry < 6 months from departure
- Adult vs Child distinction respected for DOB range

### 5.13 · Pre-reserve 48h hold (task #29)
- Step 5 footer has both **Pre-reserve · 48h hold** (ghost) and **Submit booking** (gold)
- Hold path: status = `"hold"`, `holdExpiresAt = Date.now() + 48h`
- Confirmation screen detects hold and shows bell icon + expiry timestamp + "Convert to firm booking" hint
- Admin sees gold `.pill.hold` on the bookings list
- On every masriva-data.jsx load, expired holds auto-convert to `cancelled` (`_expiredHold: true` flag)

---

## 6 · Routing (B2B portal)

`app.jsx` is the router root. Hash-less, state-only.

| route | Component | Notes |
|---|---|---|
| `login` | `LoginScreen` | Default route on load |
| `dashboard` | `DashboardScreen` | "My bookings" — filtered to agc-001 |
| `trips` | `CatalogScreen` | Featured trip + grid + search/filter/sort |
| `trip-detail` | `TripDetailScreen` | Pre-wizard pitch |
| `wizard` | `WizardScreen` | 5-step booking flow |
| `booking` | `BookingDetailScreen` | Read a single booking |

State held in the App component: `route, wizardTrip, viewingTrip, activeBooking, t (tweaks)`.

**Chromeless screens** (no sidebar): `login`, `trips`, `wizard`. Everything else gets the floating profile chip → click for dashboard.

## 7 · Routing (Admin)

`masriva-app.jsx`:

| route | Component |
|---|---|
| `dashboard` | `MsrvDashboard` |
| `templates` | `MsrvTemplates` |
| `instances` | `MsrvInstances` |
| `hotels` | `MsrvHotels` |
| `agencies` | `MsrvAgencies` |
| `bookings` | `MsrvBookings` |
| `reports` | `MsrvReports` |
| `audit` | `MsrvAudit` |
| `settings` | stub |

Sidebar: Operations group (Dashboard / Templates / Instances / Hotels / Agencies / Bookings) + Records group (Reports / Audit log / Settings).

Hardcoded ops user: "Fatima Aboud" (FA avatar). Hardcoded partner user on B2B: "Yacine Belaïd" (Voyages Méditerranée, agc-001).

---

## 8 · Cache buster discipline

Babel-standalone caches transpiled scripts and the browser caches both HTML and JSX. After any edit, **you must bump the `?v=N` query string** in the HTML's `<script>` tags or your changes won't load.

Current versions (as of writing this handoff):
- `Nilvoya B2B.html` → `?v=26`
- `Nilvoya Admin.html` → `?v=18`
- `Voucher.html` → no cache buster (always fetched fresh; loads `masriva-data.jsx?v=8` which is independent)

**Pattern when editing a JSX/CSS file:**
1. Save the change.
2. In the HTML that loads it, bump every `?v=N` on every script + the stylesheet.
3. Reload with `location.replace('...?fresh=' + Date.now())` to bypass HTML cache too.

If `window.<helper>` is undefined after a script edit and the file is correct on disk, it's a stale browser cache — bump `?v=`.

---

## 9 · Known limitations + intentional gaps

**Auth:** Login is fake — any "Enter portal" click logs you in. No real session, no real role split. The platform assumes `agc-001` for any B2B traveller.

**Mobile:** Both apps are locked to `<meta name="viewport" content="width=1280">`. They will work on a mobile browser but won't reflow.

**i18n:** Landing page advertises FR / EN / AR but only EN is implemented. Arabic RTL untouched.

**Payments:** No money flow at all. Status field changes are decorative — there's no `payment.received` or invoice.

**Inventory:** `INSTANCES.booked` is a static number. A new B2B submission does **not** increment it. (Easy add: in `saveBooking` bump the related instance's `booked` count by total pax.)

**Babel-standalone caveats:**
- `const` at the top of a `<script type="text/babel">` becomes `var` after transpile → leaks to window. We rely on this for `window.TEMPLATES`, `window.BOOKINGS`, etc. *Do not* introduce a top-level `const` whose name collides with one in another loaded script (this is why `data.jsx` wraps `BOOKINGS` in an IIFE).
- Top-level `function foo()` declarations *are* hoisted onto window the same way.
- The browser HTTP cache aggressively reuses `?v=N` responses across reloads. Always bump.

**Voucher screenshots in the preview tool:** sometimes timeout because the doc is long. Inspect the DOM directly to verify renders.

**Hotel IDs:** Admin uses `"h-ppi"`, `"h-rch"` etc. B2B's HOTELS catalog uses short IDs `"ppi"`, `"rch"`. `hotelOptionsForInstance()` strips the `"h-"` prefix when looking up. *If you add a hotel in admin, also add it to B2B's catalog or it won't appear in the wizard.*

**Currency:** All amounts are DZD (Algerian dinar). No FX, no multi-currency. `fmtCur(n)` → `"DZD 1,232,000"`, `fmtCurCompact(n)` → `"DZD 1.23M"`.

---

## 10 · Suggested next steps (ordered by ROI)

### Highest impact

1. **Payments + deposit policy + per-agency credit line.** The platform looks polished but doesn't move money. That's the gap between "demo" and "MVP". Adds: payment-status pill, deposit %, "Mark as paid" admin action, monthly statements per agency, blocked checkout for past-due Bronze tier.
2. **Booked-seat increment on submit.** Wire `saveBooking` to mutate the instance's `booked` count so sold-out states update live.
3. **Mobile responsive.** Even just collapsing the sidebar to a top nav below 1024px would 2× the demo audience.
4. **Arabic RTL + French stubs.** Already advertised on the landing — even string dictionaries + RTL switch raises perceived professionalism.

### Medium impact

5. **Real backend.** PostgreSQL + Prisma + a thin REST API. Port the prototype's data shape directly. localStorage becomes a fallback.
6. **Embeddable trip widget.** `<script src="/embed.js?agency=…">` for agencies to drop on their own sites. Already half-built — the branded voucher proves it can render under the agency's identity.
7. **Email / WhatsApp templates.** Booking received, deposit reminder, voucher issued, departure tomorrow.
8. **Cohort retention + hotel margin analysis** in Reports.

### Polish

9. **Auto-cancel for unpaid bookings.** Already half-built for 48h pre-reservations — extend to "deposit not received within 7 days → release."
10. **SLA timers + escalations** on the admin bookings inbox.
11. **Group code blocks** — pre-reserve seats for an agency for N days (soft inventory walls).
12. **Real flight schedules per instance** (currently mocked from direction).
13. **Trip companion micro-site** at `/trip/<ref>` for the actual travellers (itinerary, voucher, weather, maps, emergency contacts).

---

## 11 · Conventions

**JSX files** all start with a banner comment explaining the file's purpose. Keep that pattern.

**`window.X` exports** happen at the bottom of every file via `Object.assign(window, {...})` or single `window.X = X` for screens. Keep the bottom of every file as the one place to scan to know what's public.

**Cache busters** are bumped in two HTMLs:
- `Nilvoya B2B.html` — `?v=26`
- `Nilvoya Admin.html` — `?v=18`

When you bump, use `sed` for safety:
```bash
sed -i 's/?v=26/?v=27/g' 'Nilvoya B2B.html'
```

**localStorage keys** namespaced `nilvoya:*` for easy debug `localStorage.clear()` is destructive; prefer:
```js
Object.keys(localStorage).filter(k => k.startsWith('nilvoya:')).forEach(k => localStorage.removeItem(k));
```

**Audit log** — call `window.logEvent(...)` from any mutation path so the audit screen captures it.

**Booking refs** — format `NLV-XXXX-NNN`. Use `window.generateBookingRef()`.

---

## 12 · Test users + sample data

**Partner login (B2B):** Hardcoded — *Yacine Belaïd · Voyages Méditerranée · ALG (agc-001)*. Any login submit lands you in.

**Ops login (Admin):** Hardcoded — *Fatima Aboud · Operations*. Always logged-in.

**Sample booking refs to demo:**
| Ref | Agency | Status | Notes |
|---|---|---|---|
| `NLV-2H8K-441` | Voyages Méditerranée · ALG | confirmed | Cairo + Sharm el-Sheikh · 14a / 2c · DZD 2.68M |
| `NLV-7M3V-209` | Sahara Holidays · ALG | docs | Cairo + Sharm el-Sheikh |
| `NLV-5R1P-882` | Carthage Voyages · TUN | pending | Cairo only |
| `NLV-9D4X-115` | Atlas Travel Group · MAR | submitted | (confirmed by an earlier test) |
| `NLV-3K6T-067` | Voyages Méditerranée · ALG | completed | |
| `NLV-1F2Q-553` | Voyages Méditerranée · ALG | docs | Grand Egypt circuit |

Open `Voucher.html?ref=<REF>` to see any of these.

**Agencies + their default brand accents:**
| ID | Name | Country | Accent | Tagline |
|---|---|---|---|---|
| `agc-001` | Voyages Méditerranée | Algeria | `#0E5E6F` teal | "Mediterranean charter, since 2021" |
| `agc-002` | Atlas Travel Group | Morocco | `#A12B33` red | "From the Atlas to the Red Sea" |
| `agc-003` | Carthage Voyages | Tunisia | `#C04122` terracotta | "The Mediterranean reimagined" |
| `agc-004` | Beirut Sun Travel | Lebanon | `#C77818` orange | "Beirut · Cairo · Beyond" |
| `agc-005` | Sahara Holidays | Algeria | `#8E6A2A` ochre | "Desert routes & resort breaks" |
| `agc-006` | Cedar Trails | Lebanon | `#1F6038` green | "Cedar Trails · Egyptian sands" |
| `agc-007` | Levant Discovery | Jordan | `#3F5687` blue | "Levant ↔ Nile" |
| `agc-008` | Paris-Nile Tours | France | `#4B6C7A` slate | "Paris vers le Nil" |

**Trip templates (active):**
- `tpl-cr-sh` — Cairo + Sharm el-Sheikh (9 days)
- `tpl-cr-hr` — Cairo + Hurghada (8 days)
- `tpl-sh` — Sharm el-Sheikh only (8 days)
- `tpl-cr` — Cairo only (6 days)
- `tpl-hr-sh` — Hurghada + Sharm (9 days)
- `tpl-grand` — Grand Egypt circuit (12 days)
- `tpl-hr` — Hurghada only (inactive)

---

## 13 · How a typical demo runs

1. Open **Landing** → click `Partner Login`.
2. Land on **B2B Login** → click `Enter portal`.
3. **Catalog** opens — featured trip (Cairo + Sharm) on top, 5 cards below.
4. Click a trip card → **Trip Detail** opens with full day-by-day, hotels with prices, ready-to-book sticky rail.
5. Click `Start booking` → **Wizard Step 1** (departure dates from admin instances).
6. Pick a date, scroll to hotel pickers — Cairo shows 1 fixed locked card, Sharm shows 4 selectable with admin prices.
7. Step 2 → bump adults/children counters (start at 0/0).
8. Step 3 → upload a fake passport photo per traveler → OCR auto-fills name/passport/expiry.
9. Step 4 → add Doubles/Triples/Singles via +/- counters → drag pax from the Unassigned pool into rooms via the dropdowns → live total updates.
10. Step 5 → review with running total → click `Pre-reserve · 48h hold` OR `Submit booking`.
11. Confirmation → click `Track this booking` → opens the new ref in the booking detail.
12. Open **Admin** (different tab) → Bookings → new booking is at the top, gold "On hold" or navy "Submitted" pill.
13. Click `Mark confirmed` → status changes, audit log appended, toast (if dispatched live).
14. Click the **Voucher** action button → a new tab opens with the agency-branded printable voucher (logo / accent / day-by-day / passport names / flights / hotels with addresses).
15. Open **Admin → Audit log** → see every state change captured.

End to end in under 90 seconds, every screen functional, every number consistent.

---

That's the whole thing. If you change anything, **bump the cache buster** and update this file.
