import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, RefreshCcw, ExternalLink, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NavLink } from "react-router-dom";

export default function RAGIndexingSettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">RAG Indexing</h1>
                <p className="text-muted-foreground">
                    Manage your project's knowledge base and search accuracy.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Indexing Management</CardTitle>
                    <CardDescription>Control how your code awareness is built.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                    <p className="text-muted-foreground">
                        This tab allows you to manually trigger a <strong>Full Indexing</strong> and monitor the current
                        state of your vector database.
                    </p>

                    <Alert className="bg-primary/5 border-primary/20">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-primary">
                            For a deep dive into how vectors are stored and updated, visit the
                            <NavLink to="/docs/rag/overview" className="inline-flex items-center gap-1 font-bold ml-1 border-b border-primary/50 hover:border-primary transition-colors">
                                RAG Guide <ExternalLink className="h-3 w-3" />
                            </NavLink>.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-muted rounded-md shrink-0">
                                <RefreshCcw className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Trigger Full Index</h4>
                                <p className="text-muted-foreground">
                                    Starts a fresh crawl of your repository. This is useful if you've made significant architecture
                                    changes or updated your exclude patterns.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-muted rounded-md shrink-0">
                                <Database className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Index Stats</h4>
                                <p className="text-muted-foreground">
                                    View the number of indexed chunks and the timestamp of the last successful synchronization.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
