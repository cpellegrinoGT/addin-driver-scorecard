(function () {
  var pending = { initialize: null, focus: null, blur: null };
  var ready = false;
  var queued = [];

  window.__scorecardReady = function (impl) {
    pending = impl;
    ready = true;
    queued.forEach(function (fn) { fn(); });
    queued = [];
  };

  if (window.__scorecardImpl) {
    window.__scorecardReady(window.__scorecardImpl);
  }

  var addinFactory = function () {
    return {
      initialize: function (api, state, callback) {
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

  geotab.addin.driverScorecard = addinFactory;
  geotab.addin.driverScorecardDriveAppLink = addinFactory;
})();
