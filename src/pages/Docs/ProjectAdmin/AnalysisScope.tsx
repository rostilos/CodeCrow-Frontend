import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, GitPullRequest, GitBranch, Info, Zap, MessageSquare } from "lucide-react";
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
                        Configure when CodeCrow should automatically analyze your code.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-muted/30">
                            <h4 className="font-bold flex items-center gap-2 mb-2 text-primary">
                                <GitPullRequest className="h-4 w-4" />
                                Pull Request Analysis
                            </h4>
                            <p className="text-muted-foreground">
                                Automatically analyze code changes whenever a Pull Request is created or updated.
                                This helps maintain quality throughout the development cycle.
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg bg-muted/30">
                            <h4 className="font-bold flex items-center gap-2 mb-2 text-primary">
                                <GitBranch className="h-4 w-4" />
                                Branch Analysis
                            </h4>
                            <p className="text-muted-foreground">
                                Analyze code when direct pushes occur to monitored branches.
                                <strong> Note:</strong> Branch analysis is required when RAG indexing is enabled for incremental updates.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary" />
                        Analysis Scope Configuration
                    </CardTitle>
                    <CardDescription>
                        Define which branches trigger automated code analysis from webhooks.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm underline-offset-4">
                    <p className="text-muted-foreground">
                        If no patterns are configured, <strong>all branches</strong> will be analyzed.
                        Patterns support exact names and wildcards:
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="font-semibold">Pattern Syntax:</p>
                                <code className="block bg-muted p-2 rounded text-xs select-all">
                                    * matches any characters except / (e.g., release/*)<br />
                                    ** matches any characters including / (e.g., feature/**)
                                </code>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold">Pull Request Target Branches</h4>
                            <p className="text-muted-foreground">
                                Only analyze PRs targeting these branches (e.g., <code className="bg-muted px-1 rounded">main</code>, <code className="bg-muted px-1 rounded">develop</code>, <code className="bg-muted px-1 rounded">release/*</code>).
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold">Branch Push Patterns</h4>
                            <p className="text-muted-foreground">
                                Only analyze direct pushes to branches matching these patterns (e.g., <code className="bg-muted px-1 rounded">main</code>, <code className="bg-muted px-1 rounded">develop</code>).
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Comment Commands
                    </CardTitle>
                    <CardDescription>
                        Trigger analysis and interact with CodeCrow via PR comments.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="font-medium">Enabled</span>
                        <Badge variant="outline" className="ml-auto">Enable Comment Commands</Badge>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold">Available Commands</h4>
                        <div className="grid gap-4">
                            <div className="p-4 border rounded-lg">
                                <code className="text-primary font-bold">/codecrow analyze</code>
                                <p className="text-xs text-muted-foreground mt-1">Trigger PR analysis.</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <code className="text-primary font-bold">/codecrow summarize</code>
                                <p className="text-xs text-muted-foreground mt-1">Generate PR summary with diagrams.</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <code className="text-primary font-bold">/codecrow ask &lt;question&gt;</code>
                                <p className="text-xs text-muted-foreground mt-1">Answer questions about code/analysis.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t space-y-4">
                        <h4 className="font-bold">Rate Limiting</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium mb-1">Max Commands</p>
                                <div className="p-2 border rounded font-mono text-xs">10</div>
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1">Window (minutes)</p>
                                <div className="p-2 border rounded font-mono text-xs">60</div>
                            </div>
                        </div>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                Currently: 10 commands per 60 minutes per project.
                            </AlertDescription>
                        </Alert>
                    </div>

                    {/*<div className="pt-4 border-t">*/}
                    {/*    <div className="flex items-center justify-between">*/}
                    {/*        <div>*/}
                    {/*            <h4 className="font-bold">Allow on Public Repositories</h4>*/}
                    {/*            <p className="text-xs text-muted-foreground">Only high-privilege users can trigger commands on public repos.</p>*/}
                    {/*        </div>*/}
                    {/*        <Badge variant="outline">Restricted</Badge>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </CardContent>
            </Card>
        </div>
    );
}
