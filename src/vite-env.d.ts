/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WEBHOOK_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  
  // New Relic Browser Monitoring
  readonly VITE_NEW_RELIC_LICENSE_KEY?: string;
  readonly VITE_NEW_RELIC_APP_ID?: string;
  readonly VITE_NEW_RELIC_ACCOUNT_ID?: string;
  readonly VITE_NEW_RELIC_TRUST_KEY?: string;
  readonly VITE_NEW_RELIC_AGENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
