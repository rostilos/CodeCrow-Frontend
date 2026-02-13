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
    instructions:
      "Both URLs must be publicly accessible from the internet.\n" +
      "VCS providers (GitHub, Bitbucket, GitLab) send webhook events to the Backend API URL,\n" +
      "and OAuth redirects use the Frontend URL.",
    fields: [
      {
        key: "base-url",
        label: "Backend API URL",
        type: "text",
        placeholder: "https://api.yourdomain.com",
        helpText:
          "Must be a publicly accessible URL — VCS providers send webhook events to this address.",
        required: true,
      },
      {
        key: "frontend-url",
        label: "Frontend URL",
        type: "text",
        placeholder: "https://app.yourdomain.com",
        helpText:
          "Must be a publicly accessible URL — used in email links and OAuth redirects.",
        required: true,
      },
    ],
  },
  {
    key: "VCS_BITBUCKET",
    label: "Bitbucket",
    description: "OAuth credentials for Bitbucket Cloud integration.",
    icon: "GitBranch",
    instructions:
      "To integrate with Bitbucket Cloud, create an OAuth consumer:\n\n" +
      "1. Go to Bitbucket → Workspace settings → OAuth consumers → Add consumer\n" +
      "2. Set the Callback URL to: {backend-url}/api/auth/bitbucket/callback\n" +
      "   (replace {backend-url} with your Backend API URL from Base URLs)\n" +
      "3. Grant permissions: Repository (Read), Pull requests (Read & Write)\n" +
      "4. Save and note the Key (Client ID) and Secret (Client Secret)",
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
    instructions:
      "To integrate with GitHub, create a GitHub App:\n\n" +
      "1. Go to GitHub → Settings → Developer settings → GitHub Apps → New GitHub App\n" +
      "2. Set Homepage URL to your Frontend URL\n" +
      "3. Set Webhook URL to: {backend-url}/api/github/webhook\n" +
      "   (replace {backend-url} with your Backend API URL from Base URLs)\n" +
      "4. Under Permissions grant:\n" +
      "   • Repository contents — Read\n" +
      "   • Pull requests — Read & Write\n" +
      "   • Webhooks — Read & Write\n" +
      "5. Generate a private key (.pem), download it, and mount it into the web-server container\n" +
      "6. Note the App ID (numeric, shown at the top of the app page)",
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
    instructions:
      "To integrate with GitLab, create an OAuth application:\n\n" +
      "1. Go to GitLab → User Settings → Applications (or Admin → Applications for self-hosted)\n" +
      "2. Set the Redirect URI to: {backend-url}/api/auth/gitlab/callback\n" +
      "   (replace {backend-url} with your Backend API URL from Base URLs)\n" +
      "3. Grant scopes: api, read_user, read_repository\n" +
      "4. Save and note the Application ID and Secret",
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
    instructions:
      "To enable Google Sign-In:\n\n" +
      "1. Go to Google Cloud Console → APIs & Services → Credentials\n" +
      "2. Create an OAuth 2.0 Client ID (Web application type)\n" +
      "3. Add your Frontend URL to Authorized JavaScript origins\n" +
      "4. Add {frontend-url}/auth/google/callback to Authorized redirect URIs\n" +
      "5. Copy the Client ID and enter it below\n\n" +
      "Important: The same Client ID must also be set as VITE_GOOGLE_CLIENT_ID\n" +
      "in the web-frontend .env file, and the frontend must be rebuilt.",
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
