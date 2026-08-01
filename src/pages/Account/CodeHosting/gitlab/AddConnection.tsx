import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { ArrowLeft, Key, Link, Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gitlabService } from "@/api_service/codeHosting/gitlab/gitlabService.ts";
import { Form } from "@/components/ui/form.tsx";
import { GitLabConnection } from "@/api_service/codeHosting/gitlab/gitlabService.interface.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";

// GitLab icon component
const GitLabIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
    </svg>
);

const gitlabConnectionSchema = z.object({
    connectionName: z.string().min(1, "Connection name is required"),
    groupId: z.string().optional(),
    accessToken: z.string().min(1, "Personal Access Token is required"),
    baseUrl: z.union([
        z.literal(""),
        z.string().url("Enter a valid GitLab instance URL").refine(
            (url) => url.startsWith("https://") || url.startsWith("http://"),
            "GitLab URL must use http or https",
        ),
    ]),
});

type GitLabConnectionForm = z.infer<typeof gitlabConnectionSchema>;

export default function GitLabAddConnection() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { currentWorkspace } = useWorkspace();
    const routes = useWorkspaceRoutes();

    const form = useForm<GitLabConnectionForm>({
        resolver: zodResolver(gitlabConnectionSchema),
        defaultValues: {
            connectionName: "",
            groupId: "",
            accessToken: "",
            baseUrl: "",
        },
    });

    const onSubmit = async (data: GitLabConnectionForm) => {
        if (!currentWorkspace) return;

        setIsLoading(true);
        try {
            const response: GitLabConnection = await gitlabService.createUserConnection(currentWorkspace.slug, {
                connectionName: data.connectionName,
                groupId: data.groupId || undefined,
                accessToken: data.accessToken,
                baseUrl: data.baseUrl.trim() || undefined,
            });

            toast({
                title: "New GitLab connection successfully created"
            });

            navigate(routes.hostingGitLabConfigure(response.id))
        } catch (error: any) {
            toast({
                title: "An error occurred while creating GitLab connection.",
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
                <GitLabIcon className="h-6 w-6 text-orange-500" />
                <h1 className="text-3xl font-bold">Add GitLab Connection</h1>
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
                                    Basic information about your GitLab connection
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="connectionName">Connection Name *</Label>
                                    <Input
                                        id="connectionName"
                                        placeholder="e.g., My GitLab Account"
                                        required
                                        {...form.register("connectionName")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        A friendly name to identify this connection
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="baseUrl">GitLab Instance URL</Label>
                                    <Input
                                        id="baseUrl"
                                        placeholder="https://gitlab.example.com"
                                        {...form.register("baseUrl")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Leave blank for GitLab.com. Enter the instance root without <code>/api/v4</code>.
                                    </p>
                                    {form.formState.errors.baseUrl && (
                                        <p className="text-sm text-destructive">
                                            {form.formState.errors.baseUrl.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="groupId">Group (Optional)</Label>
                                    <Input
                                        id="groupId"
                                        placeholder="e.g., my-organization"
                                        {...form.register("groupId")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        GitLab group path/name. Leave empty to access all your repositories.
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
                                    Configure your GitLab Personal Access Token
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="accessToken">Personal Access Token *</Label>
                                    <PasswordInput
                                        id="accessToken"
                                        placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                                        required
                                        {...form.register("accessToken")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Create a Personal Access Token with api scope on the GitLab instance entered under Connection Details.
                                    </p>
                                </div>

                                <div className="p-3 bg-muted rounded-md">
                                    <h4 className="font-medium mb-2">Required Token Scopes:</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• <code className="text-xs bg-background px-1 rounded">api</code> - Full API access</li>
                                        <li>• <code className="text-xs bg-background px-1 rounded">read_repository</code> - Read repository contents</li>
                                        <li>• <code className="text-xs bg-background px-1 rounded">write_repository</code> - Write to repository (for webhooks)</li>
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
