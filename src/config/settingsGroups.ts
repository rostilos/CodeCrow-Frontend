import type { SettingsGroupMeta } from "@/api_service/admin/adminSettings.interface";

/**
 * Metadata for all admin settings groups — defines form fields, labels,
 * help text, and field types for the admin UI.
 */
export const SETTINGS_GROUPS: SettingsGroupMeta[] = [
  {
    key: "BASE_URLS",
    label: "Base URLs",
    description:
      "URLs used by the backend and email templates to generate links.",
    icon: "Globe",
    fields: [
      {
        key: "base-url",
        label: "Backend API URL",
        type: "text",
        placeholder: "http://localhost:8081",
        helpText:
          "The URL where the Java web-server is accessible (used for webhooks, OAuth callbacks).",
        required: true,
      },
      {
        key: "frontend-url",
        label: "Frontend URL",
        type: "text",
        placeholder: "http://localhost:8080",
        helpText:
          "The URL where the web frontend is accessible (used in emails, redirects).",
        required: true,
      },
    ],
  },
  {
    key: "VCS_BITBUCKET",
    label: "Bitbucket",
    description:
      "OAuth credentials for Bitbucket Cloud integration (App password or Connect App).",
    icon: "GitBranch",
    fields: [
      {
        key: "client-id",
        label: "Client ID",
        type: "text",
        placeholder: "OAuth consumer key",
        required: true,
      },
      {
        key: "client-secret",
        label: "Client Secret",
        type: "password",
        placeholder: "OAuth consumer secret",
        required: true,
      },
    ],
  },
  {
    key: "VCS_GITHUB",
    label: "GitHub",
    description: "GitHub App credentials for repository access and webhooks.",
    icon: "Github",
    fields: [
      {
        key: "app-id",
        label: "App ID",
        type: "text",
        placeholder: "GitHub App ID (numeric)",
        required: true,
      },
      {
        key: "private-key-path",
        label: "Private Key Path",
        type: "text",
        placeholder: "/app/config/github-app-private-key.pem",
        helpText:
          "Path to the PEM file on the server. The file must be mounted into the container.",
        required: true,
      },
    ],
  },
  {
    key: "VCS_GITLAB",
    label: "GitLab",
    description:
      "OAuth application credentials for GitLab integration (cloud or self-hosted).",
    icon: "Gitlab",
    fields: [
      {
        key: "client-id",
        label: "Application ID",
        type: "text",
        placeholder: "GitLab application ID",
        required: true,
      },
      {
        key: "client-secret",
        label: "Application Secret",
        type: "password",
        placeholder: "GitLab application secret",
        required: true,
      },
      {
        key: "base-url",
        label: "GitLab Base URL",
        type: "text",
        placeholder: "https://gitlab.com",
        helpText: "For self-hosted GitLab, enter your instance URL.",
      },
    ],
  },
  {
    key: "LLM_SYNC",
    label: "LLM API Keys",
    description:
      "API keys for AI model providers used for code analysis synchronization.",
    icon: "Brain",
    fields: [
      {
        key: "openrouter-api-key",
        label: "OpenRouter API Key",
        type: "password",
        placeholder: "sk-or-v1-...",
        helpText: "Used to list available models from OpenRouter.",
      },
      {
        key: "openai-api-key",
        label: "OpenAI API Key",
        type: "password",
        placeholder: "sk-...",
      },
      {
        key: "anthropic-api-key",
        label: "Anthropic API Key",
        type: "password",
        placeholder: "sk-ant-...",
      },
      {
        key: "google-api-key",
        label: "Google AI API Key",
        type: "password",
        placeholder: "AIza...",
      },
    ],
  },
  {
    key: "EMBEDDING",
    label: "Embedding Provider",
    description:
      "Configuration for the vector embedding provider used by the RAG pipeline.",
    icon: "Database",
    fields: [
      {
        key: "provider",
        label: "Provider",
        type: "select",
        required: true,
        options: [
          { value: "ollama", label: "Ollama (Local)" },
          { value: "openrouter", label: "OpenRouter (Cloud)" },
        ],
      },
      {
        key: "ollama-base-url",
        label: "Ollama Base URL",
        type: "text",
        placeholder: "http://ollama:11434",
        helpText:
          "URL of the Ollama server. Use Docker service name in production.",
      },
      {
        key: "ollama-model",
        label: "Ollama Embedding Model",
        type: "text",
        placeholder: "qwen3-embedding:0.6b",
      },
      {
        key: "openrouter-api-key",
        label: "OpenRouter API Key",
        type: "password",
        placeholder: "sk-or-v1-...",
        helpText: "Required when provider is OpenRouter.",
      },
      {
        key: "openrouter-model",
        label: "OpenRouter Embedding Model",
        type: "text",
        placeholder: "qwen/qwen3-embedding-8b",
      },
    ],
  },
  {
    key: "SMTP",
    label: "Email / SMTP",
    description: "SMTP server settings for sending notification emails.",
    icon: "Mail",
    fields: [
      {
        key: "enabled",
        label: "Enable Email",
        type: "boolean",
        helpText: "If disabled, no emails will be sent.",
      },
      {
        key: "host",
        label: "SMTP Host",
        type: "text",
        placeholder: "smtp.gmail.com",
      },
      {
        key: "port",
        label: "SMTP Port",
        type: "number",
        placeholder: "587",
      },
      {
        key: "username",
        label: "SMTP Username",
        type: "text",
        placeholder: "your-email@gmail.com",
      },
      {
        key: "password",
        label: "SMTP Password",
        type: "password",
        placeholder: "App password or SMTP password",
      },
      {
        key: "from-address",
        label: "From Address",
        type: "text",
        placeholder: "noreply@yourdomain.com",
      },
      {
        key: "from-name",
        label: "From Name",
        type: "text",
        placeholder: "CodeCrow",
      },
      {
        key: "starttls",
        label: "STARTTLS",
        type: "boolean",
        helpText: "Enable STARTTLS encryption.",
      },
    ],
  },
  {
    key: "GOOGLE_OAUTH",
    label: "Google OAuth",
    description:
      'Google OAuth client ID for "Sign in with Google" functionality.',
    icon: "Chrome",
    fields: [
      {
        key: "client-id",
        label: "Google Client ID",
        type: "text",
        placeholder: "123456789-xxxx.apps.googleusercontent.com",
        helpText:
          "OAuth 2.0 Client ID from Google Cloud Console. Required for Google sign-in.",
      },
    ],
  },
];

/** Look up group metadata by key */
export function getGroupMeta(key: string): SettingsGroupMeta | undefined {
  return SETTINGS_GROUPS.find((g) => g.key === key);
}
