import { useState, useRef, useEffect, useCallback } from "react";

export default function InfoTooltip({ text, position = "below" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const handleOutsideClick = useCallback((e) => {
    if (wrapRef.current && !wrapRef.current.contains(e.target)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("click", handleOutsideClick, true);
      return () => document.removeEventListener("click", handleOutsideClick, true);
    }
  }, [open, handleOutsideClick]);

  return (
    <span className="drive-info-wrap" ref={wrapRef}>
      <button
        type="button"
        className="drive-info-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label="More info"
      >
        i
      </button>
      {open && (
        <span className={`drive-info-tooltip drive-info-tooltip-${position}`}>
          {text}
        </span>
      )}
    </span>
  );
}
