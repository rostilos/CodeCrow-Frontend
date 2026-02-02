/**
 * Dashboard routes - require authentication and workspace context
 */

export const DASHBOARD_ROUTES = {
  // Dashboard base (requires workspace)
  DASHBOARD: (workspaceSlug: string) => `/dashboard/${workspaceSlug}`,
  
  // Project routes
  PROJECTS: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/projects`,
  PROJECT_NEW: (workspaceSlug: string) => `/dashboard/${workspaceSlug}/projects/import`,
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
  PROJECT_JOB_DETAIL: (workspaceSlug: string, namespace: string, jobId: string | number, params?: Record<string, string>) => {
    const base = `/dashboard/${workspaceSlug}/projects/${namespace}/jobs/${jobId}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      const queryString = searchParams.toString();
      return queryString ? `${base}?${queryString}` : base;
    }
    return base;
  },
  
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
    projects: () => DASHBOARD_ROUTES.PROJECTS(workspaceSlug),
    projectNew: () => DASHBOARD_ROUTES.PROJECT_NEW(workspaceSlug),
    projectImport: (params?: { connectionId?: string | number; provider?: string; connectionType?: string }) => 
      DASHBOARD_ROUTES.PROJECT_IMPORT(workspaceSlug, params),
    projectSelectRepo: (connectionId: string | number) => 
      DASHBOARD_ROUTES.PROJECT_SELECT_REPO(workspaceSlug, connectionId),
    projectDetail: (namespace: string) => DASHBOARD_ROUTES.PROJECT_DETAIL(workspaceSlug, namespace),
    projectSetup: (namespace: string) => DASHBOARD_ROUTES.PROJECT_SETUP(workspaceSlug, namespace),
    projectSetupSuccess: (namespace: string) => DASHBOARD_ROUTES.PROJECT_SETUP_SUCCESS(workspaceSlug, namespace),
    projectSettings: (namespace: string, tab?: string) => DASHBOARD_ROUTES.PROJECT_SETTINGS(workspaceSlug, namespace, tab),
    branchIssues: (namespace: string, branchName: string, params?: { severity?: string; status?: string; category?: string; filePath?: string }) => 
      DASHBOARD_ROUTES.BRANCH_ISSUES(workspaceSlug, namespace, branchName, params),
    issueDetail: (namespace: string, issueId: string, params?: Record<string, string>) => 
      DASHBOARD_ROUTES.ISSUE_DETAIL(workspaceSlug, namespace, issueId, params),
    projectJobs: (namespace: string) => DASHBOARD_ROUTES.PROJECT_JOBS(workspaceSlug, namespace),
    projectJobDetail: (namespace: string, jobId: string | number, params?: Record<string, string>) => 
      DASHBOARD_ROUTES.PROJECT_JOB_DETAIL(workspaceSlug, namespace, jobId, params),
    userSettings: () => DASHBOARD_ROUTES.USER_SETTINGS(workspaceSlug),
    hostingSettings: () => DASHBOARD_ROUTES.HOSTING_SETTINGS(workspaceSlug),
    hostingAddConnection: () => DASHBOARD_ROUTES.HOSTING_ADD_CONNECTION(workspaceSlug),
    hostingConfigure: (connectionId: string | number) => 
      DASHBOARD_ROUTES.HOSTING_CONFIGURE(workspaceSlug, connectionId),
    hostingGitHubAdd: () => DASHBOARD_ROUTES.HOSTING_GITHUB_ADD(workspaceSlug),
    hostingGitHubConfigure: (connectionId: string | number) => 
      DASHBOARD_ROUTES.HOSTING_GITHUB_CONFIGURE(workspaceSlug, connectionId),
    hostingGitHubCallback: () => DASHBOARD_ROUTES.HOSTING_GITHUB_CALLBACK(workspaceSlug),
    hostingGitLabAdd: () => DASHBOARD_ROUTES.HOSTING_GITLAB_ADD(workspaceSlug),
    hostingGitLabConfigure: (connectionId: string | number) => 
      DASHBOARD_ROUTES.HOSTING_GITLAB_CONFIGURE(workspaceSlug, connectionId),
    hostingSuccess: (provider: string) => DASHBOARD_ROUTES.HOSTING_SUCCESS(workspaceSlug, provider),
    aiSettings: () => DASHBOARD_ROUTES.AI_SETTINGS(workspaceSlug),
    workspaceSettings: () => DASHBOARD_ROUTES.WORKSPACE_SETTINGS(workspaceSlug),
    taskSettings: () => DASHBOARD_ROUTES.TASK_SETTINGS(workspaceSlug),
    qualityGates: () => DASHBOARD_ROUTES.QUALITY_GATES(workspaceSlug),
    billingSettings: () => DASHBOARD_ROUTES.BILLING_SETTINGS(workspaceSlug),
    bitbucketConnectHandshake: () => DASHBOARD_ROUTES.BITBUCKET_CONNECT_HANDSHAKE(workspaceSlug),
  };
}
