import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Globe, Lock, ExternalLink } from "lucide-react";

export default function CodeHostingSettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Code Hosting</h1>
                <p className="text-muted-foreground">
                    Integration settings for your Version Control System (VCS).
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>VCS Integration</CardTitle>
                    <CardDescription>How CodeCrow connects to your repository.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                        This section displays the current connection details between CodeCrow and your VCS provider
                        (GitHub, Bitbucket, etc.).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 font-medium mb-2">
                                <Globe className="h-4 w-4 text-primary" />
                                Repository URL
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The full path to your repository. CodeCrow uses this for cloning and fetching updates.
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 font-medium mb-2">
                                <Lock className="h-4 w-4 text-primary" />
                                Access Level
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Displays the authentication method used (OAuth, App Password, or SSH Key).
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Re-configuring Connection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>
                        If you need to move your repository or update access credentials, you can modify the VCS connection here.
                    </p>
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <ExternalLink className="h-4 w-4" />
                        <span>Switching between Personal and Workspace connections is supported.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
