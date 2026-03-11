import { useState, useRef, useEffect, useCallback } from "react";

const THRESHOLD = 60;

export default function PullToRefresh({ onRefresh, loading, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const startYRef = useRef(null);
  const pullRef = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === null) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      e.preventDefault();
      const dampened = Math.min(diff * 0.5, 100);
      pullRef.current = dampened;
      setPulling(true);
      setPullDistance(dampened);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullRef.current >= THRESHOLD && onRefresh) {
      onRefresh();
    }
    pullRef.current = 0;
    setPullDistance(0);
    setPulling(false);
    startYRef.current = null;
  }, [onRefresh]);

  // Attach non-passive touchmove to allow preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pastThreshold = pullDistance >= THRESHOLD;

  return (
    <div ref={containerRef} className="drive-pull-container">
      {pulling && (
        <div
          className="drive-pull-indicator"
          style={{ height: pullDistance }}
        >
          <span
            className={`drive-pull-arrow ${pastThreshold ? "ready" : ""}`}
          >
            {loading ? "" : "\u2193"}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
