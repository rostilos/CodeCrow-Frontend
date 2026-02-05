import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.tsx";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible.tsx";
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
    Zap
} from "lucide-react";
import {useEffect, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useToast} from "@/hooks/use-toast.ts";
import {bitbucketCloudService} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import {
    BitbucketConnections,
    EGitSetupStatus
} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.interface.ts";
import {VcsConnection, VcsConnectionType} from "@/api_service/integration/integration.interface.ts";
import {integrationService, BitbucketConnectInstallation} from "@/api_service/integration/integrationService.ts";
import { useWorkspace } from '@/context/WorkspaceContext';
import { useWorkspaceRoutes } from '@/hooks/useWorkspaceRoutes';
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

// Bitbucket icon component
const BitbucketIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/>
    </svg>
);

// GitLab icon component
const GitLabIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
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
    status: 'connected' | 'disconnected' | 'error';
    lastSync: string;
    repositories: number;
}


export default function HostingSettings() {
    const navigate = useNavigate();
    const routes = useWorkspaceRoutes();
    const { currentWorkspace } = useWorkspace();
    const [searchParams] = useSearchParams();
    const [manualConnections, setManualConnections] = useState<BitbucketConnections>([]);
    const [appConnections, setAppConnections] = useState<VcsConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [isInstallingApp, setIsInstallingApp] = useState(false);
    const [syncingConnectionId, setSyncingConnectionId] = useState<number | null>(null);
    const [reconnectingConnectionId, setReconnectingConnectionId] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState<{id: number, type: 'app' | 'manual'} | null>(null);
    const {toast} = useToast();
    
    // Connect App state
    const [connectInstallStatus, setConnectInstallStatus] = useState<string | null>(null);
    const [isConnectAppConfigured, setIsConnectAppConfigured] = useState(false);
    const [unlinkedInstallations, setUnlinkedInstallations] = useState<BitbucketConnectInstallation[]>([]);
    const [linkingInstallationId, setLinkingInstallationId] = useState<number | null>(null);
    
    // Check if Connect App is configured and load unlinked installations
    useEffect(() => {
        const checkConnectAppConfig = async () => {
            try {
                const status = await integrationService.getBitbucketConnectStatus();
                setIsConnectAppConfigured(status.configured);
                
                if (status.configured) {
                    // Load unlinked installations
                    const unlinked = await integrationService.getUnlinkedConnectInstallations();
                    setUnlinkedInstallations(unlinked);
                }
            } catch {
                // Connect App not available, use OAuth fallback
                setIsConnectAppConfigured(false);
            }
        };
        checkConnectAppConfig();
    }, []);

    const fetchConnections = async () => {
        if (!currentWorkspace) return;
        try {
            setIsFetchingData(true);
            // Fetch APP connections via integration API (filtered by connectionType=APP)
            const appConns = await integrationService.getAppConnections(currentWorkspace.slug, 'bitbucket-cloud').catch(() => []);
            
            // Fetch manual connections via legacy API and filter out APP connections
            const allManualConns = await bitbucketCloudService.getUserConnections(currentWorkspace.slug).catch(() => []);
            // Filter to only show connections that are NOT in the APP connections list
            const appConnIds = new Set(appConns.map(c => c.id));
            const manualConns = allManualConns.filter(c => !appConnIds.has(c.id));
            
            setManualConnections(manualConns || []);
            setAppConnections(appConns || []);
        } catch (error: any) {
            toast({
                title: "Failed to load connections",
                description: error.message || "Could not retrieve list of connections",
                variant: "destructive",
            });
            console.error('Failed to fetch connections:', error);
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
            await integrationService.startAppInstall(currentWorkspace.slug, 'bitbucket-cloud');
        } catch (error: any) {
            toast({
                title: "Failed to start installation",
                description: error.message || "Could not start Bitbucket app installation",
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
            setConnectInstallStatus('starting');
            
            const result = await integrationService.startBitbucketConnectInstallWithTracking(
                currentWorkspace.id,
                currentWorkspace.slug,
                (status) => setConnectInstallStatus(status)
            );
            
            if (result.status === 'installed_pending_link') {
                toast({
                    title: "Installation Found!",
                    description: `Bitbucket workspace "${result.workspaceSlug}" is ready to link.`,
                });
                
                // Refresh to show the pending installation
                const unlinked = await integrationService.getUnlinkedConnectInstallations();
                setUnlinkedInstallations(unlinked);
                
            } else if (result.status === 'completed') {
                toast({
                    title: "Bitbucket Connected!",
                    description: `Successfully connected to ${result.workspaceSlug || 'Bitbucket workspace'}`,
                });
                await fetchConnections();
                
            } else if (result.status === 'no_installation') {
                toast({
                    title: "No Installation Found",
                    description: "The app wasn't installed. Please try again and make sure to enable development mode in Bitbucket when prompted.",
                    variant: "destructive",
                });
                
            } else if (result.status === 'popup_closed' || result.status === 'timeout') {
                // User closed popup, just refresh in case installation happened
                const unlinked = await integrationService.getUnlinkedConnectInstallations();
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
    
    const isConnectInstalling = connectInstallStatus === 'starting' || connectInstallStatus === 'waiting' || connectInstallStatus === 'checking';
    
    /**
     * Link an unlinked Bitbucket Connect installation to the current workspace.
     */
    const handleLinkInstallation = async (installationId: number) => {
        if (!currentWorkspace) return;
        
        try {
            setLinkingInstallationId(installationId);
            await integrationService.linkConnectInstallation(installationId, currentWorkspace.id);
            
            toast({
                title: "Installation Linked!",
                description: "The Bitbucket workspace has been linked to your CodeCrow workspace",
            });
            
            // Refresh data
            await fetchConnections();
            
            // Remove from unlinked list
            setUnlinkedInstallations(prev => prev.filter(i => i.id !== installationId));
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
            await integrationService.syncConnection(currentWorkspace.slug, 'bitbucket-cloud', connectionId);
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
            const response = await integrationService.getReconnectUrl(currentWorkspace.slug, 'bitbucket-cloud', connectionId);
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
            if (connectionToDelete.type === 'app') {
                await integrationService.deleteConnection(currentWorkspace.slug, 'bitbucket-cloud', connectionToDelete.id);
            } else {
                await bitbucketCloudService.deleteConnection(currentWorkspace.slug, connectionToDelete.id);
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
        navigate(routes.projectImport({ connectionId: connection.id, provider: 'bitbucket-cloud', connectionType: connection.connectionType }));
    };

    if (isFetchingData) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                    <span>Loading connections...</span>
                </CardContent>
            </Card>
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
                return <CheckCircle className="h-5 w-5 text-success"/>;
            case EGitSetupStatus.ERROR:
                return <XCircle className="h-5 w-5 text-destructive"/>;
            default:
                return <AlertCircle className="h-5 w-5 text-warning"/>;
        }
    };

    const getStatusBadge = (status: EGitSetupStatus | string) => {
        switch (status) {
            case EGitSetupStatus.CONNECTED:
            case 'CONNECTED':
                return <Badge className="bg-success text-success-foreground">Connected</Badge>;
            case EGitSetupStatus.ERROR:
            case 'ERROR':
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="secondary">Pending</Badge>;
        }
    };

    const getConnectionTypeBadge = (type: VcsConnectionType) => {
        switch (type) {
            case 'APP':
            case 'CONNECT_APP':
                return <Badge variant="outline" className="border-blue-500 text-blue-600"><Zap className="h-3 w-3 mr-1" />App</Badge>;
            case 'OAUTH_MANUAL':
                return <Badge variant="outline"><Settings className="h-3 w-3 mr-1" />OAuth</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    const hasNoConnections = manualConnections.length === 0 && appConnections.length === 0;

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
                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Recommended for personal workspaces</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Quick 1-click setup via OAuth 2.0. Review comments will be posted as your Bitbucket account.
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
                                            disabled={isInstallingApp}
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
                                    </div>
                                </TabsContent>
                                
                                {/* Option 2: Connect App (Workspace-level) */}
                                <TabsContent value="connect-app" className="space-y-4 pt-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">Workspace Integration</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Install CodeCrow as a Bitbucket Connect app at the workspace level. Comments are posted by the CodeCrow app.
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
                                                        <li>Bitbucket will ask you to <strong>enable development mode</strong> - click to enable</li>
                                                        <li>Authorize the app installation</li>
                                                        <li>After install, click <strong>"Manage App"</strong> in Bitbucket to complete setup</li>
                                                    </ol>
                                                    <Collapsible>
                                                        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                                                            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                                                            <span>Why development mode is required?</span>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="mt-2 text-xs text-muted-foreground space-y-2">
                                                            <p>
                                                                <strong>Bitbucket deprecated OAuth Connect Apps</strong> from being listed on the Atlassian Marketplace. 
                                                                New Connect apps must use development mode for installation.
                                                            </p>
                                                            <p>
                                                                <strong>Forge is not suitable</strong> for CodeCrow's use case — it cannot provide the speed and quality 
                                                                of analysis we deliver, nor support full auto-setup of webhooks and repositories.
                                                            </p>
                                                            <p className="text-muted-foreground/70">
                                                                Development mode is a one-time setup per workspace and doesn't affect your other apps.
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
                                            disabled={isConnectInstalling}
                                        >
                                            {isConnectInstalling ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    {connectInstallStatus === 'waiting' ? 'Waiting for Bitbucket...' : 
                                                     connectInstallStatus === 'checking' ? 'Checking installation...' : 'Starting...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="h-4 w-4 mr-2" />
                                                    Install Connect App
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </TabsContent>
                                
                                {/* Option 3: Manual OAuth (Bring your own credentials) */}
                                <TabsContent value="manual" className="space-y-4 pt-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">Advanced</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Use your own Bitbucket OAuth consumer credentials. Best for enterprise setups or when you want full control.
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
                                                    You'll need to create an OAuth consumer in your Bitbucket workspace settings.{' '}
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
                                                    <p className="font-medium text-foreground mb-1">Required permissions:</p>
                                                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                                                        <li><strong>Account</strong> → Read</li>
                                                        <li><strong>Repositories</strong> → Read</li>
                                                        <li><strong>Pull Requests</strong> → Read</li>
                                                        <li><strong>Webhooks</strong> → Read & Write</li>
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
                                    These Bitbucket workspaces have installed CodeCrow but haven't been linked to your CodeCrow workspace yet.
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
                                                <p className="font-medium">{installation.bitbucketWorkspaceName || installation.bitbucketWorkspaceSlug}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    @{installation.bitbucketWorkspaceSlug}
                                                    {installation.installedByUsername && ` • Installed by ${installation.installedByUsername}`}
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {appConnections.map((connection) => (
                                    <Card key={connection.id} className="hover:shadow-md transition-shadow border-blue-200">
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Cloud className="h-5 w-5 text-blue-500" />
                                                    <span className="truncate">{connection.externalWorkspaceSlug || connection.connectionName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getConnectionTypeBadge(connection.connectionType)}
                                                    {getStatusBadge(connection.status)}
                                                </div>
                                            </CardTitle>
                                            <CardDescription className="flex items-center space-x-2">
                                                <span>Workspace: {connection.externalWorkspaceSlug || 'N/A'}</span>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Repositories: </span>
                                                    <span className="font-medium">{connection.repoCount || 0}</span>
                                                </div>
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Connected: </span>
                                                    <span className="font-medium">{new Date(connection.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                {connection.tokenExpiresAt && (
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">Token expires: </span>
                                                        <span className="font-medium">
                                                            {new Date(connection.tokenExpiresAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Show reconnect warning only when connection has error status (refresh failed) */}
                                            {connection.status === 'ERROR' && (
                                                <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span>Connection needs re-authorization</span>
                                                </div>
                                            )}

                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => openAppConnectionDetails(connection)}
                                                >
                                                    <Settings className="h-4 w-4 mr-1"/>
                                                    Configure
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleReconnect(connection.id)}
                                                    disabled={reconnectingConnectionId === connection.id}
                                                    title="Re-authorize connection"
                                                >
                                                    {reconnectingConnectionId === connection.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                                    ) : (
                                                        <Link2 className="h-4 w-4"/>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSyncAppConnection(connection.id)}
                                                    disabled={syncingConnectionId === connection.id}
                                                    title="Refresh connection status"
                                                >
                                                    {syncingConnectionId === connection.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                                    ) : (
                                                        <RefreshCw className="h-4 w-4"/>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setConnectionToDelete({id: connection.id, type: 'app'});
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    title="Delete connection"
                                                >
                                                    <Trash2 className="h-4 w-4"/>
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
                            <Button onClick={createBitbucketConnection} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-1"/>
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
                                    <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                                    <h3 className="text-lg font-semibold mb-2">No Manual Connections</h3>
                                    <p className="text-muted-foreground mb-4 text-sm">
                                        Manual OAuth connections give you more control over individual repository access.
                                    </p>
                                    <Button onClick={createBitbucketConnection} variant="outline">
                                        <Plus className="h-4 w-4 mr-1"/>
                                        Add Manual Connection
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {manualConnections.map((connection) => (
                                    <Card key={connection.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(connection.setupStatus || EGitSetupStatus.PENDING)}
                                                    <span className="truncate">{connection.connectionName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline"><Settings className="h-3 w-3 mr-1" />OAuth</Badge>
                                                    {getStatusBadge(connection.setupStatus || EGitSetupStatus.PENDING)}
                                                </div>
                                            </CardTitle>
                                            <CardDescription className="flex items-center space-x-2">
                                                <span>Workspace: {connection.workspaceId}</span>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="text-sm">
                                                    <span className="text-muted-foreground">Repositories: </span>
                                                    <span className="font-medium">{connection.repoCount}</span>
                                                </div>
                                            </div>

                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => configureBitbucketConnection(connection.id)}
                                                >
                                                    <Settings className="h-4 w-4 mr-1"/>
                                                    Configure
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => modifyBitbucketConnection(connection.id)}
                                                >
                                                    <Edit className="h-4 w-4"/>
                                                </Button>
                                            </div>

                                            {connection.setupStatus === EGitSetupStatus.ERROR && (
                                                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                                    Connection error. Please check your credentials and try reconnecting.
                                                </div>
                                            )}
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
                return <GitHubHostingSettings />;
            case "gitlab":
                return <GitLabHostingSettings />;
            default:
                return renderBitbucketContent();
        }
    };

    return (
        <div className="container p-6">
            <div className="mb-6">
                <div className="flex items-center space-x-2">
                    <GitBranch className="h-6 w-6 text-primary"/>
                    <h1 className="text-3xl font-bold tracking-tight">VCS Connections</h1>
                </div>
                <p className="text-muted-foreground">Manage your code hosting connections</p>
            </div>

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
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                <main className="flex-1 min-w-0">
                    {renderContent()}
                </main>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Connection?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this connection. Any projects using this connection
                            will need to be reconfigured. This action cannot be undone.
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
    );
}