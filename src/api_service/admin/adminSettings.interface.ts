/**
 * Types for the Site Admin Settings API.
 *
 * Maps to the Java backend DTOs:
 *   - ESiteSettingsGroup enum
 *   - ConfigurationStatusDTO
 *   - Settings key-value maps
 */

export type SiteSettingsGroup =
  | "VCS_BITBUCKET"
  | "VCS_BITBUCKET_CONNECT"
  | "VCS_GITHUB"
  | "VCS_GITLAB"
  | "LLM_SYNC"
  | "SMTP"
  | "GOOGLE_OAUTH"
  | "BASE_URLS";

export interface ConfigurationStatus {
  groups: Record<SiteSettingsGroup, boolean>;
  setupComplete: boolean;
}

/** A settings group is represented as a string→string map of key-value pairs */
export type SettingsMap = Record<string, string>;

/**
 * Human-readable metadata for each settings group — used by the UI.
 */
export interface SettingsGroupMeta {
  key: SiteSettingsGroup;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  fields: SettingsFieldMeta[];
  instructions?: string; // Optional setup instructions shown as an info block
}

export interface SettingsFieldMeta {
  key: string;
  label: string;
  type: "text" | "password" | "number" | "boolean" | "select";
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

/**
 * VCS provider availability flags returned by /api/public/site-config.
 * Tells the frontend which "Connect" buttons to show vs info banners.
 */
export interface VcsProviderAvailability {
  bitbucketOAuth: boolean;
  bitbucketConnect: boolean;
  githubOAuth: boolean;
  githubApp: boolean;
  gitlabOAuth: boolean;
}

/**
 * Public site config returned by the unauthenticated /api/public/site-config endpoint.
 */
export interface PublicSiteConfig {
  googleClientId?: string;
  vcsProviders?: VcsProviderAvailability;
}
