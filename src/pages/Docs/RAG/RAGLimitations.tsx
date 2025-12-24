import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Zap, AlertTriangle } from "lucide-react";

export default function RAGLimitations() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Limitations & Best Practices</h1>
                <p className="text-muted-foreground">
                    Operational constraints and performance considerations
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Re-indexing Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900">
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-orange-900 dark:text-orange-300">24-Hour Cooldown</h4>
                            <p className="text-sm text-orange-800 dark:text-orange-400 mt-1">
                                You can perform a <strong>full re-index</strong> of your project only once every 24 hours (assuming the previous attempt was successful).
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        This limitation is in place to manage resource usage for embedding generation and vector storage.
                        However, it does <strong>not</strong> apply to the automatic incremental updates.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Incremental Updates</CardTitle>
                    <CardDescription>How day-to-day changes are handled</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Zap className="h-4 w-4" />
                        "On-the-fly" Synchronization
                    </div>
                    <p className="text-sm text-muted-foreground">
                        For most use cases, you will never need to manually re-index. CodeCrow's analysis engine automatically detects changes to your
                        configured branch and performs <strong>incremental re-indexing</strong> as part of the standard process.
                    </p>
                    <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-2">
                        <li>New files are added to the index immediately.</li>
                        <li>Modified files have their embeddings updated.</li>
                        <li>Deleted files are removed from the vector store.</li>
                    </ul>
                </CardContent>
            </Card>

            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    <strong>When to wait:</strong> If you need to completely switch the indexed branch (e.g., from <code className="font-mono text-xs">master</code> to <code className="font-mono text-xs">main</code>) or drastically change your exclude patterns, you may need to wait for the 24-hour cooldown period to expire if you recently triggered a full index.
                </AlertDescription>
            </Alert>
        </div>
    );
}
