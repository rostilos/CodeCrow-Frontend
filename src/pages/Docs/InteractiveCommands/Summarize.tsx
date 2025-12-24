import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Image as ImageIcon, Layout, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CommandSummarize() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">/codecrow summarize</h1>
                <p className="text-muted-foreground">
                    Generate an intelligent overview of the changes in your PR.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usage</CardTitle>
                    <CardDescription>Get the big picture of your code changes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm border flex items-center justify-between">
                        <span>/codecrow summarize</span>
                        <Send className="h-4 w-4 text-primary" />
                    </div>

                    <p className="text-sm text-muted-foreground">
                        This command analyzes the entire diff and provides a structured summary including:
                    </p>
                    <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-2">
                        <li><strong>High-level intent</strong>: What is this PR trying to achieve?</li>
                        <li><strong>Key changes</strong>: A bulleted list of the most significant modifications.</li>
                        <li><strong>Architectural Impact</strong>: How these changes affect other parts of the system.</li>
                        <li><strong>Diagrams (Mermaid)</strong>: Visual representation of flow or logic changes where applicable.</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Feature Highlights</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="p-4 border rounded-lg">
                        <Layout className="h-5 w-5 text-blue-500 mb-2" />
                        <h4 className="font-bold text-foreground">Structured Layout</h4>
                        <p className="text-xs">Generated summaries use Markdown headers and tables for readability.</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <ImageIcon className="h-5 w-5 text-purple-500 mb-2" />
                        <h4 className="font-bold text-foreground">Visual Flow</h4>
                        <p className="text-xs">When complex logic is detected, CodeCrow generates Mermaid.js diagrams automatically.</p>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-muted/50 aspect-video rounded-xl border-2 border-dashed flex items-center justify-center">
                <span className="text-muted-foreground">Screenshot Placeholder: Structural summary of a large PR</span>
            </div>
        </div>
    );
}
