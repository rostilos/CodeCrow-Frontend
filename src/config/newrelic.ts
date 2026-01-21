import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent';

/**
 * New Relic Browser Agent Configuration
 * 
 * Required environment variables:
 * - VITE_NEW_RELIC_LICENSE_KEY: Your New Relic Ingest License Key (Browser)
 * - VITE_NEW_RELIC_APP_ID: Your New Relic Browser Application ID
 * - VITE_NEW_RELIC_ACCOUNT_ID: Your New Relic Account ID
 * 
 * Optional:
 * - VITE_NEW_RELIC_TRUST_KEY: Trust key for distributed tracing (usually same as account ID)
 * - VITE_NEW_RELIC_AGENT_ID: Agent ID (usually same as app ID)
 */

const isNewRelicEnabled = (): boolean => {
  const licenseKey = import.meta.env.VITE_NEW_RELIC_LICENSE_KEY;
  const appId = import.meta.env.VITE_NEW_RELIC_APP_ID;
  const accountId = import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID;
  
  return Boolean(licenseKey && appId && accountId);
};

export const initNewRelic = (): BrowserAgent | null => {
  if (!isNewRelicEnabled()) {
    if (import.meta.env.DEV) {
      console.info('[New Relic] Monitoring disabled - missing configuration');
    }
    return null;
  }

  try {
    const options = {
      init: {
        distributed_tracing: { enabled: true },
        privacy: { cookies_enabled: true },
        ajax: { deny_list: ['bam.eu01.nr-data.net'] },
        session_replay: {
          enabled: true,
          block_selector: '[data-nr-block]',
          mask_text_selector: '[data-nr-mask]',
          sampling_rate: 10.0,
          error_sampling_rate: 100.0,
        },
      },
      info: {
        beacon: 'bam.eu01.nr-data.net',
        errorBeacon: 'bam.eu01.nr-data.net',
        licenseKey: import.meta.env.VITE_NEW_RELIC_LICENSE_KEY,
        applicationID: import.meta.env.VITE_NEW_RELIC_APP_ID,
        sa: 1, // Standalone agent
      },
      loader_config: {
        accountID: import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID,
        trustKey: import.meta.env.VITE_NEW_RELIC_TRUST_KEY || import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID,
        agentID: import.meta.env.VITE_NEW_RELIC_AGENT_ID || import.meta.env.VITE_NEW_RELIC_APP_ID,
        licenseKey: import.meta.env.VITE_NEW_RELIC_LICENSE_KEY,
        applicationID: import.meta.env.VITE_NEW_RELIC_APP_ID,
      },
    };

    const agent = new BrowserAgent(options);
    
    if (import.meta.env.DEV) {
      console.info('[New Relic] Browser monitoring initialized');
    }

    return agent;
  } catch (error) {
    console.error('[New Relic] Failed to initialize browser agent:', error);
    return null;
  }
};

// Utility to add custom attributes to current page view
export const setNewRelicAttribute = (name: string, value: string | number | boolean): void => {
  if (typeof window !== 'undefined' && (window as any).newrelic) {
    (window as any).newrelic.setCustomAttribute(name, value);
  }
};

// Utility to track custom page actions
export const trackNewRelicAction = (name: string, attributes?: Record<string, unknown>): void => {
  if (typeof window !== 'undefined' && (window as any).newrelic) {
    (window as any).newrelic.addPageAction(name, attributes);
  }
};

// Utility to manually capture errors
export const notifyNewRelicError = (error: Error, customAttributes?: Record<string, unknown>): void => {
  if (typeof window !== 'undefined' && (window as any).newrelic) {
    (window as any).newrelic.noticeError(error, customAttributes);
  }
};

// Utility to set user ID for session tracking
export const setNewRelicUserId = (userId: string): void => {
  if (typeof window !== 'undefined' && (window as any).newrelic) {
    (window as any).newrelic.setUserId(userId);
  }
};
