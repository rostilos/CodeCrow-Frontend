import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Terminal, Shield, Clock, Info, AlertTriangle, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

            <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>Enable Comment Commands</AlertTitle>
                <AlertDescription>
                    Comment commands must be enabled in your project settings before use. 
                    Navigate to <strong>Project Settings → Analysis Settings → Comment Commands</strong> to enable this feature.
                </AlertDescription>
            </Alert>

            <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">AI Model Considerations</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                    The quality of <code>/codecrow summarize</code> and <code>/codecrow ask</code> responses depends on your AI model. 
                    Free-tier or low-parameter models may produce inconsistent results. 
                    For best results, use models with 70B+ parameters or premium models (GPT-4, Claude 3, etc.).
                </AlertDescription>
            </Alert>

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
                            <p className="text-xs text-muted-foreground">Trigger analysis manually if auto-analysis is disabled in project settings.</p>
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
        </div>
    );
}
