import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, GitPullRequest, GitBranch, Info, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function AnalysisScopeSettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Analysis Scope</h1>
                <p className="text-muted-foreground">
                    Define when and where CodeCrow should automatically analyze your code.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Auto Analysis Settings
                    </CardTitle>
                    <CardDescription>
                        Configure high-level automation triggers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-muted/30">
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                <GitPullRequest className="h-4 w-4 text-blue-500" />
                                PR Analysis
                            </h4>
                            <p className="text-muted-foreground">
                                Automatically analyze code changes when a Pull Request is created or updated.
                                This is the primary way CodeCrow helps you maintain code quality.
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg bg-muted/30">
                            <h4 className="font-bold flex items-center gap-2 mb-2">
                                <GitBranch className="h-4 w-4 text-purple-500" />
                                Branch Analysis
                            </h4>
                            <p className="text-muted-foreground">
                                Trigger analysis on direct pushes to monitored branches. Useful for maintaining
                                an up-to-date RAG index and tracking history.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary" />
                        Pattern Configuration
                    </CardTitle>
                    <CardDescription>
                        Restrict analysis to specific branches using glob patterns.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm underline-offset-4">
                    <p className="text-muted-foreground">
                        If no patterns are configured, <strong>all branches</strong> will trigger analysis.
                        Use patterns to focus resources on your most important branches.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="font-semibold">Supported Wildcards:</p>
                                <code className="block bg-muted p-2 rounded text-xs select-all">
                                    * matches any characters except / (e.g., feature/*)<br />
                                    ** matches any characters including / (e.g., release/**)
                                </code>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold">PR Target Branches</h4>
                            <p className="text-muted-foreground">
                                Only analyze PRs targeting these branches (e.g., <code className="bg-muted px-1 rounded">main</code>, <code className="bg-muted px-1 rounded">develop</code>).
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold">Branch Push Patterns</h4>
                            <p className="text-muted-foreground">
                                Only analyze direct pushes to branches matching these patterns.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
