import { createElement, createRef } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App.jsx";

const appRef = createRef();
let root = null;
let firstFocus = true;

function waitForRef(maxMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (appRef.current) return resolve(appRef.current);
      if (Date.now() - start > maxMs) return resolve(null);
      setTimeout(check, 50);
    };
    check();
  });
}

const impl = {
  initialize(freshApi, state, callback) {
    root = createRoot(document.getElementById("scorecard-root"));
    root.render(createElement(App, { ref: appRef }));

    waitForRef(10000).then(async (ref) => {
      if (ref) await ref.initializeFoundation(freshApi, state);
      callback();
    });
  },

  focus(freshApi, state) {
    if (appRef.current) appRef.current.updateApi(freshApi, state);
    if (firstFocus) {
      firstFocus = false;
      setTimeout(() => document.getElementById("scorecard-apply")?.click(), 500);
    }
  },

  blur() {
    if (appRef.current) appRef.current.abort();
  },
};

if (typeof window.__scorecardReady === "function") {
  window.__scorecardReady(impl);
} else {
  window.__scorecardImpl = impl;
}
