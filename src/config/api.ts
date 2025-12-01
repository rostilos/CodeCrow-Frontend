// API Configuration
const BACKEND_URL = import.meta.env.VITE_API_URL;

export const API_CONFIG = {
  // Replace this with your actual Java server URL
  BASE_URL: BACKEND_URL,
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    GOOGLE_AUTH: '/auth/google',
    GET_USER_DATA: '/user_info/current',
    SAVE_USER_DATA: '/user_info/update',
    CHANGE_PASSWORD: '/user_info/change-password',
    PROJECT: {
      LIST: '/project/project_list',
      CREATE: '/project/create',
      UPDATE: '/project/:projectId',
      DELETE: '/project/:projectId',
      BIND_REPOSITORY: '/project/:projectId/repository/bind',
      UNBIND_REPOSITORY: '/project/:projectId/repository/unbind',
      UPDATE_REPOSITORY_SETTINGS: '/project/:projectId/repository/settings',
      BRANCHES: '/project/:projectId/branches',
      SET_DEFAULT_BRANCH: '/project/:projectId/default-branch'
    },
    CODE_HOSTING : {
      CREATE_BITBUCKET_CONNECTION: '/git/bitbucket_cloud/create',
      GET_USER_BITBUCKET_CONNECTIONS: '/git/bitbucket_cloud/list',
      GET_USER_BITBUCKET_CONNECTION_DETAILS: '/git/bitbucket_cloud/connections/:connectionId',
      UPDATE_BITBUCKET_CONNECTION: '/git/bitbucket_cloud/connections/:connectionId',
      DELETE_BITBUCKET_CONNECTION: '/git/bitbucket_cloud/connections/:connectionId',
      GET_BITBUCKET_CONNECTION_REPOSITORIES: '/git/bitbucket_cloud/:connectionId/repositories'
    },
    ANALYSIS: {
      TRENDS: '/projects/:projectId/analysis/trends/resolved',
      PULL_REQUESTS_BY_BRANCH: '/project/:projectId/pull-requests/by-branch',
      BRANCH_ISSUES: '/project/:projectId/pull-requests/branches/:branchName/issues'
    }
  },
} as const;

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
