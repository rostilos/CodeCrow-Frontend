import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, Brain, Trash2, Edit, CheckCircle, XCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { aiConnectionService, AIConnectionDTO, CreateAIConnectionRequest } from "@/api_service/ai/aiConnectionService";

export default function AISettings() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [connections, setConnections] = useState<AIConnectionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingConnection, setEditingConnection] = useState<(AIConnectionDTO & { apiKey?: string }) | null>(null);
  const [newConnection, setNewConnection] = useState<CreateAIConnectionRequest>({
    name: '',
    providerKey: 'OPENROUTER',
    aiModel: '',
    apiKey: ''
  });

  const loadConnections = async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      const connectionsList = await aiConnectionService.listWorkspaceConnections(currentWorkspace.slug);
      setConnections(connectionsList || []);
    } catch (error: any) {
      toast({
        title: "Failed to load AI connections",
        description: error.message || "Could not retrieve AI connections",
        variant: "destructive",
      });
      console.error('Failed to fetch AI connections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [currentWorkspace]);

  const handleCreateConnection = async () => {
    if (!newConnection.apiKey.trim()) {
      toast({
        title: "Validation Error",
        description: "API key is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      await aiConnectionService.createConnection(currentWorkspace!.slug, newConnection);
      toast({
        title: "Success",
        description: "AI connection created successfully",
      });
      setShowCreateDialog(false);
      setNewConnection({ name: '', providerKey: 'OPENROUTER', aiModel: '', apiKey: '' });
      await loadConnections();
    } catch (error: any) {
      toast({
        title: "Failed to create AI connection",
        description: error.message || "Could not create AI connection",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConnection = async (connectionId: number) => {
    try {
      await aiConnectionService.deleteConnection(currentWorkspace!.slug, connectionId);
      toast({
        title: "Success",
        description: "AI connection deleted successfully",
      });
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (error: any) {
      toast({
        title: "Failed to delete AI connection",
        description: error.message || "Could not delete AI connection",
        variant: "destructive",
      });
    }
  };

  const handleEditConnection = (connection: AIConnectionDTO) => {
    setEditingConnection({ ...connection, apiKey: '' });
    setShowEditDialog(true);
  };

  const handleUpdateConnection = async () => {
    if (!editingConnection || !editingConnection.aiModel.trim()) {
      toast({
        title: "Validation Error",
        description: "AI model is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setEditing(true);
      await aiConnectionService.updateConnection(currentWorkspace!.slug, editingConnection.id, {
        name: editingConnection.name || undefined,
        providerKey: editingConnection.providerKey,
        aiModel: editingConnection.aiModel,
        apiKey: editingConnection.apiKey || undefined
      });
      toast({
        title: "Success",
        description: "AI connection updated successfully",
      });
      setShowEditDialog(false);
      setEditingConnection(null);
      await loadConnections();
    } catch (error: any) {
      toast({
        title: "Failed to update AI connection",
        description: error.message || "Could not update AI connection",
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    return <Brain className="h-4 w-4" />;
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      OPENAI: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      ANTHROPIC: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      OPENROUTER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      GOOGLE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    };

    return (
      <Badge className={colors[provider as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {provider}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Main Content Wrapper */}
        <div className="relative z-10 w-full">
          {/* Page Header */}
          <div className="w-full bg-background/40 backdrop-blur-xl border-b border-border/40 shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="group overflow-hidden rounded-2xl border-white/10 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-48 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl bg-background/30 border border-border/30 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                      <div className="flex justify-end pt-2">
                        <Skeleton className="h-9 w-24 rounded-lg" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full">
        {/* Page Header */}
        <div className="w-full bg-background/40 backdrop-blur-xl border-b border-border/40 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    AI Connection Settings
                  </h1>
                  <p className="text-base text-muted-foreground font-medium mt-1">
                    Manage your AI providers and models for code review
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add AI Connection</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create AI Connection</DialogTitle>
                      <DialogDescription>
                        Add a new AI provider connection to your workspace
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Model Recommendations Alert */}
                      <div className="flex justify-between gap-x-4">
                        <Alert>
                          <Info className="h-4 w-4 mb-2" />
                          <AlertTitle className="mb-2 font-bold text-sm">Model Recommendations</AlertTitle>
                          <AlertDescription className="space-y-2 text-xs">
                            <p>
                              For reliable code review, use <strong>mid-tier or higher models</strong> with at least <strong>200k context window</strong>.
                            </p>
                            <p>
                              <strong>Recommended models:</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              <li><code>google/gemini-2.5-flash</code> - 1M context, fast and reliable</li>
                              <li><code>openai/gpt-5.1-codex-mini</code> - 400k context, good for code</li>
                              <li><code>x-ai/grok-4-fast</code> - 2M context, balanced</li>
                            </ul>
                          </AlertDescription>
                        </Alert>

                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="mb-2 font-bold text-sm">Low-Tier Models Warning</AlertTitle>
                          <AlertDescription className="text-xs">
                            Free-tier or low-parameter models (&lt;70B params) often produce <strong>incomplete, inconsistent, or incorrect</strong> analysis results,
                            especially for large PRs. They may also struggle with complex code patterns and multi-file changes.
                            <p>You also need a model that supports tools, otherwise many functions will not work.</p>
                          </AlertDescription>
                        </Alert>
                      </div>

                      <div>
                        <Label htmlFor="name">Connection Name</Label>
                        <Input
                          id="name"
                          autoComplete="off"
                          value={newConnection.name || ''}
                          onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                          placeholder="e.g., Production GPT-4, Development Claude"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Give this connection a recognizable name
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="provider">AI Provider</Label>
                        <Select
                          value={newConnection.providerKey}
                          onValueChange={(value: any) =>
                            setNewConnection({ ...newConnection, providerKey: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPENAI">OpenAI</SelectItem>
                            <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                            <SelectItem value="GOOGLE">Google AI</SelectItem>
                            <SelectItem value="OPENROUTER">OpenRouter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="model">AI Model</Label>
                        <ModelSelector
                          value={newConnection.aiModel}
                          onValueChange={(value) => setNewConnection({ ...newConnection, aiModel: value })}
                          provider={newConnection.providerKey}
                          placeholder="Select a model..."
                          allowCustom={true}
                        />
                      </div>
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <PasswordInput
                          id="apiKey"
                          autoComplete="off"
                          value={newConnection.apiKey}
                          onChange={(e) => setNewConnection({ ...newConnection, apiKey: e.target.value })}
                          placeholder="Enter your API key"
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
                          onClick={handleCreateConnection}
                          disabled={creating}
                          className="flex-1"
                        >
                          {creating ? 'Creating...' : 'Create Connection'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit AI Connection</DialogTitle>
                      <DialogDescription>
                        Update your AI provider connection settings
                      </DialogDescription>
                    </DialogHeader>
                    {editingConnection && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">Connection Name</Label>
                          <Input
                            id="edit-name"
                            autoComplete="off"
                            value={editingConnection.name || ''}
                            onChange={(e) => setEditingConnection({ ...editingConnection, name: e.target.value })}
                            placeholder="e.g., Production GPT-4, Development Claude"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-provider">AI Provider</Label>
                          <Select
                            value={editingConnection.providerKey}
                            onValueChange={(value: any) =>
                              setEditingConnection({ ...editingConnection, providerKey: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPENAI">OpenAI</SelectItem>
                              <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                              <SelectItem value="GOOGLE">Google AI</SelectItem>
                              <SelectItem value="OPENROUTER">OpenRouter</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit-model">AI Model</Label>
                          <ModelSelector
                            value={editingConnection.aiModel}
                            onValueChange={(value) => setEditingConnection({ ...editingConnection, aiModel: value })}
                            provider={editingConnection.providerKey}
                            placeholder="Select a model..."
                            allowCustom={true}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-apiKey">API Key (leave empty to keep current)</Label>
                          <PasswordInput
                            id="edit-apiKey"
                            autoComplete="off"
                            value={editingConnection.apiKey || ''}
                            onChange={(e) => setEditingConnection({ ...editingConnection, apiKey: e.target.value })}
                            placeholder="Enter new API key or leave empty"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowEditDialog(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateConnection}
                            disabled={editing}
                            className="flex-1"
                          >
                            {editing ? 'Updating...' : 'Update Connection'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-10">
          <div className="space-y-6">
            <Tabs defaultValue="connections" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="connections">AI Connections</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
              </TabsList>

              <TabsContent value="connections" className="space-y-6">
                {connections.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No AI Connections</h3>
                      <p className="text-muted-foreground mb-6">
                        Get started by creating your first AI connection to enable code analysis and review features.
                      </p>
                      <Button onClick={() => setShowCreateDialog(true)} className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Create AI Connection</span>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {connections.map((connection, index) => (
                      <Card
                        key={connection.id}
                        className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 border-border/50 hover:border-primary/40 flex flex-col bg-card/60 backdrop-blur-xl overflow-hidden relative animate-in fade-in slide-in-from-bottom-8"
                        style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-80 group-hover:opacity-100 bg-[length:200%_auto] transition-all duration-500 group-hover:animate-pulse" />

                        <CardHeader className="pb-3 pt-5 px-5 relative z-10">
                          <CardTitle className="mb-2 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-background/80 shadow-sm ring-1 ring-border flex items-center justify-center shrink-0 group-hover:ring-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                                  {getProviderIcon(connection.providerKey)}
                                </div>
                                <span className="text-lg font-bold group-hover:text-primary transition-colors truncate">{connection.name || connection.aiModel}</span>
                              </div>
                              <CardDescription className="text-xs ml-[3.25rem] mt-[-0.25rem] opacity-80 group-hover:opacity-100 transition-opacity">
                                Created {new Date(connection.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <div className="flex shrink-0">
                              {getProviderBadge(connection.providerKey)}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-5 px-5 flex-1 flex flex-col gap-4 relative z-10">
                          <div className="space-y-2 mt-2 px-3 py-2 rounded-lg bg-background/50 border border-border/60 group-hover:border-primary/20 transition-colors">
                            {connection.name && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Name</span>
                                <span className="font-semibold truncate max-w-[150px]" title={connection.name}>{connection.name}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">Provider</span>
                              <span className="font-semibold">{connection.providerKey}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">Model</span>
                              <span className="font-semibold truncate max-w-[150px]" title={connection.aiModel}>{connection.aiModel}</span>
                            </div>
                          </div>

                          <div className="mt-auto pt-2 flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 shrink-0 h-9 font-semibold hover:bg-primary/10 hover:text-primary transition-colors hover:border-primary/40"
                              onClick={() => handleEditConnection(connection)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteConnection(connection.id)}
                              className="h-9 w-9 shrink-0 text-destructive border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Brain className="mr-2 h-5 w-5" />
                        Total Connections
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{connections.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Settings className="mr-2 h-5 w-5" />
                        Active Providers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Set(connections.map(c => c.providerKey)).size}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Unique AI providers configured
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Models Available
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Set(connections.map(c => c.aiModel)).size}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Different AI models configured
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>

  );
}