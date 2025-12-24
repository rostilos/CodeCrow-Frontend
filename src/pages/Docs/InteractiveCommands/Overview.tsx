import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Terminal, Shield, Clock, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function CommandsOverview() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Interactive Commands</h1>
                <p className="text-muted-foreground">
                    Control CodeCrow and ask questions directly from your Pull Request comments.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>How to interact with CodeCrow using slash commands.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Comment commands allow you to trigger specific actions or get insights without leaving your VCS platform
                        (GitHub/Bitbucket). CodeCrow listens for comments starting with <code className="bg-muted px-1 rounded font-bold">/codecrow</code>.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 py-4">
                        <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <Terminal className="h-5 w-5 mb-2 text-primary" />
                            <h4 className="font-bold text-sm">Analyze</h4>
                            <p className="text-xs text-muted-foreground">Force a re-analysis of the current PR state.</p>
                        </div>
                        <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <Terminal className="h-5 w-5 mb-2 text-primary" />
                            <h4 className="font-bold text-sm">Summarize</h4>
                            <p className="text-xs text-muted-foreground">Generate high-level summaries and diagrams.</p>
                        </div>
                        <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <Terminal className="h-5 w-5 mb-2 text-primary" />
                            <h4 className="font-bold text-sm">Ask</h4>
                            <p className="text-xs text-muted-foreground">Chat with your code and analysis data.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configuration & Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm underline-offset-4 line-height-relaxed">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">Public Repository Safety</p>
                            <p className="text-muted-foreground text-xs">
                                On public repositories, you can configure CodeCrow to only respond to "high-privilege" users (Write access or above)
                                to prevent unwanted API usage by external contributors.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">Rate Limiting</p>
                            <p className="text-muted-foreground text-xs">
                                To ensure platform stability, commands are rate-limited per project. By default, it's set to
                                <strong>102 commands per 60 minutes</strong>, but this can be adjusted in project settings.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-muted/50 aspect-video rounded-xl border-2 border-dashed flex items-center justify-center">
                <span className="text-muted-foreground">Screenshot Placeholder: Using commands in a PR comment</span>
            </div>
        </div>
    );
}
