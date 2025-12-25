import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, GitBranch, Key, Plus, Trash2, Edit, CheckCircle, FileCode, Target, Database, AlertTriangle, GitPullRequest, GitCommit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { projectService, BindRepositoryRequest, ProjectDTO } from "@/api_service/project/projectService.ts";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import { aiConnectionService, AIConnectionDTO } from "@/api_service/ai/aiConnectionService.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { usePermissions } from "@/hooks/usePermissions";
import ProjectTokenManagement from "@/components/ProjectTokenManagement";
import DefaultBranchSelector from "@/components/DefaultBranchSelector";
import BranchPatternConfig from "@/components/BranchPatternConfig";
import RagConfiguration from "@/components/RagConfiguration";
import DangerZone from "@/components/Project/DangerZone";
import CommentCommandsConfig from "@/components/CommentCommandsConfig";

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
      const [proj, connections, aiConns] = await Promise.all([
        projectService.getProjectByNamespace(currentWorkspace.slug, namespace).catch(() => null),
        bitbucketCloudService.getUserConnections(currentWorkspace.slug).catch(() => []),
        aiConnectionService.listWorkspaceConnections(currentWorkspace.slug).catch(() => [])
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
      
      // Set current AI connection if project has one bound
      if (proj?.aiConnectionId) {
        setSelectedAiConnectionId(proj.aiConnectionId);
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

  return (
    <div className="container space-y-6 p-6">
      <Button variant="ghost" onClick={() => navigate(routes.projectDetail(namespace!))} size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Project
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground">Configure project settings and integrations</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => navigate(`?tab=${value}`)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="codehosting">Code Hosting</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="analysis-scope">Analysis Scope</TabsTrigger>
          <TabsTrigger value="ai">AI Connections</TabsTrigger>
          <TabsTrigger value="rag">RAG Indexing</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
          {canGenerateTokens() && (
            <TabsTrigger value="tokens">API Tokens</TabsTrigger>
          )}
          <TabsTrigger value="danger" className="text-destructive data-[state=active]:text-destructive">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="codehosting" className="space-y-4">
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
                          Change Repository
                        </Button>
                        {/* Unbind moved to Danger Zone tab */}
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
                  {project.vcsConnectionId ? 'Change Repository Connection' : 'Connect Repository'}
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
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <DefaultBranchSelector 
            project={project} 
            onUpdate={(updatedProject) => setProject(updatedProject)}
          />
        </TabsContent>

        <TabsContent value="analysis-scope" className="space-y-4">
          {/* Auto Analysis Settings */}
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
              
              <Button 
                onClick={handleSaveAnalysisSettings}
                disabled={savingAnalysisSettings}
              >
                <Save className="mr-2 h-4 w-4" />
                {savingAnalysisSettings ? "Saving..." : "Save Analysis Settings"}
              </Button>
            </CardContent>
          </Card>
          
          {/* Branch Pattern Config */}
          <BranchPatternConfig
            project={project}
            onUpdate={(updatedProject) => setProject(updatedProject)}
          />
          
          {/* Comment Commands Config */}
          {currentWorkspace && (
            <CommentCommandsConfig
              project={project}
              onUpdate={(updatedProject) => setProject(updatedProject)}
            />
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
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
        </TabsContent>

        {/* RAG Indexing Tab */}
        <TabsContent value="rag" className="space-y-4">
          {currentWorkspace && project && (
            <RagConfiguration
              workspaceSlug={currentWorkspace.slug}
              project={project}
              onProjectUpdate={(updatedProject) => setProject(updatedProject)}
            />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
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
        </TabsContent>

        {canGenerateTokens() && namespace && (
          <TabsContent value="tokens" className="space-y-4">
            <ProjectTokenManagement projectId={namespace} />
          </TabsContent>
        )}

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-4">
          {currentWorkspace && project && (
            <DangerZone
              project={project}
              workspaceSlug={currentWorkspace.slug}
              onProjectUpdate={(updatedProject) => setProject(updatedProject)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
