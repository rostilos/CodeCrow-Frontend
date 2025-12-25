import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { ArrowLeft, Github, Key, Link, Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { githubService } from "@/api_service/codeHosting/github/githubService.ts";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { GitHubConnection } from "@/api_service/codeHosting/github/githubService.interface.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";

const githubConnectionSchema = z.object({
    connectionName: z.string().min(1, "Connection name is required"),
    organizationId: z.string().optional(),
    accessToken: z.string().min(1, "Personal Access Token is required"),
});

type GitHubConnectionForm = z.infer<typeof githubConnectionSchema>;

export default function GitHubAddConnection() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { currentWorkspace } = useWorkspace();
    const routes = useWorkspaceRoutes();

    const form = useForm<GitHubConnectionForm>({
        resolver: zodResolver(githubConnectionSchema),
        defaultValues: {
            connectionName: "",
            organizationId: "",
            accessToken: "",
        },
    });

    const onSubmit = async (data: GitHubConnectionForm) => {
        if (!currentWorkspace) return;

        setIsLoading(true);
        try {
            const response: GitHubConnection = await githubService.createUserConnection(currentWorkspace.slug, {
                connectionName: data.connectionName,
                organizationId: data.organizationId || undefined,
                accessToken: data.accessToken,
            });

            toast({
                title: "New GitHub connection successfully created"
            });

            navigate(routes.hostingGitHubConfigure(response.id))
        } catch (error: any) {
            toast({
                title: "An error occurred while creating GitHub connection.",
                description: error.message || "Invalid data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(routes.hostingSettings())}
                className="flex items-center space-x-2"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Code Hosting</span>
            </Button>

            <div className="flex items-center space-x-2">
                <Github className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Add GitHub Connection</h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Link className="h-5 w-5" />
                                    <span>Connection Details</span>
                                </CardTitle>
                                <CardDescription>
                                    Basic information about your GitHub connection
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="connectionName">Connection Name *</Label>
                                    <Input
                                        id="connectionName"
                                        placeholder="e.g., My GitHub Account"
                                        required
                                        {...form.register("connectionName")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        A friendly name to identify this connection
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="organizationId">Organization (Optional)</Label>
                                    <Input
                                        id="organizationId"
                                        placeholder="e.g., my-organization"
                                        {...form.register("organizationId")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        GitHub organization name. Leave empty for personal repositories.
                                    </p>
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
                                    Configure your GitHub Personal Access Token
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="accessToken">Personal Access Token *</Label>
                                    <PasswordInput
                                        id="accessToken"
                                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                        required
                                        {...form.register("accessToken")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Your GitHub Personal Access Token with repo scope.
                                        <a 
                                            href="https://github.com/settings/tokens/new" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="ml-1 text-primary hover:underline"
                                        >
                                            Create a token
                                        </a>
                                    </p>
                                </div>

                                <div className="p-3 bg-muted rounded-md">
                                    <h4 className="font-medium mb-2">Required Token Scopes:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• <code className="text-xs bg-background px-1 rounded">repo</code> - Full control of private repositories</li>
                                        <li>• <code className="text-xs bg-background px-1 rounded">read:user</code> - Read user profile data</li>
                                        <li>• <code className="text-xs bg-background px-1 rounded">read:org</code> - Read org and team data (if using org)</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator />

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(routes.hostingSettings())}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex items-center space-x-2">
                            <Save className="h-4 w-4" />
                            <span>{isLoading ? 'Creating...' : 'Create Connection'}</span>
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
