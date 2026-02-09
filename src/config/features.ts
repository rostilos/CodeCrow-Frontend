/**
 * Feature flags configuration for enabling/disabling cloud-specific features.
 *
 * For OSS deployments, these features are disabled by default.
 * For Cloud deployments, set the corresponding VITE_FEATURE_* environment variables to "true".
 *
 * Usage in .env:
 *   VITE_FEATURE_BILLING=true
 *   VITE_FEATURE_CLOUD_PLANS=true
 *   VITE_FEATURE_USAGE_ANALYTICS=true
 */

export const FEATURES = {
  /**
   * Billing & Subscription management
   * Enables: Billing page, subscription plans, payment methods, invoices
   */
  BILLING: import.meta.env.VITE_FEATURE_BILLING === "true",

  /**
   * Cloud subscription plans (Pro, Pro+, Enterprise)
   * Enables: Plan selection, upgrades, downgrades
   */
  CLOUD_PLANS: import.meta.env.VITE_FEATURE_CLOUD_PLANS === "true",

  /**
   * Usage analytics and limits
   * Enables: Usage tracking, limit warnings, quota management
   */
  USAGE_ANALYTICS: import.meta.env.VITE_FEATURE_USAGE_ANALYTICS === "true",

  /**
   * Team/Enterprise features
   * Enables: SSO, SAML, advanced team management
   */
  ENTERPRISE: import.meta.env.VITE_FEATURE_ENTERPRISE === "true",

  /**
   * Google OAuth sign-in
   * Already uses VITE_GOOGLE_CLIENT_ID presence check
   */
  GOOGLE_AUTH: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

/**
 * Check if any cloud feature is enabled
 */
export function hasCloudFeatures(): boolean {
  return (
    FEATURES.BILLING ||
    FEATURES.CLOUD_PLANS ||
    FEATURES.USAGE_ANALYTICS ||
    FEATURES.ENTERPRISE
  );
}
