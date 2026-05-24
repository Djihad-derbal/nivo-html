// app.jsx — Main app + routing

const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "ivory",
  "density": "regular",
  "showTweaks": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme & density to body
  useEffectApp(() => {
    document.body.dataset.theme = t.theme;
    document.body.dataset.density = t.density;
  }, [t.theme, t.density]);

  const [route, setRoute] = useStateApp("login");
  const [wizardTrip, setWizardTrip] = useStateApp(null);
  const [viewingTrip, setViewingTrip] = useStateApp(null);
  const [activeBooking, setActiveBooking] = useStateApp(null);

  function go(r) {
    setRoute(r);
    if (r !== "wizard") setWizardTrip(null);
    if (r !== "trip-detail") setViewingTrip(null);
    if (r !== "booking") setActiveBooking(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector(".main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function viewTrip(trip) {
    setViewingTrip(trip);
    setRoute("trip-detail");
    document.querySelector(".main")?.scrollTo({ top: 0 });
  }

  function startBooking(trip) {
    setWizardTrip(trip);
    setViewingTrip(null);
    setRoute("wizard");
    document.querySelector(".main")?.scrollTo({ top: 0 });
  }

  function openBooking(b) {
    setActiveBooking(b);
    setRoute("booking");
    document.querySelector(".main")?.scrollTo({ top: 0 });
  }

  // Sidebar route mapping: highlight "bookings" while viewing a booking detail.
  // Dashboard is its own thing now (accessed via profile button at bottom).
  const sbRoute = (route === "booking") ? "bookings"
    : (route === "wizard") ? "trips"
    : route;

  // Trips and the booking wizard are public-facing screens — no in-app chrome.
  // Login is fully chrome-less, a split-screen page.
  const isLanding = route === "trips";
  const isLogin = route === "login";
  const isWizard = route === "wizard";
  const chromeless = isLanding || isLogin || isWizard;

  return (
    <div className={"app" + (isLanding ? " app-landing" : "") + (isLogin ? " app-login" : "") + (isWizard ? " app-wizard" : "")}>
      {!chromeless && (
        <window.Sidebar
          route={sbRoute}
          go={go}
          badges={{ bookings: 4 }}
        />
      )}
      <main className="main">
        {route === "login" && <window.LoginScreen go={go}/>}
        {route === "dashboard" && <window.DashboardScreen go={go} openBooking={openBooking}/>}
        {route === "trips" && <window.CatalogScreen go={go} startBooking={startBooking} viewTrip={viewTrip}/>}
        {route === "trip-detail" && viewingTrip && <window.TripDetailScreen trip={viewingTrip} go={go} startBooking={startBooking}/>}
        {route === "wizard" && wizardTrip && <window.WizardScreen trip={wizardTrip} go={go} openBookingFromWizard={openBooking}/>}
        {route === "booking" && activeBooking && <window.BookingDetailScreen booking={activeBooking} go={go}/>}
      </main>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme}
                    options={["ivory", "dusk"]}
                    onChange={(v) => setTweak("theme", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density}
                    options={["compact", "regular"]}
                    onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Quick jump" />
        <TweakButton label="Login screen" onClick={() => go("login")}/>
        <TweakButton label="Dashboard" onClick={() => go("dashboard")}/>
        <TweakButton label="Trip catalog" onClick={() => go("trips")}/>
        <TweakButton label="Start a booking" onClick={() => startBooking(window.TRIPS[0])}/>
        <TweakButton label="Open EGP-2H8K-441" onClick={() => openBooking(window.BOOKINGS[0])}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
