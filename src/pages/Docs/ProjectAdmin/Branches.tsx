import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, CheckCircle2, AlertCircle } from "lucide-react";

export default function BranchesSettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
                <p className="text-muted-foreground">
                    Define which branches are monitored and analyzed.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Branch Monitoring</CardTitle>
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
                    <CardTitle>Default Branch</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    <p>
                        The default branch is used as the base for comparing PRs and is the primary target for RAG indexing.
                        Ensure this matches your main development branch.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
