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
      "The Backend API URL and Frontend URL must be publicly accessible from the internet.\n" +
      "VCS providers (GitHub, Bitbucket, GitLab) send webhook events to the Backend API URL,\n" +
      "and OAuth redirects use the Frontend URL.\n" +
      "The Webhook Base URL is optional — if your pipeline agent receives webhooks on a\n" +
      "separate domain/port, set it here; otherwise it defaults to the Backend API URL.",
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
      {
        key: "webhook-base-url",
        label: "Webhook Base URL",
        type: "text",
        placeholder: "https://webhooks.yourdomain.com",
        helpText:
          "Public URL that VCS providers (GitHub, Bitbucket, GitLab) send webhook events to. If left empty, defaults to the Backend API URL.",
        required: false,
      },
    ],
  },
  {
    key: "VCS_BITBUCKET",
    label: "Bitbucket",
    description:
      "OAuth credentials for the 1-click Bitbucket Cloud integration. This is optional — see the integration modes below.",
    icon: "GitBranch",
    instructions:
      '⚙️ OPTIONAL — Configuring an app here enables 1-click "Connect with Bitbucket" for all users.\n' +
      "You can skip this entirely and use project-specific keys instead (see Mode C below).\n\n" +
      "━━━ Integration Modes ━━━\n\n" +
      "MODE A — OAuth App (1-Click) ✦ Recommended\n" +
      "Best for: most deployments — users click one button and authorize.\n" +
      "Requires: the Client ID & Secret configured below.\n" +
      "How it works: each user authorizes CodeCrow via standard OAuth 2.0.\n" +
      "Webhooks are created automatically.\n\n" +
      "Setup steps:\n" +
      "1. Go to Bitbucket → Workspace settings → OAuth consumers → Add consumer\n" +
      "2. Set the Callback URL to: {backend-url}/api/integrations/bitbucket-cloud/app/callback\n" +
      "   (replace {backend-url} with your Backend API URL from Base URLs)\n" +
      "3. Grant permissions:\n" +
      "   • Account — Read\n" +
      "   • Repositories — Read\n" +
      "   • Pull requests — Read & Write\n" +
      "   • Webhooks — Read & Write\n" +
      "4. Save and copy the Key (Client ID) and Secret (Client Secret) into the fields below.\n\n" +
      "MODE B — Connect App (Workspace-Level)\n" +
      "Best for: teams that want workspace-wide installation not tied to any single user.\n" +
      "Requires: separate Atlassian Connect descriptor hosted by CodeCrow (SaaS / advanced).\n" +
      "How it works: a Bitbucket workspace admin installs the Connect App;\n" +
      "CodeCrow receives a shared secret and generates tokens with JWT.\n" +
      "Webhooks are created automatically.\n" +
      "Note: this mode is configured via the Connect App descriptor,\n" +
      "NOT through the fields below. Contact your administrator or see the docs.\n\n" +
      "MODE C — Manual OAuth (Project-Specific) ✦ No Admin Config Needed\n" +
      "Best for: users who want full control, or when no admin-level app is configured.\n" +
      "Requires: the user creates their own OAuth Consumer in their Bitbucket workspace.\n" +
      "How it works: during project setup the user provides their own\n" +
      "Client ID + Secret directly in the project connection flow.\n" +
      "Webhooks are created automatically.\n" +
      "Admin settings: not required — leave the fields below empty.",
    fields: [
      {
        key: "client-id",
        label: "Client ID",
        type: "text",
        placeholder: "OAuth consumer key",
        helpText:
          "Only needed for Mode A (1-click). Leave empty if you rely on project-specific keys.",
        required: false,
      },
      {
        key: "client-secret",
        label: "Client Secret",
        type: "password",
        placeholder: "OAuth consumer secret",
        helpText:
          "Only needed for Mode A (1-click). Leave empty if you rely on project-specific keys.",
        required: false,
      },
    ],
  },
  {
    key: "VCS_GITHUB",
    label: "GitHub",
    description:
      "GitHub App credentials for 1-click repository access. This is optional — see the integration modes below.",
    icon: "Github",
    instructions:
      '⚙️ OPTIONAL — Configuring an app here enables 1-click "Connect with GitHub" for all users.\n' +
      "You can skip this entirely and use project-specific keys instead (see Mode C below).\n\n" +
      "━━━ Integration Modes ━━━\n\n" +
      "MODE A — GitHub App ✦ Recommended\n" +
      "Best for: most deployments — users install the app on their org/account,\n" +
      "CodeCrow gets per-repository permissions with automatic webhooks.\n" +
      "Requires: the App ID, Private Key, and Webhook Secret configured below.\n\n" +
      "Setup steps:\n" +
      "1. Go to GitHub → Settings → Developer settings → GitHub Apps → New GitHub App\n" +
      "2. Set Homepage URL to your Frontend URL\n" +
      "3. Set Webhook URL to: {backend-url}/api/github/webhook\n" +
      "   (replace {backend-url} with your Backend API URL from Base URLs)\n" +
      "4. Create a Webhook Secret and enter it in the field below\n" +
      "5. Under Permissions grant:\n" +
      "   • Repository: Contents — Read\n" +
      "   • Repository: Pull requests — Read & Write\n" +
      "   • Repository: Webhooks — Read & Write\n" +
      "   • Repository: Metadata — Read (auto-selected)\n" +
      "6. Subscribe to events: Pull request, Push\n" +
      "7. Save the app, then note the App ID (numeric, shown at the top)\n" +
      "8. Generate a private key (.pem) — download it and upload via the button below\n" +
      "9. Make the app public if you want users outside your org to install it\n" +
      "10. Configure in application.properties (not here):\n" +
      "    • codecrow.github.app.webhook-secret — the webhook secret from step 4\n" +
      "    • codecrow.github.app.slug — URL slug from https://github.com/apps/<slug>\n\n" +
      "MODE B — OAuth App (Legacy)\n" +
      "Best for: simpler setup when you don't need per-repository granularity.\n" +
      "Requires: a GitHub OAuth App Client ID + Secret (configured in application.properties).\n" +
      "How it works: users authorize with their GitHub account via standard OAuth.\n" +
      "Webhooks are created automatically.\n" +
      "Note: this mode uses GitHub OAuth Apps (not GitHub Apps).\n" +
      "The backend falls back to this mode when the GitHub App slug is not configured.\n\n" +
      "MODE C — Manual Webhook / Project-Specific ✦ No Admin Config Needed\n" +
      "Best for: users who want full control, or when no admin-level app is configured.\n" +
      "Requires: the user creates a Personal Access Token (PAT) in GitHub\n" +
      "and configures the webhook URL manually in their repository settings.\n" +
      "Webhook URL format: {webhook-base-url}/api/webhooks/github/{project-auth-token}\n" +
      "Admin settings: not required — leave the fields below empty.",
    fields: [
      {
        key: "app-id",
        label: "App ID",
        type: "text",
        placeholder: "GitHub App ID (numeric)",
        helpText:
          "Only needed for Mode A (GitHub App). Leave empty if you rely on project-specific keys.",
        required: false,
      },
      {
        key: "private-key-path",
        label: "Private Key Path",
        type: "text",
        placeholder: "/app/config/github-app-private-key.pem",
        helpText:
          "Path to the PEM file on the server. Use the Upload button below to upload the key, or specify a path if manually mounted. Only needed for Mode A.",
        required: false,
      },
    ],
  },
  {
    key: "VCS_GITLAB",
    label: "GitLab",
    description:
      "OAuth application credentials for GitLab integration. This is optional — see the integration modes below.",
    icon: "Gitlab",
    instructions:
      '⚙️ OPTIONAL — Configuring an app here enables 1-click "Connect with GitLab" for all users.\n' +
      "You can skip this entirely and use project-specific keys instead (see Modes B/C below).\n\n" +
      "━━━ Integration Modes ━━━\n\n" +
      "MODE A — OAuth Application (1-Click) ✦ Recommended\n" +
      "Best for: most deployments — users click one button and authorize.\n" +
      "Works with both GitLab.com and self-hosted instances.\n" +
      "Requires: the Application ID & Secret configured below.\n\n" +
      "Setup steps:\n" +
      "1. Go to GitLab → User Settings → Applications\n" +
      "   (for self-hosted: Admin Area → Applications)\n" +
      "2. Set the Redirect URI to: {backend-url}/api/auth/gitlab/callback\n" +
      "   (replace {backend-url} with your Backend API URL from Base URLs)\n" +
      "3. Grant scopes: api, read_user, read_repository, write_repository\n" +
      '4. Uncheck "Confidential" if your instance requires it (usually leave checked)\n' +
      "5. Save and copy the Application ID and Secret into the fields below\n\n" +
      "MODE B — Personal Access Token (PAT) ✦ No Admin Config Needed\n" +
      "Best for: individual users or small teams — no OAuth app setup required.\n" +
      "Requires: the user creates a PAT in GitLab → User Settings → Access Tokens.\n" +
      "Required scopes: api, read_user, read_repository, write_repository\n" +
      "How it works: the user provides the token during the project connection flow.\n" +
      "Limitation: webhooks must be configured manually per repository.\n" +
      "Admin settings: not required — leave the fields below empty.\n\n" +
      "MODE C — Repository Token (Project-Specific) ✦ No Admin Config Needed\n" +
      "Best for: fine-grained access scoped to a single repository.\n" +
      "Requires: the user creates a Project Access Token in GitLab →\n" +
      "Repository → Settings → Access Tokens (Maintainer role needed).\n" +
      "Required scopes: api, read_repository, write_repository\n" +
      "How it works: the user provides the token during project setup.\n" +
      "Webhooks are created automatically if the token has Maintainer permissions.\n" +
      "Admin settings: not required — leave the fields below empty.",
    fields: [
      {
        key: "client-id",
        label: "Application ID",
        type: "text",
        placeholder: "GitLab application ID",
        helpText:
          "Only needed for Mode A (OAuth Application). Leave empty if you rely on project-specific tokens.",
        required: false,
      },
      {
        key: "client-secret",
        label: "Application Secret",
        type: "password",
        placeholder: "GitLab application secret",
        helpText:
          "Only needed for Mode A (OAuth Application). Leave empty if you rely on project-specific tokens.",
        required: false,
      },
      {
        key: "base-url",
        label: "GitLab Base URL",
        type: "text",
        placeholder: "https://gitlab.com",
        helpText:
          "For self-hosted GitLab, enter your instance URL. Leave empty or set to https://gitlab.com for GitLab.com.",
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
      "The Google Sign-In button will appear on the login page automatically\n" +
      "once the Client ID is saved here — no frontend rebuild required.",
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
