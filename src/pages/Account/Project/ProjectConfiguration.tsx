import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, GitBranch, Key, Plus, Trash2, Edit, CheckCircle, FileCode, Target, Database, AlertTriangle, GitPullRequest, GitCommit, Webhook, RefreshCw, Info, Settings, Cpu, FolderGit2, ListTodo, KeyRound, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { projectService, BindRepositoryRequest, ProjectDTO, WebhookInfoResponse } from "@/api_service/project/projectService.ts";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import { aiConnectionService, AIConnectionDTO } from "@/api_service/ai/aiConnectionService.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { usePermissions } from "@/hooks/usePermissions";
import ProjectTokenManagement from "@/components/ProjectTokenManagement";
import DefaultBranchSelector from "@/components/DefaultBranchSelector";
import BranchPatternConfig from "@/components/BranchPatternConfig";
import MainBranchSelector from "@/components/MainBranchSelector";
import RagConfiguration from "@/components/RagConfiguration";
import DangerZone from "@/components/Project/DangerZone";
import CommentCommandsConfig from "@/components/CommentCommandsConfig";
import { qualityGateService, QualityGate } from "@/api_service/qualitygate/qualityGateService";
import { cn } from "@/lib/utils";

interface ProjectCodeHostingConfig {
  id: string | number;
  name: string;
  repository?: string;
  oauthKey?: string;
  workspace?: string;
  branch?: string;
  provider?: string;
}

export default function ProjectConfiguration() {
  const { namespace } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const routes = useWorkspaceRoutes();
  const { canManageWorkspace, canGenerateTokens, loading: permissionsLoading } = usePermissions();
  
  const activeTab = searchParams.get("tab") || "general";
  
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [codeHostingConfigs, setCodeHostingConfigs] = useState<ProjectCodeHostingConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<ProjectCodeHostingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [aiConnections, setAiConnections] = useState<AIConnectionDTO[]>([]);
  const [selectedAiConnectionId, setSelectedAiConnectionId] = useState<number | null>(null);
  
  // Analysis settings state
  const [prAnalysisEnabled, setPrAnalysisEnabled] = useState(true);
  const [branchAnalysisEnabled, setBranchAnalysisEnabled] = useState(true);
  const [savingAnalysisSettings, setSavingAnalysisSettings] = useState(false);

  // Webhook management state
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfoResponse | null>(null);
  const [settingUpWebhooks, setSettingUpWebhooks] = useState(false);
  const [loadingWebhookInfo, setLoadingWebhookInfo] = useState(false);

  // Quality Gate state
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);
  const [selectedQualityGateId, setSelectedQualityGateId] = useState<number | null>(null);
  const [savingQualityGate, setSavingQualityGate] = useState(false);

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!permissionsLoading && !canManageWorkspace()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access project settings",
        variant: "destructive",
      });
      navigate(routes.projects());
    }
  }, [permissionsLoading, canManageWorkspace, navigate]);

  const load = async () => {
    if (!namespace || !currentWorkspace) return;
    setLoading(true);
    try {
      const [proj, connections, aiConns, gates] = await Promise.all([
        projectService.getProjectByNamespace(currentWorkspace.slug, namespace).catch(() => null),
        bitbucketCloudService.getUserConnections(currentWorkspace.slug).catch(() => []),
        aiConnectionService.listWorkspaceConnections(currentWorkspace.slug).catch(() => []),
        qualityGateService.getQualityGates(currentWorkspace.slug).catch(() => [])
      ]);

      setProject(proj);
      // Map bitbucket connections into UI-friendly objects
      const mapped = (connections || []).map((c: any) => ({
        id: c.id,
        name: c.name || `Connection ${c.id}`,
        repository: c.repository || '',
        oauthKey: c.oauthKey || '',
        workspace: c.workspace || '',
        branch: c.branch || 'main',
        provider: 'bitbucket'
      }));
      setCodeHostingConfigs(mapped);
      setAiConnections(aiConns || []);
      setQualityGates(gates || []);
      
      // Set current AI connection if project has one bound
      if (proj?.aiConnectionId) {
        setSelectedAiConnectionId(proj.aiConnectionId);
      }
      
      // Set current quality gate if project has one bound
      if (proj?.qualityGateId) {
        setSelectedQualityGateId(proj.qualityGateId);
      }
      
      // Set analysis settings from project
      if (proj) {
        setPrAnalysisEnabled(proj.prAnalysisEnabled ?? true);
        setBranchAnalysisEnabled(proj.ragConfig?.enabled ? true : (proj.branchAnalysisEnabled ?? true));
      }

    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load project data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  // Load webhook info when project is loaded and has VCS connection
  const loadWebhookInfo = async () => {
    if (!namespace || !currentWorkspace || !project?.vcsConnectionId) return;
    
    setLoadingWebhookInfo(true);
    try {
      const info = await projectService.getWebhookInfo(currentWorkspace.slug, namespace);
      setWebhookInfo(info);
    } catch (err: any) {
      console.error('Failed to load webhook info:', err);
      // Don't show error toast - webhook info is supplementary
    } finally {
      setLoadingWebhookInfo(false);
    }
  };

  useEffect(() => {
    if (project?.vcsConnectionId) {
      loadWebhookInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.vcsConnectionId]);

  const handleSetupWebhooks = async () => {
    if (!namespace || !currentWorkspace) return;
    
    setSettingUpWebhooks(true);
    try {
      const result = await projectService.setupWebhooks(currentWorkspace.slug, namespace);
      
      if (result.success) {
        toast({
          title: "Webhooks Configured",
          description: result.message || "Webhooks have been set up successfully"
        });
        // Reload webhook info to reflect the new state
        await loadWebhookInfo();
      } else {
        toast({
          title: "Webhook Setup Failed",
          description: result.message || "Failed to configure webhooks",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to setup webhooks",
        variant: "destructive"
      });
    } finally {
      setSettingUpWebhooks(false);
    }
  };
  
  const handleSaveAnalysisSettings = async () => {
    if (!namespace || !currentWorkspace) return;
    
    // Prevent disabling branch analysis when RAG is enabled
    const effectiveBranchAnalysisEnabled = project?.ragConfig?.enabled ? true : branchAnalysisEnabled;
    
    setSavingAnalysisSettings(true);
    try {
      await projectService.updateAnalysisSettings(currentWorkspace.slug, namespace, {
        prAnalysisEnabled,
        branchAnalysisEnabled: effectiveBranchAnalysisEnabled,
        installationMethod: project?.installationMethod || null
      });
      
      // Update local project state
      if (project) {
        setProject({
          ...project,
          prAnalysisEnabled,
          branchAnalysisEnabled: effectiveBranchAnalysisEnabled
        });
      }
      
      toast({
        title: "Success",
        description: "Analysis settings saved successfully"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save analysis settings",
        variant: "destructive"
      });
    } finally {
      setSavingAnalysisSettings(false);
    }
  };

  const handleSaveQualityGate = async () => {
    if (!namespace || !currentWorkspace) return;
    
    setSavingQualityGate(true);
    try {
      await projectService.updateProjectQualityGate(currentWorkspace.slug, namespace, selectedQualityGateId);
      
      // Update local project state
      if (project) {
        setProject({
          ...project,
          qualityGateId: selectedQualityGateId
        });
      }
      
      toast({
        title: "Success",
        description: selectedQualityGateId 
          ? "Quality gate assigned successfully"
          : "Quality gate removed from project"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to update quality gate",
        variant: "destructive"
      });
    } finally {
      setSavingQualityGate(false);
    }
  };

  const handleCreateConnection = () => {
    setEditingConfig({
      id: "",
      name: "",
      repository: "",
      oauthKey: "",
      workspace: "",
      branch: "main",
      provider: "bitbucket"
    });
    setSelectedConnectionId('');
  };

  const handleEditConnection = (config: ProjectCodeHostingConfig) => {
    setEditingConfig(config);
    setSelectedConnectionId(String(config.id));
  };

  const loadReposForConnection = async (connectionId: string | number) => {
    if (!connectionId) {
      setAvailableRepos([]);
      return;
    }
    try {
      const res = await bitbucketCloudService.getRepositories(currentWorkspace!.slug, Number(connectionId));
      // res can be an array or an object containing items + hasNext
      let items: any[] = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (res && (res as any).items) {
        items = (res as any).items;
      } else {
        items = [];
      }
      setAvailableRepos(items);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load repositories",
        variant: "destructive"
      });
      setAvailableRepos([]);
    }
  };

  useEffect(() => {
    if (selectedConnectionId) {
      loadReposForConnection(selectedConnectionId);
    } else {
      setAvailableRepos([]);
    }
  }, [selectedConnectionId]);

  const handleSaveConnection = async () => {
    if (!editingConfig || !namespace) return;
    
    // Prepare bind request according to backend DTO
    const bindRequest: BindRepositoryRequest = {
      provider: editingConfig.provider || 'bitbucket',
      connectionId: editingConfig.id && !isNaN(Number(editingConfig.id)) ? Number(editingConfig.id) : undefined,
      workspaceId: editingConfig.workspace || undefined,
      repositorySlug: editingConfig.repository || undefined,
      repositoryId: undefined,
      defaultBranch: editingConfig.branch || undefined,
      name: editingConfig.name || undefined
    };

    try {
      const updated = await projectService.bindRepository(currentWorkspace!.slug, namespace, bindRequest);
      setProject(updated);
      toast({
        title: "Success",
        description: "Repository bound to project successfully"
      });
      // refresh connections list in case it's relevant
      await load();
      setEditingConfig(null);
      setSelectedConnectionId('');
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to bind repository",
        variant: "destructive"
      });
    }
  };

  const handleDeleteConnection = async (id: string | number) => {
    if (!namespace) return;

    // If the connection is currently bound to this project, unbind; otherwise we don't manage global connections here
    if (project && project.vcsConnectionId && String(project.vcsConnectionId) === String(id)) {
      try {
        const updated = await projectService.unbindRepository(currentWorkspace!.slug, namespace);
        setProject(updated);
        toast({
          title: "Success",
          description: "Repository unbound from project"
        });
        await load();
        return;
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to unbind repository",
          variant: "destructive"
        });
        return;
      }
    }

    // Otherwise, try deleting connection record via code hosting service if available (best-effort)
    try {
      // bitbucketCloudService.deleteConnection might exist in other parts of the app; attempt if present
      // @ts-ignore
      if (bitbucketCloudService.deleteConnection) {
        // @ts-ignore
        await bitbucketCloudService.deleteConnection(Number(id));
        toast({ title: "Success", description: "Connection deleted" });
        await load();
      } else {
        toast({ title: "Info", description: "Deleting global connections is not supported here" });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete connection",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingConfig(null);
    setSelectedConnectionId('');
  };

  const handleGoBack = () => {
    navigate(routes.projects());
  };

  const handleBindAiConnection = async (aiConnectionId: number) => {
    if (!namespace) return;
    
    try {
      await projectService.bindAiConnection(currentWorkspace!.slug, namespace, aiConnectionId);
      setSelectedAiConnectionId(aiConnectionId);
      toast({
        title: "Success",
        description: "AI connection bound to project successfully"
      });
      await load(); // Refresh project data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to bind AI connection",
        variant: "destructive"
      });
    }
  };

  const handleSaveProjectInfo = async () => {
    if (!namespace || !project) return;
    try {
      await projectService.updateProject(currentWorkspace!.slug, namespace, {
        name: project.name,
        namespace: project.namespace,
        description: project.description,
      });
      toast({ title: "Success", description: "Project info updated" });
      await load();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save project",
        variant: "destructive"
      });
    }
  };

  // Navigation items configuration
  const navItems = [
    { id: "general", label: "General", icon: Settings },
    { id: "codehosting", label: "Code Hosting", icon: FolderGit2 },
    { id: "branches", label: "Branches", icon: GitBranch },
    { id: "analysis-scope", label: "Analysis Scope", icon: Target },
    { id: "quality-gate", label: "Quality Gate", icon: Shield },
    { id: "ai", label: "AI Connections", icon: Cpu },
    { id: "rag", label: "RAG Indexing", icon: Database },
    { id: "tasks", label: "Task Management", icon: ListTodo },
    ...(canGenerateTokens() ? [{ id: "tokens", label: "API Tokens", icon: KeyRound }] : []),
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true },
  ];

  const handleNavClick = (tabId: string) => {
    navigate(`?tab=${tabId}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p className="text-muted-foreground mt-2">The requested project could not be found.</p>
          <Button onClick={() => navigate(routes.projectDetail(namespace!))} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  // Render the content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Basic project details and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={project.name}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="project-namespace">Project Namespace</Label>
                <Input
                  id="project-namespace"
                  value={project.namespace || ''}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Project namespace cannot be changed after creation.
                </p>
              </div>
              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={project.description || ''}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveProjectInfo}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(routes.projectSetup(namespace!))}
                >
                  <FileCode className="mr-2 h-4 w-4" />
                  View Pipeline Setup Instructions
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "codehosting":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <GitBranch className="mr-2 h-5 w-5" />
                  <div>
                    <CardTitle>VCS Connection</CardTitle>
                    <CardDescription>
                      Repository connection for this project (only one repository can be bound)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.vcsConnectionId ? (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h3 className="font-medium">Repository Connected</h3>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>Connection ID:</strong> {project.vcsConnectionId}</p>
                            {project.projectVcsWorkspace && project.projectRepoSlug && (
                              <p><strong>Repository:</strong> {project.projectVcsWorkspace}/{project.projectRepoSlug}</p>
                            )}
                            {project.projectVcsWorkspace && (
                              <p><strong>Workspace:</strong> {project.projectVcsWorkspace}</p>
                            )}
                            {project.projectRepoSlug && (
                              <p><strong>Repository Slug:</strong> {project.projectRepoSlug}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingConfig({
                              id: project.vcsConnectionId!,
                              name: `Connection ${project.vcsConnectionId}`,
                              repository: project.projectRepoSlug || '',
                              workspace: project.projectVcsWorkspace || '',
                              branch: 'main',
                              provider: 'bitbucket'
                            })}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Change VCS Connection
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Repository Connected</h3>
                    <p className="text-muted-foreground mb-4">Connect a repository to enable code analysis and version control features.</p>
                    <Button onClick={() => setEditingConfig({
                      id: '',
                      name: '',
                      repository: '',
                      workspace: '',
                      branch: 'main',
                      provider: 'bitbucket'
                    })}>
                      <Plus className="mr-2 h-4 w-4" />
                      Connect Repository
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {editingConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GitBranch className="mr-2 h-5 w-5" />
                    {project.vcsConnectionId ? 'Change VCS Connection' : 'Connect Repository'}
                  </CardTitle>
                  <CardDescription>
                    Select a VCS connection and repository to bind to this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="vcs-connection">Available VCS Connections</Label>
                    <Select 
                      value={selectedConnectionId} 
                      onValueChange={(value) => {
                        setSelectedConnectionId(value);
                        const connection = codeHostingConfigs.find(c => String(c.id) === value);
                        if (connection) {
                          setEditingConfig({
                            ...editingConfig,
                            id: connection.id,
                            name: connection.name,
                            workspace: connection.workspace || '',
                            provider: connection.provider || 'bitbucket'
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a VCS connection" />
                      </SelectTrigger>
                      <SelectContent>
                        {codeHostingConfigs.map((config) => (
                          <SelectItem key={String(config.id)} value={String(config.id)}>
                            {config.name} ({config.provider})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedConnectionId && availableRepos.length > 0 && (
                    <div>
                      <Label htmlFor="repository">Select Repository</Label>
                      <Select 
                        value={editingConfig.repository} 
                        onValueChange={(value) => {
                          const repo = availableRepos.find(r => r.name === value);
                          setEditingConfig({
                            ...editingConfig,
                            repository: value,
                            workspace: repo?.workspace?.slug || editingConfig.workspace
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRepos.map((repo) => (
                            <SelectItem key={repo.uuid || repo.name} value={repo.name}>
                              {repo.workspace?.slug || 'Unknown'}/{repo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="workspace-display">Workspace</Label>
                      <Input
                        id="workspace-display"
                        value={editingConfig.workspace}
                        readOnly
                        placeholder="Will be set when repository is selected"
                      />
                    </div>
                    <div>
                      <Label htmlFor="branch">Default Branch</Label>
                      <Input
                        id="branch"
                        value={editingConfig.branch}
                        onChange={(e) => setEditingConfig({ ...editingConfig, branch: e.target.value })}
                        placeholder="main"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSaveConnection}
                      disabled={!selectedConnectionId || !editingConfig.repository}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {project.vcsConnectionId ? 'Update Connection' : 'Bind Repository'}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Webhook Management Card */}
            {project.vcsConnectionId && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Webhook className="mr-2 h-5 w-5" />
                        Webhook Management
                      </CardTitle>
                      <CardDescription>
                        Configure webhooks for automatic code analysis triggers
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {loadingWebhookInfo ? (
                            <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                          ) : webhookInfo?.webhooksConfigured ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          )}
                          <h3 className="font-medium">
                            {loadingWebhookInfo ? 'Loading...' : 
                              webhookInfo?.webhooksConfigured ? 'Webhooks Configured' : 'Webhooks Not Configured'}
                          </h3>
                        </div>
                        {webhookInfo && !loadingWebhookInfo && (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {webhookInfo.webhookId && (
                              <p><strong>Webhook ID:</strong> {webhookInfo.webhookId}</p>
                            )}
                            {webhookInfo.provider && (
                              <p><strong>Provider:</strong> {webhookInfo.provider}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant={webhookInfo?.webhooksConfigured ? "outline" : "default"}
                          size="sm"
                          onClick={handleSetupWebhooks}
                          disabled={settingUpWebhooks}
                        >
                          {settingUpWebhooks ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Webhook className="h-4 w-4 mr-2" />
                          )}
                          {webhookInfo?.webhooksConfigured ? 'Reconfigure Webhooks' : 'Setup Webhooks'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>When to use this feature</AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                      <p>Manual webhook setup is useful in the following scenarios:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>Repository migration:</strong> When you've moved your repository to a different location or renamed it</li>
                        <li><strong>Connection type change:</strong> After switching from PAT to Repository Token or vice versa</li>
                        <li><strong>Webhook deletion:</strong> If webhooks were accidentally deleted from your VCS provider</li>
                        <li><strong>Troubleshooting:</strong> When automatic analysis isn't triggering as expected</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {webhookInfo?.webhooksConfigured && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Important Notice</AlertTitle>
                      <AlertDescription>
                        If you're changing VCS connections or repositories, remember to manually delete 
                        the old webhooks from your VCS provider to avoid duplicate triggers or errors.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "branches":
        return (
          <div className="space-y-4">
            <MainBranchSelector
              project={project}
              onUpdate={(updatedProject) => setProject(updatedProject)}
            />
            <DefaultBranchSelector 
              project={project} 
              onUpdate={(updatedProject) => setProject(updatedProject)}
            />
          </div>
        );

      case "analysis-scope":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Auto Analysis Settings
                </CardTitle>
                <CardDescription>
                  Configure when CodeCrow should automatically analyze your code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="md:flex justify-between gap-4">
                  <div className="w-full flex items-center justify-between p-4 border rounded-lg">
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

                  <div className="w-full flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <GitCommit className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Branch Analysis</div>
                        <div className="text-sm text-muted-foreground">
                          Analyze code when branches are pushed
                          {project?.ragConfig?.enabled && (
                            <span className="block text-xs text-amber-600 mt-1">
                              Branch analysis is required when RAG indexing is enabled (for incremental updates)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={branchAnalysisEnabled}
                      onCheckedChange={setBranchAnalysisEnabled}
                      disabled={project?.ragConfig?.enabled}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveAnalysisSettings}
                  disabled={savingAnalysisSettings}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingAnalysisSettings ? "Saving..." : "Save Analysis Settings"}
                </Button>
              </CardContent>
            </Card>
            
            <BranchPatternConfig
              project={project}
              onUpdate={(updatedProject) => setProject(updatedProject)}
            />
            
            {currentWorkspace && (
              <CommentCommandsConfig
                project={project}
                onUpdate={(updatedProject) => setProject(updatedProject)}
              />
            )}
          </div>
        );

      case "quality-gate":
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  <div>
                    <CardTitle>Quality Gate</CardTitle>
                    <CardDescription>
                      Configure pass/fail criteria for code analysis
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {project?.qualityGateId && (
                <div className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-300">
                      Quality gate assigned to this project
                    </span>
                  </div>
                </div>
              )}
              
              {qualityGates.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No quality gates available</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create quality gates in your workspace settings first, then assign them to projects.
                  </p>
                  <Button onClick={() => navigate(routes.qualityGates())}>
                    <Plus className="mr-2 h-4 w-4" />
                    Manage Quality Gates
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Select Quality Gate</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose a quality gate to define pass/fail criteria for this project's analysis.
                    </p>
                    <Select 
                      value={selectedQualityGateId?.toString() || 'none'} 
                      onValueChange={(value) => setSelectedQualityGateId(value === 'none' ? null : parseInt(value))}
                    >
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Select a quality gate...">
                          {selectedQualityGateId ? (
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              <span>{qualityGates.find(g => g.id === selectedQualityGateId)?.name || 'Unknown'}</span>
                              {qualityGates.find(g => g.id === selectedQualityGateId)?.isDefault && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None (no quality gate)</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">None (no quality gate)</span>
                          </div>
                        </SelectItem>
                        {qualityGates.map((gate) => (
                          <SelectItem key={gate.id} value={gate.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              <span>{gate.name}</span>
                              {gate.isDefault && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-2">
                                  Default
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedQualityGateId && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      {(() => {
                        const gate = qualityGates.find(g => g.id === selectedQualityGateId);
                        if (!gate) return null;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{gate.name}</h4>
                              <span className={`text-xs px-2 py-1 rounded ${gate.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                {gate.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {gate.description && (
                              <p className="text-sm text-muted-foreground">{gate.description}</p>
                            )}
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">Conditions ({gate.conditions.length}):</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {gate.conditions.filter(c => c.enabled).slice(0, 3).map((c, i) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <span className="text-xs">•</span>
                                    {c.severity} issues {c.comparator === 'GREATER_THAN' ? '>' : c.comparator} {c.thresholdValue} → FAIL
                                  </li>
                                ))}
                                {gate.conditions.filter(c => c.enabled).length > 3 && (
                                  <li className="text-xs text-muted-foreground">
                                    ... and {gate.conditions.filter(c => c.enabled).length - 3} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveQualityGate}
                      disabled={savingQualityGate || selectedQualityGateId === project?.qualityGateId}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {savingQualityGate ? "Saving..." : "Save Quality Gate"}
                    </Button>
                    <Button variant="outline" onClick={() => navigate(routes.qualityGates())}>
                      Manage Quality Gates
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "ai":
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Key className="mr-2 h-5 w-5" />
                  <div>
                    <CardTitle>AI Connections</CardTitle>
                    <CardDescription>
                      Bind an AI connection to enable AI-powered features for this project
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {project?.aiConnectionId && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      AI connection is currently bound to this project
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Connection ID: {project.aiConnectionId}
                  </p>
                </div>
              )}
              
              {aiConnections.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No AI connections available</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create AI connections in your workspace settings first, then bind them to projects.
                  </p>
                  <Button onClick={() => navigate(routes.aiSettings())}>
                    <Plus className="mr-2 h-4 w-4" />
                    Manage AI Connections
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4">
                    <Label>Available AI Connections</Label>
                    <p className="text-sm text-muted-foreground">
                      Select an AI connection to bind to this project for AI-powered analysis and features.
                    </p>
                  </div>
                  
                  {aiConnections.map((connection) => (
                    <div key={connection.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h2 className="font-bold mb-2">
                            {connection.name}
                          </h2>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">
                              {connection.providerKey} - {connection.aiModel}
                            </h3>
                            <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                              {connection.providerKey.toLowerCase()}
                            </span>
                            {selectedAiConnectionId === connection.id && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Currently Bound
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Model:</strong> {connection.aiModel}</p>
                            <p><strong>Created:</strong> {new Date(connection.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {selectedAiConnectionId === connection.id ? (
                            <Button variant="outline" disabled>
                              Currently Bound
                            </Button>
                          ) : (
                            <Button onClick={() => handleBindAiConnection(connection.id)}>
                              Bind to Project
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "rag":
        return currentWorkspace && project ? (
          <RagConfiguration
            workspaceSlug={currentWorkspace.slug}
            project={project}
            onProjectUpdate={(updatedProject) => setProject(updatedProject)}
          />
        ) : null;

      case "tasks":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Task Management Configuration</CardTitle>
              <CardDescription>
                Configure task management integration for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Task management configuration coming soon...</p>
              </div>
            </CardContent>
          </Card>
        );

      case "tokens":
        return canGenerateTokens() && namespace ? (
          <ProjectTokenManagement projectId={namespace} />
        ) : null;

      case "danger":
        return currentWorkspace && project ? (
          <DangerZone
            project={project}
            workspaceSlug={currentWorkspace.slug}
            onProjectUpdate={(updatedProject) => setProject(updatedProject)}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="container p-6">
      <Button variant="ghost" onClick={() => navigate(routes.projectDetail(namespace!))} size="sm" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Project
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground">Configure project settings and integrations</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side Navigation */}
        <nav className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-6 space-y-1 bg-card rounded-lg border p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left",
                    isActive
                      ? item.danger
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                      : item.danger
                        ? "text-destructive/70 hover:bg-destructive/5 hover:text-destructive"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
