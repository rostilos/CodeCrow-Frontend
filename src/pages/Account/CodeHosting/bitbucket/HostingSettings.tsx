import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {
    AlertCircle, 
    CheckCircle, 
    Cloud,
    Edit, 
    ExternalLink,
    GitBranch, 
    Github,
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
import {useNavigate} from "react-router-dom";
import {useToast} from "@/hooks/use-toast.ts";
import {bitbucketCloudService} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import {
    BitbucketConnections,
    EGitSetupStatus
} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.interface.ts";
import {VcsConnection, VcsConnectionType} from "@/api_service/integration/integration.interface.ts";
import {integrationService, BitbucketConnectInstallation} from "@/api_service/integration/integrationService.ts";
import { useWorkspace } from '@/context/WorkspaceContext';
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
    const { currentWorkspace } = useWorkspace();
    const [manualConnections, setManualConnections] = useState<BitbucketConnections>([]);
    const [appConnections, setAppConnections] = useState<VcsConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [isInstallingApp, setIsInstallingApp] = useState(false);
    const [syncingConnectionId, setSyncingConnectionId] = useState<number | null>(null);
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
     * Opens popup for Bitbucket authorization, then checks for new installations.
     * User will need to manually link if an installation is found.
     */
    const handleConnectAppInstall = async () => {
        if (!currentWorkspace) return;
        
        try {
            setConnectInstallStatus('starting');
            
            const result = await integrationService.startBitbucketConnectInstallWithTracking(
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
                    description: "The app wasn't installed or you don't have access to the Bitbucket workspace. Make sure you have an existing Bitbucket connection first.",
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
        navigate(`/dashboard/projects/import?connectionId=${connection.id}&provider=bitbucket-cloud&connectionType=${connection.connectionType}`);
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
        navigate('/dashboard/hosting/add-connection');
    };

    const configureBitbucketConnection = (connectionId: number) => {
        navigate(`/dashboard/hosting/configure/${connectionId}`);
    };

    const modifyBitbucketConnection = (connectionId: number) => {
        navigate(`/dashboard/hosting/configure/${connectionId}`);
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

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <GitBranch className="h-6 w-6 text-primary"/>
                    <h1 className="text-3xl font-bold">Code Hosting Settings</h1>
                </div>
            </div>

            <Tabs defaultValue="bitbucket" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bitbucket">Bitbucket</TabsTrigger>
                    <TabsTrigger value="github">GitHub</TabsTrigger>
                    <TabsTrigger value="gitlab" disabled>GitLab (Coming Soon)</TabsTrigger>
                </TabsList>

                <TabsContent value="github" className="space-y-6">
                    <GitHubHostingSettings />
                </TabsContent>

                <TabsContent value="bitbucket" className="space-y-6">
                    {/* App Installation Card - Always show at top */}
                    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-500" />
                                Bitbucket Cloud App
                                <Badge variant="secondary" className="ml-2">Recommended</Badge>
                            </CardTitle>
                            <CardDescription>
                                1-click integration with automatic webhook setup. Connect your entire Bitbucket workspace in seconds.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Automatic webhook configuration
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Workspace-level access to all repositories
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Automatic token refresh
                                    </li>
                                </ul>
                                <div className="flex flex-col gap-2 items-end">
                                    {isConnectAppConfigured ? (
                                        <Button 
                                            onClick={handleConnectAppInstall}
                                            disabled={isConnectInstalling}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isConnectInstalling ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Installing...
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Install from Bitbucket
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={handleInstallApp}
                                            disabled={isInstallingApp}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isInstallingApp ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Connecting...
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Install Bitbucket App
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    {connectInstallStatus && (
                                        <span className="text-sm text-muted-foreground">{connectInstallStatus}</span>
                                    )}
                                </div>
                            </div>
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
                                            </div>

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
                                                    onClick={() => handleSyncAppConnection(connection.id)}
                                                    disabled={syncingConnectionId === connection.id}
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
                </TabsContent>

                <TabsContent value="github">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                            <h3 className="text-xl font-semibold mb-2">GitHub Integration Coming Soon</h3>
                            <p className="text-muted-foreground">
                                We're working on GitHub integration. It will be available in the next update.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="gitlab">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                            <h3 className="text-xl font-semibold mb-2">GitLab Integration Coming Soon</h3>
                            <p className="text-muted-foreground">
                                We're working on GitLab integration. It will be available in the next update.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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