import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Zap,
  Plus,
  Link,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw,
  Edit,
  Server,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { taskManagementService } from "@/api_service/taskManagement/taskManagementService";
import type {
  TaskManagementConnectionResponse,
  TaskManagementConnectionRequest,
  TaskManagementConnectionStatus,
} from "@/api_service/taskManagement/taskManagement.interface";

// ─── Status helpers ────────────────────────────────────────────

function statusIcon(status: TaskManagementConnectionStatus) {
  switch (status) {
    case "CONNECTED":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "ERROR":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "PENDING":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "DISABLED":
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
}

function statusBadge(status: TaskManagementConnectionStatus) {
  const variants: Record<
    TaskManagementConnectionStatus,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    CONNECTED: "default",
    ERROR: "destructive",
    PENDING: "outline",
    DISABLED: "secondary",
  };
  return <Badge variant={variants[status] ?? "outline"}>{status}</Badge>;
}

// ─── Connection Form ──────────────────────────────────────────

interface ConnectionFormProps {
  initial?: TaskManagementConnectionResponse | null;
  onSubmit: (data: TaskManagementConnectionRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

function ConnectionForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: ConnectionFormProps) {
  const [connectionName, setConnectionName] = useState(
    initial?.connectionName ?? "",
  );
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? "");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const isEdit = !!initial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      connectionName: connectionName.trim(),
      providerType: "JIRA_CLOUD",
      baseUrl: baseUrl.trim().replace(/\/+$/, ""),
      email: email.trim(),
      apiToken: apiToken.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="connName">Connection Name</Label>
        <Input
          id="connName"
          placeholder="My Jira Cloud"
          value={connectionName}
          onChange={(e) => setConnectionName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="baseUrl">Jira URL</Label>
        <Input
          id="baseUrl"
          placeholder="https://your-domain.atlassian.net"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Your Jira Cloud instance URL (e.g., https://acme.atlassian.net)
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your-email@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {isEdit && initial?.maskedEmail && (
          <p className="text-xs text-muted-foreground">
            Current: {initial.maskedEmail}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="apiToken">API Token</Label>
        <PasswordInput
          id="apiToken"
          placeholder={
            isEdit
              ? "Leave blank to keep current token"
              : "Paste your Jira API token"
          }
          value={apiToken}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setApiToken(e.target.value)
          }
          required={!isEdit}
        />
        <p className="text-xs text-muted-foreground">
          Generate a token at{" "}
          <a
            href="https://id.atlassian.com/manage-profile/security/api-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Atlassian API Tokens
          </a>
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving…"
            : isEdit
              ? "Update Connection"
              : "Create Connection"}
        </Button>
      </div>
    </form>
  );
}

// ─── Main Page Component ──────────────────────────────────────

export default function TaskSettings() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [connections, setConnections] = useState<
    TaskManagementConnectionResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<TaskManagementConnectionResponse | null>(null);

  const loadConnections = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const data = await taskManagementService.listConnections(
        currentWorkspace.slug,
      );
      setConnections(data || []);
    } catch (error: any) {
      toast({
        title: "Failed to load connections",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, toast]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleCreate = async (data: TaskManagementConnectionRequest) => {
    if (!currentWorkspace) return;
    try {
      setSaving(true);
      await taskManagementService.createConnection(currentWorkspace.slug, data);
      toast({
        title: "Connection created",
        description: `"${data.connectionName}" has been added.`,
      });
      setShowCreateDialog(false);
      await loadConnections();
    } catch (error: any) {
      toast({
        title: "Failed to create connection",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: TaskManagementConnectionRequest) => {
    if (!currentWorkspace || !editingConnection) return;
    try {
      setSaving(true);
      await taskManagementService.updateConnection(
        currentWorkspace.slug,
        editingConnection.id,
        data,
      );
      toast({
        title: "Connection updated",
        description: `"${data.connectionName}" has been updated.`,
      });
      setEditingConnection(null);
      await loadConnections();
    } catch (error: any) {
      toast({
        title: "Failed to update connection",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (conn: TaskManagementConnectionResponse) => {
    if (!currentWorkspace) return;
    try {
      setConnections((prev) => prev.filter((c) => c.id !== conn.id));
      await taskManagementService.deleteConnection(
        currentWorkspace.slug,
        conn.id,
      );
      toast({
        title: "Connection deleted",
        description: `"${conn.connectionName}" has been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete connection",
        description: error.message,
        variant: "destructive",
      });
      await loadConnections();
    }
  };

  const handleValidate = async (conn: TaskManagementConnectionResponse) => {
    if (!currentWorkspace) return;
    try {
      setValidating(conn.id);
      const updated = await taskManagementService.validateConnection(
        currentWorkspace.slug,
        conn.id,
      );
      setConnections((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      toast({
        title:
          updated.status === "CONNECTED"
            ? "Connection valid"
            : "Connection failed",
        description:
          updated.status === "CONNECTED"
            ? `"${conn.connectionName}" is working correctly.`
            : `"${conn.connectionName}" could not connect. Check credentials.`,
        variant: updated.status === "CONNECTED" ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Validation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setValidating(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full">
        <div className="w-full bg-background/40 backdrop-blur-xl border-b border-border/40 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Task Management
                  </h1>
                  <p className="text-base text-muted-foreground font-medium mt-1">
                    Connect task tracking systems for QA auto-documentation and
                    Jira comment publishing
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Connection
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-10">
          <Tabs defaultValue="jira-cloud" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jira-cloud">Jira Cloud</TabsTrigger>
              <TabsTrigger value="jira-data-center" disabled>
                <span className="flex items-center gap-2">
                  Jira Data Center
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Coming Soon
                  </Badge>
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jira-cloud" className="space-y-6 mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-60 mt-2" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-8 w-32" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : connections.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Link className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      No Jira connections yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Connect your Jira Cloud instance to enable QA
                      auto-documentation. CodeCrow keeps the latest QA Doc per
                      PR in the project dashboard and posts test documentation
                      to linked Jira tickets.
                    </p>
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Jira Cloud Connection
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {connections
                    .filter((c) => c.providerType === "JIRA_CLOUD")
                    .map((conn) => (
                      <Card key={conn.id} className="group">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Server className="h-5 w-5 text-primary" />
                              {conn.connectionName}
                            </CardTitle>
                            {statusBadge(conn.status)}
                          </div>
                          <CardDescription className="truncate">
                            {conn.baseUrl}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Status
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 font-medium">
                                {statusIcon(conn.status)} {conn.status}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Email
                              </span>
                              <p className="mt-1 font-medium truncate">
                                {conn.maskedEmail}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Created
                              </span>
                              <p className="mt-1 font-medium">
                                {new Date(conn.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Updated
                              </span>
                              <p className="mt-1 font-medium">
                                {new Date(conn.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleValidate(conn)}
                              disabled={validating === conn.id}
                            >
                              <RefreshCw
                                className={`h-3.5 w-3.5 ${validating === conn.id ? "animate-spin" : ""}`}
                              />
                              {validating === conn.id ? "Testing…" : "Test"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => setEditingConnection(conn)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete connection?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "
                                    {conn.connectionName}" and disable QA
                                    auto-documentation for any projects using
                                    it. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(conn)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="jira-data-center">
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Server className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Badge variant="outline" className="mb-4">
                    Coming Soon
                  </Badge>
                  <h3 className="text-xl font-semibold mb-2">
                    Jira Data Center Integration
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Support for Jira Data Center (self-hosted) is on our
                    roadmap. It will support the same QA auto-documentation
                    and dashboard QA Doc features as Jira Cloud.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Jira Cloud Connection</DialogTitle>
            <DialogDescription>
              Connect your Jira Cloud instance to enable QA auto-documentation
              and Jira comment publishing for linked tickets.
            </DialogDescription>
          </DialogHeader>
          <ConnectionForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingConnection}
        onOpenChange={(open) => !open && setEditingConnection(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Connection</DialogTitle>
            <DialogDescription>
              Update your Jira Cloud connection settings.
            </DialogDescription>
          </DialogHeader>
          {editingConnection && (
            <ConnectionForm
              initial={editingConnection}
              onSubmit={handleUpdate}
              onCancel={() => setEditingConnection(null)}
              loading={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
