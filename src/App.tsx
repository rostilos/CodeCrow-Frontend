import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import WorkspaceGuard from "./components/WorkspaceGuard";
import { ThemeProvider } from "./components/ThemeProvider";
const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login/Login.tsx"));
const Register = lazy(() => import("./pages/Login/Register.tsx"));
const DocsLayout = lazy(() => import("./pages/Docs/DocsLayout"));
const GettingStarted = lazy(() => import("./pages/Docs/GettingStarted"));
const CreateWorkspace = lazy(() => import("./pages/Docs/CreateWorkspace"));
const CreateVCSConnection = lazy(() => import("./pages/Docs/CreateVCSConnection"));
const CreateAIConnection = lazy(() => import("./pages/Docs/CreateAIConnection"));
const CreateFirstProject = lazy(() => import("./pages/Docs/CreateFirstProject"));
const GenerateProjectToken = lazy(() => import("./pages/Docs/GenerateProjectToken"));
const SetupBitbucketPipelines = lazy(() => import("./pages/Docs/SetupBitbucketPipelines"));
const CreatePullRequest = lazy(() => import("./pages/Docs/CreatePullRequest"));
const FAQ = lazy(() => import("./pages/Docs/FAQ"));
const BitbucketAppInstall = lazy(() => import("./pages/Docs/BitbucketAppInstall"));
// Developer Documentation
const DevArchitecture = lazy(() => import("./pages/Docs/Developer/Architecture"));
const DevConfiguration = lazy(() => import("./pages/Docs/Developer/Configuration"));
const DevAPIReference = lazy(() => import("./pages/Docs/Developer/APIReference"));
const DevDatabaseSchema = lazy(() => import("./pages/Docs/Developer/DatabaseSchema"));
const DevModules = lazy(() => import("./pages/Docs/Developer/Modules"));
const DevDeployment = lazy(() => import("./pages/Docs/Developer/Deployment"));
const DevDevelopmentGuide = lazy(() => import("./pages/Docs/Developer/DevelopmentGuide"));
const DevTroubleshooting = lazy(() => import("./pages/Docs/Developer/Troubleshooting"));
const DevSMTPSetup = lazy(() => import("./pages/Docs/Developer/SMTPSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const ProjectSetupInstructions = lazy(() => import("./pages/Account/Project/ProjectSetupInstructions.tsx"));
const WorkspaceManagementPage = lazy(() => import("./pages/Account/Workspace/WorkspaceManagement.tsx"));
const ProjectSettings = lazy(() => import("./pages/Account/Project/ProjectSettings.tsx"));
const ProjectManagement = lazy(() => import("./pages/Account/Project/ProjectManagement.tsx"));
const ProjectConfiguration = lazy(() => import("./pages/Account/Project/ProjectConfiguration.tsx"));
const UserSettings = lazy(() => import("./pages/Account/UserSettings/UserSettings.tsx"));
const HostingSettings = lazy(() => import("./pages/Account/CodeHosting/bitbucket/HostingSettings.tsx"));
const AddConnection = lazy(() => import("./pages/Account/CodeHosting/bitbucket/AddConnection.tsx"));
const ConfigureConnection = lazy(() => import("./pages/Account/CodeHosting/bitbucket/ConfigureConnection.tsx"));
const TaskSettings = lazy(() => import("./pages/Account/TaskSettings/TaskSettings.tsx"));
const AISettings = lazy(() => import("./pages/Account/AI/AISettings.tsx"));
const NewProjectPage = lazy(() => import("./pages/Account/Project/NewProject.tsx"));
const SelectRepoPage = lazy(() => import("./pages/Account/Project/SelectRepo.tsx"));
const ImportProjectPage = lazy(() => import("./pages/Account/Project/ImportProject.tsx"));
const BillingSettings = lazy(() => import("./pages/Account/Billing/BillingSettings.tsx"));
const WorkspaceSelection = lazy(() => import("./pages/WorkspaceSelection.tsx"));
const ProjectDashboard = lazy(() => import("./pages/ProjectDashboard.tsx"));
const IssueDetails = lazy(() => import("./pages/Account/Project/IssueDetails.tsx"));
const BranchIssues = lazy(() => import("./pages/Account/Project/BranchIssues.tsx"));
const IntegrationSuccess = lazy(() => import("./pages/Account/Integrations/IntegrationSuccess.tsx"));
const JobsPage = lazy(() => import("./pages/Jobs/JobsPage.tsx"));
const JobDetailPage = lazy(() => import("./pages/Jobs/JobDetailPage.tsx"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="codecrow-ui-theme">
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
              <p className="text-muted-foreground animate-pulse">Loading...</p>
            </div>
          </div>
        }>
              <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/docs" element={<DocsLayout />}>
            <Route index element={<GettingStarted />} />
            <Route path="workspace" element={<CreateWorkspace />} />
            <Route path="vcs-connection" element={<CreateVCSConnection />} />
            <Route path="ai-connection" element={<CreateAIConnection />} />
            <Route path="first-project" element={<CreateFirstProject />} />
            <Route path="project-token" element={<GenerateProjectToken />} />
            <Route path="bitbucket-pipelines" element={<SetupBitbucketPipelines />} />
            <Route path="pull-request" element={<CreatePullRequest />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="bitbucket-app-install" element={<BitbucketAppInstall />} />
            {/* Developer Documentation */}
            <Route path="dev/architecture" element={<DevArchitecture />} />
            <Route path="dev/configuration" element={<DevConfiguration />} />
            <Route path="dev/smtp" element={<DevSMTPSetup />} />
            <Route path="dev/api" element={<DevAPIReference />} />
            <Route path="dev/database" element={<DevDatabaseSchema />} />
            <Route path="dev/modules" element={<DevModules />} />
            <Route path="dev/deployment" element={<DevDeployment />} />
            <Route path="dev/development" element={<DevDevelopmentGuide />} />
            <Route path="dev/troubleshooting" element={<DevTroubleshooting />} />
          </Route>
          <Route path="/workspace" element={
            <ProtectedRoute>
              <WorkspaceProvider>
                <WorkspaceSelection />
              </WorkspaceProvider>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <WorkspaceProvider>
                <WorkspaceGuard>
                  <Routes>
                    <Route path="/" element={<DashboardLayout />}>
                      <Route path="projects" element={<ProjectManagement />} />
                      <Route path="projects/new" element={<NewProjectPage />} />
                      <Route path="projects/new/select-repo/:connectionId" element={<SelectRepoPage />} />
                      <Route path="projects/import" element={<ImportProjectPage />} />
                      <Route path="projects/:namespace" element={<ProjectDashboard />} />
                      <Route path="projects/:namespace/setup" element={<ProjectSetupInstructions />} />
                      <Route path="projects/:namespace/branches/:branchName/issues" element={<BranchIssues />} />
                      <Route path="projects/:namespace/issues/:issueId" element={<IssueDetails />} />
                      <Route path="projects/:namespace/settings" element={<ProjectConfiguration />} />
                      <Route path="projects/:namespace/jobs" element={<JobsPage />} />
                      <Route path="projects/:namespace/jobs/:jobId" element={<JobDetailPage />} />
                      <Route path="user" element={<UserSettings />} />
                      <Route path="hosting" element={<HostingSettings />} />
                      <Route path="hosting/add-connection" element={<AddConnection />} />
                      <Route path="hosting/configure/:connectionId" element={<ConfigureConnection />} />
                      <Route path="ai" element={<AISettings />} />
                      <Route path="workspace" element={<WorkspaceManagementPage />} />
                      <Route path="tasks" element={<TaskSettings />} />
                      <Route path="billing" element={<BillingSettings />} />
                      <Route path="hosting/:provider/success" element={<IntegrationSuccess />} />
                    </Route>
                  </Routes>
                </WorkspaceGuard>
              </WorkspaceProvider>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
          </Suspense>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
