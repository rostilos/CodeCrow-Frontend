import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initNewRelic } from './config/newrelic'

const assetRecoveryKey = "codecrow:asset-recovery";

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();

  try {
    const lastReload = Number(sessionStorage.getItem(assetRecoveryKey) ?? 0);
    if (Date.now() - lastReload < 10_000) {
      return;
    }
    sessionStorage.setItem(assetRecoveryKey, String(Date.now()));
  } catch {
    // A reload still recovers the current release when storage is unavailable.
  }

  window.location.reload();
});

// Public-share URLs contain a bearer credential in the fragment. Keep that
// route entirely outside browser telemetry so the credential cannot be
// captured as a page URL or error attribute.
if (!window.location.pathname.startsWith("/share")) {
  initNewRelic();
}

createRoot(document.getElementById("root")!).render(<App />);
