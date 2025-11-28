import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {AlertCircle, CheckCircle, Edit, GitBranch, Loader2, Plus, Settings, XCircle} from "lucide-react";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useToast} from "@/hooks/use-toast.ts";
import {bitbucketCloudService} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import {
    BitbucketConnections,
    EGitSetupStatus
} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.interface.ts";
import { useWorkspace } from '@/context/WorkspaceContext';

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
    const [connections, setConnections] = useState<BitbucketConnections>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const {toast} = useToast();



    useEffect(() => {
        const fetchUserBitbucketConnections = async () => {
            if (!currentWorkspace) return;
            try {
                setIsFetchingData(true);
                const userBitbucketConnections: BitbucketConnections = await bitbucketCloudService.getUserConnections(currentWorkspace.slug);
                setConnections(userBitbucketConnections);
            } catch (error: any) {
                toast({
                    title: "Failed to load user bitbucket connections",
                    description: error.message || "Could not retrieve list of bitbucket connections",
                    variant: "destructive",
                });
                console.error('Failed to fetch Bitbucket connections:', error);
            } finally {
                setIsFetchingData(false);
                setIsLoading(false);
            }
        };
        fetchUserBitbucketConnections();
    }, [toast, currentWorkspace]);


    if (isFetchingData) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                    <span>Loading profile information...</span>
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

    const deleteBitbucketConnection = async (connectionId: number) => {
        try {
            // TODO: Replace with actual API call
            // const response = await fetch(`/api/bitbucket/connections/${connectionId}`, {
            //   method: 'DELETE'
            // });
            console.log(`Deleting connection ${connectionId}...`);
            // For now, just refresh the list
           // fetchUserBitbucketConnections();
        } catch (error) {
            console.error('Failed to delete Bitbucket connection:', error);
        }
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

    const getStatusBadge = (status: EGitSetupStatus) => {
        switch (status) {
            case EGitSetupStatus.CONNECTED:
                return <Badge className="bg-success text-success-foreground">Connected</Badge>;
            case EGitSetupStatus.ERROR:
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="secondary">Pending</Badge>;
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <GitBranch className="h-6 w-6 text-primary"/>
                    <h1 className="text-3xl font-bold">Code Hosting Settings</h1>
                </div>
                <Button onClick={createBitbucketConnection} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4"/>
                    <span>Add Connection</span>
                </Button>
            </div>

            <Tabs defaultValue="bitbucket" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bitbucket">Bitbucket</TabsTrigger>
                    <TabsTrigger value="github" disabled>GitHub (Coming Soon)</TabsTrigger>
                    <TabsTrigger value="gitlab" disabled>GitLab (Coming Soon)</TabsTrigger>
                </TabsList>

                <TabsContent value="bitbucket" className="space-y-6">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="text-muted-foreground">Loading connections...</div>
                        </div>
                    ) : connections.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                                <h3 className="text-xl font-semibold mb-2">No Bitbucket Connections</h3>
                                <p className="text-muted-foreground mb-6">
                                    Get started by creating your first Bitbucket connection to sync repositories and
                                    manage
                                    code reviews.
                                </p>
                                <Button onClick={createBitbucketConnection} className="flex items-center space-x-2">
                                    <Plus className="h-4 w-4"/>
                                    <span>Create Connection</span>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {connections.map((connection) => (
                                <Card key={connection.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(connection.setupStatus || EGitSetupStatus.PENDING)}
                                                <span className="truncate">{connection.connectionName}</span>
                                            </div>
                                            {getStatusBadge(connection.setupStatus || EGitSetupStatus.PENDING)}
                                        </CardTitle>
                                        <CardDescription className="flex items-center space-x-2">
                                            <span>Workspace: {connection.workspaceId}</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            {/*<div className="text-sm">*/}
                                            {/*  <span className="text-muted-foreground">Account: </span>*/}
                                            {/*  <span className="font-medium">{connection.connectedAccount}</span>*/}
                                            {/*</div>*/}
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Repositories: </span>
                                                <span className="font-medium">{connection.repoCount}</span>
                                            </div>
                                            {/*<div className="text-sm">*/}
                                            {/*  <span className="text-muted-foreground">Last sync: </span>*/}
                                            {/*  <span className="font-medium">{connection.lastSync}</span>*/}
                                            {/*</div>*/}
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
                                                Connection error. Please check your credentials and try
                                                reconnecting.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
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
        </div>
    );
}