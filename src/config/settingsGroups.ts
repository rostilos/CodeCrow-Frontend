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
      "Public URLs for backend API, frontend, and webhooks. VCS providers send webhook events to these addresses, so they must be reachable from the internet.",
    icon: "Globe",
    fields: [
      {
        key: "base-url",
        label: "Backend API URL",
        type: "text",
        placeholder: "https://api.yourdomain.com",
        helpText:
          "Must be publicly accessible — VCS providers send webhooks here.",
        required: true,
      },
      {
        key: "frontend-url",
        label: "Frontend URL",
        type: "text",
        placeholder: "https://app.yourdomain.com",
        helpText:
          "Must be publicly accessible — used in email links and OAuth redirects.",
        required: true,
      },
      {
        key: "webhook-base-url",
        label: "Webhook Base URL",
        type: "text",
        placeholder: "https://webhooks.yourdomain.com",
        helpText:
          "Optional. If your pipeline agent receives webhooks on a separate domain, set it here. Defaults to Backend API URL.",
        required: false,
      },
    ],
  },
  {
    key: "VCS_BITBUCKET",
    label: "Bitbucket OAuth App",
    description:
      "OAuth credentials for 1-click Bitbucket integration. Users authorize via standard OAuth 2.0 flow.",
    icon: "GitBranch",
    instructions:
      "1. Bitbucket → Workspace settings → OAuth consumers → Add consumer\n" +
      "2. Callback URL: {backend-url}/api/integrations/bitbucket-cloud/app/callback\n" +
      "3. Permissions: Account (Read), Repositories (Read), Pull requests (Read & Write), Webhooks (Read & Write)\n" +
      "4. Copy the Key (Client ID) and Secret below.",
    fields: [
      {
        key: "client-id",
        label: "Client ID",
        type: "text",
        placeholder: "OAuth consumer key",
        required: false,
      },
      {
        key: "client-secret",
        label: "Client Secret",
        type: "password",
        placeholder: "OAuth consumer secret",
        required: false,
      },
    ],
  },
  {
    key: "VCS_BITBUCKET_CONNECT",
    label: "Bitbucket Connect App",
    description:
      "Connect App credentials for workspace-level Bitbucket integration. A workspace admin installs the app; access is shared across the workspace.",
    icon: "GitBranch",
    instructions:
      "Connect Apps use the Atlassian Connect framework. A workspace admin installs the app descriptor, " +
      "and CodeCrow receives a shared secret for JWT-based authentication.\n" +
      "Contact your administrator or refer to the deployment docs for the Connect App descriptor setup.",
    fields: [
      {
        key: "client-id",
        label: "Client ID",
        type: "text",
        placeholder: "Connect app client ID",
        required: false,
      },
      {
        key: "client-secret",
        label: "Client Secret",
        type: "password",
        placeholder: "Connect app client secret",
        required: false,
      },
    ],
  },
  {
    key: "VCS_GITHUB",
    label: "GitHub App",
    description:
      "GitHub App credentials for 1-click repository integration. Users install the app on their org/account.",
    icon: "Github",
    instructions:
      "1. GitHub → Settings → Developer settings → GitHub Apps → New GitHub App\n" +
      "2. Webhook URL: {backend-url}/api/github/webhook\n" +
      "3. Permissions: Contents (Read), Pull requests (Read & Write), Webhooks (Read & Write), Metadata (Read)\n" +
      "4. Subscribe to events: Pull request, Push\n" +
      "5. Generate a private key (.pem) and upload it below\n" +
      "6. Fill in all fields: App ID, Webhook Secret, and App Slug.",
    fields: [
      {
        key: "app-id",
        label: "App ID",
        type: "text",
        placeholder: "GitHub App ID (numeric)",
        required: false,
      },
      {
        key: "private-key-path",
        label: "Private Key Path",
        type: "text",
        placeholder: "/app/config/github-app-private-key.pem",
        helpText:
          "Path to the .pem file on the server. Use the Upload button to upload, or specify a path if manually mounted.",
        required: false,
      },
      {
        key: "webhook-secret",
        label: "Webhook Secret",
        type: "password",
        placeholder: "GitHub App webhook secret",
        helpText:
          "The webhook secret you set when creating the GitHub App. Used to verify webhook payloads.",
        required: false,
      },
      {
        key: "slug",
        label: "App Slug",
        type: "text",
        placeholder: "your-github-app-name",
        helpText:
          "The URL-friendly name of your GitHub App (from the app URL: github.com/apps/<slug>).",
        required: false,
      },
    ],
  },
  {
    key: "VCS_GITLAB",
    label: "GitLab OAuth App",
    description:
      "OAuth application credentials for 1-click GitLab integration. Works with GitLab.com and self-hosted instances.",
    icon: "Gitlab",
    instructions:
      "1. GitLab → User Settings → Applications (or Admin Area → Applications for self-hosted)\n" +
      "2. Redirect URI: {backend-url}/api/auth/gitlab/callback\n" +
      "3. Scopes: api, read_user, read_repository, write_repository\n" +
      "4. Copy the Application ID and Secret below.",
    fields: [
      {
        key: "client-id",
        label: "Application ID",
        type: "text",
        placeholder: "GitLab application ID",
        required: false,
      },
      {
        key: "client-secret",
        label: "Application Secret",
        type: "password",
        placeholder: "GitLab application secret",
        required: false,
      },
      {
        key: "base-url",
        label: "GitLab Base URL",
        type: "text",
        placeholder: "https://gitlab.com",
        helpText:
          "For self-hosted GitLab, enter your instance URL. Leave empty for GitLab.com.",
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
      'Google OAuth client ID for "Sign in with Google" on the login page.',
    icon: "Chrome",
    instructions:
      "1. Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID\n" +
      "2. Add your Frontend URL to Authorized JavaScript origins\n" +
      "3. Add {frontend-url}/auth/google/callback to Authorized redirect URIs\n" +
      "4. Copy the Client ID below. No frontend rebuild needed.",
    fields: [
      {
        key: "client-id",
        label: "Google Client ID",
        type: "text",
        placeholder: "123456789-xxxx.apps.googleusercontent.com",
        helpText: "OAuth 2.0 Client ID from Google Cloud Console.",
      },
    ],
  },
];

/** Look up group metadata by key */
export function getGroupMeta(key: string): SettingsGroupMeta | undefined {
  return SETTINGS_GROUPS.find((g) => g.key === key);
}
