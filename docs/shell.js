(function () {
  var pending = { initialize: null, focus: null, blur: null };
  var ready = false;
  var queued = [];
  var initialized = false;

  window.__scorecardReady = function (impl) {
    pending = impl;
    ready = true;
    queued.forEach(function (fn) { fn(); });
    queued = [];
  };

  if (window.__scorecardImpl) {
    window.__scorecardReady(window.__scorecardImpl);
  }

  // Detect Drive context at runtime using multiple signals.
  // Drive is the Geotab mobile tablet app; MyGeotab is the desktop web UI.
  function detectDriveContext(api, state) {
    // Signal 1: Drive sets pageState.device for the current vehicle
    if (state && state.device != null) return true;

    // Signal 2: Drive exposes api.mobile
    try {
      if (api && api.mobile && api.mobile.exists && api.mobile.exists()) return true;
    } catch (e) {}

    // Signal 3: mobile/tablet user agent + touch device (Drive is tablet-only)
    var isMobile = /Android|iPad|iPhone/i.test(navigator.userAgent);
    var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isMobile && isTouch) return true;

    return false;
  }

  function addinFactory() {
    return {
      initialize: function (api, state, callback) {
        if (initialized) { callback(); return; }
        initialized = true;
        window.__scorecardDriveMode = detectDriveContext(api, state);
        if (ready) { pending.initialize(api, state, callback); }
        else { queued.push(function () { pending.initialize(api, state, callback); }); }
      },
      focus: function (api, state) {
        if (ready) { pending.focus(api, state); }
        else { queued.push(function () { pending.focus(api, state); }); }
      },
      blur: function () {
        if (ready) { pending.blur(); }
        else { queued.push(function () { pending.blur(); }); }
      }
    };
  }

  // Register under all plausible naming conventions so MyGeotab/Drive
  // finds the addin regardless of how it derives the JavaScript name
  // from the config name "Driver Safety Scorecard".
  // All variants share one factory; Drive vs MyGeotab is detected at
  // runtime inside initialize, not from the registration name.
  geotab.addin.driverScorecard = addinFactory;
  geotab.addin.driverSafetyScorecard = addinFactory;
  geotab.addin.driver_safety_scorecard = addinFactory;
  geotab.addin.driverScorecardDriveAppLink = addinFactory;
  geotab.addin.driverSafetyScorecardDriveAppLink = addinFactory;
  geotab.addin.driver_safety_scorecardDriveAppLink = addinFactory;
})();
