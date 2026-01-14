/**
 * Centralized route utilities for workspace-aware URL generation.
 * All dashboard routes should use these functions to ensure workspace is included in URLs.
 */

// Route path constants
export const ROUTES = {
  // Public routes (no workspace needed)
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DOCS: '/docs',
  WORKSPACE_SELECTION: '/workspace',

  // Dashboard base (requires workspace)
  DASHBOARD: (workspaceSlug: string) => `/dashboard/${workspaceSlug}`,
  
  // Project routes
  PROJECTS: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/projects`,
  PROJECT_NEW: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/projects/import`, // Redirect to unified import flow
  PROJECT_IMPORT: (workspaceSlug: string, params?: { connectionId?: string | number; provider?: string; connectionType?: string }) => {
    const base = `/dashboard/${workspaceSlug}/projects/import`;
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.connectionId) searchParams.set('connectionId', String(params.connectionId));
      if (params.provider) searchParams.set('provider', params.provider);
      if (params.connectionType) searchParams.set('connectionType', params.connectionType);
      const queryString = searchParams.toString();
      return queryString ? `${base}?${queryString}` : base;
    }
    return base;
  },
  PROJECT_SELECT_REPO: (workspaceSlug: string, connectionId: string | number) => 
    `/dashboard/${workspaceSlug}/projects/new/select-repo/${connectionId}`,
  PROJECT_DETAIL: (workspaceSlug: string, namespace: string) => 
    `/dashboard/${workspaceSlug}/projects/${namespace}`,
  PROJECT_SETUP: (workspaceSlug: string, namespace: string) => 
    `/dashboard/${workspaceSlug}/projects/${namespace}/setup`,
  PROJECT_SETUP_SUCCESS: (workspaceSlug: string, namespace: string) => 
    `/dashboard/${workspaceSlug}/projects/${namespace}/setup/success`,
  PROJECT_SETTINGS: (workspaceSlug: string, namespace: string, tab?: string) => {
    const base = `/dashboard/${workspaceSlug}/projects/${namespace}/settings`;
    return tab ? `${base}?tab=${tab}` : base;
  },
  
  // Branch/Issue routes
  BRANCH_ISSUES: (workspaceSlug: string, namespace: string, branchName: string, params?: { severity?: string; status?: string; category?: string; filePath?: string }) => {
    const base = `/dashboard/${workspaceSlug}/projects/${namespace}/branches/${encodeURIComponent(branchName)}/issues`;
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.severity) searchParams.set('severity', params.severity);
      if (params.status) searchParams.set('status', params.status);
      if (params.category) searchParams.set('category', params.category);
      if (params.filePath) searchParams.set('filePath', params.filePath);
      const queryString = searchParams.toString();
      return queryString ? `${base}?${queryString}` : base;
    }
    return base;
  },
  ISSUE_DETAIL: (workspaceSlug: string, namespace: string, issueId: string, params?: Record<string, string>) => {
    const base = `/dashboard/${workspaceSlug}/projects/${namespace}/issues/${issueId}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      const queryString = searchParams.toString();
      return queryString ? `${base}?${queryString}` : base;
    }
    return base;
  },
  
  // Job routes
  PROJECT_JOBS: (workspaceSlug: string, namespace: string) => 
    `/dashboard/${workspaceSlug}/projects/${namespace}/jobs`,
  PROJECT_JOB_DETAIL: (workspaceSlug: string, namespace: string, jobId: string | number) => 
    `/dashboard/${workspaceSlug}/projects/${namespace}/jobs/${jobId}`,
  
  // Settings routes
  USER_SETTINGS: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/user`,
  HOSTING_SETTINGS: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/hosting`,
  HOSTING_ADD_CONNECTION: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/hosting/add-connection`,
  HOSTING_CONFIGURE: (workspaceSlug: string, connectionId: string | number) => 
    `/dashboard/${workspaceSlug}/hosting/configure/${connectionId}`,
  HOSTING_GITHUB_ADD: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/hosting/github/add-connection`,
  HOSTING_GITHUB_CONFIGURE: (workspaceSlug: string, connectionId: string | number) => 
    `/dashboard/${workspaceSlug}/hosting/github/configure/${connectionId}`,
  HOSTING_GITHUB_CALLBACK: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/hosting/github/callback`,
  HOSTING_GITLAB_ADD: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/hosting/gitlab/add-connection`,
  HOSTING_GITLAB_CONFIGURE: (workspaceSlug: string, connectionId: string | number) => 
    `/dashboard/${workspaceSlug}/hosting/gitlab/configure/${connectionId}`,
  HOSTING_SUCCESS: (workspaceSlug: string, provider: string) => 
    `/dashboard/${workspaceSlug}/hosting/${provider}/success`,
  AI_SETTINGS: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/ai`,
  WORKSPACE_SETTINGS: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/workspace`,
  TASK_SETTINGS: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/tasks`,
  QUALITY_GATES: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/quality-gates`,
  BILLING_SETTINGS: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/billing`,
  
  // Integration routes
  BITBUCKET_CONNECT_HANDSHAKE: (workspaceSlug: string) => 
    `/dashboard/${workspaceSlug}/integrations/bitbucket/connect`,
} as const;

/**
 * Hook-friendly helper to create route functions bound to current workspace
 */
export function createWorkspaceRoutes(workspaceSlug: string) {
  return {
    projects: () => ROUTES.PROJECTS(workspaceSlug),
    projectNew: () => ROUTES.PROJECT_NEW(workspaceSlug),
    projectImport: (params?: { connectionId?: string | number; provider?: string; connectionType?: string }) => 
      ROUTES.PROJECT_IMPORT(workspaceSlug, params),
    projectSelectRepo: (connectionId: string | number) => 
      ROUTES.PROJECT_SELECT_REPO(workspaceSlug, connectionId),
    projectDetail: (namespace: string) => ROUTES.PROJECT_DETAIL(workspaceSlug, namespace),
    projectSetup: (namespace: string) => ROUTES.PROJECT_SETUP(workspaceSlug, namespace),
    projectSetupSuccess: (namespace: string) => ROUTES.PROJECT_SETUP_SUCCESS(workspaceSlug, namespace),
    projectSettings: (namespace: string, tab?: string) => ROUTES.PROJECT_SETTINGS(workspaceSlug, namespace, tab),
    branchIssues: (namespace: string, branchName: string, params?: { severity?: string; status?: string; category?: string; filePath?: string }) => 
      ROUTES.BRANCH_ISSUES(workspaceSlug, namespace, branchName, params),
    issueDetail: (namespace: string, issueId: string, params?: Record<string, string>) => 
      ROUTES.ISSUE_DETAIL(workspaceSlug, namespace, issueId, params),
    projectJobs: (namespace: string) => ROUTES.PROJECT_JOBS(workspaceSlug, namespace),
    projectJobDetail: (namespace: string, jobId: string | number) => 
      ROUTES.PROJECT_JOB_DETAIL(workspaceSlug, namespace, jobId),
    userSettings: () => ROUTES.USER_SETTINGS(workspaceSlug),
    hostingSettings: () => ROUTES.HOSTING_SETTINGS(workspaceSlug),
    hostingAddConnection: () => ROUTES.HOSTING_ADD_CONNECTION(workspaceSlug),
    hostingConfigure: (connectionId: string | number) => 
      ROUTES.HOSTING_CONFIGURE(workspaceSlug, connectionId),
    hostingGitHubAdd: () => ROUTES.HOSTING_GITHUB_ADD(workspaceSlug),
    hostingGitHubConfigure: (connectionId: string | number) => 
      ROUTES.HOSTING_GITHUB_CONFIGURE(workspaceSlug, connectionId),
    hostingGitHubCallback: () => ROUTES.HOSTING_GITHUB_CALLBACK(workspaceSlug),
    hostingGitLabAdd: () => ROUTES.HOSTING_GITLAB_ADD(workspaceSlug),
    hostingGitLabConfigure: (connectionId: string | number) => 
      ROUTES.HOSTING_GITLAB_CONFIGURE(workspaceSlug, connectionId),
    hostingSuccess: (provider: string) => ROUTES.HOSTING_SUCCESS(workspaceSlug, provider),
    aiSettings: () => ROUTES.AI_SETTINGS(workspaceSlug),
    workspaceSettings: () => ROUTES.WORKSPACE_SETTINGS(workspaceSlug),
    taskSettings: () => ROUTES.TASK_SETTINGS(workspaceSlug),
    qualityGates: () => ROUTES.QUALITY_GATES(workspaceSlug),
    billingSettings: () => ROUTES.BILLING_SETTINGS(workspaceSlug),
    bitbucketConnectHandshake: () => ROUTES.BITBUCKET_CONNECT_HANDSHAKE(workspaceSlug),
  };
}

/**
 * Extract workspace slug from current URL path
 */
export function extractWorkspaceFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Check if a path is a dashboard path that requires workspace
 */
export function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard');
}
