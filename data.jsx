// data.jsx — Sample data + shared utilities
// Exposed on window so other files can read.
//
// Trips shown in the B2B catalogue are DERIVED from the admin's templates
// + instances (masriva-data.jsx). Edit a template in Nilvoya Admin and the
// public-facing trip card updates here automatically — no duplication.

const NATIONALITIES = ["Algerian", "Tunisian", "Moroccan", "French", "Lebanese", "Saudi", "Emirati", "Jordanian"];

// ── Derive TRIPS from admin TEMPLATES + INSTANCES ──────────────────
// Requires masriva-data.jsx to be loaded before this file.
function deriveTrips() {
  const TEMPLATES = window.TEMPLATES || [];
  const INSTANCES = window.INSTANCES || [];
  if (!TEMPLATES.length) {
    console.warn("[data.jsx] No admin TEMPLATES found — load masriva-data.jsx before data.jsx.");
    return [];
  }
  return TEMPLATES
    .filter(t => t.status === "active")
    .map(t => {
      const tplInstances = INSTANCES.filter(i => i.templateId === t.id);
      const liveInstances = tplInstances.filter(i => i.status === "open" || i.status === "filling");
      const sorted = [...liveInstances].sort((a, b) => new Date(a.departure) - new Date(b.departure));
      const next = sorted[0] || tplInstances[0];
      const segments = next ? next.segments
        : t.destinations.map(c => ({ city: c, nights: c === "Cairo" ? 3 : 5 }));
      const totalNights = segments.reduce((s, x) => s + x.nights, 0);
      const allDoubles = liveInstances.flatMap(i => i.assigned.map(a => a.prices.double));
      const fromPrice = allDoubles.length ? Math.min(...allDoubles) : 0;
      return {
        id: t.id,
        code: `${t.code} / ${String(totalNights).padStart(2, "0")}N`,
        name: t.name,
        blurb: t.blurb || "",
        destinations: t.destinations,
        segments,
        runs: liveInstances.length,
        nextDate: next ? next.departure : "—",
        fromPrice,
        photo: t.photo,
      };
    });
}
const TRIPS = deriveTrips();

// Each hotel is an explicit option with its own per-pax-per-night rates.
// Total stay price per pax = perNight[roomType] * nights at that city.
// Hotels are a GLOBAL CATALOGUE keyed by destination. Each hotel has a
// `seed` per-night rate used only as a starting suggestion when first
// assigning the hotel to a trip — the authoritative price lives on
// `TRIP_HOTELS` and is full-stay, per-pax, set per (trip × hotel).
const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=320&q=80`;
const HOTELS = {
  "Cairo": [
    { id: "ppi",   name: "Pyramids Park Inn",         stars: 3, photo: U("1568322445389-f64ac2515020"), seed: { single: 15500, double: 12500, triple: 11000, child: 8000 } },
    { id: "rch",   name: "Royal Cleo Hotel",          stars: 3, photo: U("1551882547-ff40c63fe5fa"),    seed: { single: 16500, double: 13500, triple: 12000, child: 8500 } },
    { id: "gza",   name: "Giza Plaza",                stars: 3, photo: U("1551918120-9739cb430c6d"),    seed: { single: 15000, double: 12000, triple: 10500, child: 7500 } },
    { id: "lmcp",  name: "Le Méridien Cairo Pyramids", stars: 4, photo: U("1566073771259-6a8506099945"), seed: { single: 22500, double: 18000, triple: 16000, child: 11000 } },
    { id: "stah",  name: "Steigenberger Tahrir",      stars: 4, photo: U("1564501049412-61c2a3083791"), seed: { single: 22000, double: 17500, triple: 15500, child: 11000 } },
    { id: "mmh",   name: "Marriott Mena House",       stars: 5, photo: U("1542314831-068cd1dbfeeb"),    seed: { single: 31500, double: 25000, triple: 22000, child: 14500 } },
    { id: "fsnp",  name: "Four Seasons Nile Plaza",   stars: 5, photo: U("1611892440504-42a792e24d32"), seed: { single: 35000, double: 27500, triple: 24500, child: 15500 } },
    { id: "kn",    name: "Kempinski Nile",            stars: 5, photo: U("1455587734955-081b22074882"), seed: { single: 32500, double: 26000, triple: 23000, child: 14500 } }
  ],
  "Sharm el-Sheikh": [
    { id: "shr",   name: "Sharm Holiday Resort",      stars: 3, photo: U("1559734840-f9509ee5677f"),    seed: { single: 14000, double: 11500, triple: 10000, child: 7500 } },
    { id: "nbi",   name: "Naama Beach Inn",           stars: 3, photo: U("1582719508461-905c673771fd"), seed: { single: 13500, double: 11000, triple: 9500,  child: 7000 } },
    { id: "vsh",   name: "Verginia Sharm",            stars: 3, photo: U("1561501900-3701fa6a0864"),    seed: { single: 14500, double: 11500, triple: 10000, child: 7500 } },
    { id: "csr",   name: "Coral Sea Holiday Resort",  stars: 4, photo: U("1571896349842-33c89424de2d"), seed: { single: 21000, double: 17000, triple: 15000, child: 10500 } },
    { id: "sdb",   name: "Sunrise Diamond Beach",     stars: 4, photo: U("1582719471384-894fbb16e074"), seed: { single: 20500, double: 16500, triple: 14500, child: 10500 } },
    { id: "fssh",  name: "Four Seasons Sharm",        stars: 5, photo: U("1520250497591-112f2f40a3f4"), seed: { single: 33000, double: 26500, triple: 23500, child: 14500 } },
    { id: "rps",   name: "Rixos Premium Seagate",     stars: 5, photo: U("1535827841776-24afc1e255ac"), seed: { single: 30500, double: 24500, triple: 21500, child: 14000 } }
  ],
  "Hurghada": [
    { id: "rtb",   name: "Royal Tulip Beach",         stars: 3, photo: U("1551763985-13b643f4a09c"),    seed: { single: 13500, double: 11000, triple: 9500,  child: 7000 } },
    { id: "avr",   name: "Aqua Vista Resort",         stars: 3, photo: U("1564013799919-ab600027ffc6"), seed: { single: 14000, double: 11500, triple: 10000, child: 7500 } },
    { id: "sam",   name: "Steigenberger Aqua Magic",  stars: 4, photo: U("1582719471384-894fbb16e074"), seed: { single: 20000, double: 16000, triple: 14000, child: 10000 } },
    { id: "sgb",   name: "Sunrise Garden Beach",      stars: 4, photo: U("1535827841776-24afc1e255ac"), seed: { single: 20500, double: 16500, triple: 14500, child: 10500 } },
    { id: "bpsh",  name: "Baron Palace Sahl Hasheesh",stars: 5, photo: U("1542314831-068cd1dbfeeb"),    seed: { single: 29500, double: 23500, triple: 21000, child: 13500 } },
    { id: "smp",   name: "Sentido Mamlouk Palace",    stars: 5, photo: U("1455587734955-081b22074882"), seed: { single: 28500, double: 23000, triple: 20500, child: 13500 } }
  ],
  "Luxor": [
    { id: "lsnp",  name: "Luxor Steigenberger Nile Palace", stars: 3, photo: U("1551918120-9739cb430c6d"), seed: { single: 16000, double: 13000, triple: 11500, child: 8500 } },
    { id: "ibl",   name: "Iberotel Luxor",            stars: 3, photo: U("1561501900-3701fa6a0864"),    seed: { single: 15500, double: 12500, triple: 11000, child: 8000 } },
    { id: "snp",   name: "Steigenberger Nile Palace", stars: 4, photo: U("1564501049412-61c2a3083791"), seed: { single: 23000, double: 18500, triple: 16500, child: 11500 } },
    { id: "achti", name: "Achti Resort",              stars: 4, photo: U("1566073771259-6a8506099945"), seed: { single: 22000, double: 17500, triple: 15500, child: 11000 } },
    { id: "swp",   name: "Sofitel Winter Palace",     stars: 5, photo: U("1611892440504-42a792e24d32"), seed: { single: 34000, double: 27000, triple: 24000, child: 15500 } },
    { id: "hlr",   name: "Hilton Luxor Resort",       stars: 5, photo: U("1551882547-ff40c63fe5fa"),    seed: { single: 31500, double: 25500, triple: 22500, child: 14500 } }
  ]
};

// Back-compat shim: a few legacy screens still read `.perNight`. Mirror seed
// there so they keep working until they migrate to TRIP_HOTELS.
Object.values(HOTELS).forEach(list => list.forEach(h => { h.perNight = h.seed; }));

// Backwards-compat helpers — old code that still wants the {tier: [names]} shape.
function hotelsByTier(city, tier) {
  return (HOTELS[city] || []).filter(h => h.stars === tier).map(h => h.name);
}
function hotelById(city, id) {
  return (HOTELS[city] || []).find(h => h.id === id);
}
function cheapestHotel(city, stars) {
  const candidates = (HOTELS[city] || []).filter(h => h.stars === stars);
  candidates.sort((a, b) => a.perNight.double - b.perNight.double);
  return candidates[0] || (HOTELS[city] || [])[0];
}
// Legacy: keep PRICING.default as a tier-average fallback for old BOOKINGS records.
const PRICING = {
  default: {
    3: { single: 15500, double: 12500, triple: 11000, child: 8000 },
    4: { single: 22000, double: 17500, triple: 15500, child: 11000 },
    5: { single: 32500, double: 26000, triple: 23000, child: 14500 }
  }
};

// BOOKINGS used to live here as a seed array, but Babel transpiles `const` to
// `var` in classic <script> tags which leaks the name onto window — clobbering
// the admin's BOOKINGS array loaded earlier from masriva-data.jsx. We keep the
// archive of old shapes inside an IIFE so the data is preserved for reference
// but doesn't escape to window. The B2B portal reads window.BOOKINGS (admin's
// single source of truth).
const _LEGACY_B2B_BOOKINGS_ARCHIVE = (function() { return [
  {
    ref: "EGP-2H8K-441",
    trip: "Cairo & Sharm el-Sheikh",
    tripCode: "CR · SH / 09N",
    departure: "May 28, 2026",
    pax: { adults: 14, children: 2 },
    tier: 4,
    status: "confirmed",
    total: 2678400,
    submitted: "Apr 28",
    lead: "Karim Belkacem"
  },
  {
    ref: "EGP-7M3V-209",
    trip: "Sharm el-Sheikh, full week",
    tripCode: "SH / 07N",
    departure: "Jun 04, 2026",
    pax: { adults: 22, children: 5 },
    tier: 5,
    status: "verified",
    total: 5186700,
    submitted: "May 02",
    lead: "Nora Haddad"
  },
  {
    ref: "EGP-5R1P-882",
    trip: "Cairo, classical",
    tripCode: "CR / 05N",
    departure: "May 21, 2026",
    pax: { adults: 8, children: 0 },
    tier: 3,
    status: "pending",
    total: 777600,
    submitted: "May 05",
    lead: "Yacine Mansouri"
  },
  {
    ref: "EGP-9D4X-115",
    trip: "Luxor & Cairo",
    tripCode: "LX · CR / 09N",
    departure: "Jun 11, 2026",
    pax: { adults: 12, children: 3 },
    tier: 4,
    status: "submitted",
    total: 2324700,
    submitted: "May 09",
    lead: "Hafsa Brahimi"
  },
  {
    ref: "EGP-3K6T-067",
    trip: "Cairo & Hurghada",
    tripCode: "CR · HR / 08N",
    departure: "May 14, 2026",
    pax: { adults: 18, children: 4 },
    tier: 4,
    status: "completed",
    total: 3022650,
    submitted: "Mar 18",
    lead: "Sami Ould-Ali"
  },
  {
    ref: "EGP-1F2Q-553",
    trip: "Grand Egypt circuit",
    tripCode: "CR · SH · HR / 12N",
    departure: "Jun 18, 2026",
    pax: { adults: 28, children: 6 },
    tier: 5,
    status: "verified",
    total: 7929900,
    submitted: "May 11",
    lead: "Karim Belkacem"
  },
  {
    ref: "EGP-8C7N-310",
    trip: "Cairo, classical",
    tripCode: "CR / 05N",
    departure: "Jul 02, 2026",
    pax: { adults: 6, children: 1 },
    tier: 5,
    status: "submitted",
    total: 1305450,
    submitted: "May 12",
    lead: "Nora Haddad"
  },
  {
    ref: "EGP-4B9L-988",
    trip: "Sharm el-Sheikh, full week",
    tripCode: "SH / 07N",
    departure: "May 07, 2026",
    pax: { adults: 16, children: 2 },
    tier: 3,
    status: "completed",
    total: 1900800,
    submitted: "Feb 22",
    lead: "Sami Ould-Ali"
  }
]; })();

const STATUS_LABEL = {
  hold: "On hold · 48h",
  submitted: "Submitted",
  docs: "Documents pending",
  verified: "Documents verified",
  confirmed: "Confirmed",
  pending: "Pending info",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

const fmt = (n) => n.toLocaleString("en-US");
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
// Currency: Algerian Dinar. Conventional B2B notation is "DZD 123,500".
const CUR = "DZD";
const fmtCur = (n) => `${CUR}\u00A0${n.toLocaleString("en-US")}`;
// Compact form for huge totals: "DZD 5.19M"
const fmtCurCompact = (n) => {
  if (n >= 1e6) return `${CUR}\u00A0${(n/1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${CUR}\u00A0${(n/1e3).toFixed(0)}k`;
  return fmtCur(n);
};

// ─── Per-trip hotel assignments + pricing ─────────────────────────
// One trip can assign N hotels from the global catalogue. For every assigned
// hotel we store 4 full-stay, per-pax prices specific to that trip. Same
// hotel on a different trip can have different prices.
//   TRIP_HOTELS[tripId] = [{ hotelId, city, prices: { single, double, triple, child } }, ...]
const TRIP_HOTELS = {};
TRIPS.forEach(trip => {
  const rows = [];
  trip.segments.forEach(seg => {
    (HOTELS[seg.city] || []).forEach(h => {
      rows.push({
        hotelId: h.id,
        city: seg.city,
        prices: {
          single: h.seed.single * seg.nights,
          double: h.seed.double * seg.nights,
          triple: h.seed.triple * seg.nights,
          child:  h.seed.child  * seg.nights,
        },
      });
    });
  });
  TRIP_HOTELS[trip.id] = rows;
});

// Lookup: full hotel record + per-trip prices in one shot.
function tripHotelRow(tripId, hotelId) {
  return (TRIP_HOTELS[tripId] || []).find(r => r.hotelId === hotelId);
}
// Count how many trips currently assign a given hotel.
function hotelUsageCount(hotelId) {
  return Object.values(TRIP_HOTELS).filter(rows => rows.some(r => r.hotelId === hotelId)).length;
}

Object.assign(window, {
  TRIPS, HOTELS, PRICING, STATUS_LABEL, NATIONALITIES,
  // Note: window.BOOKINGS comes from masriva-data.jsx — admin's bookings list
  // is the single source of truth. We don't export B2B's seed BOOKINGS so
  // saveBooking() reaches the same array both apps render.
  TRIP_HOTELS, tripHotelRow, hotelUsageCount,
  fmt, stars, CUR, fmtCur, fmtCurCompact,
  hotelsByTier, hotelById, cheapestHotel
});
