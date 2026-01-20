import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  GitBranch, 
  FileText, 
  Brain, 
  Loader2, 
  Search, 
  Plus, 
  Zap,
  CheckCircle,
  Settings,
  GitPullRequest,
  GitCommit,
  X,
  Info,
  Webhook,
  Workflow,
  RefreshCw,
  Key
} from "lucide-react";
import { Github } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { integrationService } from "@/api_service/integration/integrationService";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService";
import { githubService } from "@/api_service/codeHosting/github/githubService";
import { gitlabService } from "@/api_service/codeHosting/gitlab/gitlabService";
import { projectService } from "@/api_service/project/projectService";
import { aiConnectionService, AIConnectionDTO, CreateAIConnectionRequest } from "@/api_service/ai/aiConnectionService";
import { GitLabRepositoryTokenForm } from "@/components/gitlab/GitLabRepositoryTokenForm";
import { RepositoryTokenForm, RepositoryTokenData } from "@/components/common/RepositoryTokenForm";
import { GitLabRepositoryTokenRequest } from "@/api_service/codeHosting/gitlab/gitlabService.interface";
import { 
  VcsConnection, 
  VcsProvider, 
  VcsRepository 
} from "@/api_service/integration/integration.interface";

// Bitbucket logo SVG component
function BitbucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
    </svg>
  );
}

// GitLab logo SVG component
function GitLabIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51a.42.42 0 01.82 0l2.44 7.51h8.06l2.44-7.51a.42.42 0 01.82 0l2.44 7.51 1.22 3.78a.84.84 0 01-.3.94z"/>
    </svg>
  );
}

// Provider display info
const PROVIDER_INFO: Record<VcsProvider, { name: string; color: string }> = {
  'bitbucket-cloud': { name: 'Bitbucket Cloud', color: 'text-blue-500' },
  'bitbucket-server': { name: 'Bitbucket Server', color: 'text-blue-600' },
  'github': { name: 'GitHub', color: 'text-gray-900 dark:text-gray-100' },
  'gitlab': { name: 'GitLab', color: 'text-orange-500' },
};

function getProviderIcon(provider: VcsProvider, className: string = "h-6 w-6") {
  const color = PROVIDER_INFO[provider]?.color || '';
  switch (provider) {
    case 'bitbucket-cloud':
    case 'bitbucket-server':
      return <BitbucketIcon className={`${className} ${color}`} />;
    case 'github':
      return <Github className={`${className} ${color}`} />;
    case 'gitlab':
      return <GitLabIcon className={`${className} ${color}`} />;
    default:
      return <GitBranch className={className} />;
  }
}

/**
 * Import Project Flow for Manual OAuth connections.
 * Steps:
 * 0. Select VCS connection (if not provided in URL)
 * 1. Select repository from VCS connection
 * 2. Set project name and description
 * 3. Select or create AI connection
 * 4. Analysis configuration (default branch, auto-analysis)
 */
export default function ImportProject() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId');
  const provider = searchParams.get('provider') as VcsProvider;
  const connectionType = searchParams.get('connectionType');
  const { currentWorkspace } = useWorkspace();
  const routes = useWorkspaceRoutes();
  const { toast } = useToast();
  
  // Current step: 0 = connection selection (if no connectionId), 1 = repo selection, 2 = project details, 3 = AI connection, 4 = analysis config, 5 = installation method
  const [currentStep, setCurrentStep] = useState(connectionId ? 1 : 0);
  
  // Connection selection state (step 0)
  const [allConnections, setAllConnections] = useState<VcsConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true); // Start as true, will be set to false after load
  const [selectedProvider, setSelectedProvider] = useState<VcsProvider | null>(null);
  
  // GitLab Repository Token mode (for single-repo access without group/org)
  const [showRepoTokenForm, setShowRepoTokenForm] = useState(false);
  const [isCreatingRepoToken, setIsCreatingRepoToken] = useState(false);
  
  // Connection & Repository state
  const [connection, setConnection] = useState<VcsConnection | null>(null);
  const [repositories, setRepositories] = useState<VcsRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<VcsRepository | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Project details state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  
  // AI Connection state
  const [aiConnections, setAiConnections] = useState<AIConnectionDTO[]>([]);
  const [selectedAiConnectionId, setSelectedAiConnectionId] = useState<number | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showCreateAi, setShowCreateAi] = useState(false);
  const [newAiConnection, setNewAiConnection] = useState<CreateAIConnectionRequest>({
    name: '',
    providerKey: 'OPENROUTER',
    aiModel: '',
    apiKey: '',
    tokenLimitation: '150000'
  });
  
  // Analysis settings state
  const [prAnalysisEnabled, setPrAnalysisEnabled] = useState(true);
  const [branchAnalysisEnabled, setBranchAnalysisEnabled] = useState(true);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedMainBranch, setSelectedMainBranch] = useState<string>('');
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  
  // Branch pattern state
  const [prTargetPatterns, setPrTargetPatterns] = useState<string[]>([]);
  const [branchPushPatterns, setBranchPushPatterns] = useState<string[]>([]);
  const [newPrPattern, setNewPrPattern] = useState("");
  const [newBranchPattern, setNewBranchPattern] = useState("");
  
  // Installation method state: 'WEBHOOK' or 'PIPELINE'
  const [installationMethod, setInstallationMethod] = useState<'WEBHOOK' | 'PIPELINE'>('WEBHOOK');
  
  // Creating state
  const [isCreating, setIsCreating] = useState(false);
  
  // Load all connections if no connectionId is provided (step 0)
  useEffect(() => {
    if (connectionId) {
      // If connectionId is provided, we don't need to load all connections
      setIsLoadingConnections(false);
      return;
    }
    if (currentWorkspace) {
      loadAllConnections();
    }
  }, [currentWorkspace, connectionId]);
  
  useEffect(() => {
    if (currentWorkspace && connectionId && provider) {
      loadConnection();
      loadRepositories();
    }
  }, [currentWorkspace, connectionId, provider]);
  
  const loadAllConnections = async () => {
    if (!currentWorkspace) return;
    setIsLoadingConnections(true);
    try {
      const data = await integrationService.getAllConnections(currentWorkspace.slug);
      console.log('Loaded connections:', data);
      setAllConnections(data);
    } catch (error: any) {
      console.error('Failed to load connections:', error);
      toast({
        title: "Failed to load connections",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingConnections(false);
    }
  };
  
  const handleSelectConnection = (conn: VcsConnection) => {
    // Update URL params and move to step 1
    setSearchParams({
      connectionId: String(conn.id),
      provider: conn.provider,
      connectionType: conn.connectionType || ''
    });
    setConnection(conn);
    setCurrentStep(1);
  };
  
  /**
   * Handle GitLab Repository Token submission.
   * Creates a connection with the token, then moves to step 1 with the single repo.
   */
  const handleRepositoryTokenSubmit = async (data: GitLabRepositoryTokenRequest) => {
    if (!currentWorkspace) return;
    
    setIsCreatingRepoToken(true);
    try {
      // Create the repository token connection
      const createdConnection = await gitlabService.createRepositoryTokenConnection(
        currentWorkspace.slug,
        data
      );
      
      toast({
        title: "Connection Created",
        description: `GitLab repository "${data.repositoryPath}" connected successfully.`,
      });
      
      // Navigate to step 1 with the new connection
      setSearchParams({
        connectionId: String(createdConnection.id),
        provider: 'gitlab',
        connectionType: 'REPOSITORY_TOKEN'
      });
      setConnection({
        id: createdConnection.id,
        provider: 'gitlab',
        connectionType: 'REPOSITORY_TOKEN',
        connectionName: createdConnection.connectionName,
        status: createdConnection.setupStatus as any,
        externalWorkspaceId: null,
        externalWorkspaceSlug: null,
        repoCount: 1,
        createdAt: '',
        updatedAt: '',
      });
      setShowRepoTokenForm(false);
      setCurrentStep(1);
      
      // Reload connections in case user goes back
      loadAllConnections();
    } catch (error: any) {
      console.error('Failed to create repository token connection:', error);
      toast({
        title: "Failed to Create Connection",
        description: error.message || "Could not connect to GitLab repository",
        variant: "destructive",
      });
      throw error; // Re-throw so the form can display the error
    } finally {
      setIsCreatingRepoToken(false);
    }
  };
  
  const loadConnection = async () => {
    if (!currentWorkspace || !connectionId || !provider) return;
    
    try {
      // Use appropriate service based on connection type
      // Note: connectionType can be "null" string if backend returns null
      if (connectionType === 'OAUTH_MANUAL' || connectionType === 'ACCESS_TOKEN' || connectionType === 'null' || !connectionType) {
        const conn = await bitbucketCloudService.getConnection(
          currentWorkspace.slug, 
          parseInt(connectionId)
        );
        // Map to VcsConnection format
        setConnection({
          id: conn.id,
          provider: 'bitbucket-cloud',
          connectionType: connectionType as any,
          connectionName: conn.connectionName,
          status: conn.setupStatus as any,
          externalWorkspaceId: conn.workspaceId || null,
          externalWorkspaceSlug: conn.workspaceId || null,
          repoCount: conn.repoCount || 0,
          createdAt: '',
          updatedAt: '',
        });
      } else {
        const conn = await integrationService.getConnection(
          currentWorkspace.slug, 
          provider, 
          parseInt(connectionId)
        );
        setConnection(conn);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load connection",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const loadRepositories = async (pageNum = 1, append = false) => {
    if (!currentWorkspace || !connectionId || !provider) return;
    
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      let result: { items: VcsRepository[]; hasNext: boolean };
      
      // Check connection type to use appropriate endpoint
      // For OAuth manual connections (or null/undefined), use provider-specific legacy services
      // For APP connections, use integrationService
      // Note: connectionType from URL can be "null" string if backend returns null
      // IMPORTANT: Don't rely on connection state here since loadConnection() is async
      const isManualConnection = !connectionType || 
        connectionType === 'null' ||
        connectionType === 'OAUTH_MANUAL' || 
        connectionType === 'ACCESS_TOKEN';
      
      if (isManualConnection) {
        // Use legacy OAuth endpoint for manual connections based on provider
        let res: { items: any[]; hasNext: boolean };
        
        if (provider === 'github' || provider.toLowerCase() === 'github') {
          res = await githubService.getRepositories(
            currentWorkspace.slug,
            parseInt(connectionId),
            pageNum,
            searchQuery || undefined
          );
        } else if (provider === 'gitlab' || provider.toLowerCase() === 'gitlab') {
          // GitLab doesn't have legacy manual connection support, use integration service
          const gitlabResult = await integrationService.listRepositories(
            currentWorkspace.slug,
            provider,
            parseInt(connectionId),
            pageNum,
            searchQuery || undefined
          );
          result = gitlabResult;
          
          if (append) {
            setRepositories(prev => [...prev, ...result.items]);
          } else {
            setRepositories(result.items);
          }
          setPage(pageNum);
          setHasMore(result.hasNext);
          return; // Early return for GitLab
        } else {
          // Default to Bitbucket Cloud service
          res = await bitbucketCloudService.getRepositories(
            currentWorkspace.slug,
            parseInt(connectionId),
            pageNum,
            searchQuery || undefined
          );
        }
        
        result = {
          items: res.items.map((r: any) => {
            // For Bitbucket, fullName is "workspace/repo-slug", extract repo slug from it
            const fullName = r.fullName || r.full_name || '';
            const repoSlug = fullName.includes('/') ? fullName.split('/').pop() : (r.slug || r.name);
            return {
              id: r.uuid || r.id || r.name,
              slug: repoSlug,
              name: r.name,
              fullName: fullName || `${r.owner?.username || r.workspace?.slug || ''}/${repoSlug}`,
              description: r.description,
              isPrivate: r.isPrivate ?? r.is_private ?? r.private ?? true,
              defaultBranch: r.mainBranch?.name || r.defaultBranch || r.default_branch || 'main',
              cloneUrl: r.links?.clone?.[0]?.href || r.cloneUrl,
              htmlUrl: r.links?.html?.href || r.htmlUrl || r.html_url,
              namespace: r.owner?.username || r.workspace?.slug || '',
              avatarUrl: r.links?.avatar?.href || r.avatarUrl || null,
              isOnboarded: r.isOnboarded ?? false,
            };
          }),
          hasNext: res.hasNext
        };
      } else {
        // Use integration API for APP connections
        result = await integrationService.listRepositories(
          currentWorkspace.slug,
          provider,
          parseInt(connectionId),
          pageNum,
          searchQuery || undefined
        );
      }
      
      if (append) {
        setRepositories(prev => [...prev, ...result.items]);
      } else {
        setRepositories(result.items);
      }
      
      setPage(pageNum);
      setHasMore(result.hasNext);
    } catch (error: any) {
      const isExpiredToken = error.message?.includes('expired') || error.error === 'INTEGRATION_ERROR';
      toast({
        title: isExpiredToken ? "Connection Expired" : "Failed to load repositories",
        description: error.message,
        variant: "destructive",
        action: isExpiredToken ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/${currentWorkspace?.slug}/settings/code-hosting`)}
          >
            Reconnect
          </Button>
        ) : undefined,
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  const handleSearch = () => {
    setPage(1);
    loadRepositories(1, false);
  };
  
  const handleLoadMore = () => {
    loadRepositories(page + 1, true);
  };
  
  const handleSelectRepo = (repo: VcsRepository) => {
    setSelectedRepo(repo);
    setProjectName(repo.name);
  };
  
  const loadAiConnections = async () => {
    if (!currentWorkspace) return;
    
    try {
      setIsLoadingAi(true);
      const connections = await aiConnectionService.listWorkspaceConnections(currentWorkspace.slug);
      setAiConnections(connections);
      if (connections.length > 0 && !selectedAiConnectionId) {
        setSelectedAiConnectionId(connections[0].id);
      }
    } catch (error: any) {
      console.error("Failed to load AI connections:", error);
    } finally {
      setIsLoadingAi(false);
    }
  };
  
  const handleCreateAiConnection = async () => {
    if (!currentWorkspace) return;
    
    if (!newAiConnection.aiModel || !newAiConnection.apiKey) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoadingAi(true);
      const created = await aiConnectionService.createConnection(currentWorkspace.slug, newAiConnection);
      setAiConnections(prev => [...prev, created]);
      setSelectedAiConnectionId(created.id);
      setShowCreateAi(false);
      setNewAiConnection({
        name: '',
        providerKey: 'OPENROUTER',
        aiModel: '',
        apiKey: '',
        tokenLimitation: '150000'
      });
      toast({
        title: "AI Connection Created",
        description: "Your AI connection has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to create AI connection",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingAi(false);
    }
  };
  
  const loadBranches = async () => {
    if (!selectedRepo || !currentWorkspace || !connectionId || !provider) return;
    
    setIsLoadingBranches(true);
    
    // Use main branch from repo metadata as default
    const mainBranch = selectedRepo.defaultBranch || 'main';
    
    try {
      // Fetch branches from the API
      const fetchedBranches = await integrationService.listBranches(
        currentWorkspace.slug,
        provider,
        parseInt(connectionId),
        selectedRepo.id
      );
      
      // Ensure main branch and common branches are included, with main first
      const allBranches = [
        mainBranch,
        ...fetchedBranches.filter(b => b !== mainBranch)
      ];
      
      setBranches(allBranches);
    } catch (error: any) {
      console.warn('Failed to fetch branches from API, using defaults:', error);
      // Fallback to default branches if API fails
      setBranches([mainBranch, 'main', 'master', 'develop'].filter((v, i, a) => a.indexOf(v) === i));
    } finally {
      setIsLoadingBranches(false);
    }
    
    setSelectedMainBranch(mainBranch);
    
    // Auto-add main branch to patterns (it will always be required)
    if (!prTargetPatterns.includes(mainBranch)) {
      setPrTargetPatterns([mainBranch, ...prTargetPatterns.filter(p => p !== mainBranch)]);
    }
    if (!branchPushPatterns.includes(mainBranch)) {
      setBranchPushPatterns([mainBranch, ...branchPushPatterns.filter(p => p !== mainBranch)]);
    }
  };
  
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedRepo) {
        toast({
          title: "No repository selected",
          description: "Please select a repository to continue",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!projectName.trim()) {
        toast({
          title: "Name required",
          description: "Please enter a project name",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(3);
      loadAiConnections();
    } else if (currentStep === 3) {
      setCurrentStep(4);
      loadBranches();
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleCreateProject = async () => {
    if (!currentWorkspace || !connectionId || !provider || !selectedRepo) return;
    
    try {
      setIsCreating(true);
      
      console.log('[ImportProject] handleCreateProject called', {
        connectionType,
        provider,
        connectionId,
        selectedRepo: selectedRepo?.slug,
        installationMethod
      });
      
      // Determine whether to setup webhooks based on installation method
      const shouldSetupWebhooks = installationMethod === 'WEBHOOK';
      
      // For GitLab, use the numeric ID or fullName (path_with_namespace) instead of just slug
      // This is necessary because GitLab OAuth tokens can access repos across multiple namespaces
      // Using just the slug would fail for repos not in the user's own namespace
      const repoIdentifier = provider === 'gitlab' ? selectedRepo.id : selectedRepo.slug;
      
      // Use unified onboardRepository flow for all connection types
      // This enables automatic webhook setup for both APP and OAUTH_MANUAL connections
      const onboardResult = await integrationService.onboardRepository(
        currentWorkspace.slug,
        provider,
        repoIdentifier,
        {
          vcsConnectionId: parseInt(connectionId),
          projectName: projectName,
          projectNamespace: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
          projectDescription: projectDescription || undefined,
          aiConnectionId: selectedAiConnectionId || undefined,
          mainBranch: selectedMainBranch || undefined,
          defaultBranch: selectedMainBranch || undefined, // For backward compatibility
          prAnalysisEnabled: prAnalysisEnabled,
          branchAnalysisEnabled: branchAnalysisEnabled,
          setupWebhooks: shouldSetupWebhooks,
        }
      );
      
      const result = {
        projectId: onboardResult.projectId,
        projectName: onboardResult.projectName,
        projectNamespace: onboardResult.projectNamespace,
        webhooksConfigured: onboardResult.webhooksConfigured
      };
      
      // Update branch patterns if any are set
      if ((prTargetPatterns.length > 0 || branchPushPatterns.length > 0) && result.projectNamespace) {
        await projectService.updateBranchAnalysisConfig(currentWorkspace.slug, result.projectNamespace, {
          prTargetBranches: prTargetPatterns,
          branchPushPatterns: branchPushPatterns
        });
      }
      
      // Determine the actual installation method based on user choice and webhook setup result
      const finalInstallationMethod = installationMethod === 'WEBHOOK' && result.webhooksConfigured 
        ? 'WEBHOOK' 
        : 'PIPELINE';
      
      toast({
        title: "Project created",
        description: result.webhooksConfigured 
          ? `Successfully created project "${result.projectName}" with automatic PR reviews enabled`
          : `Successfully created project "${result.projectName}". Configure pipelines to trigger reviews.`,
      });
      
      // Navigate to success page
      navigate(routes.projectSetupSuccess(result.projectNamespace), {
        state: {
          project: {
            id: result.projectId,
            name: result.projectName,
            namespace: result.projectNamespace,
          },
          installationMethod: finalInstallationMethod,
          webhooksConfigured: result.webhooksConfigured,
          prAnalysisEnabled,
          branchAnalysisEnabled,
          prTargetPatterns,
          branchPushPatterns
        }
      });
    } catch (error: any) {
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  if (isLoadingConnections) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading connections...</span>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (connectionId && isLoading && !connection) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => {
          if (currentStep === 0) {
            if (showRepoTokenForm) {
              // Go back from repo token form to connection selection
              setShowRepoTokenForm(false);
            } else if (selectedProvider) {
              // Go back from connection selection to provider selection
              setSelectedProvider(null);
            } else {
              navigate(routes.projects());
            }
          } else if (currentStep === 1 && !connectionId) {
            // If we selected a connection from step 0, go back to step 0
            setCurrentStep(0);
            setSearchParams({});
          } else {
            navigate(routes.projects());
          }
        }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Project</h1>
          <p className="text-muted-foreground">
            {currentStep === 0 
              ? (showRepoTokenForm
                  ? `Connect a ${selectedProvider ? PROVIDER_INFO[selectedProvider]?.name : ''} repository using Access Token`
                  : selectedProvider 
                    ? `Select a ${PROVIDER_INFO[selectedProvider]?.name} connection or use a repository access token` 
                    : 'Select a VCS platform to add a project from')
              : `Add a repository from ${connection?.connectionName || 'your VCS connection'}`}
          </p>
        </div>
      </div>
      
      {/* Step indicator - only show when past step 0 */}
      {currentStep >= 1 && (
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="hidden sm:inline font-medium">Repository</span>
          </div>
          <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className="hidden sm:inline font-medium">Details</span>
          </div>
          <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {currentStep > 3 ? <CheckCircle className="h-4 w-4" /> : '3'}
            </div>
            <span className="hidden sm:inline font-medium">AI</span>
          </div>
          <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 4 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 4 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {currentStep > 4 ? <CheckCircle className="h-4 w-4" /> : '4'}
            </div>
            <span className="hidden sm:inline font-medium">Analysis</span>
          </div>
          <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 5 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center gap-2 ${currentStep >= 5 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 5 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              5
            </div>
            <span className="hidden sm:inline font-medium">Install</span>
          </div>
        </div>
      )}
      
      {/* Step 0: Connection Selection */}
      {currentStep === 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {showRepoTokenForm && selectedProvider 
                  ? <Key className="h-5 w-5" />
                  : selectedProvider 
                    ? getProviderIcon(selectedProvider, "h-5 w-5") 
                    : <GitBranch className="h-5 w-5" />}
                {showRepoTokenForm 
                  ? 'Repository Access Token'
                  : selectedProvider 
                    ? 'Select Connection' 
                    : 'Select VCS Platform'}
              </CardTitle>
              <CardDescription>
                {showRepoTokenForm
                  ? `Connect a single ${PROVIDER_INFO[selectedProvider!]?.name || selectedProvider} repository using an access token`
                  : selectedProvider 
                    ? `Choose how to connect to ${PROVIDER_INFO[selectedProvider]?.name || selectedProvider}`
                    : 'Choose a version control platform to import repositories from'}
              </CardDescription>
            </div>
            {(selectedProvider || showRepoTokenForm) && (
              <Button variant="outline" size="sm" onClick={() => {
                if (showRepoTokenForm) {
                  setShowRepoTokenForm(false);
                } else {
                  setSelectedProvider(null);
                }
              }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {/* Provider Selection */}
            {!selectedProvider && !showRepoTokenForm && (
              <>
                {(() => {
                  const allProviders: VcsProvider[] = ['github', 'gitlab', 'bitbucket-cloud'];
                  
                  return (
                    <div className="space-y-6">
                      {/* Provider Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {allProviders.map((providerKey) => {
                          const providerConns = allConnections.filter(c => c.provider === providerKey);
                          const hasConnections = providerConns.length > 0;
                          
                          return (
                            <div
                              key={providerKey}
                              className="flex flex-col items-center gap-3 p-6 border rounded-xl transition-all cursor-pointer hover:border-primary hover:shadow-md hover:bg-muted/30"
                              onClick={() => setSelectedProvider(providerKey)}
                            >
                              {getProviderIcon(providerKey, "h-12 w-12")}
                              <div className="text-center">
                                <div className="font-semibold">{PROVIDER_INFO[providerKey]?.name || providerKey}</div>
                                <div className="text-sm text-muted-foreground">
                                  {hasConnections 
                                    ? `${providerConns.length} connection${providerConns.length > 1 ? 's' : ''}`
                                    : 'Click to connect'}
                                </div>
                              </div>
                              {hasConnections && (
                                <Badge variant="secondary">{providerConns.reduce((sum, c) => sum + c.repoCount, 0)} repos</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
            
            {/* Connection Selection (after provider is selected) */}
            {selectedProvider && !showRepoTokenForm && (
              <>
                {(() => {
                  const providerConnections = allConnections.filter(c => c.provider === selectedProvider);
                  
                  return (
                    <div className="space-y-6">
                      {/* Connection Method Info */}
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p><strong>VCS Connection</strong> — Connect to an organization/workspace to access multiple repositories. Requires org-level permissions.</p>
                            <p><strong>Repository Token</strong> — Connect to a single repository using an access token. Ideal when you don't have org-level access.</p>
                          </div>
                        </AlertDescription>
                      </Alert>
                      
                      {/* Existing Connections */}
                      {providerConnections.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Your Connections</h3>
                          {providerConnections.map((conn) => (
                            <div
                              key={conn.id}
                              className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary hover:shadow-md hover:bg-muted/30 transition-all"
                              onClick={() => handleSelectConnection(conn)}
                            >
                              {getProviderIcon(conn.provider, "h-10 w-10")}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-lg">{conn.connectionName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {conn.connectionType === 'APP' || conn.connectionType === 'CONNECT_APP' 
                                    ? 'App Installation' 
                                    : conn.connectionType === 'REPOSITORY_TOKEN'
                                    ? 'Repository Access Token'
                                    : 'OAuth Connection'}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="text-base">{conn.repoCount} repos</Badge>
                              </div>
                              <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Connection Options */}
                      <div className="space-y-3">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          {providerConnections.length > 0 ? 'Add Another Connection' : 'Connect to ' + PROVIDER_INFO[selectedProvider]?.name}
                        </h3>
                        
                        {/* Add VCS Connection (org-level) */}
                        <div
                          className="flex items-center gap-3 p-4 border border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                          onClick={() => navigate(routes.hostingSettings())}
                        >
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Plus className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">Add VCS Connection</div>
                            <div className="text-sm text-muted-foreground">
                              Connect to {selectedProvider === 'github' ? 'an organization' : selectedProvider === 'gitlab' ? 'a group' : 'a workspace'} for multi-repo access
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        {/* Use Repository Access Token */}
                        <div
                          className="flex items-center gap-3 p-4 border border-dashed rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all"
                          onClick={() => setShowRepoTokenForm(true)}
                        >
                          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Key className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">Use Repository Access Token</div>
                            <div className="text-sm text-muted-foreground">
                              Connect a single repository without {selectedProvider === 'github' ? 'organization' : selectedProvider === 'gitlab' ? 'group' : 'workspace'} access
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
            
            {/* Repository Token Form - shown for any provider */}
            {showRepoTokenForm && selectedProvider && (
              <RepositoryTokenForm
                provider={selectedProvider}
                onSubmit={handleRepositoryTokenSubmit}
                onCancel={() => setShowRepoTokenForm(false)}
                isLoading={isCreatingRepoToken}
              />
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Step 1: Repository Selection */}
      {currentStep === 1 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {connection ? getProviderIcon(connection.provider, "h-5 w-5") : <GitBranch className="h-5 w-5" />}
                Select Repository
              </CardTitle>
              <CardDescription>
                Choose a repository from {connection?.connectionName || 'your connection'} to import as a project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Repository list */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading repositories...</span>
                </div>
              ) : repositories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No repositories found
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer
                        ${repo.isOnboarded ? 'opacity-50' : 'hover:bg-muted/50'}
                        ${selectedRepo?.id === repo.id ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => !repo.isOnboarded && handleSelectRepo(repo)}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedRepo?.id === repo.id ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {selectedRepo?.id === repo.id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{repo.name}</span>
                          {repo.isPrivate && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Private</span>
                          )}
                          {repo.isOnboarded && (
                            <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded">
                              Already imported
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {repo.fullName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Load more */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Step 1 Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate(routes.projects())}>
              Cancel
            </Button>
            <Button onClick={handleNextStep} disabled={!selectedRepo}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}
      
      {/* Step 2: Project Details */}
      {currentStep === 2 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Details
              </CardTitle>
              <CardDescription>
                Configure the project name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected repo info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Selected repository</div>
                <div className="font-medium">{selectedRepo?.fullName}</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Description (optional)</Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Step 2 Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePreviousStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNextStep} disabled={!projectName.trim()}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}
      
      {/* Step 3: AI Connection */}
      {currentStep === 3 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configure AI Connection
              </CardTitle>
              <CardDescription>
                Select or create an AI connection for code analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingAi ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading AI connections...</span>
                </div>
              ) : (
                <>
                  {/* Existing connections */}
                  {aiConnections.length > 0 && !showCreateAi && (
                    <div className="space-y-3">
                      <Label>Select an existing AI connection</Label>
                      <div className="space-y-2">
                        {aiConnections.map((conn) => (
                          <div
                            key={conn.id}
                            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                              selectedAiConnectionId === conn.id ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setSelectedAiConnectionId(conn.id)}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedAiConnectionId === conn.id ? 'border-primary' : 'border-muted-foreground'
                            }`}>
                              {selectedAiConnectionId === conn.id && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="font-medium">{conn.name || conn.providerKey}</span>
                                <span className="text-sm text-muted-foreground">- {conn.aiModel}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateAi(true)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New AI Connection
                      </Button>
                    </div>
                  )}
                  
                  {/* Create new connection form */}
                  {(showCreateAi || aiConnections.length === 0) && (
                    <div className="space-y-4">
                      {aiConnections.length > 0 && (
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Create New AI Connection</Label>
                          <Button variant="ghost" size="sm" onClick={() => setShowCreateAi(false)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                      {aiConnections.length === 0 && (
                        <Label className="text-base font-semibold">Create Your First AI Connection</Label>
                      )}
                      
                      {/* Model Recommendations */}
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                          <span className="font-semibold">Model Recommendations</span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          Use <strong>mid-tier or higher models</strong> with at least <strong>200k context window</strong> for reliable code review.
                        </p>
                        <ul className="text-xs text-blue-600 dark:text-blue-300 list-disc list-inside space-y-0.5">
                          <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">google/gemini-2.5-flash</code> - 1M context</li>
                          <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">openai/gpt-5.1-codex-mini</code> - 200k context</li>
                          <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">anthropic/claude-haiku-4.5</code> - 200k context</li>
                          <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">x-ai/grok-4.1-fast</code> - 200k context</li>
                        </ul>
                      </div>

                      {/* Low-tier Warning */}
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-1">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                          <span className="font-semibold text-sm">Low-Tier Models Warning</span>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-300">
                          Free-tier or low-parameter models (&lt;70B params) often produce incomplete or incorrect results for large PRs.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="ai-name">Connection Name (Optional)</Label>
                          <Input
                            id="ai-name"
                            value={newAiConnection.name || ''}
                            onChange={(e) => setNewAiConnection(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Production Claude, Dev GPT-4"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="ai-provider">AI Provider</Label>
                          <Select
                            value={newAiConnection.providerKey}
                            onValueChange={(value) => setNewAiConnection(prev => ({ ...prev, providerKey: value as 'OPENAI' | 'OPENROUTER' | 'ANTHROPIC' | 'GOOGLE' }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPENROUTER">OpenRouter (Recommended)</SelectItem>
                              <SelectItem value="OPENAI">OpenAI</SelectItem>
                              <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                              <SelectItem value="GOOGLE">Google AI</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {newAiConnection.providerKey === 'OPENROUTER' && 'Access multiple AI providers through one API'}
                            {newAiConnection.providerKey === 'OPENAI' && 'Direct OpenAI API - GPT-4o, GPT-4-turbo'}
                            {newAiConnection.providerKey === 'ANTHROPIC' && 'Direct Anthropic API - Claude 3 models'}
                            {newAiConnection.providerKey === 'GOOGLE' && 'Direct Google AI API - Gemini models'}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="ai-model">Model Name</Label>
                          <Input
                            id="ai-model"
                            value={newAiConnection.aiModel}
                            onChange={(e) => setNewAiConnection(prev => ({ ...prev, aiModel: e.target.value }))}
                            placeholder={
                              newAiConnection.providerKey === 'OPENROUTER' ? 'anthropic/claude-sonnet-4' :
                              newAiConnection.providerKey === 'OPENAI' ? 'gpt-4o' :
                              newAiConnection.providerKey === 'ANTHROPIC' ? 'claude-3-opus-20240229' :
                              newAiConnection.providerKey === 'GOOGLE' ? 'gemini-1.5-pro' : 'model-name'
                            }
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="ai-api-key">API Key</Label>
                          <Input
                            id="ai-api-key"
                            type="password"
                            value={newAiConnection.apiKey}
                            onChange={(e) => setNewAiConnection(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder="Enter your API key"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="ai-token-limit">Token Limitation</Label>
                          <Input
                            id="ai-token-limit"
                            value={newAiConnection.tokenLimitation}
                            onChange={(e) => setNewAiConnection(prev => ({ ...prev, tokenLimitation: e.target.value }))}
                            placeholder="150000"
                          />
                        </div>
                        
                        <Button
                          onClick={handleCreateAiConnection}
                          disabled={isLoadingAi}
                          className="w-full"
                        >
                          {isLoadingAi ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          Create AI Connection
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Step 3 Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePreviousStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleNextStep}
              >
                Skip AI Setup
              </Button>
              <Button onClick={handleNextStep}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </>
      )}
      
      {/* Step 4: Analysis Configuration */}
      {currentStep === 4 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Analysis Configuration
              </CardTitle>
              <CardDescription>
                Configure when and how CodeCrow should analyze your code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Branch */}
              <div className="space-y-2">
                <Label htmlFor="main-branch" className="text-base font-semibold flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Main Branch
                </Label>
                <Select
                  value={selectedMainBranch}
                  onValueChange={(value) => {
                    if (value === '__custom__') {
                      // Show custom input mode - handled by separate state
                      return;
                    }
                    setSelectedMainBranch(value);
                    if (value.trim()) {
                      setPrTargetPatterns([value, ...prTargetPatterns.filter(p => p !== value && p !== selectedMainBranch)]);
                      setBranchPushPatterns([value, ...branchPushPatterns.filter(p => p !== value && p !== selectedMainBranch)]);
                    }
                  }}
                  disabled={isLoadingBranches}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select main branch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                    {branches.length > 0 && <SelectSeparator />}
                    <SelectItem value="__custom__">
                      <span className="text-muted-foreground">Enter custom branch name...</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {selectedMainBranch === '__custom__' && (
                  <Input
                    placeholder="Enter custom branch name"
                    className="mt-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value) {
                          setSelectedMainBranch(value);
                          setBranches(prev => prev.includes(value) ? prev : [...prev, value]);
                          setPrTargetPatterns([value, ...prTargetPatterns.filter(p => p !== value)]);
                          setBranchPushPatterns([value, ...branchPushPatterns.filter(p => p !== value)]);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value) {
                        setSelectedMainBranch(value);
                        setBranches(prev => prev.includes(value) ? prev : [...prev, value]);
                        setPrTargetPatterns([value, ...prTargetPatterns.filter(p => p !== value)]);
                        setBranchPushPatterns([value, ...branchPushPatterns.filter(p => p !== value)]);
                      }
                    }}
                  />
                )}
                {isLoadingBranches ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading branches from repository...
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {branches.length > 0 
                      ? `${branches.length} branch${branches.length > 1 ? 'es' : ''} available`
                      : 'No branches found - enter a custom branch name'
                    }
                  </p>
                )}
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> The main branch is used as the baseline for RAG code indexing, 
                    delta indexes for release branches, and is always included in analysis patterns. 
                    It cannot be removed from branch filters.
                  </AlertDescription>
                </Alert>
              </div>
              
              {/* Analysis Scope */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Analysis Scope</Label>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <GitPullRequest className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Pull Request Analysis</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically analyze PRs when created or updated
                      </div>
                    </div>
                  </div>
                  <Switch 
                    checked={prAnalysisEnabled}
                    onCheckedChange={setPrAnalysisEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <GitCommit className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Branch Analysis</div>
                      <div className="text-sm text-muted-foreground">
                        Analyze code when branches are pushed
                      </div>
                    </div>
                  </div>
                  <Switch 
                    checked={branchAnalysisEnabled}
                    onCheckedChange={setBranchAnalysisEnabled}
                  />
                </div>
              </div>
              
              {/* Branch Pattern Configuration */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Branch Pattern Filters (Optional)</Label>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Define which branches trigger automated analysis. If no patterns are configured, 
                    all branches will be analyzed. Supports wildcards: <code className="px-1 bg-muted rounded">*</code> and <code className="px-1 bg-muted rounded">**</code>
                  </AlertDescription>
                </Alert>
                
                {/* PR Target Patterns */}
                {prAnalysisEnabled && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <GitPullRequest className="h-4 w-4" />
                        PR Target Branches
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Only analyze PRs targeting these branches (e.g., main, develop, release/*)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., main, develop, release/*"
                        value={newPrPattern}
                        onChange={(e) => setNewPrPattern(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const pattern = newPrPattern.trim();
                            if (pattern && !prTargetPatterns.includes(pattern)) {
                              setPrTargetPatterns([...prTargetPatterns, pattern]);
                              setNewPrPattern("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const pattern = newPrPattern.trim();
                          if (pattern && !prTargetPatterns.includes(pattern)) {
                            setPrTargetPatterns([...prTargetPatterns, pattern]);
                            setNewPrPattern("");
                          }
                        }}
                        disabled={!newPrPattern.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {prTargetPatterns.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {prTargetPatterns.map((pattern) => {
                          const isMainBranch = pattern === selectedMainBranch;
                          return (
                            <Badge 
                              key={pattern} 
                              variant={isMainBranch ? "default" : "secondary"} 
                              className={`pl-3 ${isMainBranch ? 'pr-3' : 'pr-1'} py-1.5`}
                            >
                              <code className="text-xs">{pattern}</code>
                              {isMainBranch ? (
                                <span className="ml-2 text-xs opacity-75">(required)</span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 ml-1 hover:bg-destructive/20"
                                  onClick={() => setPrTargetPatterns(prTargetPatterns.filter(p => p !== pattern))}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No patterns configured - all PR target branches will be analyzed
                      </div>
                    )}
                  </div>
                )}
                
                {/* Branch Push Patterns */}
                {branchAnalysisEnabled && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <GitCommit className="h-4 w-4" />
                        Branch Push Patterns
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Only analyze pushes to branches matching these patterns
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., main, develop, feature/*"
                        value={newBranchPattern}
                        onChange={(e) => setNewBranchPattern(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const pattern = newBranchPattern.trim();
                            if (pattern && !branchPushPatterns.includes(pattern)) {
                              setBranchPushPatterns([...branchPushPatterns, pattern]);
                              setNewBranchPattern("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const pattern = newBranchPattern.trim();
                          if (pattern && !branchPushPatterns.includes(pattern)) {
                            setBranchPushPatterns([...branchPushPatterns, pattern]);
                            setNewBranchPattern("");
                          }
                        }}
                        disabled={!newBranchPattern.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {branchPushPatterns.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {branchPushPatterns.map((pattern) => {
                          const isMainBranch = pattern === selectedMainBranch;
                          return (
                            <Badge 
                              key={pattern} 
                              variant={isMainBranch ? "default" : "secondary"} 
                              className={`pl-3 ${isMainBranch ? 'pr-3' : 'pr-1'} py-1.5`}
                            >
                              <code className="text-xs">{pattern}</code>
                              {isMainBranch ? (
                                <span className="ml-2 text-xs opacity-75">(required)</span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 ml-1 hover:bg-destructive/20"
                                  onClick={() => setBranchPushPatterns(branchPushPatterns.filter(p => p !== pattern))}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No patterns configured - all branch pushes will be analyzed
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="font-medium">Project Summary</div>
                <div className="text-sm space-y-1">
                  <div><span className="text-muted-foreground">Repository:</span> {selectedRepo?.fullName}</div>
                  <div><span className="text-muted-foreground">Project Name:</span> {projectName}</div>
                  <div><span className="text-muted-foreground">Main Branch:</span> {selectedMainBranch}</div>
                  <div><span className="text-muted-foreground">PR Analysis:</span> {prAnalysisEnabled ? 'Enabled' : 'Disabled'}</div>
                  <div><span className="text-muted-foreground">Branch Analysis:</span> {branchAnalysisEnabled ? 'Enabled' : 'Disabled'}</div>
                  {prTargetPatterns.length > 0 && (
                    <div><span className="text-muted-foreground">PR Target Patterns:</span> {prTargetPatterns.join(', ')}</div>
                  )}
                  {branchPushPatterns.length > 0 && (
                    <div><span className="text-muted-foreground">Branch Push Patterns:</span> {branchPushPatterns.join(', ')}</div>
                  )}
                  {selectedAiConnectionId && (
                    <div><span className="text-muted-foreground">AI Connection:</span> {aiConnections.find(c => c.id === selectedAiConnectionId)?.aiModel}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Step 4 Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePreviousStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNextStep}>
              Next: Installation Method
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}
      
      {/* Step 5: Installation Method */}
      {currentStep === 5 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Installation Method
              </CardTitle>
              <CardDescription>
                Choose how CodeCrow will receive events from your repository
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Webhook Option */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  installationMethod === 'WEBHOOK' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setInstallationMethod('WEBHOOK')}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${installationMethod === 'WEBHOOK' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Webhook className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">Webhook (Recommended)</div>
                      <Badge variant="secondary" className="text-xs">Automatic</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      CodeCrow will automatically create webhooks in your repository. 
                      Analysis triggers automatically when PRs are created or code is pushed.
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        No setup required
                      </Badge>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Instant triggers
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      installationMethod === 'WEBHOOK' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {installationMethod === 'WEBHOOK' && (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pipeline Option */}
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  installationMethod === 'PIPELINE' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setInstallationMethod('PIPELINE')}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${installationMethod === 'PIPELINE' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Workflow className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">Bitbucket Pipelines</div>
                      <Badge variant="secondary" className="text-xs">Manual Setup</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Configure your bitbucket-pipelines.yml to call CodeCrow. 
                      Useful when you want full control over when analysis runs.
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        Full control
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Custom triggers
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      installationMethod === 'PIPELINE' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {installationMethod === 'PIPELINE' && (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Info Alert */}
              {installationMethod === 'PIPELINE' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    After project creation, you'll see setup instructions for configuring your pipeline.
                    You will also need to configure webhooks manually in order to use (<code className="px-1 bg-muted rounded">/codecrow</code>) commands.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Final Summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="font-medium">Final Summary</div>
                <div className="text-sm space-y-1">
                  <div><span className="text-muted-foreground">Repository:</span> {selectedRepo?.fullName}</div>
                  <div><span className="text-muted-foreground">Project Name:</span> {projectName}</div>
                  <div><span className="text-muted-foreground">Main Branch:</span> {selectedMainBranch}</div>
                  <div><span className="text-muted-foreground">PR Analysis:</span> {prAnalysisEnabled ? 'Enabled' : 'Disabled'}</div>
                  <div><span className="text-muted-foreground">Branch Analysis:</span> {branchAnalysisEnabled ? 'Enabled' : 'Disabled'}</div>
                  <div><span className="text-muted-foreground">Installation:</span> {installationMethod === 'WEBHOOK' ? 'Automatic Webhook' : 'Bitbucket Pipelines'}</div>
                  {selectedAiConnectionId && (
                    <div><span className="text-muted-foreground">AI Connection:</span> {aiConnections.find(c => c.id === selectedAiConnectionId)?.aiModel}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Step 5 Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePreviousStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Project
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
