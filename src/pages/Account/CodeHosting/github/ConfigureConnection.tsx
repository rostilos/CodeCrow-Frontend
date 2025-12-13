import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { ArrowLeft, Github, Key, Link, Save, Settings, Trash2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { githubService } from "@/api_service/codeHosting/github/githubService.ts";
import { GitHubConnection, GitHubConnectionCreateRequest } from "@/api_service/codeHosting/github/githubService.interface.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/use-toast.ts";

interface ConnectionConfig {
    id: number;
    connectionName: string;
    organizationId: string;
    accessToken: string;

    // UI-only fields
    status?: 'CONNECTED' | 'PENDING' | 'ERROR';
    lastSync?: string;
    repositories?: number;
    autoReviewPRs?: boolean;
    blockMergingOnIssues?: boolean;
    commentOnPRs?: boolean;
}

export default function GitHubConfigureConnection() {
    const navigate = useNavigate();
    const { connectionId } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState<ConnectionConfig | null>(null);
    const { currentWorkspace } = useWorkspace();
    const { toast } = useToast();

    useEffect(() => {
        fetchConnectionConfig();
    }, [connectionId]);

    const fetchConnectionConfig = async () => {
        if (!connectionId || !currentWorkspace) return;
        try {
            setIsLoading(true);
            const data = await githubService.getConnection(currentWorkspace.slug, Number(connectionId));
            const mapped: ConnectionConfig = {
                id: data.id,
                connectionName: data.connectionName,
                organizationId: data.organizationId || "",
                accessToken: data.hasAccessToken ? "******" : "",
                status: (data.setupStatus as any) || undefined,
                repositories: data.repoCount ?? 0,
                lastSync: data.updatedAt
            };
            setConfig(mapped);
        } catch (error) {
            console.error('Failed to fetch connection config:', error);
            setConfig(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof ConnectionConfig, value: string | boolean) => {
        if (config) {
            setConfig(prev => prev ? { ...prev, [field]: value } : null);
        }
    };

    const handleSave = async () => {
        if (!config || !connectionId) return;
        try {
            setIsSaving(true);
            const payload: Partial<GitHubConnectionCreateRequest> = {
                connectionName: config.connectionName,
                organizationId: config.organizationId || undefined,
            };
            // Only include access token if it's been changed from the masked value
            if (config.accessToken && config.accessToken !== "******") {
                payload.accessToken = config.accessToken;
            }

            await githubService.updateConnection(currentWorkspace!.slug, Number(connectionId), payload);
            await fetchConnectionConfig();
            toast({ title: "Success", description: "GitHub connection successfully updated." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save data. Please check that the data you entered is correct.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!config || !connectionId || !confirm('Are you sure you want to delete this connection? This action cannot be undone.')) return;
        try {
            await githubService.deleteConnection(currentWorkspace!.slug, Number(connectionId));
            navigate('/dashboard/hosting');
        } catch (error) {
            console.error('Failed to delete connection:', error);
            toast({ title: "Error", description: "Failed to delete connection.", variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8">
                    <div className="text-muted-foreground">Loading connection configuration...</div>
                </div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-8">
                    <div className="text-destructive">Connection not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/hosting')}
                className="flex items-center space-x-2"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Code Hosting</span>
            </Button>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Github className="h-6 w-6 text-primary" />
                    <h1 className="text-3xl font-bold">Configure GitHub Connection</h1>
                    {config.status === 'CONNECTED' && (
                        <Badge className="bg-success text-success-foreground">Connected</Badge>
                    )}
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className="flex items-center space-x-2"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Connection</span>
                </Button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Connection Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Link className="h-5 w-5" />
                                <span>Connection Status</span>
                            </CardTitle>
                            <CardDescription>
                                Current connection information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-5 w-5 text-success" />
                                    <span className="font-medium">Connected</span>
                                </div>
                                <Badge className="bg-success text-success-foreground">Active</Badge>
                            </div>

                            <div className="space-y-2">
                                <Label>Connection Name</Label>
                                <Input
                                    value={config.connectionName}
                                    onChange={(e) => handleInputChange('connectionName', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Organization</Label>
                                <Input
                                    value={config.organizationId}
                                    onChange={(e) => handleInputChange('organizationId', e.target.value)}
                                    placeholder="Leave empty for personal account"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Repositories: </Label>
                                <span className="text-sm text-muted-foreground">{config.repositories || 0}</span>
                            </div>

                            <div className="space-y-2">
                                <Label>Last Updated: </Label>
                                <span className="text-sm text-muted-foreground">
                                    {config.lastSync ? new Date(config.lastSync).toLocaleString() : 'N/A'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Authentication */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Key className="h-5 w-5" />
                                <span>Authentication</span>
                            </CardTitle>
                            <CardDescription>
                                Update Personal Access Token
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="accessToken">Personal Access Token</Label>
                                <PasswordInput
                                    id="accessToken"
                                    value={config.accessToken}
                                    onChange={(e) => handleInputChange('accessToken', e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Update your GitHub Personal Access Token. Leave unchanged to keep existing token.
                                </p>
                            </div>

                            <div className="p-3 bg-muted rounded-md">
                                <h4 className="font-medium mb-2">Required Token Scopes:</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• <code className="text-xs bg-background px-1 rounded">repo</code> - Full control of private repositories</li>
                                    <li>• <code className="text-xs bg-background px-1 rounded">read:user</code> - Read user profile data</li>
                                    <li>• <code className="text-xs bg-background px-1 rounded">read:org</code> - Read org and team data</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Repository Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Settings className="h-5 w-5" />
                            <span>Repository Configuration</span>
                        </CardTitle>
                        <CardDescription>
                            Configure repository settings and review preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    if (!connectionId) return;
                                    try {
                                        await githubService.syncConnection(currentWorkspace!.slug, Number(connectionId));
                                        toast({
                                            title: "Success",
                                            description: "Connection successfully synchronized"
                                        });
                                        await fetchConnectionConfig();
                                    } catch (e) {
                                        console.error(e);
                                        toast({
                                            title: "Error",
                                            description: "Failed to sync connection",
                                            variant: "destructive"
                                        });
                                    }
                                }}
                                className="mb-4"
                            >
                                Sync status
                            </Button>
                        </div>

                        <Separator />

                        <div className="space-y-4 opacity-50 pointer-events-none">
                            <Label className="text-base font-medium">Review Settings (Coming Soon)</Label>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Auto-review PRs</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Automatically review new pull requests
                                        </p>
                                    </div>
                                    <Switch
                                        checked={config.autoReviewPRs}
                                        onCheckedChange={(checked) => handleInputChange('autoReviewPRs', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Block merging on issues</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Prevent merging when issues are found
                                        </p>
                                    </div>
                                    <Switch
                                        checked={config.blockMergingOnIssues}
                                        onCheckedChange={(checked) => handleInputChange('blockMergingOnIssues', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Comment on PRs</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Add review comments to pull requests
                                        </p>
                                    </div>
                                    <Switch
                                        checked={config.commentOnPRs}
                                        onCheckedChange={(checked) => handleInputChange('commentOnPRs', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                <div className="flex justify-end space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard/hosting')}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center space-x-2"
                    >
                        <Save className="h-4 w-4" />
                        <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
