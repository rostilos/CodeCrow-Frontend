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
  Workflow
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { integrationService } from "@/api_service/integration/integrationService";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService";
import { githubService } from "@/api_service/codeHosting/github/githubService";
import { projectService } from "@/api_service/project/projectService";
import { aiConnectionService, AIConnectionDTO, CreateAIConnectionRequest } from "@/api_service/ai/aiConnectionService";
import { 
  VcsConnection, 
  VcsProvider, 
  VcsRepository 
} from "@/api_service/integration/integration.interface";

/**
 * Import Project Flow for Manual OAuth connections.
 * Steps:
 * 1. Select repository from VCS connection
 * 2. Set project name and description
 * 3. Select or create AI connection
 * 4. Analysis configuration (default branch, auto-analysis)
 */
export default function ImportProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId');
  const provider = searchParams.get('provider') as VcsProvider;
  const connectionType = searchParams.get('connectionType');
  const { currentWorkspace } = useWorkspace();
  const routes = useWorkspaceRoutes();
  const { toast } = useToast();
  
  // Current step: 1 = repo selection, 2 = project details, 3 = AI connection, 4 = analysis config, 5 = installation method
  const [currentStep, setCurrentStep] = useState(1);
  
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
  const [selectedDefaultBranch, setSelectedDefaultBranch] = useState<string>('');
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
  
  useEffect(() => {
    if (currentWorkspace && connectionId && provider) {
      loadConnection();
      loadRepositories();
    }
  }, [currentWorkspace, connectionId, provider]);
  
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
      const isManualConnection = !connectionType || 
        connectionType === 'null' ||
        connectionType === 'OAUTH_MANUAL' || 
        connectionType === 'ACCESS_TOKEN' ||
        !connection?.connectionType || 
        connection?.connectionType === 'OAUTH_MANUAL' || 
        connection?.connectionType === 'ACCESS_TOKEN';
      
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
    if (!selectedRepo) return;
    
    // Use default branch from repo metadata
    const defaultBranch = selectedRepo.defaultBranch || 'main';
    setBranches([defaultBranch, 'main', 'master', 'develop'].filter((v, i, a) => a.indexOf(v) === i));
    setSelectedDefaultBranch(defaultBranch);
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
      
      // Use unified onboardRepository flow for all connection types
      // This enables automatic webhook setup for both APP and OAUTH_MANUAL connections
      const onboardResult = await integrationService.onboardRepository(
        currentWorkspace.slug,
        provider,
        selectedRepo.slug,
        {
          vcsConnectionId: parseInt(connectionId),
          projectName: projectName,
          projectNamespace: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
          projectDescription: projectDescription || undefined,
          aiConnectionId: selectedAiConnectionId || undefined,
          defaultBranch: selectedDefaultBranch || undefined,
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
  
  if (isLoading && !connection) {
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
        <Button variant="ghost" size="sm" onClick={() => navigate(routes.projects())}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Project</h1>
          <p className="text-muted-foreground">
            Import a repository from {connection?.connectionName || 'your VCS connection'}
          </p>
        </div>
      </div>
      
      {/* Step indicator */}
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
      
      {/* Step 1: Repository Selection */}
      {currentStep === 1 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Select Repository
              </CardTitle>
              <CardDescription>
                Choose a repository to import as a project
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
                            onValueChange={(value) => setNewAiConnection(prev => ({ ...prev, providerKey: value as 'OPENAI' | 'OPENROUTER' | 'ANTHROPIC' }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPENROUTER">OpenRouter</SelectItem>
                              <SelectItem value="OPENAI">OpenAI</SelectItem>
                              <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="ai-model">Model Name</Label>
                          <Input
                            id="ai-model"
                            value={newAiConnection.aiModel}
                            onChange={(e) => setNewAiConnection(prev => ({ ...prev, aiModel: e.target.value }))}
                            placeholder={newAiConnection.providerKey === 'OPENROUTER' ? 'anthropic/claude-sonnet-4' : 'gpt-4o'}
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
              {/* Default Branch */}
              <div className="space-y-2">
                <Label htmlFor="default-branch">Default Branch</Label>
                <Select
                  value={selectedDefaultBranch}
                  onValueChange={setSelectedDefaultBranch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This branch will be used as the baseline for analysis
                </p>
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
                        {prTargetPatterns.map((pattern) => (
                          <Badge key={pattern} variant="secondary" className="pl-3 pr-1 py-1.5">
                            <code className="text-xs">{pattern}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 ml-1 hover:bg-destructive/20"
                              onClick={() => setPrTargetPatterns(prTargetPatterns.filter(p => p !== pattern))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
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
                        {branchPushPatterns.map((pattern) => (
                          <Badge key={pattern} variant="secondary" className="pl-3 pr-1 py-1.5">
                            <code className="text-xs">{pattern}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 ml-1 hover:bg-destructive/20"
                              onClick={() => setBranchPushPatterns(branchPushPatterns.filter(p => p !== pattern))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
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
                  <div><span className="text-muted-foreground">Default Branch:</span> {selectedDefaultBranch}</div>
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
                  <div><span className="text-muted-foreground">Default Branch:</span> {selectedDefaultBranch}</div>
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
