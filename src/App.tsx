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
const ForgotPassword = lazy(() => import("./pages/Login/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/Login/ResetPassword.tsx"));
const DocsLayout = lazy(() => import("./pages/Docs/DocsLayout"));
const GettingStarted = lazy(() => import("./pages/Docs/GettingStarted"));
const CreateWorkspace = lazy(() => import("./pages/Docs/CreateWorkspace"));
const CreateVCSConnection = lazy(() => import("./pages/Docs/CreateVCSConnection"));
const CreateAIConnection = lazy(() => import("./pages/Docs/CreateAIConnection"));
const CreateFirstProject = lazy(() => import("./pages/Docs/CreateFirstProject"));
const GenerateProjectToken = lazy(() => import("./pages/Docs/GenerateProjectToken"));
const SetupPipelines = lazy(() => import("./pages/Docs/SetupPipelines"));
const SetupRAG = lazy(() => import("./pages/Docs/SetupRAG"));
const CreatePullRequest = lazy(() => import("./pages/Docs/CreatePullRequest"));
const FAQ = lazy(() => import("./pages/Docs/FAQ"));
const PlatformSupport = lazy(() => import("./pages/Docs/PlatformSupport"));
const VCSBitbucket = lazy(() => import("./pages/Docs/VCS/Bitbucket"));
const VCSGitHub = lazy(() => import("./pages/Docs/VCS/GitHub"));
const VCSGitLab = lazy(() => import("./pages/Docs/VCS/GitLab"));
const ProjectAdministration = lazy(() => import("./pages/Docs/ProjectAdministration"));
const ProjectAdminGeneral = lazy(() => import("./pages/Docs/ProjectAdmin/General"));
const ProjectAdminHosting = lazy(() => import("./pages/Docs/ProjectAdmin/CodeHosting"));
const ProjectAdminBranches = lazy(() => import("./pages/Docs/ProjectAdmin/Branches"));
const ProjectAdminScope = lazy(() => import("./pages/Docs/ProjectAdmin/AnalysisScope"));
const ProjectAdminAI = lazy(() => import("./pages/Docs/ProjectAdmin/AIConnections"));
const ProjectAdminRAG = lazy(() => import("./pages/Docs/ProjectAdmin/RAGIndexing"));
const ProjectAdminTasks = lazy(() => import("./pages/Docs/ProjectAdmin/TaskManagement"));
const ProjectAdminDanger = lazy(() => import("./pages/Docs/ProjectAdmin/DangerZone"));
const ProjectAdminActivity = lazy(() => import("./pages/Docs/ProjectAdmin/Activity"));
const WorkspaceAdministration = lazy(() => import("./pages/Docs/WorkspaceAdministration"));
const RAGOverview = lazy(() => import("./pages/Docs/RAG/RAGOverview"));
const RAGProjectSetup = lazy(() => import("./pages/Docs/RAG/RAGProjectSetup"));
const RAGLimitations = lazy(() => import("./pages/Docs/RAG/RAGLimitations"));

// Interactive Commands
const CommandsOverview = lazy(() => import("./pages/Docs/InteractiveCommands/Overview"));
const CommandAnalyze = lazy(() => import("./pages/Docs/InteractiveCommands/Analyze"));
const CommandSummarize = lazy(() => import("./pages/Docs/InteractiveCommands/Summarize"));
const CommandAsk = lazy(() => import("./pages/Docs/InteractiveCommands/Ask"));

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
const ProjectSetupSuccess = lazy(() => import("./pages/Account/Project/new/ProjectSetupSuccess.tsx"));
const WorkspaceManagementPage = lazy(() => import("./pages/Account/Workspace/WorkspaceManagement.tsx"));
const ProjectSettings = lazy(() => import("./pages/Account/Project/ProjectSettings.tsx"));
const ProjectManagement = lazy(() => import("./pages/Account/Project/ProjectManagement.tsx"));
const ProjectConfiguration = lazy(() => import("./pages/Account/Project/ProjectConfiguration.tsx"));
const UserSettings = lazy(() => import("./pages/Account/UserSettings/UserSettings.tsx"));
const HostingSettings = lazy(() => import("./pages/Account/CodeHosting/bitbucket/HostingSettings.tsx"));
const AddConnection = lazy(() => import("./pages/Account/CodeHosting/bitbucket/AddConnection.tsx"));
const ConfigureConnection = lazy(() => import("./pages/Account/CodeHosting/bitbucket/ConfigureConnection.tsx"));
const GitHubAddConnection = lazy(() => import("./pages/Account/CodeHosting/github/AddConnection.tsx"));
const GitHubConfigureConnection = lazy(() => import("./pages/Account/CodeHosting/github/ConfigureConnection.tsx"));
const GitHubOAuthCallback = lazy(() => import("./pages/Account/CodeHosting/github/OAuthCallback.tsx"));
const GitLabAddConnection = lazy(() => import("./pages/Account/CodeHosting/gitlab/AddConnection.tsx"));
const TaskSettings = lazy(() => import("./pages/Account/TaskSettings/TaskSettings.tsx"));
const AISettings = lazy(() => import("./pages/Account/AI/AISettings.tsx"));
const NewProjectPage = lazy(() => import("./pages/Account/Project/new/NewProject.tsx"));
const SelectRepoPage = lazy(() => import("./pages/Account/Project/SelectRepo.tsx"));
const ImportProjectPage = lazy(() => import("./pages/Account/Project/ImportProject.tsx"));
const BillingSettings = lazy(() => import("./pages/Account/Billing/BillingSettings.tsx"));
const WorkspaceSelection = lazy(() => import("./pages/WorkspaceSelection.tsx"));
const ProjectDashboard = lazy(() => import("./pages/ProjectDashboard.tsx"));
const IssueDetails = lazy(() => import("./pages/Account/Project/IssueDetails.tsx"));
const BranchIssues = lazy(() => import("./pages/Account/Project/BranchIssues.tsx"));
const IntegrationSuccess = lazy(() => import("./pages/Account/Integrations/IntegrationSuccess.tsx"));
const BitbucketConnectHandshake = lazy(() => import("./pages/Account/Integrations/BitbucketConnectHandshake.tsx"));
const JobsPage = lazy(() => import("./pages/Jobs/JobsPage.tsx"));
const JobDetailPage = lazy(() => import("./pages/Jobs/JobDetailPage.tsx"));
const QualityGatesPage = lazy(() => import("./pages/QualityGates/QualityGatesPage.tsx"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="codecrow-ui-theme">
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
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/docs" element={<DocsLayout />}>
                <Route index element={<GettingStarted />} />
                <Route path="capabilities" element={<PlatformSupport />} />
                <Route path="workspace" element={<CreateWorkspace />} />
                <Route path="vcs-connection" element={<CreateVCSConnection />} />
                <Route path="vcs-connection/bitbucket" element={<VCSBitbucket />} />
                <Route path="vcs-connection/github" element={<VCSGitHub />} />
                <Route path="vcs-connection/gitlab" element={<VCSGitLab />} />
                <Route path="ai-connection" element={<CreateAIConnection />} />
                <Route path="first-project" element={<CreateFirstProject />} />
                <Route path="setup-rag" element={<SetupRAG />} />
                <Route path="project-token" element={<GenerateProjectToken />} />
                <Route path="pipeline-setup" element={<SetupPipelines />} />
                <Route path="pull-request" element={<CreatePullRequest />} />
                <Route path="faq" element={<FAQ />} />

                <Route path="admin/project" element={<ProjectAdministration />} />
                <Route path="admin/project/general" element={<ProjectAdminGeneral />} />
                <Route path="admin/project/hosting" element={<ProjectAdminHosting />} />
                <Route path="admin/project/branches" element={<ProjectAdminBranches />} />
                <Route path="admin/project/scope" element={<ProjectAdminScope />} />
                <Route path="admin/project/ai" element={<ProjectAdminAI />} />
                <Route path="admin/project/rag" element={<ProjectAdminRAG />} />
                <Route path="admin/project/tasks" element={<ProjectAdminTasks />} />
                <Route path="admin/project/activity" element={<ProjectAdminActivity />} />
                <Route path="admin/project/danger" element={<ProjectAdminDanger />} />
                <Route path="admin/workspace" element={<WorkspaceAdministration />} />

                {/* RAG Guide Routes */}
                <Route path="rag/overview" element={<RAGOverview />} />
                <Route path="rag/setup" element={<RAGProjectSetup />} />
                <Route path="rag/limitations" element={<RAGLimitations />} />

                {/* Interactive Commands */}
                <Route path="commands/overview" element={<CommandsOverview />} />
                <Route path="commands/analyze" element={<CommandAnalyze />} />
                <Route path="commands/summarize" element={<CommandSummarize />} />
                <Route path="commands/ask" element={<CommandAsk />} />
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
              <Route path="/dashboard/:workspaceSlug/*" element={
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
                          <Route path="projects/:namespace/setup/success" element={<ProjectSetupSuccess />} />
                          <Route path="projects/:namespace/branches/:branchName/issues" element={<BranchIssues />} />
                          <Route path="projects/:namespace/issues/:issueId" element={<IssueDetails />} />
                          <Route path="projects/:namespace/settings" element={<ProjectConfiguration />} />
                          <Route path="projects/:namespace/jobs" element={<JobsPage />} />
                          <Route path="projects/:namespace/jobs/:jobId" element={<JobDetailPage />} />
                          <Route path="user" element={<UserSettings />} />
                          <Route path="hosting" element={<HostingSettings />} />
                          <Route path="hosting/add-connection" element={<AddConnection />} />
                          <Route path="hosting/configure/:connectionId" element={<ConfigureConnection />} />
                          <Route path="hosting/github/add-connection" element={<GitHubAddConnection />} />
                          <Route path="hosting/github/configure/:connectionId" element={<GitHubConfigureConnection />} />
                          <Route path="hosting/github/callback" element={<GitHubOAuthCallback />} />
                          <Route path="hosting/gitlab/add-connection" element={<GitLabAddConnection />} />
                          <Route path="ai" element={<AISettings />} />
                          <Route path="workspace" element={<WorkspaceManagementPage />} />
                          <Route path="tasks" element={<TaskSettings />} />
                          <Route path="quality-gates" element={<QualityGatesPage />} />
                          <Route path="billing" element={<BillingSettings />} />
                          <Route path="hosting/:provider/success" element={<IntegrationSuccess />} />
                          <Route path="integrations/bitbucket/connect" element={<BitbucketConnectHandshake />} />
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
