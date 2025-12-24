import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Terminal, RefreshCw, Send, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CommandAnalyze() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">/codecrow analyze</h1>
                <p className="text-muted-foreground">
                    Force a fresh analysis of your code changes.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usage</CardTitle>
                    <CardDescription>Manually trigger the analysis pipeline.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm border flex items-center justify-between">
                        <span>/codecrow analyze</span>
                        <Send className="h-4 w-4 text-primary" />
                    </div>

                    <p className="text-sm text-muted-foreground">
                        While CodeCrow usually triggers automatically on push, this command is useful when:
                    </p>
                    <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-2">
                        <li>You've updated your <strong>Analysis Scope</strong> or <strong>Exclude Patterns</strong> and want to re-evaluate the current PR.</li>
                        <li>A previous analysis failed due to transient infrastructure issues.</li>
                        <li>You want to see if recent RAG index updates change the previous findings.</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>What Happens Next?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                        <RefreshCw className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <p>
                            CodeCrow will acknowledge the command with a reaction or a reply and start a new analysis job.
                            Old comments or reports for the same commit will be updated or replaced to reflect the new state.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-muted/50 aspect-video rounded-xl border-2 border-dashed flex items-center justify-center">
                <span className="text-muted-foreground">Screenshot Placeholder: Analysis trigger acknowledgment</span>
            </div>
        </div>
    );
}
