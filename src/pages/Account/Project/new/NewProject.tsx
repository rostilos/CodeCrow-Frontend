import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  GitBranch, 
  FileText, 
  Brain, 
  Loader2, 
  Zap,
  CheckCircle,
  Settings,
  Webhook,
  GitPullRequest,
  GitCommit,
  X,
  Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import { githubService } from "@/api_service/codeHosting/github/githubService.ts";
import { projectService, InstallationMethod } from "@/api_service/project/projectService.ts";
import { aiConnectionService, AIConnectionDTO, CreateAIConnectionRequest } from "@/api_service/ai/aiConnectionService.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";

export default function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const routes = useWorkspaceRoutes();

  // Current step: 1 = connection/repo selection, 2 = project details, 3 = AI connection
  const [currentStep, setCurrentStep] = useState(1);

  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Project details
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [selectedConnectionProvider, setSelectedConnectionProvider] = useState<string>("BITBUCKET_CLOUD");
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  
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
  const [installationMethod, setInstallationMethod] = useState<InstallationMethod | null>(null);
  
  // Branch pattern state
  const [prTargetPatterns, setPrTargetPatterns] = useState<string[]>([]);
  const [branchPushPatterns, setBranchPushPatterns] = useState<string[]>([]);
  const [newPrPattern, setNewPrPattern] = useState("");
  const [newBranchPattern, setNewBranchPattern] = useState("");

  useEffect(() => {
    // read selection returned from repo selector
    if (location.state && (location.state as any).selectedRepo) {
      setSelectedRepo((location.state as any).selectedRepo);
      // Auto-set project name from repo name
      const repo = (location.state as any).selectedRepo;
      if (!projectName) {
        setProjectName(repo.name || repo.slug || '');
      }
      // Move to step 2 if we have a repo selected
      setCurrentStep(2);
    }
    if (location.state && (location.state as any).connectionId) {
      setSelectedConnectionId(Number((location.state as any).connectionId));
    }
    if (location.state && (location.state as any).provider) {
      setSelectedConnectionProvider((location.state as any).provider);
    }
  }, [location.state]);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [bbConns, ghConns] = await Promise.all([
        bitbucketCloudService.getUserConnections(currentWorkspace.slug).catch(() => []),
        githubService.getUserConnections(currentWorkspace.slug).catch(() => [])
      ]);
      // Merge connections with provider info
      const allConns = [
        ...(bbConns || []).map((c: any) => ({ ...c, provider: 'BITBUCKET_CLOUD' })),
        ...(ghConns || []).map((c: any) => ({ ...c, provider: 'GITHUB' }))
      ];
      setConnections(allConns);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load connections",
        variant: "destructive"
      });
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRepoSelector = (connectionId: number, provider: string) => {
    navigate(routes.projectSelectRepo(connectionId), { state: { projectName, provider } });
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
  
  const handleNextStep = () => {
    if (currentStep === 1) {
      // For step 1, user should select a repo first
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
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    if (!projectName) {
      toast({
        title: "Name required",
        description: "Please provide a project name",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);

      // Generate namespace from project name (lowercase, replace spaces/special chars with dashes)
      const namespace = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      const payload: any = {
        name: projectName,
        namespace: namespace,
        description: projectDescription,
        creationMode: selectedRepo ? "IMPORT" : "MANUAL"
      };

      if (selectedConnectionId) {
        payload.vcsConnectionId = selectedConnectionId;
        payload.vcsProvider = selectedConnectionProvider;
      }
      
      if (selectedAiConnectionId) {
        payload.aiConnectionId = selectedAiConnectionId;
      }

      if (selectedRepo) {
        // Clean UUID by removing braces if present
        const cleanUUID = selectedRepo.uuid ? selectedRepo.uuid.replace(/[{}]/g, '') : 
                          (selectedRepo.id ? String(selectedRepo.id).replace(/[{}]/g, '') : undefined);
        payload.repositorySlug = selectedRepo.slug || selectedRepo.name;
        payload.repositoryUUID = cleanUUID;
      }

      const createdProject = await projectService.createProject(currentWorkspace!.slug, payload);
      
      // Update analysis settings
      if (createdProject.namespace) {
        await projectService.updateAnalysisSettings(currentWorkspace!.slug, createdProject.namespace, {
          prAnalysisEnabled,
          branchAnalysisEnabled,
          installationMethod
        });
        
        // Update branch patterns if any are set
        if (prTargetPatterns.length > 0 || branchPushPatterns.length > 0) {
          await projectService.updateBranchAnalysisConfig(currentWorkspace!.slug, createdProject.namespace, {
            prTargetBranches: prTargetPatterns,
            branchPushPatterns: branchPushPatterns
          });
        }
      }
      
      toast({
        title: "Project created",
        description: "Project was created successfully"
      });
      
      // Navigate to success page with project info
      navigate(routes.projectSetupSuccess(createdProject.namespace), {
        state: {
          project: createdProject,
          installationMethod,
          prAnalysisEnabled,
          branchAnalysisEnabled,
          prTargetPatterns,
          branchPushPatterns
        }
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(routes.projects())}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Set up a new project by connecting a repository
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
            4
          </div>
          <span className="hidden sm:inline font-medium">Analysis</span>
        </div>
      </div>

      {/* Step 1: Connection & Repository Selection */}
      {currentStep === 1 && (
        <>
          {/* Selected Repository Display */}
          {selectedRepo && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{selectedRepo.full_name || selectedRepo.name || selectedRepo.slug}</div>
                      <div className="text-sm text-muted-foreground">Selected repository</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedRepo(null)}>
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Available Connections
              </CardTitle>
              <CardDescription>Select a connection to browse its repositories</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading connections...</span>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No connections found</p>
                  <Button onClick={() => navigate(routes.hostingSettings())}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add VCS Connection
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium">{c.connectionName || c.name || `Connection ${c.id}`}</div>
                        <div className="text-sm text-muted-foreground">
                          {c.provider === 'GITHUB' ? 'GitHub' : 'Bitbucket Cloud'} • {c.workspaceId || c.workspace || ""}
                        </div>
                        <div className="text-sm text-muted-foreground">Repos: {c.repoCount ?? "-"}</div>
                      </div>
                      <Button
                        onClick={() => handleOpenRepoSelector(Number(c.id), c.provider || 'BITBUCKET_CLOUD')}
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Choose repository
                      </Button>
                    </div>
                  ))}
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
              {selectedRepo && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Selected repository</div>
                  <div className="font-medium">{selectedRepo.full_name || selectedRepo.name || selectedRepo.slug}</div>
                </div>
              )}
              
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
              <Button
                onClick={handleNextStep}
              >
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
              
              {/* Installation Method */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Installation Method</Label>
                <p className="text-sm text-muted-foreground">
                  Choose how CodeCrow will be triggered for analysis
                </p>
                
                <div className="grid gap-3">
                  <div 
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      installationMethod === 'WEBHOOK' ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setInstallationMethod('WEBHOOK')}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      installationMethod === 'WEBHOOK' ? 'border-primary' : 'border-muted-foreground'
                    }`}>
                      {installationMethod === 'WEBHOOK' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <Webhook className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">Webhook (Recommended)</div>
                      <div className="text-sm text-muted-foreground">
                        Automatic triggers via {selectedConnectionProvider === 'GITHUB' ? 'GitHub App' : 'Bitbucket webhooks'}. No setup required.
                      </div>
                    </div>
                  </div>
                  
                  {/* Show Bitbucket Pipelines only for Bitbucket connections */}
                  {selectedConnectionProvider !== 'GITHUB' && (
                    <div 
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        installationMethod === 'PIPELINE' ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setInstallationMethod('PIPELINE')}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        installationMethod === 'PIPELINE' ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {installationMethod === 'PIPELINE' && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <GitBranch className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium">Bitbucket Pipelines</div>
                        <div className="text-sm text-muted-foreground">
                          Integrate with your existing CI/CD pipeline. Requires pipeline configuration.
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show GitHub Actions only for GitHub connections */}
                  {selectedConnectionProvider === 'GITHUB' && (
                    <div 
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        installationMethod === 'GITHUB_ACTION' ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setInstallationMethod('GITHUB_ACTION')}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        installationMethod === 'GITHUB_ACTION' ? 'border-primary' : 'border-muted-foreground'
                      }`}>
                        {installationMethod === 'GITHUB_ACTION' && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <GitBranch className="h-5 w-5 text-orange-500" />
                      <div className="flex-1">
                        <div className="font-medium">GitHub Actions</div>
                        <div className="text-sm text-muted-foreground">
                          Use GitHub Actions workflow. Requires workflow configuration.
                        </div>
                      </div>
                    </div>
                  )}
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
            </CardContent>
          </Card>
          
          {/* Step 4 Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePreviousStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
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

