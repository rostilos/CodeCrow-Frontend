/**
 * Task Management Integration types
 */

// --- Enums / union types ---

export type TaskManagementProvider = "JIRA_CLOUD" | "JIRA_DATA_CENTER";

export type TaskManagementConnectionStatus =
  | "PENDING"
  | "CONNECTED"
  | "ERROR"
  | "DISABLED";

export type QaAutoDocTemplateMode = "RAW" | "BASE" | "CUSTOM";

export type QaAutoDocTaskIdSource =
  | "BRANCH_NAME"
  | "PR_TITLE"
  | "PR_DESCRIPTION";

// --- Provider metadata ---

export interface TaskManagementProviderInfo {
  id: TaskManagementProvider;
  label: string;
  supported: boolean;
}

// --- Connection DTOs ---

export interface TaskManagementConnectionResponse {
  id: number;
  connectionName: string;
  providerType: TaskManagementProvider;
  status: TaskManagementConnectionStatus;
  baseUrl: string;
  maskedEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskManagementConnectionRequest {
  connectionName: string;
  providerType: TaskManagementProvider;
  baseUrl: string;
  email: string;
  apiToken: string;
}

// --- QA Auto-Documentation Config DTOs ---

export interface QaAutoDocConfigResponse {
  enabled: boolean;
  taskManagementConnectionId: number | null;
  taskIdPattern: string | null;
  taskIdSource: QaAutoDocTaskIdSource | null;
  templateMode: QaAutoDocTemplateMode | null;
  customTemplate: string | null;
  outputLanguage: string | null;
  commentVisibility: TaskCommentVisibility | null;
}

export interface QaAutoDocConfigRequest {
  enabled: boolean;
  taskManagementConnectionId: number | null;
  taskIdPattern: string | null;
  taskIdSource: QaAutoDocTaskIdSource | null;
  templateMode: QaAutoDocTemplateMode | null;
  customTemplate: string | null;
  outputLanguage: string | null;
  commentVisibility: TaskCommentVisibility | null;
}

export interface TaskCommentVisibility {
  type: "group" | "role";
  identifier: string;
  value?: string | null;
  displayName?: string | null;
}

// --- Constants ---

export const TASK_MANAGEMENT_PROVIDERS: TaskManagementProviderInfo[] = [
  { id: "JIRA_CLOUD", label: "Jira Cloud", supported: true },
  { id: "JIRA_DATA_CENTER", label: "Jira Data Center", supported: false },
];

export const TEMPLATE_MODES: {
  value: QaAutoDocTemplateMode;
  label: string;
  description: string;
}[] = [
  {
    value: "RAW",
    label: "Raw",
    description:
      "AI has full creative freedom in structuring the documentation",
  },
  {
    value: "BASE",
    label: "Base",
    description:
      "Structured template with test scenarios, regression risks, etc.",
  },
  {
    value: "CUSTOM",
    label: "Custom",
    description: "Your own template with placeholder substitution",
  },
];

export const TASK_ID_SOURCES: {
  value: QaAutoDocTaskIdSource;
  label: string;
  description: string;
}[] = [
  {
    value: "BRANCH_NAME",
    label: "Branch Name",
    description: "Extract task ID from the source branch name",
  },
  {
    value: "PR_TITLE",
    label: "PR Title",
    description: "Extract task ID from the pull request title",
  },
  {
    value: "PR_DESCRIPTION",
    label: "PR Description",
    description: "Extract task ID from the pull request description",
  },
];

export const DEFAULT_TASK_ID_PATTERN = "[A-Z][A-Z0-9]+-\\d+";

export const MAX_CUSTOM_TEMPLATE_LENGTH = 5000;

export const OUTPUT_LANGUAGES: { value: string; label: string }[] = [
  { value: "English", label: "English" },
  { value: "Ukrainian", label: "Українська (Ukrainian)" },
  { value: "Spanish", label: "Español (Spanish)" },
  { value: "French", label: "Français (French)" },
  { value: "German", label: "Deutsch (German)" },
  { value: "Portuguese", label: "Português (Portuguese)" },
  { value: "Italian", label: "Italiano (Italian)" },
  { value: "Polish", label: "Polski (Polish)" },
  { value: "Dutch", label: "Nederlands (Dutch)" },
  { value: "Czech", label: "Čeština (Czech)" },
  { value: "Turkish", label: "Türkçe (Turkish)" },
  { value: "Japanese", label: "日本語 (Japanese)" },
  { value: "Korean", label: "한국어 (Korean)" },
  { value: "Chinese", label: "中文 (Chinese)" },
  { value: "Arabic", label: "العربية (Arabic)" },
  { value: "Hebrew", label: "עברית (Hebrew)" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Swedish", label: "Svenska (Swedish)" },
  { value: "Norwegian", label: "Norsk (Norwegian)" },
  { value: "Danish", label: "Dansk (Danish)" },
  { value: "Finnish", label: "Suomi (Finnish)" },
  { value: "Romanian", label: "Română (Romanian)" },
  { value: "Bulgarian", label: "Български (Bulgarian)" },
  { value: "Croatian", label: "Hrvatski (Croatian)" },
  { value: "Serbian", label: "Српски (Serbian)" },
  { value: "Slovak", label: "Slovenčina (Slovak)" },
  { value: "Slovenian", label: "Slovenščina (Slovenian)" },
  { value: "Greek", label: "Ελληνικά (Greek)" },
  { value: "Thai", label: "ไทย (Thai)" },
  { value: "Vietnamese", label: "Tiếng Việt (Vietnamese)" },
  { value: "Indonesian", label: "Bahasa Indonesia (Indonesian)" },
  { value: "Malay", label: "Bahasa Melayu (Malay)" },
];
