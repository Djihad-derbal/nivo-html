// masriva-data.jsx
// Nilvoya admin data layer. Self-contained — no dependency on Nilvoya files.
//
// Two-level trip model
//   Level 1: TEMPLATES   — name + destination combination, e.g. "Cairo + Sharm"
//   Level 2: INSTANCES   — concrete, bookable runs. Reference a template, and
//                           carry segments (city × nights), direction, departure
//                           date, status, assigned hotels with per-instance
//                           prices (single/double/triple/child, full per-pax).
//
// HOTELS is a flat global catalogue keyed by id. Hotels are reused across
// many instances. Same hotel on a different instance has different prices.
//
// All currency in DZD. Reference "today" for relative dates: May 21, 2026.

// ─── Hotels (global catalogue) ─────────────────────────────────────
const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=80`;
const HOTELS = [
  // Cairo · 3★ (Comfort)
  { id: "h-ppi",  name: "Pyramids Park Inn",         city: "Cairo",            stars: 3, photo: U("1568322445389-f64ac2515020") },
  { id: "h-rch",  name: "Royal Cleo Hotel",          city: "Cairo",            stars: 3, photo: U("1551882547-ff40c63fe5fa") },
  { id: "h-gza",  name: "Giza Plaza",                city: "Cairo",            stars: 3, photo: U("1551918120-9739cb430c6d") },
  // Cairo · 4★ (Premium)
  { id: "h-lmcp", name: "Le Méridien Cairo Pyramids", city: "Cairo",           stars: 4, photo: U("1566073771259-6a8506099945") },
  { id: "h-stah", name: "Steigenberger Tahrir",      city: "Cairo",            stars: 4, photo: U("1564501049412-61c2a3083791") },
  // Cairo · 5★ (Luxury)
  { id: "h-mmh",  name: "Marriott Mena House",       city: "Cairo",            stars: 5, photo: U("1542314831-068cd1dbfeeb") },
  { id: "h-fsnp", name: "Four Seasons Nile Plaza",   city: "Cairo",            stars: 5, photo: U("1611892440504-42a792e24d32") },
  { id: "h-kn",   name: "Kempinski Nile",            city: "Cairo",            stars: 5, photo: U("1455587734955-081b22074882") },

  // Sharm el-Sheikh · 3★
  { id: "h-shr",  name: "Sharm Holiday Resort",      city: "Sharm el-Sheikh",  stars: 3, photo: U("1559734840-f9509ee5677f") },
  { id: "h-nbi",  name: "Naama Beach Inn",           city: "Sharm el-Sheikh",  stars: 3, photo: U("1582719508461-905c673771fd") },
  // Sharm · 4★
  { id: "h-csr",  name: "Coral Sea Holiday Resort",  city: "Sharm el-Sheikh",  stars: 4, photo: U("1571896349842-33c89424de2d") },
  { id: "h-sdb",  name: "Sunrise Diamond Beach",     city: "Sharm el-Sheikh",  stars: 4, photo: U("1582719471384-894fbb16e074") },
  { id: "h-vsh",  name: "Verginia Sharm",            city: "Sharm el-Sheikh",  stars: 4, photo: U("1561501900-3701fa6a0864") },
  // Sharm · 5★
  { id: "h-fssh", name: "Four Seasons Sharm",        city: "Sharm el-Sheikh",  stars: 5, photo: U("1520250497591-112f2f40a3f4") },
  { id: "h-rps",  name: "Rixos Premium Seagate",     city: "Sharm el-Sheikh",  stars: 5, photo: U("1535827841776-24afc1e255ac") },

  // Hurghada · 3★
  { id: "h-rtb",  name: "Royal Tulip Beach",         city: "Hurghada",         stars: 3, photo: U("1551763985-13b643f4a09c") },
  { id: "h-avr",  name: "Aqua Vista Resort",         city: "Hurghada",         stars: 3, photo: U("1564013799919-ab600027ffc6") },
  // Hurghada · 4★
  { id: "h-sam",  name: "Steigenberger Aqua Magic",  city: "Hurghada",         stars: 4, photo: U("1582719471384-894fbb16e074") },
  { id: "h-sgb",  name: "Sunrise Garden Beach",      city: "Hurghada",         stars: 4, photo: U("1535827841776-24afc1e255ac") },
  // Hurghada · 5★
  { id: "h-bpsh", name: "Baron Palace Sahl Hasheesh", city: "Hurghada",        stars: 5, photo: U("1542314831-068cd1dbfeeb") },
  { id: "h-smp",  name: "Sentido Mamlouk Palace",    city: "Hurghada",         stars: 5, photo: U("1455587734955-081b22074882") },
];
function hotelById(id) { return HOTELS.find(h => h.id === id); }
function hotelsByCity(city) { return HOTELS.filter(h => h.city === city); }

const DESTINATIONS = ["Cairo", "Sharm el-Sheikh", "Hurghada"];

// ─── Trip templates (Level 1) ──────────────────────────────────────
// Each template is one product the agency sells. `photo` + `blurb` feed the
// public-facing showcase card in the B2B portal (Nilvoya B2B). Edit a template
// here and the change reflects on the partner-facing trip catalogue.
const TEMPLATES = [
  { id: "tpl-cr-sh", code: "CR · SH",      name: "Cairo + Sharm el-Sheikh", destinations: ["Cairo", "Sharm el-Sheikh"],             status: "active",   created: "Jan 2024", blurb: "Pyramids by day, Red Sea by night.",   photo: "https://images.unsplash.com/photo-1539768942893-daf53e448371?auto=format&fit=crop&w=900&q=80" },
  { id: "tpl-cr-hr", code: "CR · HR",      name: "Cairo + Hurghada",        destinations: ["Cairo", "Hurghada"],                    status: "active",   created: "Jan 2024", blurb: "Antiquities, then aquamarine.",         photo: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=80" },
  { id: "tpl-sh",    code: "SH",           name: "Sharm el-Sheikh only",    destinations: ["Sharm el-Sheikh"],                      status: "active",   created: "Jan 2024", blurb: "Resort-only stay on Naama Bay.",        photo: "https://images.unsplash.com/photo-1559734840-f9509ee5677f?auto=format&fit=crop&w=900&q=80" },
  { id: "tpl-cr",    code: "CR",           name: "Cairo only",              destinations: ["Cairo"],                                status: "active",   created: "Jan 2024", blurb: "Giza, Saqqara, the Egyptian Museum.",   photo: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=900&q=80" },
  { id: "tpl-hr-sh", code: "HR · SH",      name: "Hurghada + Sharm",        destinations: ["Hurghada", "Sharm el-Sheikh"],          status: "active",   created: "Sep 2024", blurb: "Two Red Sea coasts in one trip.",       photo: "https://images.unsplash.com/photo-1582034986517-30d163aa1da9?auto=format&fit=crop&w=900&q=80" },
  { id: "tpl-grand", code: "CR · SH · HR", name: "Grand Egypt circuit",     destinations: ["Cairo", "Sharm el-Sheikh", "Hurghada"], status: "active",   created: "Mar 2025", blurb: "All three icons, twelve nights.",       photo: "https://images.unsplash.com/photo-1547636780-8aa64a72ad36?auto=format&fit=crop&w=900&q=80" },
  { id: "tpl-hr",    code: "HR",           name: "Hurghada only",           destinations: ["Hurghada"],                             status: "inactive", created: "Apr 2024", blurb: "Diving and downtime on the Red Sea.",   photo: "https://images.unsplash.com/photo-1543248939-ff40856f65d4?auto=format&fit=crop&w=900&q=80" },
];
function templateById(id) { return TEMPLATES.find(t => t.id === id); }

// ─── Day-by-day program per template ───────────────────────────────
// Editable in admin → Templates. Surfaced on the B2B trip-detail page and on
// the voucher's "Day-by-day program" section. Persisted to localStorage.
const TEMPLATE_PROGRAMS = {
  "tpl-cr-sh": [
    { day: 1, title: "Arrival in Cairo",            description: "Airport pickup, transfer to the hotel near Giza, light dinner and briefing with the local representative." },
    { day: 2, title: "Pyramids of Giza & the Sphinx", description: "Full-day guided tour of the Giza plateau, lunch with a Pyramids view, optional camel ride at sunset." },
    { day: 3, title: "Fly to Sharm el-Sheikh",      description: "Morning visit to the Egyptian Museum, transfer to the airport, short domestic flight, beachside dinner on Naama Bay." },
    { day: 4, title: "Ras Mohamed National Park",   description: "Snorkeling boat trip to one of the world's best reef sites. Lunch on board. Free afternoon." },
    { day: 5, title: "Free day on the Red Sea",     description: "Pool / beach day. Optional excursions: glass-bottom boat, quad-bike desert sunset, or spa." },
    { day: 6, title: "Naama Bay shopping",          description: "Half-day Naama Bay & Old Market visit. Afternoon at the resort or optional dive intro." },
    { day: 7, title: "Sharm leisure",               description: "Beach day. Children's activities at the resort. Evening at a local restaurant." },
    { day: 8, title: "Last morning in Sharm",       description: "Late check-out. Transfer to the airport." },
    { day: 9, title: "Departure",                   description: "Return flight to Algiers." },
  ],
  "tpl-cr-hr": [
    { day: 1, title: "Arrival in Cairo",            description: "Airport pickup, hotel check-in, evening at leisure." },
    { day: 2, title: "Giza day-tour",               description: "Pyramids, Sphinx, panoramic stop and Egyptian Museum." },
    { day: 3, title: "Cairo to Hurghada",           description: "Transfer to Hurghada by domestic flight. Check-in at the resort." },
    { day: 4, title: "Reef snorkeling",             description: "Full-day boat trip to Giftun Island. Lunch on board." },
    { day: 5, title: "Free day at the resort",      description: "Beach, pool, optional spa or diving excursions." },
    { day: 6, title: "El Gouna day-trip",           description: "Half-day at El Gouna's lagoons and downtown." },
    { day: 7, title: "Sunset desert safari",        description: "Quad-bike sunset safari with Bedouin tea + dinner." },
    { day: 8, title: "Departure",                   description: "Transfer to Hurghada airport. Return flight." },
  ],
  "tpl-sh": [
    { day: 1, title: "Arrival in Sharm el-Sheikh",  description: "Airport pickup, resort check-in, welcome dinner on Naama Bay." },
    { day: 2, title: "Ras Mohamed snorkeling",      description: "Full-day boat trip to the protected marine park." },
    { day: 3, title: "Resort leisure",              description: "Beach and pool day. Optional excursions available." },
    { day: 4, title: "Desert & camel safari",       description: "Half-day desert excursion. Sunset views with Bedouin tea." },
    { day: 5, title: "Old Market visit",            description: "Free morning. Afternoon visit to Sharm's Old Market." },
    { day: 6, title: "Reef diving intro",           description: "Optional discovery dive or family snorkel. Beach evening." },
    { day: 7, title: "Last day",                    description: "Beach morning, late check-out, dinner on Naama Bay." },
    { day: 8, title: "Departure",                   description: "Transfer to the airport. Return flight." },
  ],
  "tpl-cr": [
    { day: 1, title: "Arrival in Cairo",            description: "Pickup, hotel check-in, evening tea on the Nile." },
    { day: 2, title: "Pyramids of Giza",            description: "Full-day guided tour of the Giza plateau and Sphinx." },
    { day: 3, title: "Saqqara & Memphis",           description: "Step Pyramid of Djoser and the old capital of Memphis." },
    { day: 4, title: "Egyptian Museum",             description: "Morning at the Egyptian Museum, afternoon free in Khan el-Khalili." },
    { day: 5, title: "Coptic Cairo",                description: "Hanging Church, Ben Ezra Synagogue, Coptic Museum. Last evening dinner cruise." },
    { day: 6, title: "Departure",                   description: "Transfer to the airport." },
  ],
  "tpl-hr-sh": [
    { day: 1, title: "Arrival in Hurghada",         description: "Airport pickup, resort check-in." },
    { day: 2, title: "Giftun Island",               description: "Snorkeling boat trip to Giftun and a free afternoon." },
    { day: 3, title: "Desert sunset",               description: "Quad-bike safari with Bedouin tea + dinner." },
    { day: 4, title: "Transfer to Sharm",           description: "Coastal transfer (or domestic hop) to Sharm el-Sheikh." },
    { day: 5, title: "Ras Mohamed",                 description: "Full-day boat trip to the protected reef." },
    { day: 6, title: "Free day",                    description: "Beach, pool, optional spa, or diving intro." },
    { day: 7, title: "Naama Bay leisure",           description: "Half-day Old Market visit. Free afternoon." },
    { day: 8, title: "Departure",                   description: "Transfer to the airport. Return flight." },
    { day: 9, title: "Buffer day",                  description: "Reserved for delayed return flights." },
  ],
  "tpl-grand": [
    { day: 1, title: "Arrival in Cairo",            description: "Pickup, briefing, light dinner." },
    { day: 2, title: "Pyramids & Sphinx",           description: "Full-day Giza tour." },
    { day: 3, title: "Egyptian Museum",             description: "Morning museum, afternoon in Khan el-Khalili." },
    { day: 4, title: "Fly to Sharm el-Sheikh",      description: "Domestic flight. Check-in. Beach evening." },
    { day: 5, title: "Ras Mohamed reef",            description: "Snorkeling day." },
    { day: 6, title: "Free day in Sharm",           description: "Beach, spa, or dive." },
    { day: 7, title: "Transfer to Hurghada",        description: "Drive along the coast. Resort check-in." },
    { day: 8, title: "Giftun Island",               description: "Reef boat trip." },
    { day: 9, title: "Desert safari",               description: "Quad-bike sunset." },
    { day: 10, title: "Free day in Hurghada",       description: "Beach, pool, or optional excursions." },
    { day: 11, title: "El Gouna",                   description: "Half-day in the lagoons." },
    { day: 12, title: "Departure",                  description: "Transfer to the airport. Return flight." },
  ],
  "tpl-hr": [
    { day: 1, title: "Arrival in Hurghada",         description: "Pickup and resort check-in." },
    { day: 2, title: "Diving / snorkeling",         description: "Reef trip to one of the protected sites." },
    { day: 3, title: "Free day",                    description: "Beach and pool day." },
    { day: 4, title: "El Gouna",                    description: "Half-day in the lagoons." },
    { day: 5, title: "Sunset safari",               description: "Quad-bike with Bedouin tea." },
    { day: 6, title: "Free day",                    description: "Reserved for diving or relaxation." },
    { day: 7, title: "Departure",                   description: "Transfer to the airport." },
  ],
};
function templateProgram(id) { return TEMPLATE_PROGRAMS[id] ? [...TEMPLATE_PROGRAMS[id]] : []; }
function updateTemplateProgram(id, days) {
  const prevCount = (TEMPLATE_PROGRAMS[id] || []).length;
  TEMPLATE_PROGRAMS[id] = days || [];
  try { localStorage.setItem("nilvoya:program:" + id, JSON.stringify(TEMPLATE_PROGRAMS[id])); } catch {}
  try { window.dispatchEvent(new CustomEvent("nilvoya:program:updated", { detail: { templateId: id } })); } catch {}
  logEvent({
    actor: "Fatima Aboud", actorRole: "Operations",
    kind: "template.program.updated",
    target: id,
    from: prevCount ? `${prevCount} days` : null,
    to: `${days.length} days`,
  });
}
(function _loadPersistedPrograms() {
  try {
    Object.keys(TEMPLATE_PROGRAMS).forEach(id => {
      const raw = localStorage.getItem("nilvoya:program:" + id);
      if (raw) { try { TEMPLATE_PROGRAMS[id] = JSON.parse(raw); } catch {} }
    });
  } catch {}
})();

// ─── Trip instances (Level 2) ──────────────────────────────────────
// Each instance is ONE departure. Same templateId + same date = independent.
// Prices on assignedHotels are FULL-STAY per pax (no per-night math).
function mkPrices(base) {
  return {
    single: base.single,
    double: base.double,
    triple: base.triple,
    child:  base.child,
  };
}
const INSTANCES = [
  // CR · SH
  {
    id: "ins-001", templateId: "tpl-cr-sh", label: "Cairo→Sharm · May 28",
    segments: [{ city: "Cairo", nights: 2 }, { city: "Sharm el-Sheikh", nights: 7 }],
    direction: "Cairo → Sharm", departure: "May 28, 2026", status: "open",
    capacity: 60, booked: 18,
    assigned: [
      { hotelId: "h-ppi",  prices: mkPrices({ single: 38500, double: 31000, triple: 27500, child: 18500 }) },
      { hotelId: "h-rch",  prices: mkPrices({ single: 40500, double: 33000, triple: 29000, child: 19500 }) },
      { hotelId: "h-lmcp", prices: mkPrices({ single: 54500, double: 44000, triple: 39000, child: 26000 }) },
      { hotelId: "h-stah", prices: mkPrices({ single: 53500, double: 43000, triple: 38000, child: 25500 }) },
      { hotelId: "h-mmh",  prices: mkPrices({ single: 76500, double: 60500, triple: 53000, child: 34500 }) },
      { hotelId: "h-fsnp", prices: mkPrices({ single: 85000, double: 66500, triple: 59000, child: 37500 }) },
      { hotelId: "h-shr",  prices: mkPrices({ single: 98000, double: 80500, triple: 70000, child: 52500 }) },
      { hotelId: "h-csr",  prices: mkPrices({ single: 147000, double: 119000, triple: 105000, child: 73500 }) },
      { hotelId: "h-fssh", prices: mkPrices({ single: 231000, double: 185500, triple: 164500, child: 101500 }) },
      { hotelId: "h-rps",  prices: mkPrices({ single: 213500, double: 171500, triple: 150500, child: 98000 }) },
    ],
  },
  {
    id: "ins-002", templateId: "tpl-cr-sh", label: "Sharm→Cairo · Jun 04",
    segments: [{ city: "Sharm el-Sheikh", nights: 6 }, { city: "Cairo", nights: 3 }],
    direction: "Sharm → Cairo", departure: "Jun 04, 2026", status: "filling",
    capacity: 60, booked: 36,
    assigned: [
      { hotelId: "h-ppi",  prices: mkPrices({ single: 41500, double: 33500, triple: 29500, child: 20000 }) },
      { hotelId: "h-rch",  prices: mkPrices({ single: 43500, double: 35500, triple: 31000, child: 21000 }) },
      { hotelId: "h-lmcp", prices: mkPrices({ single: 58500, double: 47000, triple: 41500, child: 27500 }) },
      { hotelId: "h-mmh",  prices: mkPrices({ single: 82000, double: 64500, triple: 56500, child: 36500 }) },
      { hotelId: "h-csr",  prices: mkPrices({ single: 126000, double: 102000, triple: 90000, child: 63000 }) },
      { hotelId: "h-fssh", prices: mkPrices({ single: 198000, double: 159000, triple: 141000, child: 87000 }) },
    ],
  },
  {
    id: "ins-003", templateId: "tpl-cr-sh", label: "Cairo→Sharm · Jun 25",
    segments: [{ city: "Cairo", nights: 2 }, { city: "Sharm el-Sheikh", nights: 7 }],
    direction: "Cairo → Sharm", departure: "Jun 25, 2026", status: "soldout",
    capacity: 60, booked: 60,
    assigned: [
      { hotelId: "h-ppi",  prices: mkPrices({ single: 38500, double: 31000, triple: 27500, child: 18500 }) },
      { hotelId: "h-stah", prices: mkPrices({ single: 53500, double: 43000, triple: 38000, child: 25500 }) },
      { hotelId: "h-fssh", prices: mkPrices({ single: 231000, double: 185500, triple: 164500, child: 101500 }) },
    ],
  },

  // CR · HR
  {
    id: "ins-004", templateId: "tpl-cr-hr", label: "Cairo+Hurghada · Jun 04",
    segments: [{ city: "Cairo", nights: 3 }, { city: "Hurghada", nights: 5 }],
    direction: "Cairo → Hurghada", departure: "Jun 04, 2026", status: "open",
    capacity: 52, booked: 22,
    assigned: [
      { hotelId: "h-gza",  prices: mkPrices({ single: 45000, double: 36000, triple: 31500, child: 22500 }) },
      { hotelId: "h-lmcp", prices: mkPrices({ single: 67500, double: 54000, triple: 48000, child: 33000 }) },
      { hotelId: "h-mmh",  prices: mkPrices({ single: 94500, double: 75000, triple: 66000, child: 43500 }) },
      { hotelId: "h-rtb",  prices: mkPrices({ single: 67500, double: 55000, triple: 47500, child: 35000 }) },
      { hotelId: "h-sam",  prices: mkPrices({ single: 100000, double: 80000, triple: 70000, child: 50000 }) },
      { hotelId: "h-bpsh", prices: mkPrices({ single: 147500, double: 117500, triple: 105000, child: 67500 }) },
    ],
  },
  {
    id: "ins-005", templateId: "tpl-cr-hr", label: "Cairo+Hurghada · Jul 02",
    segments: [{ city: "Cairo", nights: 3 }, { city: "Hurghada", nights: 5 }],
    direction: "Cairo → Hurghada", departure: "Jul 02, 2026", status: "open",
    capacity: 52, booked: 0,
    assigned: [
      { hotelId: "h-gza",  prices: mkPrices({ single: 45000, double: 36000, triple: 31500, child: 22500 }) },
      { hotelId: "h-stah", prices: mkPrices({ single: 66000, double: 52500, triple: 46500, child: 33000 }) },
      { hotelId: "h-sam",  prices: mkPrices({ single: 100000, double: 80000, triple: 70000, child: 50000 }) },
      { hotelId: "h-bpsh", prices: mkPrices({ single: 147500, double: 117500, triple: 105000, child: 67500 }) },
    ],
  },

  // SH (single dest)
  {
    id: "ins-006", templateId: "tpl-sh", label: "Sharm full week · May 24",
    segments: [{ city: "Sharm el-Sheikh", nights: 7 }],
    direction: "Direct to Sharm", departure: "May 24, 2026", status: "filling",
    capacity: 52, booked: 34,
    assigned: [
      { hotelId: "h-shr",  prices: mkPrices({ single: 98000, double: 80500, triple: 70000, child: 52500 }) },
      { hotelId: "h-csr",  prices: mkPrices({ single: 147000, double: 119000, triple: 105000, child: 73500 }) },
      { hotelId: "h-fssh", prices: mkPrices({ single: 231000, double: 185500, triple: 164500, child: 101500 }) },
    ],
  },
  {
    id: "ins-007", templateId: "tpl-sh", label: "Sharm full week · May 31",
    segments: [{ city: "Sharm el-Sheikh", nights: 7 }],
    direction: "Direct to Sharm", departure: "May 31, 2026", status: "soldout",
    capacity: 52, booked: 52,
    assigned: [
      { hotelId: "h-csr",  prices: mkPrices({ single: 147000, double: 119000, triple: 105000, child: 73500 }) },
      { hotelId: "h-fssh", prices: mkPrices({ single: 231000, double: 185500, triple: 164500, child: 101500 }) },
    ],
  },
  // Same dep date as ins-007 — different instance entirely.
  {
    id: "ins-008", templateId: "tpl-sh", label: "Sharm boutique · May 31",
    segments: [{ city: "Sharm el-Sheikh", nights: 5 }],
    direction: "Direct to Sharm", departure: "May 31, 2026", status: "open",
    capacity: 28, booked: 8,
    assigned: [
      { hotelId: "h-nbi",  prices: mkPrices({ single: 67500, double: 55000, triple: 47500, child: 35000 }) },
      { hotelId: "h-vsh",  prices: mkPrices({ single: 73000, double: 57500, triple: 50000, child: 37500 }) },
      { hotelId: "h-rps",  prices: mkPrices({ single: 152500, double: 122500, triple: 107500, child: 70000 }) },
    ],
  },
  {
    id: "ins-009", templateId: "tpl-sh", label: "Sharm full week · Jun 07",
    segments: [{ city: "Sharm el-Sheikh", nights: 7 }],
    direction: "Direct to Sharm", departure: "Jun 07, 2026", status: "open",
    capacity: 52, booked: 28,
    assigned: [
      { hotelId: "h-shr",  prices: mkPrices({ single: 98000, double: 80500, triple: 70000, child: 52500 }) },
      { hotelId: "h-csr",  prices: mkPrices({ single: 147000, double: 119000, triple: 105000, child: 73500 }) },
      { hotelId: "h-sdb",  prices: mkPrices({ single: 143500, double: 115500, triple: 101500, child: 73500 }) },
      { hotelId: "h-fssh", prices: mkPrices({ single: 231000, double: 185500, triple: 164500, child: 101500 }) },
    ],
  },

  // CR
  {
    id: "ins-010", templateId: "tpl-cr", label: "Cairo classical · May 21",
    segments: [{ city: "Cairo", nights: 5 }],
    direction: "Direct to Cairo", departure: "May 21, 2026", status: "filling",
    capacity: 36, booked: 14,
    assigned: [
      { hotelId: "h-ppi",  prices: mkPrices({ single: 77500, double: 62500, triple: 55000, child: 40000 }) },
      { hotelId: "h-stah", prices: mkPrices({ single: 110000, double: 87500, triple: 77500, child: 55000 }) },
      { hotelId: "h-mmh",  prices: mkPrices({ single: 157500, double: 125000, triple: 110000, child: 72500 }) },
    ],
  },
  {
    id: "ins-011", templateId: "tpl-cr", label: "Cairo classical · Jun 04",
    segments: [{ city: "Cairo", nights: 5 }],
    direction: "Direct to Cairo", departure: "Jun 04, 2026", status: "open",
    capacity: 36, booked: 9,
    assigned: [
      { hotelId: "h-rch",  prices: mkPrices({ single: 82500, double: 67500, triple: 60000, child: 42500 }) },
      { hotelId: "h-lmcp", prices: mkPrices({ single: 112500, double: 90000, triple: 80000, child: 55000 }) },
      { hotelId: "h-fsnp", prices: mkPrices({ single: 175000, double: 137500, triple: 122500, child: 77500 }) },
    ],
  },

  // HR · SH
  {
    id: "ins-012", templateId: "tpl-hr-sh", label: "Hurghada+Sharm · Jun 11",
    segments: [{ city: "Hurghada", nights: 4 }, { city: "Sharm el-Sheikh", nights: 5 }],
    direction: "Hurghada → Sharm", departure: "Jun 11, 2026", status: "open",
    capacity: 40, booked: 12,
    assigned: [
      { hotelId: "h-rtb",  prices: mkPrices({ single: 54000, double: 44000, triple: 38000, child: 28000 }) },
      { hotelId: "h-sam",  prices: mkPrices({ single: 80000, double: 64000, triple: 56000, child: 40000 }) },
      { hotelId: "h-shr",  prices: mkPrices({ single: 70000, double: 57500, triple: 50000, child: 37500 }) },
      { hotelId: "h-csr",  prices: mkPrices({ single: 105000, double: 85000, triple: 75000, child: 52500 }) },
      { hotelId: "h-fssh", prices: mkPrices({ single: 165000, double: 132500, triple: 117500, child: 72500 }) },
    ],
  },

  // Grand
  {
    id: "ins-013", templateId: "tpl-grand", label: "Grand Egypt circuit · Jun 18",
    segments: [{ city: "Cairo", nights: 3 }, { city: "Sharm el-Sheikh", nights: 5 }, { city: "Hurghada", nights: 4 }],
    direction: "Cairo → Sharm → Hurghada", departure: "Jun 18, 2026", status: "filling",
    capacity: 40, booked: 26,
    assigned: [
      { hotelId: "h-gza",  prices: mkPrices({ single: 87500, double: 70000, triple: 61500, child: 43500 }) },
      { hotelId: "h-stah", prices: mkPrices({ single: 132000, double: 105500, triple: 93500, child: 66500 }) },
      { hotelId: "h-mmh",  prices: mkPrices({ single: 220000, double: 174000, triple: 153500, child: 100500 }) },
      { hotelId: "h-fssh", prices: mkPrices({ single: 295000, double: 235500, triple: 208500, child: 132000 }) },
    ],
  },
  {
    id: "ins-014", templateId: "tpl-grand", label: "Grand Egypt circuit · Jul 02",
    segments: [{ city: "Cairo", nights: 3 }, { city: "Sharm el-Sheikh", nights: 5 }, { city: "Hurghada", nights: 4 }],
    direction: "Cairo → Sharm → Hurghada", departure: "Jul 02, 2026", status: "open",
    capacity: 40, booked: 0,
    assigned: [
      { hotelId: "h-gza",  prices: mkPrices({ single: 87500, double: 70000, triple: 61500, child: 43500 }) },
      { hotelId: "h-mmh",  prices: mkPrices({ single: 220000, double: 174000, triple: 153500, child: 100500 }) },
      { hotelId: "h-fssh", prices: mkPrices({ single: 295000, double: 235500, triple: 208500, child: 132000 }) },
    ],
  },
];
function instancesForTemplate(tplId) { return INSTANCES.filter(i => i.templateId === tplId); }
function instanceById(id) { return INSTANCES.find(i => i.id === id); }
function hotelUsageCount(hotelId) {
  return INSTANCES.filter(i => i.assigned.some(a => a.hotelId === hotelId)).length;
}

// ─── Agencies ──────────────────────────────────────────────────────
const AGENCIES = [
  {
    id: "agc-001", name: "Voyages Méditerranée", country: "Algeria",  city: "Algiers",
    contact: "Yacine Belaïd", email: "yacine@voyages-med.dz", phone: "+213 21 55 41 02",
    level: "Gold", bookings: 38, nextLevel: null, joined: "Mar 2021", lastBooking: "May 11, 2026",
    active: true,
    users: [
      { name: "Yacine Belaïd",  role: "Owner",   email: "yacine@voyages-med.dz",  last: "Today" },
      { name: "Sofia Khelifi",  role: "Agent",   email: "sofia@voyages-med.dz",   last: "2d ago" },
      { name: "Ilyes Bensaid",  role: "Finance", email: "ilyes@voyages-med.dz",   last: "1w ago" },
    ],
  },
  {
    id: "agc-002", name: "Atlas Travel Group",   country: "Morocco",  city: "Casablanca",
    contact: "Hafsa Mansouri", email: "h.mansouri@atlas-travel.ma", phone: "+212 522 48 19 90",
    level: "Gold", bookings: 32, nextLevel: null, joined: "Sep 2020", lastBooking: "May 09, 2026",
    active: true,
    users: [
      { name: "Hafsa Mansouri", role: "Owner", email: "h.mansouri@atlas-travel.ma", last: "Today" },
      { name: "Mehdi Cherif",   role: "Agent", email: "m.cherif@atlas-travel.ma",   last: "Today" },
    ],
  },
  {
    id: "agc-003", name: "Carthage Voyages",     country: "Tunisia",  city: "Tunis",
    contact: "Rania Saadi", email: "rania@carthage-voyages.tn", phone: "+216 71 33 02 41",
    level: "Silver", bookings: 18, nextLevel: 30, joined: "Jan 2022", lastBooking: "May 04, 2026",
    active: true,
    users: [
      { name: "Rania Saadi", role: "Owner", email: "rania@carthage-voyages.tn", last: "Yesterday" },
      { name: "Tarek Ziani", role: "Agent", email: "tarek@carthage-voyages.tn", last: "3d ago" },
    ],
  },
  {
    id: "agc-004", name: "Beirut Sun Travel",    country: "Lebanon",  city: "Beirut",
    contact: "Karim Belkacem", email: "karim@beirutsun.lb", phone: "+961 1 384 552",
    level: "Silver", bookings: 21, nextLevel: 30, joined: "Apr 2022", lastBooking: "Apr 28, 2026",
    active: true,
    users: [
      { name: "Karim Belkacem", role: "Owner",   email: "karim@beirutsun.lb", last: "Today" },
      { name: "Lila Bouzid",    role: "Agent",   email: "lila@beirutsun.lb",  last: "2d ago" },
    ],
  },
  {
    id: "agc-005", name: "Sahara Holidays",      country: "Algeria",  city: "Oran",
    contact: "Nora Haddad", email: "nora@sahara-holidays.dz", phone: "+213 41 22 81 06",
    level: "Silver", bookings: 19, nextLevel: 30, joined: "Nov 2022", lastBooking: "May 10, 2026",
    active: true,
    users: [
      { name: "Nora Haddad",  role: "Owner", email: "nora@sahara-holidays.dz", last: "Today" },
      { name: "Sami Brahimi", role: "Agent", email: "sami@sahara-holidays.dz", last: "5d ago" },
    ],
  },
  {
    id: "agc-006", name: "Riyadh Voyage Club",   country: "Saudi Arabia", city: "Riyadh",
    contact: "Yasmine Ait-Ali", email: "yasmine@rvc.sa", phone: "+966 11 488 0392",
    level: "Bronze", bookings: 8, nextLevel: 15, joined: "Aug 2024", lastBooking: "May 12, 2026",
    active: true,
    users: [
      { name: "Yasmine Ait-Ali", role: "Owner", email: "yasmine@rvc.sa", last: "Today" },
    ],
  },
  {
    id: "agc-007", name: "Levant Discovery",     country: "Jordan",   city: "Amman",
    contact: "Tarek Ziani", email: "tarek@levant-discovery.jo", phone: "+962 6 562 4488",
    level: "Bronze", bookings: 6, nextLevel: 15, joined: "Jan 2025", lastBooking: "Apr 22, 2026",
    active: true,
    users: [
      { name: "Tarek Ziani", role: "Owner", email: "tarek@levant-discovery.jo", last: "1w ago" },
    ],
  },
  {
    id: "agc-008", name: "Paris-Nile Tours",     country: "France",   city: "Paris",
    contact: "Mehdi Cherif", email: "m.cherif@paris-nile.fr", phone: "+33 1 42 88 17 03",
    level: "Bronze", bookings: 3, nextLevel: 15, joined: "Mar 2025", lastBooking: "Mar 18, 2026",
    active: false,
    users: [
      { name: "Mehdi Cherif", role: "Owner", email: "m.cherif@paris-nile.fr", last: "2mo ago" },
    ],
  },
];
function agencyById(id) { return AGENCIES.find(a => a.id === id); }

// ─── Agency branding (white-label) ──────────────────────────────────
// Each agency can override the default voucher / invoice / widget accent and
// logo. Stored as a separate map so AGENCIES stays focused on identity data.
// In production this would be uploaded by the agency owner; here we seed
// plausible defaults per region.
const AGENCY_BRANDING = {
  "agc-001": { accent: "#0E5E6F", accentDeep: "#0A4753", logo: null, tagline: "Mediterranean charter, since 2021" },
  "agc-002": { accent: "#A12B33", accentDeep: "#7C1F26", logo: null, tagline: "From the Atlas to the Red Sea" },
  "agc-003": { accent: "#C04122", accentDeep: "#8A2D16", logo: null, tagline: "The Mediterranean reimagined" },
  "agc-004": { accent: "#C77818", accentDeep: "#965A11", logo: null, tagline: "Beirut · Cairo · Beyond" },
  "agc-005": { accent: "#8E6A2A", accentDeep: "#6B4F1F", logo: null, tagline: "Desert routes & resort breaks" },
  "agc-006": { accent: "#1F6038", accentDeep: "#163F25", logo: null, tagline: "Cedar Trails · Egyptian sands" },
  "agc-007": { accent: "#3F5687", accentDeep: "#2A3B5D", logo: null, tagline: "Levant ↔ Nile" },
  "agc-008": { accent: "#4B6C7A", accentDeep: "#324954", logo: null, tagline: "Paris vers le Nil" },
};
// Merge the agency record with its branding so consumers get one object.
function agencyWithBrand(idOrAgency) {
  const a = typeof idOrAgency === "string" ? agencyById(idOrAgency) : idOrAgency;
  if (!a) return null;
  const b = AGENCY_BRANDING[a.id] || {};
  return {
    ...a,
    accent: b.accent || "#B0823A",        // fall back to platform gold
    accentDeep: b.accentDeep || "#8B6326",
    logo: b.logo || null,
    tagline: b.tagline || "",
  };
}
function updateAgencyBranding(agencyId, patch) {
  AGENCY_BRANDING[agencyId] = { ...(AGENCY_BRANDING[agencyId] || {}), ...patch };
  try { localStorage.setItem("nilvoya:branding:" + agencyId, JSON.stringify(AGENCY_BRANDING[agencyId])); } catch {}
  try { window.dispatchEvent(new CustomEvent("nilvoya:branding:updated", { detail: { agencyId } })); } catch {}
  logEvent({
    actor: "Fatima Aboud", actorRole: "Operations",
    kind: "agency.branding.updated",
    target: agencyId,
    from: null, to: null,
    reason: Object.keys(patch).join(", "),
  });
}
// Rehydrate persisted branding tweaks on script load.
(function _loadPersistedBranding() {
  try {
    Object.keys(AGENCY_BRANDING).forEach(id => {
      const raw = localStorage.getItem("nilvoya:branding:" + id);
      if (raw) {
        try { AGENCY_BRANDING[id] = { ...AGENCY_BRANDING[id], ...JSON.parse(raw) }; } catch {}
      }
    });
  } catch {}
})();
// Bronze < 15 bookings · Silver < 30 · Gold ≥ 30
const LEVELS = {
  Bronze: { next: "Silver", at: 15 },
  Silver: { next: "Gold",   at: 30 },
  Gold:   { next: null,     at: null },
};

// ─── Passengers (per booking) ──────────────────────────────────────
// Random-ish but plausible. Adult = no DOB constraint; Child = under-12.
function pax(first, last, nat, passport, gender, dob, room) {
  return { first, last, nat, passport, gender, dob, room };
}
const PASSENGER_LISTS = {
  "NLV-2H8K-441": [
    pax("Yacine",   "Belaïd",     "Algerian", "12AB45678", "M", "1978-04-12", "R1"),
    pax("Amel",     "Belaïd",     "Algerian", "12AB45679", "F", "1981-09-03", "R1"),
    pax("Sofia",    "Khelifi",    "Algerian", "09KH22210", "F", "1984-11-19", "R2"),
    pax("Ilyes",    "Bensaid",    "Algerian", "11BS66554", "M", "1990-02-08", "R2"),
    pax("Mehdi",    "Saadi",      "Algerian", "14SA98765", "M", "1986-07-22", "R3"),
    pax("Nora",     "Saadi",      "Algerian", "14SA98766", "F", "1989-03-30", "R3"),
    pax("Adam",     "Saadi",      "Algerian", "14SA98767", "M", "2017-05-14", "R3"),
    pax("Lina",     "Brahimi",    "Algerian", "10BR11220", "F", "1992-10-01", "R4"),
    pax("Karim",    "Brahimi",    "Algerian", "10BR11221", "M", "1991-06-25", "R4"),
    pax("Sami",     "Cherif",     "Algerian", "15CH33445", "M", "1988-01-17", "R5"),
    pax("Hafsa",    "Cherif",     "Algerian", "15CH33446", "F", "1990-12-04", "R5"),
    pax("Rania",    "Mansouri",   "Algerian", "13MA77889", "F", "1983-08-08", "R6"),
    pax("Faycal",   "Mansouri",   "Algerian", "13MA77890", "M", "1982-02-21", "R6"),
    pax("Yacine",   "Ould-Ali",   "Algerian", "16OA55667", "M", "1985-10-30", "R7"),
    pax("Salima",   "Ould-Ali",   "Algerian", "16OA55668", "F", "1987-04-11", "R7"),
    pax("Inès",     "Ould-Ali",   "Algerian", "16OA55669", "F", "2018-07-09", "R7"),
  ],
  "NLV-7M3V-209": [
    pax("Nora",     "Haddad",     "Algerian", "21HD11112", "F", "1980-06-15", "R1"),
    pax("Sami",     "Haddad",     "Algerian", "21HD11113", "M", "1979-02-04", "R1"),
    pax("Lila",     "Bouzid",     "Algerian", "22BZ22224", "F", "1988-11-12", "R2"),
    pax("Karim",    "Bouzid",     "Algerian", "22BZ22225", "M", "1986-05-30", "R2"),
    pax("Adel",     "Reza",       "Algerian", "23RZ33335", "M", "1991-09-21", "R3"),
    pax("Sara",     "Reza",       "Algerian", "23RZ33336", "F", "1993-12-18", "R3"),
  ],
  "NLV-5R1P-882": [
    pax("Yacine",   "Mansouri",   "Algerian", "30MA40001", "M", "1985-07-04", "R1"),
    pax("Hafsa",    "Mansouri",   "Algerian", "30MA40002", "F", "1987-04-22", "R1"),
    pax("Mehdi",    "Mansouri",   "Algerian", "30MA40003", "M", "2016-09-30", "R1"),
  ],
};

// ─── Rooms — per booking, links assignment to a price column ──────
// roomType keys map to assigned[].prices[roomType].
function room(code, roomType, hotelId, paxRefs) {
  return { code, roomType, hotelId, paxRefs };
}
const ROOM_LISTS = {
  "NLV-2H8K-441": [
    room("R1", "double",  "h-stah", [0, 1]),
    room("R2", "double",  "h-stah", [2, 3]),
    room("R3", "triple",  "h-stah", [4, 5, 6]),  // 1 child
    room("R4", "double",  "h-stah", [7, 8]),
    room("R5", "double",  "h-stah", [9, 10]),
    room("R6", "double",  "h-stah", [11, 12]),
    room("R7", "triple",  "h-stah", [13, 14, 15]), // 1 child
  ],
  "NLV-7M3V-209": [
    room("R1", "double", "h-fssh", [0, 1]),
    room("R2", "double", "h-fssh", [2, 3]),
    room("R3", "double", "h-fssh", [4, 5]),
  ],
  "NLV-5R1P-882": [
    room("R1", "triple", "h-ppi", [0, 1, 2]),
  ],
};

// ─── Bookings ──────────────────────────────────────────────────────
// Status flow: submitted → docs → confirmed → completed | cancelled
// pending: info missing from agency
const BOOKINGS = [
  { ref: "NLV-2H8K-441", agencyId: "agc-001", instanceId: "ins-001", pax: { adults: 14, children: 2 }, status: "confirmed", total: 2678400, submitted: "Apr 28", lead: "Karim Belkacem" },
  { ref: "NLV-7M3V-209", agencyId: "agc-005", instanceId: "ins-006", pax: { adults: 6,  children: 0 }, status: "docs",      total: 882000,  submitted: "May 02", lead: "Nora Haddad" },
  { ref: "NLV-5R1P-882", agencyId: "agc-003", instanceId: "ins-010", pax: { adults: 2,  children: 1 }, status: "pending",   total: 187500,  submitted: "May 05", lead: "Yacine Mansouri" },
  { ref: "NLV-9D4X-115", agencyId: "agc-002", instanceId: "ins-012", pax: { adults: 12, children: 3 }, status: "submitted", total: 1284500, submitted: "May 09", lead: "Hafsa Brahimi" },
  { ref: "NLV-3K6T-067", agencyId: "agc-001", instanceId: "ins-004", pax: { adults: 18, children: 4 }, status: "completed", total: 1822500, submitted: "Mar 18", lead: "Sami Ould-Ali" },
  { ref: "NLV-1F2Q-553", agencyId: "agc-001", instanceId: "ins-013", pax: { adults: 28, children: 6 }, status: "docs",      total: 6730000, submitted: "May 11", lead: "Yacine Belaïd" },
  { ref: "NLV-8C7N-310", agencyId: "agc-002", instanceId: "ins-011", pax: { adults: 6,  children: 1 }, status: "submitted", total: 845500,  submitted: "May 12", lead: "Hafsa Mansouri" },
  { ref: "NLV-4B9L-988", agencyId: "agc-006", instanceId: "ins-007", pax: { adults: 16, children: 2 }, status: "completed", total: 2057500, submitted: "Feb 22", lead: "Yasmine Ait-Ali" },
  { ref: "NLV-6P3K-720", agencyId: "agc-004", instanceId: "ins-009", pax: { adults: 12, children: 2 }, status: "pending",   total: 1382500, submitted: "May 13", lead: "Lila Bouzid" },
  { ref: "NLV-2T9X-118", agencyId: "agc-006", instanceId: "ins-011", pax: { adults: 4,  children: 0 }, status: "submitted", total: 562500,  submitted: "May 15", lead: "Yasmine Ait-Ali" },
  { ref: "NLV-5G7N-441", agencyId: "agc-002", instanceId: "ins-005", pax: { adults: 20, children: 4 }, status: "docs",      total: 2200000, submitted: "May 09", lead: "Hafsa Mansouri" },
  { ref: "NLV-9V2L-051", agencyId: "agc-001", instanceId: "ins-014", pax: { adults: 18, children: 3 }, status: "submitted", total: 4530000, submitted: "May 14", lead: "Yacine Belaïd" },
  { ref: "NLV-3M8B-637", agencyId: "agc-003", instanceId: "ins-010", pax: { adults: 10, children: 2 }, status: "confirmed", total: 1377500, submitted: "Apr 24", lead: "Rania Saadi" },
  { ref: "NLV-7H1F-294", agencyId: "agc-005", instanceId: "ins-006", pax: { adults: 24, children: 6 }, status: "confirmed", total: 2730000, submitted: "Apr 18", lead: "Nora Haddad" },
  { ref: "NLV-1L8K-302", agencyId: "agc-002", instanceId: "ins-002", pax: { adults: 8,  children: 0 }, status: "cancelled", total: 280000,  submitted: "Apr 02", lead: "Hafsa Mansouri" },
];
function bookingByRef(ref) { return BOOKINGS.find(b => b.ref === ref); }

// ─── Audit log ──────────────────────────────────────────────────────
// Append-only stream of every meaningful state change. Read by the admin's
// "Audit log" screen + can be filtered. Persisted to localStorage so events
// from B2B (e.g. new submissions) survive across tabs and admin reloads.
const _AUDIT_KEY = "nilvoya:audit";
let AUDIT_LOG = [];
function _loadAudit() {
  try { return JSON.parse(localStorage.getItem(_AUDIT_KEY) || "[]"); }
  catch { return []; }
}
function _saveAudit() {
  try { localStorage.setItem(_AUDIT_KEY, JSON.stringify(AUDIT_LOG.slice(-500))); } catch {}
}
AUDIT_LOG = _loadAudit();
// Seed a handful of synthetic events on first ever load so the screen isn't empty.
if (AUDIT_LOG.length === 0) {
  const now = Date.now();
  AUDIT_LOG = [
    { id: "evt-001", ts: now - 14 * 3600 * 1000, actor: "Fatima Aboud",  actorRole: "Operations", kind: "booking.status.changed", target: "NLV-9D4X-115",  from: "submitted", to: "docs",      reason: "Awaiting passport scans" },
    { id: "evt-002", ts: now - 12 * 3600 * 1000, actor: "Fatima Aboud",  actorRole: "Operations", kind: "booking.status.changed", target: "NLV-2H8K-441",  from: "docs",      to: "confirmed", reason: "Documents verified" },
    { id: "evt-003", ts: now - 6 * 3600 * 1000,  actor: "Yacine Belaïd", actorRole: "Agency · agc-001", kind: "booking.created", target: "NLV-1F2Q-553", from: null, to: "submitted", reason: null },
    { id: "evt-004", ts: now - 4 * 3600 * 1000,  actor: "Fatima Aboud",  actorRole: "Operations", kind: "instance.hotel.assigned", target: "ins-004",       from: null,        to: "h-bpsh",    reason: null },
    { id: "evt-005", ts: now - 2 * 3600 * 1000,  actor: "Fatima Aboud",  actorRole: "Operations", kind: "template.program.updated", target: "tpl-cr-sh",   from: null,        to: null,        reason: "Refined Day 4 description" },
    { id: "evt-006", ts: now - 30 * 60 * 1000,   actor: "Rania Saadi",   actorRole: "Agency · agc-003", kind: "booking.created", target: "NLV-3M8B-637", from: null, to: "hold",       reason: "48h pre-reserve" },
  ];
  _saveAudit();
}
function logEvent(ev) {
  const entry = {
    id: "evt-" + Math.random().toString(36).slice(2, 9),
    ts: Date.now(),
    actor: ev.actor || "System",
    actorRole: ev.actorRole || "",
    kind: ev.kind,
    target: ev.target || "",
    from: ev.from ?? null,
    to: ev.to ?? null,
    reason: ev.reason || null,
  };
  AUDIT_LOG.push(entry);
  if (AUDIT_LOG.length > 500) AUDIT_LOG = AUDIT_LOG.slice(-500);
  _saveAudit();
  try { window.dispatchEvent(new CustomEvent("nilvoya:audit:appended", { detail: entry })); } catch {}
  return entry;
}
// Read helpers
function auditAll() { return [...AUDIT_LOG].reverse(); }  // newest first
function auditByTarget(target) { return AUDIT_LOG.filter(e => e.target === target).reverse(); }
const AUDIT_KIND_LABEL = {
  "booking.created":              { label: "Booking created",          tone: "ok" },
  "booking.status.changed":       { label: "Status changed",           tone: "neutral" },
  "booking.cancelled":            { label: "Booking cancelled",        tone: "danger" },
  "instance.hotel.assigned":      { label: "Hotel assigned",           tone: "neutral" },
  "instance.hotel.unassigned":    { label: "Hotel unassigned",         tone: "neutral" },
  "instance.price.edited":        { label: "Price edited",             tone: "neutral" },
  "template.created":             { label: "Template created",         tone: "ok" },
  "template.program.updated":     { label: "Program updated",          tone: "neutral" },
  "agency.branding.updated":      { label: "Branding updated",         tone: "neutral" },
  "agency.user.added":            { label: "Agency user added",        tone: "neutral" },
};

// ─── Persistence bridge: B2B-submitted bookings ────────────────────
// Bookings created by partner agencies in the B2B portal are persisted to
// localStorage so the admin sees them on next load. Both apps merge the
// persisted list with their seed BOOKINGS on script load.
const _NLV_BOOKINGS_KEY = "nilvoya:bookings";
function _loadPersistedBookings() {
  try { return JSON.parse(localStorage.getItem(_NLV_BOOKINGS_KEY) || "[]"); }
  catch { return []; }
}
function _savePersistedBookings(arr) {
  try { localStorage.setItem(_NLV_BOOKINGS_KEY, JSON.stringify(arr)); } catch {}
}
function saveBooking(booking) {
  const persisted = _loadPersistedBookings();
  persisted.push(booking);
  _savePersistedBookings(persisted);
  BOOKINGS.unshift(booking); // newest first in the in-memory list too
  // Notify listeners in case admin is open in another tab.
  try { window.dispatchEvent(new CustomEvent("nilvoya:bookings:updated", { detail: booking })); } catch {}
  // Audit
  const agc = agencyById(booking.agencyId);
  logEvent({
    actor: booking.lead || "Agency user",
    actorRole: agc ? `Agency · ${agc.id}` : "Agency",
    kind: "booking.created",
    target: booking.ref,
    from: null,
    to: booking.status,
    reason: booking.status === "hold" ? "48h pre-reserve" : null,
  });
}
function generateBookingRef() {
  const rnd = () => Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, "X");
  return `NLV-${rnd()}-${String(Math.floor(Math.random() * 900) + 100)}`;
}
// Mutate a booking in-place + persist + notify listeners.
function updateBookingStatus(ref, newStatus) {
  const b = BOOKINGS.find(x => x.ref === ref);
  if (!b) return null;
  const prev = b.status;
  b.status = newStatus;
  // Mirror in localStorage if the booking was originally B2B-submitted.
  try {
    const persisted = _loadPersistedBookings();
    const idx = persisted.findIndex(x => x.ref === ref);
    if (idx >= 0) { persisted[idx] = Object.assign({}, persisted[idx], { status: newStatus }); _savePersistedBookings(persisted); }
  } catch (e) {}
  try { window.dispatchEvent(new CustomEvent("nilvoya:bookings:updated", { detail: b })); } catch (e) {}
  // Audit
  logEvent({
    actor: "Fatima Aboud",
    actorRole: "Operations",
    kind: newStatus === "cancelled" ? "booking.cancelled" : "booking.status.changed",
    target: ref,
    from: prev,
    to: newStatus,
  });
  return b;
}
// Make sure the function is exported even if the closing Object.assign block changes later.
window.updateBookingStatus = updateBookingStatus;
// Merge persisted bookings into the seed list on load (newest first).
(function _mergePersisted() {
  const persisted = _loadPersistedBookings();
  if (persisted.length) BOOKINGS.unshift(...persisted.reverse());
})();

const STATUSES = [
  { key: "hold",      label: "On hold",            hint: "Soft 48-hour pre-reservation. Auto-releases if not confirmed by the agency." },
  { key: "submitted", label: "Submitted",         hint: "Agency has sent the booking; awaiting review." },
  { key: "docs",      label: "Documents pending", hint: "Awaiting passports / payment proofs." },
  { key: "pending",   label: "Info missing",      hint: "Operator has requested clarifications." },
  { key: "confirmed", label: "Confirmed",         hint: "Vouchers issued. All set." },
  { key: "completed", label: "Completed",         hint: "Trip has concluded." },
  { key: "cancelled", label: "Cancelled",         hint: "Cancelled by agency or operator." },
];
function statusLabel(key) { return STATUSES.find(s => s.key === key)?.label || key; }
// Pre-reservation expiry helpers.
const HOLD_MS = 48 * 60 * 60 * 1000;
function isHoldExpired(b) {
  return b?.status === "hold" && typeof b.holdExpiresAt === "number" && Date.now() > b.holdExpiresAt;
}
function holdHoursLeft(b) {
  if (!b?.holdExpiresAt) return 0;
  return Math.max(0, Math.round((b.holdExpiresAt - Date.now()) / (60 * 60 * 1000)));
}
// Sweep expired holds → cancel them automatically. Runs on every script load.
(function _sweepExpiredHolds() {
  let mutated = false;
  BOOKINGS.forEach(b => {
    if (isHoldExpired(b)) {
      b.status = "cancelled";
      b._expiredHold = true;
      mutated = true;
    }
  });
  if (mutated) {
    try {
      const persisted = _loadPersistedBookings().map(b => isHoldExpired(b) ? { ...b, status: "cancelled", _expiredHold: true } : b);
      _savePersistedBookings(persisted);
    } catch {}
  }
})();

// ─── Formatters ────────────────────────────────────────────────────
const CUR = "DZD";
const fmt = (n) => (n || 0).toLocaleString("en-US");
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
const fmtCur = (n) => `${CUR}\u00A0${fmt(n)}`;
const fmtCurCompact = (n) => {
  if (n >= 1e6) return `${CUR}\u00A0${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${CUR}\u00A0${(n / 1e3).toFixed(0)}k`;
  return fmtCur(n);
};

// ─── Reference date helpers ─────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TODAY = { m: 4, d: 21, year: 2026 }; // May 21, 2026
function parseShort(s) {
  if (!s) return null;
  const parts = s.split(/[ ,]+/);
  return { m: MONTHS.indexOf(parts[0]), d: parseInt(parts[1]) };
}
function daysFromToday(s) {
  const p = parseShort(s);
  if (!p) return 0;
  return (p.m - TODAY.m) * 30 + (p.d - TODAY.d);
}
function upcomingInstances(days = 14) {
  return INSTANCES
    .map(i => ({ ...i, _days: daysFromToday(i.departure) }))
    .filter(i => i._days >= 0 && i._days <= days)
    .sort((a, b) => a._days - b._days);
}
function bookingsThisMonth() {
  // Demo definition: submitted in May or Apr.
  return BOOKINGS.filter(b => b.submitted?.startsWith("May") || b.submitted?.startsWith("Apr"));
}
function activeAgencyCount() { return AGENCIES.filter(a => a.active).length; }

// ─── Expose to window ──────────────────────────────────────────────
Object.assign(window, {
  HOTELS, hotelById, hotelsByCity, hotelUsageCount,
  DESTINATIONS,
  TEMPLATES, templateById, templateProgram, updateTemplateProgram, TEMPLATE_PROGRAMS,
  INSTANCES, instancesForTemplate, instanceById,
  AGENCIES, agencyById, agencyWithBrand, AGENCY_BRANDING, updateAgencyBranding, LEVELS,
  BOOKINGS, bookingByRef, PASSENGER_LISTS, ROOM_LISTS,
  saveBooking, generateBookingRef, updateBookingStatus,
  HOLD_MS, isHoldExpired, holdHoursLeft,
  AUDIT_LOG, logEvent, auditAll, auditByTarget, AUDIT_KIND_LABEL,
  STATUSES, statusLabel,
  CUR, fmt, stars, fmtCur, fmtCurCompact,
  upcomingInstances, bookingsThisMonth, activeAgencyCount,
});
