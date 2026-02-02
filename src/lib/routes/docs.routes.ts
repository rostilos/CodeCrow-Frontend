/**
 * Documentation routes
 */

export const DOCS_ROUTES = {
  INDEX: '/docs',
  CAPABILITIES: '/docs/capabilities',
  WORKSPACE: '/docs/workspace',
  VCS_CONNECTION: '/docs/vcs-connection',
  VCS_BITBUCKET: '/docs/vcs-connection/bitbucket',
  VCS_GITHUB: '/docs/vcs-connection/github',
  VCS_GITLAB: '/docs/vcs-connection/gitlab',
  AI_CONNECTION: '/docs/ai-connection',
  FIRST_PROJECT: '/docs/first-project',
  SETUP_RAG: '/docs/setup-rag',
  PROJECT_TOKEN: '/docs/project-token',
  PIPELINE_SETUP: '/docs/pipeline-setup',
  PULL_REQUEST: '/docs/pull-request',
  FAQ: '/docs/faq',
  
  // Admin
  ADMIN_PROJECT: '/docs/admin/project',
  ADMIN_PROJECT_GENERAL: '/docs/admin/project/general',
  ADMIN_PROJECT_HOSTING: '/docs/admin/project/hosting',
  ADMIN_PROJECT_BRANCHES: '/docs/admin/project/branches',
  ADMIN_PROJECT_SCOPE: '/docs/admin/project/scope',
  ADMIN_PROJECT_AI: '/docs/admin/project/ai',
  ADMIN_PROJECT_RAG: '/docs/admin/project/rag',
  ADMIN_PROJECT_TASKS: '/docs/admin/project/tasks',
  ADMIN_PROJECT_ACTIVITY: '/docs/admin/project/activity',
  ADMIN_PROJECT_DANGER: '/docs/admin/project/danger',
  ADMIN_WORKSPACE: '/docs/admin/workspace',
  
  // RAG Guide
  RAG_OVERVIEW: '/docs/rag/overview',
  RAG_SETUP: '/docs/rag/setup',
  RAG_LIMITATIONS: '/docs/rag/limitations',
  
  // Commands
  COMMANDS_OVERVIEW: '/docs/commands/overview',
  COMMANDS_ANALYZE: '/docs/commands/analyze',
  COMMANDS_SUMMARIZE: '/docs/commands/summarize',
  COMMANDS_ASK: '/docs/commands/ask',
  
  // Developer
  DEV_ARCHITECTURE: '/docs/dev/architecture',
  DEV_SELF_HOSTING: '/docs/dev/self-hosting',
  DEV_CONFIGURATION: '/docs/dev/configuration',
  DEV_PIPELINE_AGENT: '/docs/dev/pipeline-agent',
  DEV_WEB_SERVER: '/docs/dev/web-server',
  DEV_MCP_CLIENT: '/docs/dev/mcp-client',
  DEV_RAG_PIPELINE: '/docs/dev/rag-pipeline',
  DEV_JOBS: '/docs/dev/jobs',
  DEV_SMTP: '/docs/dev/smtp',
  DEV_API: '/docs/dev/api',
  DEV_DATABASE: '/docs/dev/database',
  DEV_MODULES: '/docs/dev/modules',
  DEV_DEPLOYMENT: '/docs/dev/deployment',
  DEV_DEVELOPMENT: '/docs/dev/development',
  DEV_TROUBLESHOOTING: '/docs/dev/troubleshooting',
} as const;
