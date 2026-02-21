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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Cloud,
  Edit,
  ExternalLink,
  GitBranch,
  Github,
  Info,
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
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import {
  BitbucketConnections,
  EGitSetupStatus,
} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.interface.ts";
import {
  VcsConnection,
  VcsConnectionType,
} from "@/api_service/integration/integration.interface.ts";
import {
  integrationService,
  BitbucketConnectInstallation,
} from "@/api_service/integration/integrationService.ts";
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
import GitHubHostingSettings from "@/pages/Account/CodeHosting/github/GitHubHostingSettings.tsx";
import GitLabHostingSettings from "@/pages/Account/CodeHosting/gitlab/GitLabHostingSettings.tsx";
import bitbucketAppSetupImg from "@/assets/bitbucket-app-setup.png";
import { cn } from "@/lib/utils";
import { adminSettingsService } from "@/api_service/admin/adminSettingsService";
import type { VcsProviderAvailability } from "@/api_service/admin/adminSettings.interface";

// Bitbucket icon component
const BitbucketIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
  </svg>
);

// GitLab icon component
const GitLabIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z" />
  </svg>
);

const navItems = [
  { id: "bitbucket", label: "Bitbucket", icon: BitbucketIcon },
  { id: "github", label: "GitHub", icon: Github },
  { id: "gitlab", label: "GitLab", icon: GitLabIcon },
];

interface BitbucketConnection {
  id: string;
  name: string;
  workspace: string;
  connectedAccount: string;
  status: "connected" | "disconnected" | "error";
  lastSync: string;
  repositories: number;
}

export default function HostingSettings() {
  const navigate = useNavigate();
  const routes = useWorkspaceRoutes();
  const { currentWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  const [manualConnections, setManualConnections] =
    useState<BitbucketConnections>([]);
  const [appConnections, setAppConnections] = useState<VcsConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isInstallingApp, setIsInstallingApp] = useState(false);
  const [syncingConnectionId, setSyncingConnectionId] = useState<number | null>(
    null,
  );
  const [reconnectingConnectionId, setReconnectingConnectionId] = useState<
    number | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<{
    id: number;
    type: "app" | "manual";
  } | null>(null);
  const { toast } = useToast();

  // Connect App state
  const [connectInstallStatus, setConnectInstallStatus] = useState<
    string | null
  >(null);
  const [isConnectAppConfigured, setIsConnectAppConfigured] = useState(false);
  const [unlinkedInstallations, setUnlinkedInstallations] = useState<
    BitbucketConnectInstallation[]
  >([]);
  const [linkingInstallationId, setLinkingInstallationId] = useState<
    number | null
  >(null);

  // VCS provider availability (fetched from public site config)
  const [vcsAvailability, setVcsAvailability] =
    useState<VcsProviderAvailability | null>(null);

  // Check if Connect App is configured and load unlinked installations
  useEffect(() => {
    const checkConnectAppConfig = async () => {
      try {
        const status = await integrationService.getBitbucketConnectStatus();
        setIsConnectAppConfigured(status.configured);

        if (status.configured) {
          // Load unlinked installations
          const unlinked =
            await integrationService.getUnlinkedConnectInstallations();
          setUnlinkedInstallations(unlinked);
        }
      } catch {
        // Connect App not available, use OAuth fallback
        setIsConnectAppConfigured(false);
      }
    };
    checkConnectAppConfig();
  }, []);

  // Fetch VCS provider availability from public site config
  useEffect(() => {
    const fetchVcsAvailability = async () => {
      try {
        const config = await adminSettingsService.getPublicConfig();
        if (config.vcsProviders) {
          setVcsAvailability(config.vcsProviders);
        }
      } catch {
        // If fetch fails, leave as null (all options will be shown by default)
      }
    };
    fetchVcsAvailability();
  }, []);

  const fetchConnections = async () => {
    if (!currentWorkspace) return;
    try {
      setIsFetchingData(true);
      // Fetch APP connections via integration API (filtered by connectionType=APP)
      const appConns = await integrationService
        .getAppConnections(currentWorkspace.slug, "bitbucket-cloud")
        .catch(() => []);

      // Fetch manual connections via legacy API and filter out APP connections
      const allManualConns = await bitbucketCloudService
        .getUserConnections(currentWorkspace.slug)
        .catch(() => []);
      // Filter to only show connections that are NOT in the APP connections list
      const appConnIds = new Set(appConns.map((c) => c.id));
      const manualConns = allManualConns.filter((c) => !appConnIds.has(c.id));

      setManualConnections(manualConns || []);
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

  useEffect(() => {
    fetchConnections();
  }, [toast, currentWorkspace]);

  const handleInstallApp = async () => {
    if (!currentWorkspace) return;
    try {
      setIsInstallingApp(true);
      await integrationService.startAppInstall(
        currentWorkspace.slug,
        "bitbucket-cloud",
      );
    } catch (error: any) {
      toast({
        title: "Failed to start installation",
        description:
          error.message || "Could not start Bitbucket app installation",
        variant: "destructive",
      });
      setIsInstallingApp(false);
    }
  };

  /**
   * Handle Bitbucket Connect App installation.
   * Opens popup for Bitbucket authorization. User enables dev mode in Bitbucket,
   * app installs automatically, then user clicks "Manage App" to complete setup.
   */
  const handleConnectAppInstall = async () => {
    if (!currentWorkspace) return;

    try {
      setConnectInstallStatus("starting");

      const result =
        await integrationService.startBitbucketConnectInstallWithTracking(
          currentWorkspace.id,
          currentWorkspace.slug,
          (status) => setConnectInstallStatus(status),
        );

      if (result.status === "installed_pending_link") {
        toast({
          title: "Installation Found!",
          description: `Bitbucket workspace "${result.workspaceSlug}" is ready to link.`,
        });

        // Refresh to show the pending installation
        const unlinked =
          await integrationService.getUnlinkedConnectInstallations();
        setUnlinkedInstallations(unlinked);
      } else if (result.status === "completed") {
        toast({
          title: "Bitbucket Connected!",
          description: `Successfully connected to ${result.workspaceSlug || "Bitbucket workspace"}`,
        });
        await fetchConnections();
      } else if (result.status === "no_installation") {
        toast({
          title: "No Installation Found",
          description:
            "The app wasn't installed. Please try again and make sure to enable development mode in Bitbucket when prompted.",
          variant: "destructive",
        });
      } else if (
        result.status === "popup_closed" ||
        result.status === "timeout"
      ) {
        // User closed popup, just refresh in case installation happened
        const unlinked =
          await integrationService.getUnlinkedConnectInstallations();
        if (unlinked.length > 0) {
          setUnlinkedInstallations(unlinked);
          toast({
            title: "Installation Found!",
            description: "Click 'Link to Workspace' to complete the setup.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Installation failed",
        description: error.message || "Could not complete the installation",
        variant: "destructive",
      });
    } finally {
      setConnectInstallStatus(null);
    }
  };

  const isConnectInstalling =
    connectInstallStatus === "starting" ||
    connectInstallStatus === "waiting" ||
    connectInstallStatus === "checking";

  /**
   * Link an unlinked Bitbucket Connect installation to the current workspace.
   */
  const handleLinkInstallation = async (installationId: number) => {
    if (!currentWorkspace) return;

    try {
      setLinkingInstallationId(installationId);
      await integrationService.linkConnectInstallation(
        installationId,
        currentWorkspace.id,
      );

      toast({
        title: "Installation Linked!",
        description:
          "The Bitbucket workspace has been linked to your CodeCrow workspace",
      });

      // Refresh data
      await fetchConnections();

      // Remove from unlinked list
      setUnlinkedInstallations((prev) =>
        prev.filter((i) => i.id !== installationId),
      );
    } catch (error: any) {
      toast({
        title: "Failed to link installation",
        description: error.message || "Could not link the installation",
        variant: "destructive",
      });
    } finally {
      setLinkingInstallationId(null);
    }
  };

  const handleSyncAppConnection = async (connectionId: number) => {
    if (!currentWorkspace) return;
    try {
      setSyncingConnectionId(connectionId);
      await integrationService.syncConnection(
        currentWorkspace.slug,
        "bitbucket-cloud",
        connectionId,
      );
      toast({
        title: "Connection synced",
        description: "Connection status and repository count updated.",
      });
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
      const response = await integrationService.getReconnectUrl(
        currentWorkspace.slug,
        "bitbucket-cloud",
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
          "bitbucket-cloud",
          connectionToDelete.id,
        );
      } else {
        await bitbucketCloudService.deleteConnection(
          currentWorkspace.slug,
          connectionToDelete.id,
        );
      }
      toast({
        title: "Connection deleted",
        description: "The connection has been removed.",
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

  const openAppConnectionDetails = (connection: VcsConnection) => {
    // Use unified import flow for APP connections
    navigate(
      routes.projectImport({
        connectionId: connection.id,
        provider: "bitbucket-cloud",
        connectionType: connection.connectionType,
      }),
    );
  };

  if (isFetchingData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full">
          {/* Page Header */}
          <div className="w-full bg-background/40 backdrop-blur-xl border-b border-border/40 shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner block">
                    <Cloud className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96 max-w-full" />
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <div className="flex space-x-2 border-b border-border/40 pb-px">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-24 rounded-t-lg rounded-b-none" />)}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 lg:px-8 py-8 space-y-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-96 max-w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i} className="group overflow-hidden rounded-2xl border-white/10 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-background/30 rounded-xl border border-border/30 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Skeleton className="h-9 w-24" />
                          <Skeleton className="h-9 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const createBitbucketConnection = () => {
    navigate(routes.hostingAddConnection());
  };

  const configureBitbucketConnection = (connectionId: number) => {
    navigate(routes.hostingConfigure(connectionId));
  };

  const modifyBitbucketConnection = (connectionId: number) => {
    navigate(routes.hostingConfigure(connectionId));
  };

  const getStatusIcon = (status: EGitSetupStatus) => {
    switch (status) {
      case EGitSetupStatus.CONNECTED:
        return <CheckCircle className="h-5 w-5 text-success" />;
      case EGitSetupStatus.ERROR:
        return <XCircle className="h-5 w-5 text-destructive" />;
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
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getConnectionTypeBadge = (type: VcsConnectionType) => {
    switch (type) {
      case "APP":
      case "CONNECT_APP":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            <Zap className="h-3 w-3 mr-1" />
            App
          </Badge>
        );
      case "OAUTH_MANUAL":
        return (
          <Badge variant="outline">
            <Settings className="h-3 w-3 mr-1" />
            OAuth
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const hasNoConnections =
    manualConnections.length === 0 && appConnections.length === 0;

  const activeTab = searchParams.get("tab") || "bitbucket";

  const handleNavClick = (tabId: string) => {
    navigate(`?tab=${tabId}`);
  };

  const renderBitbucketContent = () => (
    <div className="space-y-6">
      {/* New Connection Options Card with 3 tabs */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Connect Bitbucket Cloud
          </CardTitle>
          <CardDescription>
            Choose your preferred method to connect your Bitbucket workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="oauth-app" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="oauth-app">OAuth App</TabsTrigger>
              <TabsTrigger value="connect-app">Connect App</TabsTrigger>
              <TabsTrigger value="manual">Manual OAuth</TabsTrigger>
            </TabsList>

            {/* Option 1: OAuth App (Recommended - 1-click) */}
            <TabsContent value="oauth-app" className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Recommended for personal workspaces
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quick 1-click setup via OAuth 2.0. Review comments will be
                  posted as your Bitbucket account.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Fastest setup - just authorize and go
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    User-level integration (tied to personal account)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Works with any Bitbucket workspace you have access to
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Automatic webhook configuration
                  </li>
                </ul>
                <Button
                  onClick={handleInstallApp}
                  disabled={
                    isInstallingApp || vcsAvailability?.bitbucketOAuth === false
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isInstallingApp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect with Bitbucket
                    </>
                  )}
                </Button>
                {vcsAvailability?.bitbucketOAuth === false && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Bitbucket OAuth is not configured on this instance. Ask your
                    site administrator to set it up in Site Administration →
                    Bitbucket.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Option 2: Connect App (Workspace-level) */}
            <TabsContent value="connect-app" className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Workspace Integration</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Install CodeCrow as a Bitbucket Connect app at the workspace
                  level. Comments are posted by the CodeCrow app.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Workspace-level integration (not tied to personal account)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Comments appear as "CodeCrow" bot
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Requires workspace admin + enabling development mode
                  </li>
                </ul>

                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 dark:text-blue-200 text-sm">
                    How it works
                  </AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs flex justify-between gap-x-4">
                    <div className="w-1/2">
                      <ol className="list-decimal list-inside space-y-1 mt-2 mb-4">
                        <li>Click "Install Connect App" below</li>
                        <li>
                          Bitbucket will ask you to{" "}
                          <strong>enable development mode</strong> - click to
                          enable
                        </li>
                        <li>Authorize the app installation</li>
                        <li>
                          After install, click <strong>"Manage App"</strong> in
                          Bitbucket to complete setup
                        </li>
                      </ol>
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                          <span>Why development mode is required?</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 text-xs text-muted-foreground space-y-2">
                          <p>
                            <strong>
                              Bitbucket deprecated OAuth Connect Apps
                            </strong>{" "}
                            from being listed on the Atlassian Marketplace. New
                            Connect apps must use development mode for
                            installation.
                          </p>
                          <p>
                            <strong>Forge is not suitable</strong> for
                            CodeCrow's use case — it cannot provide the speed
                            and quality of analysis we deliver, nor support full
                            auto-setup of webhooks and repositories.
                          </p>
                          <p className="text-muted-foreground/70">
                            Development mode is a one-time setup per workspace
                            and doesn't affect your other apps.
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    <img
                      src={bitbucketAppSetupImg}
                      alt="Bitbucket Manage App button location"
                      className="rounded-lg border shadow-sm max-h-96 object-contain"
                    />
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full"
                  onClick={handleConnectAppInstall}
                  disabled={
                    isConnectInstalling ||
                    vcsAvailability?.bitbucketConnect === false
                  }
                >
                  {isConnectInstalling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {connectInstallStatus === "waiting"
                        ? "Waiting for Bitbucket..."
                        : connectInstallStatus === "checking"
                          ? "Checking installation..."
                          : "Starting..."}
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Install Connect App
                    </>
                  )}
                </Button>
                {vcsAvailability?.bitbucketConnect === false && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Bitbucket Connect App is not configured on this instance.
                    Ask your site administrator to set it up in Site
                    Administration → Bitbucket Connect.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Option 3: Manual OAuth (Bring your own credentials) */}
            <TabsContent value="manual" className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Advanced</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use your own Bitbucket OAuth consumer credentials. Best for
                  enterprise setups or when you want full control.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Full control over OAuth credentials
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Can use existing OAuth consumers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Enterprise/compliance friendly
                  </li>
                </ul>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle className="text-sm">Setup Required</AlertTitle>
                  <AlertDescription className="text-xs space-y-2">
                    <p>
                      You'll need to create an OAuth consumer in your Bitbucket
                      workspace settings.{" "}
                      <a
                        href="https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Official docs <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                    <div className="mt-2">
                      <p className="font-medium text-foreground mb-1">
                        Required permissions:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                        <li>
                          <strong>Account</strong> → Read
                        </li>
                        <li>
                          <strong>Repositories</strong> → Read
                        </li>
                        <li>
                          <strong>Pull Requests</strong> → Read
                        </li>
                        <li>
                          <strong>Webhooks</strong> → Read & Write
                        </li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(routes.hostingAddConnection())}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Manual OAuth
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Unlinked Installations Section */}
      {unlinkedInstallations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
              Pending Bitbucket Installations
            </CardTitle>
            <CardDescription>
              These Bitbucket workspaces have installed CodeCrow but haven't
              been linked to your CodeCrow workspace yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {unlinkedInstallations.map((installation) => (
              <div
                key={installation.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">
                      {installation.bitbucketWorkspaceName ||
                        installation.bitbucketWorkspaceSlug}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{installation.bitbucketWorkspaceSlug}
                      {installation.installedByUsername &&
                        ` • Installed by ${installation.installedByUsername}`}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleLinkInstallation(installation.id)}
                  disabled={linkingInstallationId === installation.id}
                  size="sm"
                >
                  {linkingInstallationId === installation.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Link to Workspace
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* App Connections Section */}
      {appConnections.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            App Connections
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {appConnections.map((connection, index) => (
              <Card
                key={connection.id}
                className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 border-border/50 hover:border-primary/40 flex flex-col bg-card/60 backdrop-blur-xl overflow-hidden relative animate-in fade-in slide-in-from-bottom-8"
                style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/60 via-blue-500 to-blue-500/60 opacity-80 group-hover:opacity-100 bg-[length:200%_auto] transition-all duration-500 group-hover:animate-pulse" />
                <CardHeader className="pb-3 pt-5 px-5 relative z-10">
                  <CardTitle className="mb-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-background/80 shadow-sm ring-1 ring-border flex items-center justify-center shrink-0 group-hover:ring-blue-500/40 group-hover:bg-blue-500/10 transition-all duration-300">
                          <Cloud className="h-5 w-5 text-blue-500/80 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300" />
                        </div>
                        <span className="text-lg font-bold group-hover:text-blue-500 transition-colors truncate">
                          {connection.externalWorkspaceSlug || connection.connectionName}
                        </span>
                      </div>
                      <CardDescription className="text-xs ml-[3.25rem] mt-[-0.25rem] opacity-80 group-hover:opacity-100 transition-opacity">
                        Connected {new Date(connection.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {getConnectionTypeBadge(connection.connectionType)}
                      {getStatusBadge(connection.status)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-5 px-5 flex-1 flex flex-col gap-4 relative z-10">
                  <div className="space-y-2 mt-2 px-3 py-2 rounded-lg bg-background/50 border border-border/60 group-hover:border-blue-500/20 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Workspace</span>
                      <span className="font-semibold truncate max-w-[150px]">{connection.externalWorkspaceSlug || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Repositories</span>
                      <span className="font-semibold">{connection.repoCount || 0}</span>
                    </div>
                    {connection.tokenExpiresAt && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Expires</span>
                        <span className="font-semibold">{new Date(connection.tokenExpiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {connection.status === "ERROR" && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 mt-1 flex-shrink-0">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="truncate">Auth required</span>
                    </div>
                  )}

                  <div className="mt-auto pt-2 grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-2 h-9 font-semibold hover:bg-blue-500/10 hover:text-blue-500 transition-colors hover:border-blue-500/40"
                      onClick={() => openAppConnectionDetails(connection)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-full shrink-0 border-border/60 hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => handleReconnect(connection.id)}
                      disabled={reconnectingConnectionId === connection.id}
                      title="Re-authorize connection"
                    >
                      {reconnectingConnectionId === connection.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-full shrink-0 border-border/60 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors hover:border-destructive/30"
                      onClick={() => {
                        setConnectionToDelete({ id: connection.id, type: "app" });
                        setDeleteDialogOpen(true);
                      }}
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

      {/* Manual Connections Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manual OAuth Connections
          </h3>
          <Button
            onClick={createBitbucketConnection}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Manual Connection
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading connections...</div>
          </div>
        ) : manualConnections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Manual Connections
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Manual OAuth connections give you more control over individual
                repository access.
              </p>
              <Button onClick={createBitbucketConnection} variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Manual Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {manualConnections.map((connection, index) => (
              <Card
                key={connection.id}
                className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 border-border/50 hover:border-primary/40 flex flex-col bg-card/60 backdrop-blur-xl overflow-hidden relative animate-in fade-in slide-in-from-bottom-8"
                style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-500/60 via-gray-500 to-gray-500/60 opacity-80 group-hover:opacity-100 bg-[length:200%_auto] transition-all duration-500 group-hover:animate-pulse" />
                <CardHeader className="pb-3 pt-5 px-5 relative z-10">
                  <CardTitle className="mb-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-background/80 shadow-sm ring-1 ring-border flex items-center justify-center shrink-0 group-hover:ring-gray-500/40 group-hover:bg-gray-500/10 transition-all duration-300">
                          {getStatusIcon(connection.setupStatus || EGitSetupStatus.PENDING)}
                        </div>
                        <span className="text-lg font-bold group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors truncate">
                          {connection.connectionName}
                        </span>
                      </div>
                      <CardDescription className="text-xs ml-[3.25rem] mt-[-0.25rem] opacity-80 group-hover:opacity-100 transition-opacity">
                        Workspace: {connection.workspaceId}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="outline" className="text-[10px] py-0">
                        <Settings className="h-3 w-3 mr-1" />
                        OAuth
                      </Badge>
                      {getStatusBadge(connection.setupStatus || EGitSetupStatus.PENDING)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-5 px-5 flex-1 flex flex-col gap-4 relative z-10">
                  <div className="space-y-2 mt-2 px-3 py-2 rounded-lg bg-background/50 border border-border/60 group-hover:border-gray-500/20 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Repositories</span>
                      <span className="font-semibold">{connection.repoCount}</span>
                    </div>
                  </div>

                  {connection.setupStatus === EGitSetupStatus.ERROR && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 mt-1 flex-shrink-0">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="truncate">Check credentials</span>
                    </div>
                  )}

                  <div className="mt-auto pt-2 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 font-semibold hover:bg-gray-500/10 hover:text-foreground transition-colors hover:border-gray-500/40"
                      onClick={() => configureBitbucketConnection(connection.id)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0 border-border/60 hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => modifyBitbucketConnection(connection.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "bitbucket":
        return renderBitbucketContent();
      case "github":
        return <GitHubHostingSettings vcsAvailability={vcsAvailability} />;
      case "gitlab":
        return <GitLabHostingSettings vcsAvailability={vcsAvailability} />;
      default:
        return renderBitbucketContent();
    }
  };

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
                  <GitBranch className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    VCS Connections
                  </h1>
                  <p className="text-base text-muted-foreground font-medium mt-1">
                    Manage your code hosting connections
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side Navigation */}
            <nav className="lg:w-64 shrink-0">
              <div className="lg:sticky lg:top-6 space-y-1 bg-card rounded-lg border p-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 min-w-0">{renderContent()}</main>
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Connection?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this connection. Any projects using
                  this connection will need to be reconfigured. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConnection}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
