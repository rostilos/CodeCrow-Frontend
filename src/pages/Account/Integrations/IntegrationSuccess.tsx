import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, 
  Search,
  Loader2,
  GitBranch,
  ArrowRight,
  ArrowLeft,
  Brain,
  Plus,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { integrationService } from "@/api_service/integration/integrationService";
import { aiConnectionService, AIConnectionDTO, CreateAIConnectionRequest } from "@/api_service/ai/aiConnectionService";
import { 
  VcsConnection, 
  VcsProvider, 
  VcsRepository,
  VcsRepositoryList 
} from "@/api_service/integration/integration.interface";

/**
 * Post-installation success page.
 * Shows repository selection for onboarding after app installation.
 * Step 1: Select repositories
 * Step 2: Configure AI connection
 */
export default function IntegrationSuccess() {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId');
  const { currentWorkspace } = useWorkspace();
  const routes = useWorkspaceRoutes();
  const { toast } = useToast();
  
  // Current step: 1 = repository selection, 2 = AI connection
  const [currentStep, setCurrentStep] = useState(1);
  
  const [connection, setConnection] = useState<VcsConnection | null>(null);
  const [repositories, setRepositories] = useState<VcsRepository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
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
  
  useEffect(() => {
    if (currentWorkspace && connectionId && provider) {
      loadConnection();
      loadRepositories();
    }
  }, [currentWorkspace, connectionId, provider]);
  
  const loadConnection = async () => {
    if (!currentWorkspace || !connectionId || !provider) return;
    
    try {
      const conn = await integrationService.getConnection(
        currentWorkspace.slug, 
        provider as VcsProvider, 
        parseInt(connectionId)
      );
      setConnection(conn);
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
      
      const result: VcsRepositoryList = await integrationService.listRepositories(
        currentWorkspace.slug,
        provider as VcsProvider,
        parseInt(connectionId),
        pageNum,
        searchQuery || undefined
      );
      
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
  
  const toggleRepo = (repoId: string) => {
    setSelectedRepos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(repoId)) {
        newSet.delete(repoId);
      } else {
        newSet.add(repoId);
      }
      return newSet;
    });
  };
  
  const selectAll = () => {
    const allIds = repositories
      .filter(r => !r.isOnboarded)
      .map(r => r.id);
    setSelectedRepos(new Set(allIds));
  };
  
  const deselectAll = () => {
    setSelectedRepos(new Set());
  };
  
  // Load AI connections when moving to step 2
  const loadAiConnections = async () => {
    if (!currentWorkspace) return;
    
    try {
      setIsLoadingAi(true);
      const connections = await aiConnectionService.listWorkspaceConnections(currentWorkspace.slug);
      setAiConnections(connections);
      // Auto-select first connection if available
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
  
  const handleProceedToAiStep = () => {
    if (selectedRepos.size === 0) {
      toast({
        title: "No repositories selected",
        description: "Please select at least one repository to continue",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
    loadAiConnections();
  };
  
  const handleBackToRepos = () => {
    setCurrentStep(1);
  };
  
  const handleOnboard = async () => {
    if (!currentWorkspace || !connectionId || !provider) return;
    if (selectedRepos.size === 0) return;
    
    try {
      setIsOnboarding(true);
      
      const reposToOnboard = repositories.filter(r => selectedRepos.has(r.id));
      const requests = reposToOnboard.map(repo => ({
        externalRepoId: repo.slug, // Use slug for Bitbucket API compatibility
        request: {
          vcsConnectionId: parseInt(connectionId),
          projectName: repo.name,
          projectNamespace: repo.slug,
          setupWebhooks: true,
          aiConnectionId: selectedAiConnectionId || undefined,
        },
      }));
      
      const results = await integrationService.onboardRepositories(
        currentWorkspace.slug,
        provider as VcsProvider,
        requests
      );
      
      toast({
        title: "Repositories connected",
        description: `Successfully connected ${results.length} repositories`,
      });
      
      // Refresh list to show updated status
      loadRepositories(1, false);
      setSelectedRepos(new Set());
      
      // Navigate to projects page
      navigate(routes.projects());
      
    } catch (error: any) {
      toast({
        title: "Failed to connect repositories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsOnboarding(false);
    }
  };
  
  const handleFinish = () => {
    navigate(routes.projects());
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
      {/* Success header */}
      <Card className="border-success/50 bg-success/5">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="p-3 bg-success/20 rounded-full">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connection Successful!</h2>
            <p className="text-muted-foreground">
              {connection?.connectionName || 'Your VCS connection'} is now connected.
              {currentStep === 1 ? ' Select repositories to start analyzing.' : ' Configure AI for code analysis.'}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span className="hidden sm:inline font-medium">Select Repositories</span>
        </div>
        <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
          <span className="hidden sm:inline font-medium">AI Connection</span>
        </div>
      </div>
      
      {/* Step 1: Repository selection */}
      {currentStep === 1 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Select Repositories
              </CardTitle>
              <CardDescription>
                Choose which repositories you want to connect to CodeCrow
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
              
              {/* Selection controls */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-2">
                  <Button variant="link" size="sm" onClick={selectAll} className="p-0 h-auto">
                    Select all
                  </Button>
                  <span className="text-muted-foreground">|</span>
                  <Button variant="link" size="sm" onClick={deselectAll} className="p-0 h-auto">
                    Deselect all
                  </Button>
                </div>
                <span className="text-muted-foreground">
                  {selectedRepos.size} selected
                </span>
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
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors
                        ${repo.isOnboarded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}
                        ${selectedRepos.has(repo.id) ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => !repo.isOnboarded && toggleRepo(repo.id)}
                    >
                      <Checkbox
                        checked={selectedRepos.has(repo.id) || repo.isOnboarded}
                        disabled={repo.isOnboarded}
                        onCheckedChange={() => !repo.isOnboarded && toggleRepo(repo.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{repo.name}</span>
                          {repo.isPrivate && (
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Private</span>
                          )}
                          {repo.isOnboarded && (
                            <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded">
                              Already connected
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
            <Button variant="outline" onClick={handleFinish}>
              Skip for Now
            </Button>
            <Button
              onClick={handleProceedToAiStep}
              disabled={selectedRepos.size === 0}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}
      
      {/* Step 2: AI Connection */}
      {currentStep === 2 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configure AI Connection
              </CardTitle>
              <CardDescription>
                Select or create an AI connection for code analysis. This will be used for all {selectedRepos.size} selected repositories.
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
          
          {/* Step 2 Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBackToRepos}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleFinish}>
                Skip AI Setup
              </Button>
              <Button
                onClick={handleOnboard}
                disabled={isOnboarding}
              >
                {isOnboarding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Connect {selectedRepos.size} Repositories
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
