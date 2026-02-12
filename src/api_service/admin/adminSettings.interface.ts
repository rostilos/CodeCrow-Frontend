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
  | "VCS_GITHUB"
  | "VCS_GITLAB"
  | "LLM_SYNC"
  | "EMBEDDING"
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
