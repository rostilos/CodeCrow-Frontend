import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatabaseZap, ExternalLink, Info, Brain, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { DocNavigation } from "./DocNavigation";

export default function SetupRAG() {
    const navigate = useNavigate();
    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl font-sans">
            <div className="mb-8">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    <DatabaseZap className="mr-2 h-4 w-4 inline" />
                    Step 5
                </Badge>
                <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
                    Setup RAG (Optional)
                </h1>
                <p className="text-xl text-muted-foreground">
                    Enrich your AI reviews with project-wide context using Retrieval-Augmented Generation.
                </p>
            </div>

            <div className="space-y-6">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>What is RAG?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Standard AI analysis only sees the files changed in a PR. <strong>RAG</strong> (Retrieval-Augmented Generation)
                            indexes your <strong>entire codebase</strong> into a vector database. This allows CodeCrow to "look up"
                            relevant functions, classes, and logic from across your project, providing much more accurate and
                            context-aware feedback.
                        </p>
                        <div className="flex gap-4">
                            <div className="flex-1 p-4 border rounded-lg bg-background">
                                <Brain className="h-5 w-5 text-primary mb-2" />
                                <h4 className="font-bold text-sm">Deep Context</h4>
                                <p className="text-xs text-muted-foreground">AI understands internal dependencies and APIs.</p>
                            </div>
                            <div className="flex-1 p-4 border rounded-lg bg-background">
                                <Zap className="h-5 w-5 text-primary mb-2" />
                                <h4 className="font-bold text-sm">Fewer False Positives</h4>
                                <p className="text-xs text-muted-foreground">Better reasoning about project-specific patterns.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>How to Enable</CardTitle>
                        <CardDescription>Setting up RAG is a one-time process per project.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <ol className="space-y-4 list-decimal ml-4">
                            <li className="pl-2">
                                <strong>Navigate to Indexing:</strong> Go to your Project Settings and select the <strong>RAG Indexing</strong> tab.
                            </li>
                            <li className="pl-2">
                                <strong>Select Index Branch:</strong> Choose your main development branch (e.g., <code className="bg-muted px-1 rounded">main</code> or <code className="bg-muted px-1 rounded">develop</code>) as the source of truth.
                            </li>
                            <li className="pl-2">
                                <strong>Trigger Initial Sync:</strong> Click "Start Indexing". CodeCrow will crawl your repository and generate embeddings.
                            </li>
                            <li className="pl-2">
                                <strong>Automatic Updates:</strong> Once the initial index is complete, CodeCrow will incrementally update the index on every push to your main branch.
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                <Card className="bg-muted/30 border-dashed border-primary/20">
                    <CardContent className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div>
                            <h4 className="font-bold text-sm">Need a Technical Deep Dive?</h4>
                            <p className="text-xs text-muted-foreground">Explore architecture, indexing lifecycle, and limitations.</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-primary/30 hover:bg-primary/5 text-primary"
                            onClick={() => navigate("/docs/rag/overview")}
                        >
                            Full RAG Guide <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>

                <DocNavigation
                    prev={{ title: "Create First Project", url: "/docs/first-project" }}
                    next={{ title: "Project Token", url: "/docs/project-token" }}
                />
            </div>
        </div>
    );
}
