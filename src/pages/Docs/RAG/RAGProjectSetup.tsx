import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, FolderX, Play, Settings, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RAGProjectSetup() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Managing RAG</h1>
                <p className="text-muted-foreground">
                    Configuring and maintaining your project's search index
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuration Overview</CardTitle>
                    <CardDescription>
                        RAG settings are located in <strong>Project Settings</strong> → <strong>RAG Indexing</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-primary" />
                            Index Branch
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            This is the "source of truth" branch for your project context (usually <code className="bg-muted px-1 rounded">main</code> or <code className="bg-muted px-1 rounded">develop</code>).
                        </p>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Currently, CodeCrow supports indexing a <strong>single branch</strong> per project.
                                Any PR targeted at this branch will benefit from the RAG context. Multi-branch indexing is planned for future releases.
                            </AlertDescription>
                        </Alert>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <FolderX className="h-5 w-5 text-primary" />
                            Exclude Patterns
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Not all files are useful for AI context. Excluding generic or sensitive files improves answer quality and reduces noise.
                        </p>
                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <div className="text-sm font-medium">Recommended Exclusions:</div>
                            <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
                                <li><strong>Framework Internals:</strong> <code className="bg-muted px-1 rounded">node_modules/**</code>, <code className="bg-muted px-1 rounded">vendor/**</code> (LLMs already know standard libraries).</li>
                                <li><strong>Build Artifacts:</strong> <code className="bg-muted px-1 rounded">dist/**</code>, <code className="bg-muted px-1 rounded">build/**</code>.</li>
                                <li><strong>Sensitive Data:</strong> <code className="bg-muted px-1 rounded">**/*.env</code>, <code className="bg-muted px-1 rounded">secrets/**</code>.</li>
                                <li><strong>Assets:</strong> <code className="bg-muted px-1 rounded">**/*.png</code>, <code className="bg-muted px-1 rounded">**/*.svg</code>.</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Starting the Process</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                        <Play className="h-5 w-5 text-green-600 mt-1" />
                        <div>
                            <h4 className="font-medium mb-1">Trigger Indexing</h4>
                            <p className="text-sm text-muted-foreground">
                                Once configured, simply click the <strong>Trigger Indexing</strong> button.
                                The system will clone your repository, filter files based on your patterns, generate embeddings, and store them in Qdrant.
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                        Note: Ensure your "Analysis Scope" is also configured to monitor the indexed branch to enable automatic updates.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
