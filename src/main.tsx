import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initNewRelic } from './config/newrelic'

// Initialize New Relic Browser monitoring (before React renders)
initNewRelic();

createRoot(document.getElementById("root")!).render(<App />);
