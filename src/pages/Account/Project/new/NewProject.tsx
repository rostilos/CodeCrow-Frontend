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
import { useWorkspace } from "@/context/WorkspaceContext";

export default function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();

  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);

  useEffect(() => {
    // read selection returned from repo selector
    if (location.state && (location.state as any).selectedRepo) {
      setSelectedRepo((location.state as any).selectedRepo);
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
      const conns = await bitbucketCloudService.getUserConnections(currentWorkspace.slug).catch(() => []);
      setConnections(conns || []);
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

  const handleOpenRepoSelector = (connectionId: number) => {
    if (!projectName) {
      toast({
        title: "Name required",
        description: "Please enter a project name before selecting a repository",
        variant: "destructive"
      });
      return;
    }
    // keep projectName in state; navigate to selector and pass it along
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

    try {
      setCreating(true);

      const payload: any = {
        name: projectName,
        description: "",
        creationMode: "IMPORT" // using import when binding a repo; fallback is MANUAL
      };

      if (selectedConnectionId) {
        payload.connectionId = selectedConnectionId;
      }

      if (selectedRepo) {
        // attempt to include repo-specific fields if available
        payload.workspaceId = selectedRepo.workspace?.slug || selectedRepo.workspaceId || selectedRepo.workspace;
        payload.repositorySlug = selectedRepo.full_name || selectedRepo.slug || selectedRepo.name;
        payload.repositoryId = selectedRepo.id || selectedRepo.uuid || undefined;
      }

      const createdProject = await projectService.createProject(currentWorkspace!.slug, payload);
      toast({
        title: "Project created",
        description: "Project was created successfully"
      });
      // Redirect to setup instructions with the project namespace
      navigate(`/dashboard/projects/${createdProject.namespace}/setup`);
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
            <p className="text-muted-foreground">Choose a code-hosting connection and repository, then create the project</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Enter a name for the new project (required)</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
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
        </CardContent>
      </Card>

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
        <Button onClick={handleCreate} disabled={creating} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>
    </div>
  );
}
