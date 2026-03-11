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

  function makeAddin(isDrive) {
    return function () {
      return {
        initialize: function (api, state, callback) {
          if (initialized) { callback(); return; }
          initialized = true;
          window.__scorecardDriveMode = isDrive;
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
    };
  }

  // Register under both naming conventions so MyGeotab finds the correct addin
  // regardless of how it derives the name from the config.
  // ActivityLink (MyGeotab) — isDrive = false
  geotab.addin.driverScorecard = makeAddin(false);
  geotab.addin.driverSafetyScorecard = makeAddin(false);
  geotab.addin.driver_safety_scorecard = makeAddin(false);
  // DriveAppLink (Drive) — isDrive = true
  geotab.addin.driverScorecardDriveAppLink = makeAddin(true);
  geotab.addin.driverSafetyScorecardDriveAppLink = makeAddin(true);
  geotab.addin.driver_safety_scorecardDriveAppLink = makeAddin(true);
})();
