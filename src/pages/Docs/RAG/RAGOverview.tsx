import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Brain, RefreshCw, Shield, Layers, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import flowDiagram from "@/assets/rag/flow-diagram.png";
import demoResults from "@/assets/rag/demo-results.png";


export default function RAGOverview() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">RAG Overview</h1>
                <p className="text-muted-foreground">
                    Understanding Retrieval-Augmented Generation in CodeCrow
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Why RAG?</CardTitle>
                    <CardDescription>Bridging the gap between LLM knowledge and your codebase</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Large Language Models (LLMs) like GPT-5.2 are powerful, but they don't know about your specific project structure,
                        internal libraries, or business logic. RAG (Retrieval-Augmented Generation) solves this by creating a searchable
                        index of your code, allowing the AI to "look up" relevant files before answering questions or analyzing code.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 pt-4">
                        <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                            <div className="flex items-center gap-2 font-medium mb-2 text-primary">
                                <Brain className="h-4 w-4" />
                                Contextual Awareness
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Helps resolve project-specific issues like circular dependencies or incorrect usage of internal APIs
                                by providing the AI with the definitions of functions used in the changed code.
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                            <div className="flex items-center gap-2 font-medium mb-2 text-primary">
                                <Shield className="h-4 w-4" />
                                Secure & Private
                            </div>
                            <p className="text-xs text-muted-foreground">
                                We use secure <strong>Qdrant</strong> indexes created specifically for each project.
                                Your code embeddings are isolated and never shared between projects.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border overflow-x-auto min-h-[300px] flex flex-col items-center justify-center">
                        <h4 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">Architecture Flow</h4>
                        <div className="w-full max-w-2xl">
                            <img
                                src={flowDiagram}
                                alt="Codecrow RAG flow"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Technical Implementation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-muted rounded-md shrink-0">
                                <Layers className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">1. Embedding Generation</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We use <strong className="text-foreground">OpenAI embedding models</strong> to convert your code chunks into vector representations.
                                    These vectors capture the semantic meaning of your code, not just keywords.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-muted rounded-md shrink-0">
                                <Database className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">2. Secured Qdrant Indexes</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    The vectors are stored in a dedicated Qdrant collection for your project.
                                    All processes from indexing to retrieval are covered on our infrastructure, ensuring
                                    that results are placed in secured indexes isolated by project identity.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-muted rounded-md shrink-0">
                                <RefreshCw className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">3. Automatic Sync Pipeline</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We have built a full-fledged pipeline to handle updates.
                                    While the <Badge variant="outline">Initial Indexing</Badge> may take time depending on project size,
                                    all subsequent changes to the monitored branch are handled automatically via incremental updates.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Alert>
                <Bot className="h-4 w-4" />
                <AlertDescription>
                    RAG allows CodeCrow to detect <strong>architecture-specific issues</strong>. For example, if you change a shared
                    interface in one file, CodeCrow can retrieve the relevant implementations in other files to ensure the change
                    hasn't inadvertently introduced a breaking contract violation.
                </AlertDescription>
                <div className="flex justify-center">
                    <div className="w-full">
                        <img
                            src={demoResults}
                            alt="Codecrow RAG flow"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </Alert>
        </div>
    );
}
