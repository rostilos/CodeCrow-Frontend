import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Trash2, Link2Off, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DangerZoneSettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Danger Zone</h1>
                <p className="text-muted-foreground">
                    Irreversible and destructive actions. Please proceed with caution.
                </p>
            </div>

            <Card className="border-destructive/30">
                <CardHeader className="bg-destructive/5">
                    <CardTitle className="flex items-center gap-2 text-destructive font-bold text-lg">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h4 className="font-bold flex items-center gap-2">
                                <Link2Off className="h-4 w-4" />
                                Disconnect Repository
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Remove the VCS connection from this project. Analysis history will be preserved.
                            </p>
                        </div>
                        <Button variant="destructive" size="sm" className="shrink-0">Disconnect</Button>
                    </div>

                    <div className="border-t pt-6 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h4 className="font-bold flex items-center gap-2 text-destructive">
                                <Trash2 className="h-4 w-4" />
                                Delete Project
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Permanently delete this project and all its data including analysis history, branches, and settings. This action cannot be undone.
                            </p>
                        </div>
                        <Button variant="destructive" size="sm" className="shrink-0">Delete Project</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 border rounded-lg bg-primary/5 border-primary/10 flex gap-3 items-center">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm font-medium">
                    Two-factor authentication is enabled. You'll need to verify your identity for destructive actions.
                </p>
            </div>
        </div>
    );
}
