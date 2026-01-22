import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
    AlertCircle,
    CheckCircle,
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
    Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { githubService } from "@/api_service/codeHosting/github/githubService.ts";
import {
    GitHubConnections,
    EGitSetupStatus
} from "@/api_service/codeHosting/github/githubService.interface.ts";
import { integrationService } from "@/api_service/integration/integrationService.ts";
import { VcsConnection } from "@/api_service/integration/integration.interface.ts";
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

export default function GitHubHostingSettings() {
    const navigate = useNavigate();
    const routes = useWorkspaceRoutes();
    const { currentWorkspace } = useWorkspace();
    const [oauthConnections, setOauthConnections] = useState<GitHubConnections>([]);
    const [appConnections, setAppConnections] = useState<VcsConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [syncingConnectionId, setSyncingConnectionId] = useState<number | null>(null);
    const [reconnectingConnectionId, setReconnectingConnectionId] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState<{ id: number, type: 'app' | 'oauth' } | null>(null);
    const { toast } = useToast();

    const fetchConnections = async () => {
        if (!currentWorkspace) return;
        try {
            setIsFetchingData(true);
            // Fetch APP connections via integration API
            const appConns = await integrationService.getAppConnections(currentWorkspace.slug, 'github').catch(() => []);

            // Fetch OAuth connections
            const oauthConns = await githubService.getUserConnections(currentWorkspace.slug).catch(() => []);
            // Filter to only show connections that are NOT in the APP connections list
            const appConnIds = new Set(appConns.map(c => c.id));
            const filteredOauthConns = oauthConns.filter(c => !appConnIds.has(c.id));

            setOauthConnections(filteredOauthConns || []);
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
            await integrationService.syncConnection(currentWorkspace.slug, 'github', connectionId);
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
            const response = await integrationService.getReconnectUrl(currentWorkspace.slug, 'github', connectionId);
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
                await integrationService.deleteConnection(currentWorkspace.slug, 'github', connectionToDelete.id);
            } else {
                await githubService.deleteConnection(currentWorkspace.slug, connectionToDelete.id);
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

    const openConnectionDetails = (connection: VcsConnection) => {
        navigate(routes.projectImport({ connectionId: connection.id, provider: 'github', connectionType: connection.connectionType }));
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
            case 'CONNECTED':
                return <CheckCircle className="h-5 w-5 text-success" />;
            case EGitSetupStatus.ERROR:
            case 'ERROR':
                return <XCircle className="h-5 w-5 text-destructive" />;
            default:
                return <AlertCircle className="h-5 w-5 text-warning" />;
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

    const hasNoConnections = oauthConnections.length === 0 && appConnections.length === 0;

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
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Recommended</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Quick 1-click setup via OAuth 2.0. Review comments will be posted as your GitHub account.
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
                                    disabled={isConnecting}
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
                            </div>
                        </TabsContent>

                        {/* Option 2: Personal Access Token */}
                        <TabsContent value="pat" className="space-y-4 pt-4">
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Connect using a Personal Access Token for more granular control over permissions.
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {appConnections.map((connection) => (
                            <Card key={connection.id} className="hover:shadow-md transition-shadow border-purple-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Github className="h-5 w-5" />
                                            <span className="truncate">{connection.externalWorkspaceSlug || connection.connectionName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(connection.status)}
                                        </div>
                                    </CardTitle>
                                    <CardDescription className="flex items-center space-x-2">
                                        <span>Organization: {connection.externalWorkspaceSlug || 'Personal'}</span>
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
                                                <span className={`font-medium ${new Date(connection.tokenExpiresAt) < new Date() ? 'text-destructive' : ''}`}>
                                                    {new Date(connection.tokenExpiresAt).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Show reconnect warning for expired/error connections */}
                                    {(connection.status === 'ERROR' || (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date())) && (
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
                                            onClick={() => openConnectionDetails(connection)}
                                        >
                                            <Settings className="h-4 w-4 mr-1" />
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
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Link2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSyncConnection(connection.id)}
                                            disabled={syncingConnectionId === connection.id}
                                            title="Refresh connection status"
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
                                                setConnectionToDelete({ id: connection.id, type: 'app' });
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {oauthConnections.map((connection) => (
                            <Card key={connection.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Github className="h-5 w-5" />
                                            <span className="truncate">{connection.connectionName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(connection.setupStatus || 'PENDING')}
                                        </div>
                                    </CardTitle>
                                    <CardDescription className="flex items-center space-x-2">
                                        <span>Organization: {connection.organizationId || 'Personal'}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Repositories: </span>
                                            <span className="font-medium">{connection.repoCount || 0}</span>
                                        </div>
                                        {connection.updatedAt && (
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Updated: </span>
                                                <span className="font-medium">{new Date(connection.updatedAt).toLocaleDateString()}</span>
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
                                                setConnectionToDelete({ id: connection.id, type: 'oauth' });
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
                        Add a connection using a GitHub Personal Access Token for fine-grained access control.
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
                        <h3 className="text-lg font-semibold mb-2">No GitHub connections yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Connect your GitHub account to start analyzing your repositories.
                        </p>
                        <Button onClick={handleConnectGitHub} disabled={isConnecting}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connect with GitHub
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this connection? This action cannot be undone.
                            All associated projects and webhooks will be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConnection} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
