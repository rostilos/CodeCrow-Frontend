import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {PasswordInput} from "@/components/ui/password-input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {ArrowLeft, GitBranch, Key, Link, Save} from "lucide-react";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useToast} from "@/hooks/use-toast.ts";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {bitbucketCloudService} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {BitbucketConnection} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.interface.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";


const btibucketConnectionSchema = z.object({
    connectionName: z.string(),
    workspaceId: z.string(),
    oAuthKey: z.string(),
    oAuthSecret: z.string(),
});

type BitbucketConnectionForm = z.infer<typeof btibucketConnectionSchema>;

export default function AddConnection() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const {toast} = useToast();
    const { currentWorkspace } = useWorkspace();
    const routes = useWorkspaceRoutes();

    const form = useForm<BitbucketConnectionForm>({
        resolver: zodResolver(btibucketConnectionSchema),
        defaultValues: {
            connectionName: "",
            workspaceId: "",
            oAuthKey: "",
            oAuthSecret: "",
        },
    });

    const onSubmit = async (data: BitbucketConnectionForm) => {
        if (!currentWorkspace) return;
        
        setIsLoading(true);
        try {
            const response: BitbucketConnection = await bitbucketCloudService.createUserConnection(currentWorkspace.slug, data as {
                connectionName: string,
                workspaceId: string,
                oAuthKey: string,
                oAuthSecret: string,
            });

            toast({
                title: "New Bitbucket Cloud connection successfully created"
            });

            navigate(routes.hostingConfigure(response.id))
        } catch (error: any) {
            toast({
                title: "An error occurred while creating bitbucket connection.",
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
                <ArrowLeft className="h-4 w-4"/>
                <span>Back to Code Hosting</span>
            </Button>

            <div className="flex items-center space-x-2">
                <GitBranch className="h-6 w-6 text-primary"/>
                <h1 className="text-3xl font-bold">Add Bitbucket Connection</h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Link className="h-5 w-5"/>
                                    <span>Connection Details</span>
                                </CardTitle>
                                <CardDescription>
                                    Basic information about your Bitbucket connection
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Connection Name *</Label>
                                    <Input
                                        id="connectionName"
                                        placeholder="e.g., Main Workspace"
                                        required
                                        {...form.register("connectionName")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        A friendly name to identify this connection
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="workspace">Workspace *</Label>
                                    <Input
                                        id="workspaceId"
                                        placeholder="e.g., acme-corp"
                                        required
                                        {...form.register("workspaceId")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Your Bitbucket workspace name
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Authentication */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Key className="h-5 w-5"/>
                                    <span>Authentication</span>
                                </CardTitle>
                                <CardDescription>
                                    Configure API keys and credentials
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">OAuth Key *</Label>
                                    <PasswordInput
                                        id="oAuthKey"
                                        placeholder="Enter your Bitbucket API key"
                                        required
                                        {...form.register("oAuthKey")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Your Bitbucket OAuth key
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="webhookSecret">OAuth Key Secret *</Label>
                                    <PasswordInput
                                        id="oAuthSecret"
                                        placeholder="Optional webhook secret"
                                        required
                                        {...form.register("oAuthSecret")}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        OAuth Secret
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>


                    {/* Permissions */}
                    {/*<Card className="opacity-50 pointer-events-none">*/}
                    {/*    <CardHeader>*/}
                    {/*        <CardTitle>Permissions</CardTitle>*/}
                    {/*        <CardDescription>*/}
                    {/*            Configure what this connection can access*/}
                    {/*        </CardDescription>*/}
                    {/*    </CardHeader>*/}
                    {/*    <CardContent className="space-y-4">*/}
                    {/*        <div className="space-y-4">*/}
                    {/*            <div className="flex items-center justify-between">*/}
                    {/*                <div className="space-y-0.5">*/}
                    {/*                    <Label>Repository Access</Label>*/}
                    {/*                    <p className="text-sm text-muted-foreground">*/}
                    {/*                        Read access to repositories*/}
                    {/*                    </p>*/}
                    {/*                </div>*/}
                    {/*                <Switch*/}
                    {/*                    checked={formData.repositoryAccess}*/}
                    {/*                    onCheckedChange={(checked) => handleInputChange('repositoryAccess', checked)}*/}
                    {/*                />*/}
                    {/*            </div>*/}

                    {/*            <div className="flex items-center justify-between">*/}
                    {/*                <div className="space-y-0.5">*/}
                    {/*                    <Label>Pull Request Access</Label>*/}
                    {/*                    <p className="text-sm text-muted-foreground">*/}
                    {/*                        Access to PR data and comments*/}
                    {/*                    </p>*/}
                    {/*                </div>*/}
                    {/*                <Switch*/}
                    {/*                    checked={formData.pullRequestAccess}*/}
                    {/*                    onCheckedChange={(checked) => handleInputChange('pullRequestAccess', checked)}*/}
                    {/*                />*/}
                    {/*            </div>*/}

                    {/*            <div className="flex items-center justify-between">*/}
                    {/*                <div className="space-y-0.5">*/}
                    {/*                    <Label>Webhook Access</Label>*/}
                    {/*                    <p className="text-sm text-muted-foreground">*/}
                    {/*                        Receive webhook notifications*/}
                    {/*                    </p>*/}
                    {/*                </div>*/}
                    {/*                <Switch*/}
                    {/*                    checked={formData.webhookAccess}*/}
                    {/*                    onCheckedChange={(checked) => handleInputChange('webhookAccess', checked)}*/}
                    {/*                />*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </CardContent>*/}
                    {/*</Card>*/}

                    <Separator/>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(routes.hostingSettings())}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex items-center space-x-2">
                            <Save className="h-4 w-4"/>
                            <span>{isLoading ? 'Creating...' : 'Create Connection'}</span>
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}