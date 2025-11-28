import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building, Users, Calendar, Home, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspace } from '@/context/WorkspaceContext';
import { workspaceService, CreateWorkspaceRequest } from '@/api_service/workspace/workspaceService';
import { useToast } from '@/hooks/use-toast';

export default function WorkspaceSelection() {
  const navigate = useNavigate();
  const { workspaces, setCurrentWorkspace, refreshWorkspaces, loading } = useWorkspace();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState<CreateWorkspaceRequest>({
    slug: '',
    name: '',
    description: ''
  });
  const [slugError, setSlugError] = useState<string>('');

  const handleSelectWorkspace = (workspace: any) => {
    setCurrentWorkspace(workspace);
    navigate('/dashboard/projects');
  };

  const validateSlug = (slug: string): boolean => {
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slug.trim()) {
      setSlugError('Workspace slug is required');
      return false;
    }
    if (slug.length < 3 || slug.length > 64) {
      setSlugError('Slug must be between 3 and 64 characters');
      return false;
    }
    if (!slugPattern.test(slug)) {
      setSlugError('Slug must contain only lowercase letters, numbers, and hyphens');
      return false;
    }
    setSlugError('');
    return true;
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.slug.trim() || !validateSlug(newWorkspace.slug)) {
      toast({
        title: "Validation Error",
        description: slugError || "Workspace slug is required",
        variant: "destructive",
      });
      return;
    }
    if (!newWorkspace.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Workspace name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreateLoading(true);
      const created = await workspaceService.createWorkspace(newWorkspace);
      await refreshWorkspaces();
      setCurrentWorkspace(created);
      setShowCreateDialog(false);
      setNewWorkspace({ slug: '', name: '', description: '' });
      setSlugError('');
      toast({
        title: "Success",
        description: "Workspace created successfully",
      });
      navigate('/dashboard/projects');
    } catch (error: any) {
      toast({
        title: "Failed to create workspace",
        description: error.message || "Could not create workspace",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <Building className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">Workspace Selection</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/docs")}>
              <BookOpen className="mr-2 h-4 w-4" />
              Documentation
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <Building className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Select Workspace</h1>
          <p className="text-muted-foreground text-lg">
            Choose a workspace to get started or create a new one
          </p>
        </div>

        {workspaces.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Workspaces</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first workspace
              </p>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Create Workspace</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                    <DialogDescription>
                      Set up a new workspace for your team and projects
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="workspace-slug">Workspace Slug</Label>
                      <Input
                        id="workspace-slug"
                        value={newWorkspace.slug}
                        onChange={(e) => {
                          setNewWorkspace({ ...newWorkspace, slug: e.target.value.toLowerCase() });
                          if (e.target.value) validateSlug(e.target.value.toLowerCase());
                        }}
                        placeholder="my-workspace"
                        className={slugError ? 'border-destructive' : ''}
                      />
                      {slugError && (
                        <p className="text-sm text-destructive mt-1">{slugError}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Lowercase letters, numbers, and hyphens only (3-64 chars)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="workspace-name">Workspace Name</Label>
                      <Input
                        id="workspace-name"
                        value={newWorkspace.name}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                        placeholder="Enter workspace name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workspace-description">Description (Optional)</Label>
                      <Textarea
                        id="workspace-description"
                        value={newWorkspace.description}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                        placeholder="Describe your workspace"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateWorkspace}
                        disabled={createLoading}
                        className="flex-1"
                      >
                        {createLoading ? 'Creating...' : 'Create Workspace'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Create Workspace</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                    <DialogDescription>
                      Set up a new workspace for your team and projects
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="workspace-slug">Workspace Slug</Label>
                      <Input
                        id="workspace-slug"
                        value={newWorkspace.slug}
                        onChange={(e) => {
                          setNewWorkspace({ ...newWorkspace, slug: e.target.value.toLowerCase() });
                          if (e.target.value) validateSlug(e.target.value.toLowerCase());
                        }}
                        placeholder="my-workspace"
                        className={slugError ? 'border-destructive' : ''}
                      />
                      {slugError && (
                        <p className="text-sm text-destructive mt-1">{slugError}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Lowercase letters, numbers, and hyphens only (3-64 chars)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="workspace-name">Workspace Name</Label>
                      <Input
                        id="workspace-name"
                        value={newWorkspace.name}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                        placeholder="Enter workspace name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workspace-description">Description (Optional)</Label>
                      <Textarea
                        id="workspace-description"
                        value={newWorkspace.description}
                        onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                        placeholder="Describe your workspace"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateWorkspace}
                        disabled={createLoading}
                        className="flex-1"
                      >
                        {createLoading ? 'Creating...' : 'Create Workspace'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <Card
                  key={workspace.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelectWorkspace(workspace)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{workspace.name}</span>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {workspace.members?.length || 0}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {workspace.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Created {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}