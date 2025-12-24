import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Cpu, Layers, Send, Brain } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function CommandAsk() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">/codecrow ask</h1>
                <p className="text-muted-foreground">
                    Talk to your code through a platform-specific AI interface.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usage</CardTitle>
                    <CardDescription>Ask specific questions about the code or analysis results.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm border flex items-center justify-between">
                        <span>/codecrow ask "Can you explain how this change affects the database schema?"</span>
                        <Send className="h-4 w-4 text-primary" />
                    </div>

                    <p className="text-sm text-muted-foreground">
                        The <code className="font-bold text-foreground">ask</code> command is more than just a chatbot.
                        It uses CodeCrow's platform-specific <strong>MCP (Model Context Protocol)</strong> to
                        gain deep insights into your project.
                    </p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            RAG & Context Aware
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <p>
                            When you ask a question, CodeCrow doesn't just look at the diff. It queries your
                            <strong>RAG Index</strong> to understand imports, class definitions, and usages
                            in other files that aren't even part of the current PR.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-primary" />
                            Analysis Integration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <p>
                            It knows about the issues it previously detected. You can clarify a point,
                            ask for a <strong>potential patch</strong>, or verify if a specific edge case
                            was considered in the AI's logic.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Example Scenarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg bg-muted/20">
                        <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Refactoring Suggestion</p>
                        <p className="text-sm italic">"/codecrow ask could you rewrite this function to be more performant using map/reduce?"</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/20">
                        <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Cross-file impact</p>
                        <p className="text-sm italic">"/codecrow ask are there any other services that rely on this API endpoint?"</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/20">
                        <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Bug verification</p>
                        <p className="text-sm italic">"/codecrow ask you flagged a potential race condition. How should I fix it?"</p>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-muted/50 aspect-video rounded-xl border-2 border-dashed flex items-center justify-center">
                <span className="text-muted-foreground">Screenshot Placeholder: Conversational AI in a PR thread</span>
            </div>
        </div>
    );
}
