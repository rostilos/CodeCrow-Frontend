import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import { projectService } from "@/api_service/project/projectService.ts";
import { aiConnectionService, AIConnectionDTO } from "@/api_service/ai/aiConnectionService.ts";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();

  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectNamespace, setProjectNamespace] = useState("");
  const [aiConnections, setAiConnections] = useState<AIConnectionDTO[]>([]);
  const [selectedAiConnectionId, setSelectedAiConnectionId] = useState<number | null>(null);

  useEffect(() => {
    // read selection returned from repo selector
    if (location.state && (location.state as any).selectedRepo) {
      const repo = (location.state as any).selectedRepo;
      setSelectedRepo(repo);
      
      // Auto-populate namespace with repository slug
      const repoSlug = repo.slug || repo.name || '';
      if (repoSlug && !projectNamespace) {
        setProjectNamespace(repoSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
      }
    }
    if (location.state && (location.state as any).connectionId) {
      setSelectedConnectionId(Number((location.state as any).connectionId));
    }
  }, [location.state]);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [conns, aiConns] = await Promise.all([
        bitbucketCloudService.getUserConnections(currentWorkspace.slug).catch(() => []),
        aiConnectionService.listWorkspaceConnections(currentWorkspace.slug).catch(() => [])
      ]);
      setConnections(conns || []);
      setAiConnections(aiConns || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load connections",
        variant: "destructive"
      });
      setConnections([]);
      setAiConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRepoSelector = (connectionId: number) => {
    // Navigate to repository selector first, no project name required
    navigate(`/dashboard/projects/new/select-repo/${connectionId}`, { state: { projectName } });
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

    if (!projectNamespace) {
      toast({
        title: "Namespace required",
        description: "Please provide a project namespace",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);

      const payload: any = {
        name: projectName,
        namespace: projectNamespace,
        description: "",
        creationMode: "IMPORT",
        vcsProvider: "BITBUCKET_CLOUD",
        vcsConnectionId: selectedConnectionId
      };

      if (selectedRepo) {
        // Clean UUID by removing braces if present
        const cleanUUID = selectedRepo.uuid ? selectedRepo.uuid.replace(/[{}]/g, '') : selectedRepo.id;
        payload.repositorySlug = selectedRepo.name || selectedRepo.slug;
        payload.repositoryUUID = cleanUUID;
      }

      const project = await projectService.createProject(currentWorkspace!.slug, payload);
      
      // If AI connection selected, bind it to the project
      if (selectedAiConnectionId && project.namespace) {
        try {
          await projectService.bindAiConnection(currentWorkspace!.slug, project.namespace, selectedAiConnectionId);
        } catch (aiErr: any) {
          console.warn("Failed to bind AI connection:", aiErr);
          // Don't fail the whole creation, just show a warning
          toast({
            title: "Project created",
            description: "Project created successfully, but AI connection binding failed. You can bind it later in project settings.",
            variant: "default"
          });
        }
      }
      
      toast({
        title: "Project created",
        description: "Project was created successfully"
      });
      navigate("/dashboard/projects");
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Project</h1>
            <p className="text-muted-foreground">Select a repository first, then enter project details</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Enter project name after selecting a repository</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>

            <div>
              <Label htmlFor="project-namespace">Project Namespace</Label>
              <Input
                id="project-namespace"
                value={projectNamespace}
                onChange={(e) => setProjectNamespace(e.target.value)}
                placeholder="Enter project namespace (e.g., my-project)"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label>Selected Connection</Label>
            <div className="mt-2">
              {selectedConnectionId ? (
                <div className="text-sm text-muted-foreground">Connection ID: {selectedConnectionId}</div>
              ) : (
                <div className="text-sm text-muted-foreground">No connection selected</div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Label>Selected Repository</Label>
            <div className="mt-2">
              {selectedRepo ? (
                <>
                  <div className="font-medium">{selectedRepo.full_name || selectedRepo.name || selectedRepo.slug}</div>
                  <div className="text-sm text-muted-foreground">{selectedRepo.id}</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No repository selected</div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Label>AI Connection (Optional)</Label>
            <div className="mt-2">
              {selectedAiConnectionId ? (
                <>
                  {(() => {
                    const connection = aiConnections.find(c => c.id === selectedAiConnectionId);
                    return connection ? (
                      <>
                        <div className="font-medium">{connection.providerKey} - {connection.aiModel}</div>
                        <div className="text-sm text-muted-foreground">Model: {connection.aiModel}</div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Connection not found</div>
                    );
                  })()}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No AI connection selected</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {aiConnections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Connection (Optional)</CardTitle>
            <CardDescription>Select an AI connection to enable AI-powered features for this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiConnections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between border rounded p-4">
                  <div>
                    <div className="font-medium">{connection.providerKey} - {connection.aiModel}</div>
                    <div className="text-sm text-muted-foreground">Model: {connection.aiModel}</div>
                    <div className="text-sm text-muted-foreground">Created: {new Date(connection.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex space-x-2">
                    {selectedAiConnectionId === connection.id ? (
                      <Button variant="outline" onClick={() => setSelectedAiConnectionId(null)}>
                        Deselect
                      </Button>
                    ) : (
                      <Button onClick={() => setSelectedAiConnectionId(connection.id)}>
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Connections</CardTitle>
          <CardDescription>Select a connection to browse its repositories</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading connections...</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No connections found</p>
              <div className="mt-4 flex justify-center">
                <Button onClick={() => navigate("/dashboard/hosting")}>
                  Manage Connections
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between border rounded p-4">
                  <div>
                    <div className="font-medium">{c.connectionName || c.name || `Connection ${c.id}`}</div>
                    <div className="text-sm text-muted-foreground">{c.workspaceId || c.workspace || ""}</div>
                    <div className="text-sm text-muted-foreground">Repos: {c.repoCount ?? "-"}</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleOpenRepoSelector(Number(c.id))}
                      disabled={creating}
                      className="flex items-center"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Choose repository
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => navigate("/dashboard/projects")}>
          Close
        </Button>
        <Button onClick={handleCreate} disabled={creating || !selectedRepo || !projectName || !projectNamespace} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>
    </div>
  );
}
