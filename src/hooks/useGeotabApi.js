import { useCallback } from "react";

export function apiCall(api, method, params) {
  return new Promise((resolve, reject) => {
    api.call(method, params, resolve, reject);
  });
}

export function apiMultiCall(api, calls) {
  return new Promise((resolve, reject) => {
    api.multiCall(calls, resolve, reject);
  });
}

export async function apiMultiCallRetry(api, calls, maxRetries = 3) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiMultiCall(api, calls);
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

export function useApiCall(api) {
  return useCallback(
    (method, params) => apiCall(api, method, params),
    [api]
  );
}
