import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, CheckCircle2, AlertCircle, AlertTriangle, Database, Layers } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BranchesSettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
                <p className="text-muted-foreground">
                    Configure the main branch and branch monitoring patterns for your project.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Main Branch
                    </CardTitle>
                    <CardDescription>The primary branch used for RAG indexing and as baseline for analysis.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        The <strong>Main Branch</strong> serves as the foundation for your project's code analysis:
                    </p>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                            <Database className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium">RAG Code Indexing</div>
                                <p className="text-sm text-muted-foreground">
                                    The main branch is indexed for RAG (Retrieval-Augmented Generation), enabling AI-powered contextual code analysis.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                            <Layers className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium">Delta Indexes for Release Branches</div>
                                <p className="text-sm text-muted-foreground">
                                    Release branches create delta indexes based on the main branch, tracking only the differences for efficient analysis.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium">Always Included in Analysis</div>
                                <p className="text-sm text-muted-foreground">
                                    The main branch is automatically included in PR target patterns and branch push patterns, and cannot be removed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Warning:</strong> Changing the main branch after RAG indexing requires retraining. 
                            All delta indexes will need to be rebuilt against the new main branch. 
                            2FA verification is required when changing the main branch for projects with existing analysis.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Branch Monitoring Patterns</CardTitle>
                    <CardDescription>Configure glob patterns for automatic analysis.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                        CodeCrow uses <strong>Branch Patterns</strong> to decide which pushes should trigger a full code analysis.
                    </p>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Common Patterns</h4>
                        <div className="bg-muted p-4 rounded-lg">
                            <ul className="space-y-2 text-sm font-mono">
                                <li className="flex justify-between">
                                    <span>main, master</span>
                                    <span className="text-muted-foreground italic"># Primary branches</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>release/*</span>
                                    <span className="text-muted-foreground italic"># All release branches</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>feature/**</span>
                                    <span className="text-muted-foreground italic"># Deeply nested features</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 border rounded-lg bg-primary/5">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm">
                            Any push to a branch matching these patterns will automatically trigger an incremental analysis,
                            updating your RAG index and issue tracker.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Default Branch for Statistics</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p>
                        The <strong>Default Branch</strong> (separate from Main Branch) determines which analyzed branch 
                        is shown in project statistics and dashboards. This should typically be set to your main development 
                        branch after the first analysis is complete.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
