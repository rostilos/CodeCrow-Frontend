import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { aiConnectionService, AIConnectionDTO, CreateAIConnectionRequest, UpdateAiConnectionRequest } from "@/api_service/ai/aiConnectionService";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function AIConnectionsPage() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();

  const [connections, setConnections] = useState<AIConnectionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<null | (CreateAIConnectionRequest & { id?: number })>(null);
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const list = await aiConnectionService.listWorkspaceConnections(currentWorkspace.slug);
      setConnections(list || []);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load AI connections", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace]);

  const handleCreate = () => {
    setEditing({ providerKey: "OPENAI", aiModel: "", apiKey: "", tokenLimitation: "200000" });
    setIsCreating(true);
  };

  const handleEdit = (c: AIConnectionDTO) => {
    setEditing({ id: c.id, providerKey: c.providerKey, aiModel: c.aiModel, apiKey: "", tokenLimitation: String(c.tokenLimitation) });
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!currentWorkspace || !editing) return;
    try {
      if (editing.id) {
        const payload: UpdateAiConnectionRequest = {
          providerKey: editing.providerKey,
          aiModel: editing.aiModel,
          apiKey: editing.apiKey,
          tokenLimitation: editing.tokenLimitation,
        };
        await aiConnectionService.updateConnection(currentWorkspace.slug, editing.id, payload);
        toast({ title: "Success", description: "AI connection updated" });
      } else {
        const payload: CreateAIConnectionRequest = {
          providerKey: editing.providerKey,
          aiModel: editing.aiModel,
          apiKey: editing.apiKey,
          tokenLimitation: editing.tokenLimitation,
        };
        await aiConnectionService.createConnection(currentWorkspace.slug, payload);
        toast({ title: "Success", description: "AI connection created" });
      }
      await load();
      setEditing(null);
      setIsCreating(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save connection", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!currentWorkspace) return;
    try {
      await aiConnectionService.deleteConnection(currentWorkspace.slug, id);
      toast({ title: "Success", description: "AI connection deleted" });
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete connection", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Connections</h1>
          <p className="text-muted-foreground">Manage AI provider connections for this workspace</p>
        </div>
        <div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Connection
          </Button>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        ) : (
          <>
            {editing ? (
              <Card>
                <CardHeader>
                  <CardTitle>{editing.id ? "Edit AI Connection" : "Create AI Connection"}</CardTitle>
                  <CardDescription>Provider, model and API key</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Provider</Label>
                    <Select value={editing.providerKey} onValueChange={(v) => setEditing({ ...editing, providerKey: v as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPENAI" disabled={true}>OpenAI</SelectItem>
                        <SelectItem value="OPENROUTER">OpenRouter</SelectItem>
                        <SelectItem value="ANTHROPIC" disabled={true}>Anthropic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Model</Label>
                    <Input value={editing.aiModel} onChange={(e) => setEditing({ ...editing, aiModel: e.target.value })} placeholder="e.g., gpt-5-mini" />
                  </div>

                  <div>
                    <Label>API Key</Label>
                    <PasswordInput value={editing.apiKey} onChange={(e) => setEditing({ ...editing, apiKey: e.target.value })} placeholder="sk-..." />
                  </div>

                  <div>
                    <Label>Token Limitation</Label>
                    <Input type="text" value={editing.tokenLimitation} onChange={(e) => setEditing({ ...editing, tokenLimitation: e.target.value })} placeholder="200000" />
                    <p className="text-sm text-muted-foreground mt-1">
                      For large pull requests, it can be unnecessary to check PRs with very high token counts, as this leads to high costs. 
                      This limit applies only to the fileDiff retrieval stage from your VCS platform. Recommended: 200,000 tokens.
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No AI connections available. Create one to get started.</p>
                      <div className="mt-4">
                        <Button onClick={handleCreate}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create AI Connection
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  connections.map((c) => (
                    <Card key={c.id}>
                      <CardContent className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{c.providerKey}</h3>
                            <span className="text-sm text-muted-foreground">{c.aiModel}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <div>ID: {c.id}</div>
                            <div>Created at: {new Date(c.createdAt).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
