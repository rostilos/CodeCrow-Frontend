import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Cpu, Zap, Brain, Shield } from "lucide-react";

export default function AIConnectionsSettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">AI Connections</h1>
                <p className="text-muted-foreground">
                    Select which AI brains power your project analysis.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Model Selection</CardTitle>
                    <CardDescription>Choose the LLM that best fits your complexity needs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm underline-offset-4">
                    <p className="text-muted-foreground">
                        CodeCrow allows you to select different models for different projects. Some teams prefer
                        stronger reasoning models (like GPT-4o) for complex backend logic and faster models for standard UI components.
                    </p>

                    <div className="grid gap-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
                            <Zap className="h-6 w-6 text-primary" />
                            <div>
                                <h4 className="font-semibold">Project-Level Override</h4>
                                <p className="text-xs text-muted-foreground">
                                    By default, projects use the workspace connection. You can override this to use a specific
                                    model or unique credentials for a high-priority project.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Privacy & Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                        <p>
                            Metadata and code chunks sent to AI models are transmitted over secure TLS connections.
                            CodeCrow does not use your data for training proprietary models.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
