// screens-login.jsx — Partner portal sign-in (landing page)

function LoginScreen({ go }) {
  function submit(e) {
    e.preventDefault();
    go("trips");
  }

  return (
    <div className="login">
      {/* Left — atmospheric visual */}
      <div className="login-visual">
        <div className="login-visual-img"></div>
        <div className="login-visual-overlay"></div>
        <div className="login-visual-content">
          <div className="login-brand">
            <div className="login-brand-mark">N</div>
            <div className="login-brand-lockup">
              <div className="login-brand-name">Nilvoya</div>
              <div className="login-brand-meta">EST.&nbsp;1968 · CAIRO</div>
            </div>
          </div>

          <div className="login-tagline">
            <h1 className="login-tagline-title">
              Organized trips to Egypt — <em>for travel professionals.</em>
            </h1>
            <p className="login-tagline-body">
              Pyramids, Nile cruises and the Red Sea. Fixed itineraries, locked agency rates, and a partner team that picks up the phone.
            </p>
          </div>

          <div className="login-meta">
            <div className="lm-item">
              <span className="lm-num">12</span>
              <span className="lm-lbl">Curated trips</span>
            </div>
            <div className="lm-item">
              <span className="lm-num">4</span>
              <span className="lm-lbl">Destinations</span>
            </div>
            <div className="lm-item">
              <span className="lm-num">58<small> yrs</small></span>
              <span className="lm-lbl">On the ground</span>
            </div>
            <div className="lm-item">
              <span className="lm-num">410+</span>
              <span className="lm-lbl">Partner agencies</span>
            </div>
          </div>

          <div className="login-footnote">
            <span>Cairo · Sharm el-Sheikh · Hurghada · Luxor</span>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          <div className="login-form-eyebrow">Partner portal · sign in</div>
          <h2 className="login-form-title">Welcome back.</h2>
          <p className="login-form-sub">
            Manage group bookings, generate vouchers, and access live inventory across the catalogue.
          </p>

          <form className="login-form" onSubmit={submit}>
            <div className="lf-field">
              <label>Work email</label>
              <input
                type="email"
                className="input"
                defaultValue="yacine.belaid@voyages-med.dz"
                placeholder="name@agency.com"
              />
            </div>
            <div className="lf-field">
              <label>Password</label>
              <input
                type="password"
                className="input"
                defaultValue="••••••••••••"
                placeholder="••••••••"
              />
            </div>

            <div className="lf-options">
              <label className="lf-check">
                <input type="checkbox" defaultChecked />
                <span>Keep me signed in</span>
              </label>
              <a className="lf-link-quiet">Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary btn-lg lf-submit">
              Enter portal <window.Icon name="arrowRight" size={14}/>
            </button>
          </form>

          <div className="lf-divider"><span>or</span></div>

          <div className="lf-secondary">
            <button type="button" className="btn btn-ghost lf-sso">
              <span className="lf-sso-dot"></span>Sign in with agency SSO
            </button>
          </div>

          <div className="lf-foot">
            New partner? <a className="lf-link" onClick={() => go("trips")}>Request access</a>
            <span className="lf-foot-sep">·</span>
            <a className="lf-link-quiet">Talk to Yasmine</a>
          </div>
        </div>

        <div className="login-form-legal">
          <span>© 2026 Nilvoya</span>
          <span className="lfl-sep">·</span>
          <a>Terms</a>
          <span className="lfl-sep">·</span>
          <a>Privacy</a>
          <span className="lfl-sep">·</span>
          <a>FR / EN / AR</a>
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
