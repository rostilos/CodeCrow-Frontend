import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, RefreshCcw, ExternalLink, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

            {/* Free Plan Limitations Alert */}
            <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-600 dark:text-amber-400">Free Plan Limitations</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300 space-y-2">
                    <p>
                        During the free plan, RAG indexing has the following limitations to ensure fair usage:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>Maximum 70,000 chunks</strong> per indexed branch</li>
                        <li><strong>Maximum 40,000 files</strong> per indexed branch</li>
                        <li><strong>Maximum 1 MB</strong> per individual file</li>
                    </ul>
                    <p className="text-sm mt-2">
                        These limits are designed to support most small to medium projects. We're working on expanded plans 
                        with higher limits for larger repositories. <strong>Contact support</strong> if you need increased capacity.
                    </p>
                </AlertDescription>
            </Alert>

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

                    {/* Tips for staying within limits */}
                    <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Tips for Optimizing Index Size</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-4">
                            <p>
                                Use <strong>exclude patterns</strong> in your project's RAG settings to skip large or unnecessary directories.
                                This helps stay within limits and improves indexing performance.
                            </p>
                            
                            <div className="space-y-3">
                                <div>
                                    <h5 className="font-semibold text-foreground mb-1">Common directories to exclude:</h5>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li><code className="text-xs bg-background px-1 rounded">node_modules/**</code> - npm/yarn dependencies</li>
                                        <li><code className="text-xs bg-background px-1 rounded">vendor/**</code> - Composer/bundler dependencies</li>
                                        <li><code className="text-xs bg-background px-1 rounded">.venv/**</code>, <code className="text-xs bg-background px-1 rounded">venv/**</code> - Python virtual environments</li>
                                        <li><code className="text-xs bg-background px-1 rounded">dist/**</code>, <code className="text-xs bg-background px-1 rounded">build/**</code>, <code className="text-xs bg-background px-1 rounded">target/**</code> - Build outputs</li>
                                    </ul>
                                </div>
                                
                                <div>
                                    <h5 className="font-semibold text-foreground mb-1">Generated files to exclude:</h5>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li><code className="text-xs bg-background px-1 rounded">*.generated.*</code> - Auto-generated code</li>
                                        <li><code className="text-xs bg-background px-1 rounded">*.min.js</code>, <code className="text-xs bg-background px-1 rounded">*.min.css</code> - Minified assets</li>
                                        <li><code className="text-xs bg-background px-1 rounded">*.bundle.js</code> - Bundled JavaScript</li>
                                        <li><code className="text-xs bg-background px-1 rounded">*.lock</code>, <code className="text-xs bg-background px-1 rounded">package-lock.json</code> - Lock files</li>
                                    </ul>
                                </div>
                                
                                <div>
                                    <h5 className="font-semibold text-foreground mb-1">Framework-specific directories:</h5>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        <li><code className="text-xs bg-background px-1 rounded">.next/**</code> - Next.js build cache</li>
                                        <li><code className="text-xs bg-background px-1 rounded">.nuxt/**</code> - Nuxt.js build cache</li>
                                        <li><code className="text-xs bg-background px-1 rounded">__pycache__/**</code> - Python bytecode</li>
                                        <li><code className="text-xs bg-background px-1 rounded">.gradle/**</code>, <code className="text-xs bg-background px-1 rounded">.m2/**</code> - Java build caches</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <p className="text-xs italic">
                                Note: Binary files, images, and common asset types are automatically excluded from indexing.
                            </p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}
