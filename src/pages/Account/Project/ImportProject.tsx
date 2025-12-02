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
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { integrationService } from "@/api_service/integration/integrationService";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService";
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
 */
export default function ImportProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId');
  const provider = searchParams.get('provider') as VcsProvider;
  const connectionType = searchParams.get('connectionType');
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  // Current step: 1 = repo selection, 2 = project details, 3 = AI connection
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
    providerKey: 'OPENROUTER',
    aiModel: '',
    apiKey: '',
    tokenLimitation: '150000'
  });
  
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
      if (connectionType === 'OAUTH_MANUAL' || connectionType === 'ACCESS_TOKEN') {
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
      // For OAuth manual connections (or null/undefined), use bitbucketCloudService
      // For APP connections, use integrationService
      const isManualConnection = !connection?.connectionType || 
        connection?.connectionType === 'OAUTH_MANUAL' || 
        connection?.connectionType === 'ACCESS_TOKEN';
      
      if (isManualConnection) {
        // Use legacy OAuth endpoint for manual connections
        const res = await bitbucketCloudService.getRepositories(
          currentWorkspace.slug,
          parseInt(connectionId),
          pageNum,
          searchQuery || undefined
        );
        result = {
          items: res.items.map((r: any) => ({
            id: r.uuid || r.id || r.slug,
            slug: r.slug,
            name: r.name,
            fullName: r.fullName || r.full_name || `${r.owner?.username || r.workspace?.slug || ''}/${r.slug}`,
            description: r.description,
            isPrivate: r.isPrivate ?? r.is_private ?? true,
            defaultBranch: r.mainBranch?.name || r.defaultBranch || r.default_branch || 'main',
            cloneUrl: r.links?.clone?.[0]?.href || r.cloneUrl,
            htmlUrl: r.links?.html?.href || r.htmlUrl,
            namespace: r.owner?.username || r.workspace?.slug || '',
            avatarUrl: r.links?.avatar?.href || r.avatarUrl || null,
            isOnboarded: r.isOnboarded ?? false,
          })),
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
      toast({
        title: "Failed to load repositories",
        description: error.message,
        variant: "destructive",
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
      
      const result = await integrationService.onboardRepository(
        currentWorkspace.slug,
        provider,
        selectedRepo.slug,
        {
          vcsConnectionId: parseInt(connectionId),
          projectName: projectName,
          projectDescription: projectDescription || undefined,
          aiConnectionId: selectedAiConnectionId || undefined,
          setupWebhooks: true,
        }
      );
      
      toast({
        title: "Project created",
        description: `Successfully created project "${result.projectName}"`,
      });
      
      navigate(`/dashboard/projects/${result.projectNamespace}/setup`);
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
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/projects")}>
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
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
          </div>
          <span className="hidden sm:inline font-medium">Select Repository</span>
        </div>
        <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
          </div>
          <span className="hidden sm:inline font-medium">Project Details</span>
        </div>
        <div className={`w-12 h-0.5 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span className="hidden sm:inline font-medium">AI Connection</span>
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
            <Button variant="outline" onClick={() => navigate('/dashboard/projects')}>
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
                                <span className="font-medium">{conn.providerKey}</span>
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
                      
                      <div className="space-y-4">
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
                onClick={handleCreateProject}
                disabled={isCreating}
              >
                Skip AI Setup
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Project
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
