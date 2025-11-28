import { useState, useEffect } from 'react';
import { Key, Copy, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { projectService, ProjectTokenDTO, CreateProjectTokenRequest } from '@/api_service/project/projectService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ProjectTokenManagementProps {
  projectId: string;
}

export default function ProjectTokenManagement({ projectId }: ProjectTokenManagementProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ProjectTokenDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTokenData, setNewTokenData] = useState<CreateProjectTokenRequest>({
    name: '',
    lifetime: '30d'
  });
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [showToken, setShowToken] = useState(false);
  const [deleteTokenId, setDeleteTokenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const loadTokens = async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      const tokenList = await projectService.listProjectTokens(currentWorkspace.slug, projectId);
      setTokens(tokenList);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load project tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, [currentWorkspace, projectId]);

  const handleCreateToken = async () => {
    if (!currentWorkspace || !newTokenData.name) {
      toast({
        title: "Error",
        description: "Please provide a token name",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      const response = await projectService.createProjectToken(currentWorkspace.slug, projectId, newTokenData);
      setGeneratedToken(response.token);
      setShowToken(true);
      toast({
        title: "Success",
        description: "Project token created successfully"
      });
      await loadTokens();
      setNewTokenData({ name: '', lifetime: '30d' });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create project token",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteToken = async (tokenId: number) => {
    if (!currentWorkspace) return;

    try {
      await projectService.deleteProjectToken(currentWorkspace.slug, projectId, tokenId);
      toast({
        title: "Success",
        description: "Token deleted successfully"
      });
      await loadTokens();
      setDeleteTokenId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete token",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Token copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy token to clipboard",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setGeneratedToken('');
    setShowToken(false);
    setNewTokenData({ name: '', lifetime: '30d' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            <div>
              <CardTitle>Project API Tokens</CardTitle>
              <CardDescription>
                Manage API tokens for programmatic access to this project
              </CardDescription>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Token
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Project Token</DialogTitle>
                <DialogDescription>
                  Generate a new API token for this project
                </DialogDescription>
              </DialogHeader>
              
              {!generatedToken ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="token-name">Token Name</Label>
                    <Input
                      id="token-name"
                      type="text"
                      placeholder="e.g., CI/CD Token"
                      value={newTokenData.name}
                      onChange={(e) => setNewTokenData({ ...newTokenData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="token-lifetime">Token Lifetime</Label>
                    <Select
                      value={newTokenData.lifetime}
                      onValueChange={(lifetime) => setNewTokenData({ ...newTokenData, lifetime })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 days</SelectItem>
                        <SelectItem value="30d">30 days</SelectItem>
                        <SelectItem value="90d">90 days</SelectItem>
                        <SelectItem value="180d">180 days</SelectItem>
                        <SelectItem value="365d">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateToken} disabled={creating || !newTokenData.name}>
                      {creating ? "Creating..." : "Create Token"}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> This token will only be shown once. Make sure to copy it and store it securely.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label htmlFor="generated-token">Generated Token</Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="generated-token"
                          type={showToken ? 'text' : 'password'}
                          value={generatedToken}
                          readOnly
                          className="pr-10"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowToken(!showToken)}
                        >
                          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button variant="outline" onClick={() => copyToClipboard(generatedToken)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button onClick={closeCreateDialog}>
                      Done
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Tokens Created</h3>
            <p className="text-muted-foreground mb-4">
              Create a secure API token to access this project programmatically.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell>{formatDate(token.createdAt)}</TableCell>
                  <TableCell>{formatDate(token.expiresAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTokenId(token.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={deleteTokenId !== null} onOpenChange={() => setDeleteTokenId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Token</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this token? This action cannot be undone and any services using this token will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTokenId && handleDeleteToken(deleteTokenId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
