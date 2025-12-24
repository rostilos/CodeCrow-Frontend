import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GeneralSettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
                <p className="text-muted-foreground">
                    Basic project information and visibility controls.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Project Basics</CardTitle>
                    <CardDescription>Manage how your project appears in CodeCrow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-muted rounded-md shrink-0">
                                <Settings className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">Project Name & Description</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    The name of the project as it appears in your dashboard. The description helps team members understand
                                    the project's purpose and scope.
                                </p>
                            </div>
                        </div>

                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Changing the project name in CodeCrow does not affect your repository name in your VCS provider.
                            </AlertDescription>
                        </Alert>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Visibility & Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>
                        You can view the unique <strong>Project ID</strong> used for API interactions and CI/CD integrations.
                    </p>
                    <p>
                        Visibility settings control who within your workspace can view analysis results and modify project settings.
                        By default, projects inherit workspace-level visibility.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
