import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import WorkspaceGuard from "./components/WorkspaceGuard";
import { ThemeProvider } from "./components/ThemeProvider";
import { FEATURES } from "./config/features";
import { CROSS_LINKS } from "./lib/domains";
const queryClient = new QueryClient();

/**
 * Redirect /docs/* routes to codecrow.app/docs/*
 * Docs now live on the static site.
 */
function DocsRedirect() {
  React.useEffect(() => {
    const subpath = window.location.pathname.replace(/^\/docs\/?/, "");
    window.location.href = `${CROSS_LINKS.docs}${subpath ? `/${subpath}` : ""}`;
  }, []);
  return null;
}

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login/Login.tsx"));
const Register = lazy(() => import("./pages/Login/Register.tsx"));
const ForgotPassword = lazy(() => import("./pages/Login/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/Login/ResetPassword.tsx"));

const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const ProjectSetupInstructions = lazy(
  () => import("./pages/Account/Project/ProjectSetupInstructions.tsx"),
);
const ProjectSetupSuccess = lazy(
  () => import("./pages/Account/Project/new/ProjectSetupSuccess.tsx"),
);
const WorkspaceManagementPage = lazy(
  () => import("./pages/Account/Workspace/WorkspaceManagement.tsx"),
);
const ProjectSettings = lazy(
  () => import("./pages/Account/Project/ProjectSettings.tsx"),
);
const ProjectManagement = lazy(
  () => import("./pages/Account/Project/ProjectManagement.tsx"),
);
const ProjectConfiguration = lazy(
  () => import("./pages/Account/Project/ProjectConfiguration.tsx"),
);
const UserSettings = lazy(
  () => import("./pages/Account/UserSettings/UserSettings.tsx"),
);
const HostingSettings = lazy(
  () => import("./pages/Account/CodeHosting/bitbucket/HostingSettings.tsx"),
);
const AddConnection = lazy(
  () => import("./pages/Account/CodeHosting/bitbucket/AddConnection.tsx"),
);
const ConfigureConnection = lazy(
  () => import("./pages/Account/CodeHosting/bitbucket/ConfigureConnection.tsx"),
);
const GitHubAddConnection = lazy(
  () => import("./pages/Account/CodeHosting/github/AddConnection.tsx"),
);
const GitHubConfigureConnection = lazy(
  () => import("./pages/Account/CodeHosting/github/ConfigureConnection.tsx"),
);
const GitHubOAuthCallback = lazy(
  () => import("./pages/Account/CodeHosting/github/OAuthCallback.tsx"),
);
const GitLabAddConnection = lazy(
  () => import("./pages/Account/CodeHosting/gitlab/AddConnection.tsx"),
);
const TaskSettings = lazy(
  () => import("./pages/Account/TaskSettings/TaskSettings.tsx"),
);
const AISettings = lazy(() => import("./pages/Account/AI/AISettings.tsx"));
const NewProjectPage = lazy(
  () => import("./pages/Account/Project/new/NewProject.tsx"),
);
const SelectRepoPage = lazy(
  () => import("./pages/Account/Project/SelectRepo.tsx"),
);
const ImportProjectPage = lazy(
  () => import("./pages/Account/Project/ImportProject.tsx"),
);
const BillingSettings = lazy(
  () => import("./pages/Account/Billing/BillingSettings.tsx"),
);
const WorkspaceSelection = lazy(() => import("./pages/WorkspaceSelection.tsx"));
const ProjectDashboard = lazy(() => import("./pages/ProjectDashboard.tsx"));
const IssueDetails = lazy(
  () => import("./pages/Account/Project/IssueDetails.tsx"),
);
const BranchIssues = lazy(
  () => import("./pages/Account/Project/BranchIssues.tsx"),
);
const IntegrationSuccess = lazy(
  () => import("./pages/Account/Integrations/IntegrationSuccess.tsx"),
);
const BitbucketConnectHandshake = lazy(
  () => import("./pages/Account/Integrations/BitbucketConnectHandshake.tsx"),
);
const JobsPage = lazy(() => import("./pages/Jobs/JobsPage.tsx"));
const JobDetailPage = lazy(() => import("./pages/Jobs/JobDetailPage.tsx"));
const QualityGatesPage = lazy(
  () => import("./pages/QualityGates/QualityGatesPage.tsx"),
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="codecrow-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-muted-foreground animate-pulse">
                    Loading...
                  </p>
                </div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Docs now live on codecrow.app — redirect */}
              <Route path="/docs/*" element={<DocsRedirect />} />
              <Route path="/docs" element={<DocsRedirect />} />
              <Route
                path="/workspace"
                element={
                  <ProtectedRoute>
                    <WorkspaceProvider>
                      <WorkspaceSelection />
                    </WorkspaceProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/:workspaceSlug/*"
                element={
                  <ProtectedRoute>
                    <WorkspaceProvider>
                      <WorkspaceGuard>
                        <Routes>
                          <Route path="/" element={<DashboardLayout />}>
                            <Route
                              path="projects"
                              element={<ProjectManagement />}
                            />
                            <Route
                              path="projects/new"
                              element={<NewProjectPage />}
                            />
                            <Route
                              path="projects/new/select-repo/:connectionId"
                              element={<SelectRepoPage />}
                            />
                            <Route
                              path="projects/import"
                              element={<ImportProjectPage />}
                            />
                            <Route
                              path="projects/:namespace"
                              element={<ProjectDashboard />}
                            />
                            <Route
                              path="projects/:namespace/setup"
                              element={<ProjectSetupInstructions />}
                            />
                            <Route
                              path="projects/:namespace/setup/success"
                              element={<ProjectSetupSuccess />}
                            />
                            <Route
                              path="projects/:namespace/branches/:branchName/issues"
                              element={<BranchIssues />}
                            />
                            <Route
                              path="projects/:namespace/issues/:issueId"
                              element={<IssueDetails />}
                            />
                            <Route
                              path="projects/:namespace/settings"
                              element={<ProjectConfiguration />}
                            />
                            <Route
                              path="projects/:namespace/jobs"
                              element={<JobsPage />}
                            />
                            <Route
                              path="projects/:namespace/jobs/:jobId"
                              element={<JobDetailPage />}
                            />
                            <Route path="user" element={<UserSettings />} />
                            <Route
                              path="hosting"
                              element={<HostingSettings />}
                            />
                            <Route
                              path="hosting/add-connection"
                              element={<AddConnection />}
                            />
                            <Route
                              path="hosting/configure/:connectionId"
                              element={<ConfigureConnection />}
                            />
                            <Route
                              path="hosting/github/add-connection"
                              element={<GitHubAddConnection />}
                            />
                            <Route
                              path="hosting/github/configure/:connectionId"
                              element={<GitHubConfigureConnection />}
                            />
                            <Route
                              path="hosting/github/callback"
                              element={<GitHubOAuthCallback />}
                            />
                            <Route
                              path="hosting/gitlab/add-connection"
                              element={<GitLabAddConnection />}
                            />
                            <Route path="ai" element={<AISettings />} />
                            <Route
                              path="workspace"
                              element={<WorkspaceManagementPage />}
                            />
                            <Route path="tasks" element={<TaskSettings />} />
                            <Route
                              path="quality-gates"
                              element={<QualityGatesPage />}
                            />
                            {/* Billing route only available when feature is enabled */}
                            {FEATURES.BILLING && (
                              <Route
                                path="billing"
                                element={<BillingSettings />}
                              />
                            )}
                            <Route
                              path="hosting/:provider/success"
                              element={<IntegrationSuccess />}
                            />
                            <Route
                              path="integrations/bitbucket/connect"
                              element={<BitbucketConnectHandshake />}
                            />
                          </Route>
                        </Routes>
                      </WorkspaceGuard>
                    </WorkspaceProvider>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
