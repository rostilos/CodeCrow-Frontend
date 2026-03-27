import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * Full-screen overlay that punches a radial "flashlight" hole around the
 * cursor.  Active only when the "very-dark" theme is selected.
 *
 * The heavy lifting is done in CSS (`.flashlight-overlay` in index.css).
 * This component just tracks the pointer and feeds CSS custom properties
 * `--fl-x`, `--fl-y`, and `--fl-r` on the overlay element.
 */
export function FlashlightOverlay() {
  const { theme } = useTheme();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme !== "very-dark") return;

    const el = overlayRef.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      el.style.setProperty("--fl-x", `${e.clientX}px`);
      el.style.setProperty("--fl-y", `${e.clientY}px`);
    };

    // Initialise with a generous radius; CSS handles the masking.
    el.style.setProperty("--fl-r", "220px");
    el.style.setProperty("--fl-x", "50vw");
    el.style.setProperty("--fl-y", "50vh");

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [theme]);

  if (theme !== "very-dark") return null;

  return <div ref={overlayRef} className="flashlight-overlay" />;
}
