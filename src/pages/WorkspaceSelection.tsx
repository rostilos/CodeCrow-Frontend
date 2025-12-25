import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building, Users, Calendar, Home, BookOpen, ArrowRight } from 'lucide-react';
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
import { CodeCrowLogo } from '@/components/CodeCrowLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ROUTES } from '@/lib/routes';

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
    navigate(ROUTES.PROJECTS(workspace.slug));
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
      navigate(ROUTES.PROJECTS(created.slug));
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => navigate("/")}
            className="hover:opacity-80 transition-opacity"
          >
            <CodeCrowLogo size="md" />
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/docs")}>
              <BookOpen className="mr-2 h-4 w-4" />
              Docs
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
              <Building className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Select Workspace</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Choose a workspace to continue or create a new one
            </p>
          </div>

          {workspaces.length === 0 ? (
            /* Empty State */
            <Card className="max-w-md mx-auto border-dashed">
              <CardContent className="p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-6">
                  <Building className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Workspaces Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first workspace
                </p>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Workspace</DialogTitle>
                      <DialogDescription>
                        Set up a workspace for your team and projects
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
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
                          <p className="text-sm text-destructive">{slugError}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Lowercase letters, numbers, and hyphens only (3-64 chars)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workspace-name">Workspace Name</Label>
                        <Input
                          id="workspace-name"
                          value={newWorkspace.name}
                          onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                          placeholder="My Workspace"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workspace-description">Description (Optional)</Label>
                        <Textarea
                          id="workspace-description"
                          value={newWorkspace.description}
                          onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                          placeholder="What is this workspace for?"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
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
                        {createLoading ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            /* Workspace List */
            <div className="space-y-8">
              <div className="flex justify-end">
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Workspace</DialogTitle>
                      <DialogDescription>
                        Set up a workspace for your team and projects
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="workspace-slug-list">Workspace Slug</Label>
                        <Input
                          id="workspace-slug-list"
                          value={newWorkspace.slug}
                          onChange={(e) => {
                            setNewWorkspace({ ...newWorkspace, slug: e.target.value.toLowerCase() });
                            if (e.target.value) validateSlug(e.target.value.toLowerCase());
                          }}
                          placeholder="my-workspace"
                          className={slugError ? 'border-destructive' : ''}
                        />
                        {slugError && (
                          <p className="text-sm text-destructive">{slugError}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Lowercase letters, numbers, and hyphens only (3-64 chars)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workspace-name-list">Workspace Name</Label>
                        <Input
                          id="workspace-name-list"
                          value={newWorkspace.name}
                          onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                          placeholder="My Workspace"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workspace-description-list">Description (Optional)</Label>
                        <Textarea
                          id="workspace-description-list"
                          value={newWorkspace.description}
                          onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
                          placeholder="What is this workspace for?"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
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
                        {createLoading ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                  <Card
                    key={workspace.id}
                    className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => handleSelectWorkspace(workspace)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold truncate group-hover:text-primary transition-colors">
                            {workspace.name}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2 text-sm">
                            {workspace.description || 'No description'}
                          </CardDescription>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{workspace.membersCount ?? workspace.members?.length ?? 0} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>
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