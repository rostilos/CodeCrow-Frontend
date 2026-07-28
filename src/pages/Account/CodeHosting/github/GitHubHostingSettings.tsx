import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Github,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { githubService } from "@/api_service/codeHosting/github/githubService.ts";
import {
  GitHubConnections,
  EGitSetupStatus,
} from "@/api_service/codeHosting/github/githubService.interface.ts";
import {
  integrationService,
} from "@/api_service/integration/integrationService.ts";
import type { GitHubInstallationCandidate } from "@/api_service/integration/integrationService.ts";
import { VcsConnection } from "@/api_service/integration/integration.interface.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { VcsProviderAvailability } from "@/api_service/admin/adminSettings.interface";

interface GitHubHostingSettingsProps {
  vcsAvailability?: VcsProviderAvailability | null;
}

export default function GitHubHostingSettings({
  vcsAvailability,
}: GitHubHostingSettingsProps) {
  const navigate = useNavigate();
  const routes = useWorkspaceRoutes();
  const { currentWorkspace } = useWorkspace();
  const [oauthConnections, setOauthConnections] = useState<GitHubConnections>(
    [],
  );
  const [appConnections, setAppConnections] = useState<VcsConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingConnectionId, setSyncingConnectionId] = useState<number | null>(
    null,
  );
  const [reconnectingConnectionId, setReconnectingConnectionId] = useState<
    number | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<{
    id: number;
    type: "app" | "oauth";
  } | null>(null);
  const [candidateConnectionId, setCandidateConnectionId] = useState<
    number | null
  >(null);
  const [installationCandidates, setInstallationCandidates] = useState<
    GitHubInstallationCandidate[]
  >([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(
    null,
  );
  const { toast } = useToast();

  const fetchConnections = async () => {
    if (!currentWorkspace) return;
    try {
      setIsFetchingData(true);
      // Fetch APP connections via integration API
      const appConns = await integrationService
        .getAppConnections(currentWorkspace.slug, "github")
        .catch(() => []);

      // Fetch OAuth connections
      const oauthConns = await githubService
        .getUserConnections(currentWorkspace.slug)
        .catch(() => []);
      // Filter to only show connections that are NOT in the APP connections list
      const appConnIds = new Set(appConns.map((c) => c.id));
      const filteredOauthConns = oauthConns.filter(
        (c) => !appConnIds.has(c.id),
      );

      setOauthConnections(filteredOauthConns || []);
      setAppConnections(appConns || []);
    } catch (error: any) {
      toast({
        title: "Failed to load connections",
        description: error.message || "Could not retrieve list of connections",
        variant: "destructive",
      });
      console.error("Failed to fetch connections:", error);
    } finally {
      setIsFetchingData(false);
      setIsLoading(false);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchConnections();
  }, [toast, currentWorkspace]);

  // Poll only request-bound pending rows. This never scans or re-syncs current
  // installations; the backend can resolve these rows by exact GitHub request
  // and target-account IDs.
  useEffect(() => {
    if (!currentWorkspace) return;
    const pendingRequests = appConnections.filter(
      (connection) =>
        connection.status === "PENDING" &&
        connection.installationRequestPending,
    );
    if (pendingRequests.length === 0) return;

    const intervalId = window.setInterval(async () => {
      await Promise.allSettled(
        pendingRequests.map((connection) =>
          integrationService.syncConnection(
            currentWorkspace.slug,
            "github",
            connection.id,
          ),
        ),
      );
      await fetchConnections();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [appConnections, currentWorkspace]);

  // Handle redirect from GitHub App request flow (org owner approval pending)
  useEffect(() => {
    if (searchParams.get("pending") === "true") {
      toast({
        title: "Installation request sent",
        description:
          "Your request has been sent to the organization owner. " +
          "CodeCrow will connect only the exact requested organization after approval; Check Approval refreshes it immediately.",
        duration: 10000,
      });
      // Clean up the URL param
      searchParams.delete("pending");
      searchParams.delete("connectionId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    if (
      !currentWorkspace ||
      searchParams.get("existingInstallations") !== "true"
    ) {
      return;
    }

    const parsedConnectionId = Number(searchParams.get("connectionId"));
    if (!Number.isSafeInteger(parsedConnectionId) || parsedConnectionId <= 0) {
      toast({
        title: "Could not restore GitHub installation",
        description:
          "The connection reference is missing or invalid. Start the GitHub connection again.",
        variant: "destructive",
      });
      return;
    }
    if (candidateConnectionId === parsedConnectionId) {
      return;
    }

    setCandidateConnectionId(parsedConnectionId);
    setIsLoadingCandidates(true);
    integrationService
      .getGitHubInstallationCandidates(
        currentWorkspace.slug,
        parsedConnectionId,
      )
      .then((candidates) => {
        setInstallationCandidates(candidates);
        if (candidates.length === 0) {
          toast({
            title: "No reusable installation found",
            description:
              "The GitHub installation is no longer available. Start the connection again to install CodeCrow.",
            variant: "destructive",
          });
        }
      })
      .catch((error: any) => {
        toast({
          title: "Could not load GitHub installations",
          description: error.message || "Start the GitHub connection again.",
          variant: "destructive",
        });
      })
      .finally(() => setIsLoadingCandidates(false));
  }, [
    candidateConnectionId,
    currentWorkspace,
    searchParams,
    toast,
  ]);

  const closeCandidateSelection = () => {
    setCandidateConnectionId(null);
    setInstallationCandidates([]);
    setSelectedCandidateId(null);
    const next = new URLSearchParams(searchParams);
    next.delete("existingInstallations");
    next.delete("connectionId");
    setSearchParams(next, { replace: true });
  };

  const verifyExistingInstallation = async (installationId: number) => {
    if (!currentWorkspace || candidateConnectionId == null) return;
    try {
      setSelectedCandidateId(installationId);
      const response =
        await integrationService.getGitHubInstallationCandidateVerificationUrl(
          currentWorkspace.slug,
          candidateConnectionId,
          installationId,
        );
      window.location.href = response.installUrl;
    } catch (error: any) {
      toast({
        title: "Could not verify GitHub installation",
        description: error.message || "Start the GitHub connection again.",
        variant: "destructive",
      });
      setSelectedCandidateId(null);
    }
  };

  const handleConnectGitHub = async () => {
    if (!currentWorkspace) return;
    try {
      setIsConnecting(true);
      await githubService.startOAuthFlow(currentWorkspace.slug);
    } catch (error: any) {
      toast({
        title: "Failed to start GitHub connection",
        description: error.message || "Could not start GitHub OAuth flow",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleSyncConnection = async (connectionId: number) => {
    if (!currentWorkspace) return;
    try {
      setSyncingConnectionId(connectionId);
      const connection = await integrationService.syncConnection(
        currentWorkspace.slug,
        "github",
        connectionId,
      );
      if (connection.status === "PENDING") {
        toast({
          title: connection.installationRequestPending
            ? "Still waiting for approval"
            : "Verification required",
          description: connection.installationRequestPending
            ? "The exact GitHub installation request is still pending organization-owner approval."
            : "Complete the GitHub flow to verify the selected installation.",
        });
      } else if (connection.status === "CONNECTED") {
        toast({
          title: "Connection activated",
          description: "GitHub App installation is connected.",
        });
      } else {
        toast({
          title: "Connection synced",
          description: "Connection status and repository count updated.",
        });
      }
      await fetchConnections();
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message || "Could not sync connection",
        variant: "destructive",
      });
    } finally {
      setSyncingConnectionId(null);
    }
  };

  const handleReconnect = async (connectionId: number) => {
    if (!currentWorkspace) return;
    try {
      setReconnectingConnectionId(connectionId);

      // GitHub App installation tokens are minted server-side. ERROR commonly
      // means that the one-hour installation token expired, so repair the exact
      // installation before asking GitHub for any user interaction.
      const connection = appConnections.find((c) => c.id === connectionId);
      if (connection?.installationRequestPending) {
        await handleSyncConnection(connectionId);
        setReconnectingConnectionId(null);
        return;
      }
      if (
        connection &&
        connection.connectionType === "APP" &&
        (connection.status === "CONNECTED" || connection.status === "ERROR")
      ) {
        try {
          await integrationService.refreshConnectionToken(
            currentWorkspace.slug,
            "github",
            connectionId,
          );
          toast({
            title: "Connection refreshed",
            description: "GitHub App token has been refreshed successfully.",
          });
          await fetchConnections();
          setReconnectingConnectionId(null);
          return;
        } catch {
          // If GitHub rejects the server-side refresh, verify the exact known
          // installation. The backend must not start a duplicate installation.
        }
      }

      // OAuth connections and failed App refreshes continue through the
      // provider-specific, connection-bound verification flow.
      const response = await integrationService.getReconnectUrl(
        currentWorkspace.slug,
        "github",
        connectionId,
      );
      window.location.href = response.installUrl;
    } catch (error: any) {
      toast({
        title: "Reconnect failed",
        description: error.message || "Could not start reconnection flow",
        variant: "destructive",
      });
      setReconnectingConnectionId(null);
    }
  };

  const handleDeleteConnection = async () => {
    if (!currentWorkspace || !connectionToDelete) return;
    try {
      if (connectionToDelete.type === "app") {
        await integrationService.deleteConnection(
          currentWorkspace.slug,
          "github",
          connectionToDelete.id,
        );
      } else {
        await githubService.deleteConnection(
          currentWorkspace.slug,
          connectionToDelete.id,
        );
      }
      toast({
        title: "Connection deleted",
        description:
          connectionToDelete.type === "app"
            ? "The connection and its exact GitHub App installation were removed."
            : "The connection has been removed.",
      });
      await fetchConnections();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete connection",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setConnectionToDelete(null);
    }
  };

  const openConnectionDetails = (connection: VcsConnection) => {
    navigate(
      routes.projectImport({
        connectionId: connection.id,
        provider: "github",
        connectionType: connection.connectionType,
      }),
    );
  };

  const createManualConnection = () => {
    navigate(routes.hostingGitHubAdd());
  };

  if (isFetchingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading connections...</span>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: EGitSetupStatus | string) => {
    switch (status) {
      case EGitSetupStatus.CONNECTED:
      case "CONNECTED":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case EGitSetupStatus.ERROR:
      case "ERROR":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "DISABLED":
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: EGitSetupStatus | string) => {
    switch (status) {
      case EGitSetupStatus.CONNECTED:
      case "CONNECTED":
        return (
          <Badge className="bg-success text-success-foreground">
            Connected
          </Badge>
        );
      case EGitSetupStatus.ERROR:
      case "ERROR":
        return <Badge variant="destructive">Error</Badge>;
      case "PENDING":
        return (
          <Badge className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case "DISABLED":
        return <Badge variant="secondary">Disabled</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const hasNoConnections =
    oauthConnections.length === 0 && appConnections.length === 0;

  return (
    <div className="space-y-6">
      {/* Connect GitHub Card with Tabs */}
      <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Connect GitHub
          </CardTitle>
          <CardDescription>
            Choose your preferred method to connect your GitHub account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="oauth" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="oauth">OAuth App</TabsTrigger>
              <TabsTrigger value="pat">Personal Access Token</TabsTrigger>
            </TabsList>

            {/* Option 1: OAuth (Recommended - 1-click) */}
            <TabsContent value="oauth" className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Recommended
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quick 1-click setup via OAuth 2.0. Review comments will be
                  posted as your GitHub account.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Access to your GitHub repositories
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Pull request and commit analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Organization and user repositories
                  </li>
                </ul>
                <Button
                  onClick={handleConnectGitHub}
                  disabled={
                    isConnecting ||
                    (vcsAvailability?.githubOAuth === false &&
                      vcsAvailability?.githubApp === false)
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect with GitHub
                    </>
                  )}
                </Button>
                {vcsAvailability?.githubOAuth === false &&
                  vcsAvailability?.githubApp === false && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      GitHub is not configured on this instance. Ask your site
                      administrator to set it up in Site Administration →
                      GitHub.
                    </p>
                  )}
              </div>
            </TabsContent>

            {/* Option 2: Personal Access Token */}
            <TabsContent value="pat" className="space-y-4 pt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect using a Personal Access Token for more granular
                  control over permissions.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Fine-grained access control
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Works with GitHub Enterprise
                  </li>
                </ul>
                <Button
                  onClick={createManualConnection}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Personal Access Token
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Existing Connections */}
      {appConnections.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            OAuth Connections
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {appConnections.map((connection) => (
              <Card
                key={connection.id}
                className="hover:shadow-md transition-shadow border-purple-200"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Github className="h-5 w-5" />
                      <span className="truncate">
                        {connection.externalWorkspaceSlug ||
                          connection.connectionName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(connection.status)}
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <span>
                      Organization:{" "}
                      {connection.externalWorkspaceSlug || "Personal"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Repositories:{" "}
                      </span>
                      <span className="font-medium">
                        {connection.repoCount || 0}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Connected: </span>
                      <span className="font-medium">
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Show reconnect warning only when connection has error status (refresh failed) */}
                  {connection.status === "ERROR" && (
                    <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Connection needs re-authorization</span>
                    </div>
                  )}

                  {/* Show pending approval info for org installation requests */}
                  {connection.status === "PENDING" && (
                    <div className="flex items-start gap-2 p-3 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm">
                      <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {connection.installationRequestPending
                          ? "This exact GitHub installation request is awaiting organization-owner approval. CodeCrow will only accept an installation for the requested organization."
                          : "Complete the GitHub verification flow for the selected installation."}
                      </span>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openConnectionDetails(connection)}
                      disabled={connection.status === "PENDING"}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReconnect(connection.id)}
                      disabled={reconnectingConnectionId === connection.id}
                      title={
                        connection.status === "PENDING"
                          ? connection.installationRequestPending
                            ? "Check Approval"
                            : "Verify & Connect"
                          : "Re-authorize connection"
                      }
                    >
                      {reconnectingConnectionId === connection.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="h-4 w-4" />
                          {connection.status === "PENDING" && (
                            <span className="ml-1">
                              {connection.installationRequestPending
                                ? "Check Approval"
                                : "Verify & Connect"}
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncConnection(connection.id)}
                      disabled={syncingConnectionId === connection.id}
                      title={
                        connection.status === "PENDING"
                          ? "Show verification status"
                          : "Refresh connection status"
                      }
                    >
                      {syncingConnectionId === connection.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConnectionToDelete({
                          id: connection.id,
                          type: "app",
                        });
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive"
                      title="Delete connection"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* OAuth Manual Connections */}
      {oauthConnections.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            Personal Access Token Connections
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {oauthConnections.map((connection) => (
              <Card
                key={connection.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Github className="h-5 w-5" />
                      <span className="truncate">
                        {connection.connectionName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(connection.setupStatus || "PENDING")}
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <span>
                      Organization: {connection.organizationId || "Personal"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Repositories:{" "}
                      </span>
                      <span className="font-medium">
                        {connection.repoCount || 0}
                      </span>
                    </div>
                    {connection.updatedAt && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Updated: </span>
                        <span className="font-medium">
                          {new Date(connection.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openConnectionDetails(connection)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConnectionToDelete({
                          id: connection.id,
                          type: "oauth",
                        });
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Manual Connection Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Manual Connection
          </CardTitle>
          <CardDescription>
            Add a connection using a GitHub Personal Access Token for
            fine-grained access control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={createManualConnection}>
            <Plus className="h-4 w-4 mr-2" />
            Add Personal Access Token
          </Button>
        </CardContent>
      </Card>

      {/* Empty State */}
      {hasNoConnections && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Github className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No GitHub connections yet
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your GitHub account to start analyzing your repositories.
            </p>
            <Button
              onClick={handleConnectGitHub}
              disabled={
                isConnecting ||
                (vcsAvailability?.githubOAuth === false &&
                  vcsAvailability?.githubApp === false)
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect with GitHub
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={candidateConnectionId != null}
        onOpenChange={(open) => {
          if (!open && selectedCandidateId == null) {
            closeCandidateSelection();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Use an existing GitHub installation
            </AlertDialogTitle>
            <AlertDialogDescription>
              CodeCrow is already installed for more than one account available
              to your verified GitHub user. Choose the exact account to connect
              to this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            {isLoadingCandidates && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading installations...
              </div>
            )}
            {!isLoadingCandidates &&
              installationCandidates.map((candidate) => (
                <Button
                  key={candidate.installationId}
                  variant="outline"
                  className="h-auto w-full justify-start gap-3 p-3"
                  disabled={selectedCandidateId != null}
                  onClick={() =>
                    verifyExistingInstallation(candidate.installationId)
                  }
                >
                  {candidate.accountAvatarUrl ? (
                    <img
                      src={candidate.accountAvatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <Github className="h-8 w-8" />
                  )}
                  <span className="flex-1 text-left">
                    <span className="block font-medium">
                      {candidate.accountLogin}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {candidate.accountType}
                    </span>
                  </span>
                  {selectedCandidateId === candidate.installationId && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Button>
              ))}
            {!isLoadingCandidates && installationCandidates.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No reusable installations are available.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={closeCandidateSelection}
              disabled={selectedCandidateId != null}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>
              This connection can be deleted only after its projects are
              removed or unbound. For an App connection, CodeCrow will also
              uninstall that exact GitHub App installation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConnection}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
