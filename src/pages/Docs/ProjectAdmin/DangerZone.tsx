import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Trash2, Archive, ShieldAlert } from "lucide-react";

export default function DangerZoneSettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2 text-destructive">
                <h1 className="text-3xl font-bold tracking-tight">Danger Zone</h1>
                <p className="text-muted-foreground">
                    Heavy-duty destructive actions. Use with caution.
                </p>
            </div>

            <Card className="border-destructive/30">
                <CardHeader className="bg-destructive/5">
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <ShieldAlert className="h-5 w-5" />
                        Destructive Actions
                    </CardTitle>
                    <CardDescription>Permanent changes that cannot be undone.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-destructive/10 rounded-md shrink-0">
                            <Archive className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">Transfer Ownership</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Move this project to another workspace. You must be an owner in both workspaces to
                                perform this action.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-destructive/10 rounded-md shrink-0">
                            <Trash2 className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-destructive">Delete Project</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Completely remove this project from CodeCrow. This will delete all analysis history,
                                RAG indexes, and stored settings. This action is irreversible.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/50 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    Only Workspace Admins or the Project Creator have permission to access the Danger Zone.
                </p>
            </div>
        </div>
    );
}
