/**
 * Cross-domain URL configuration for CodeCrow services.
 *
 * codecrow.app    → Static content: landing page, docs, blog
 * codecrow.cloud  → Dashboard, authentication (login, register, etc.)  ← THIS site
 *
 * Uses env vars for flexibility across dev / staging / production.
 */

export const DOMAINS = {
  /** Static content site (landing page, docs, blog) */
  app: import.meta.env.VITE_APP_URL || "https://codecrow.app",

  /** This site — cloud dashboard & auth */
  cloud: import.meta.env.VITE_CLOUD_URL || "https://codecrow.cloud",
} as const;

/** Pre-built cross-domain links used throughout the app */
export const CROSS_LINKS = {
  // ── App (static content @ codecrow.app) ───────────────
  home: DOMAINS.app,
  docs: `${DOMAINS.app}/docs`,
  docsGettingStarted: `${DOMAINS.app}/docs/getting-started`,
  blog: `${DOMAINS.app}/blog`,

  // ── Cloud (this site) ─────────────────────────────────
  login: "/login",
  register: "/register",
  dashboard: "/workspace",
  forgotPassword: "/forgot-password",
} as const;
