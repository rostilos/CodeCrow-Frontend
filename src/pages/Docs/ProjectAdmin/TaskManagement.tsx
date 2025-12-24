import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hammer, Github, Gitlab, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TaskManagementSettings() {
    return (
        <div className="space-y-6 opacity-80">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Coming Soon
                    </Badge>
                </div>
                <p className="text-muted-foreground">
                    Integrate with Jira, Linear, and GitHub Issues.
                </p>
            </div>

            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5" />
                        Under Development
                    </CardTitle>
                    <CardDescription>We are currently building deep integrations for issue tracking.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>
                        The Task Management integration will allow CodeCrow to:
                    </p>
                    <ul className="list-disc ml-5 space-y-2">
                        <li><strong>Auto-comment</strong> on Jira tickets when an analysis finds a related bug.</li>
                        <li><strong>Link PRs</strong> to specific tasks to provide better AI context about the change's intent.</li>
                        <li><strong>Update task status</strong> automatically based on code review outcomes.</li>
                    </ul>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground backdrop-blur-sm">
                    <Github className="h-8 w-8 mb-2" />
                    <span className="text-xs uppercase font-bold">GitHub Issues</span>
                </div>
                <div className="p-4 border border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground backdrop-blur-sm">
                    <Hammer className="h-8 w-8 mb-2" />
                    <span className="text-xs uppercase font-bold">Jira</span>
                </div>
                <div className="p-4 border border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground backdrop-blur-sm">
                    <Gitlab className="h-8 w-8 mb-2" />
                    <span className="text-xs uppercase font-bold">GitLab</span>
                </div>
            </div>
        </div>
    );
}
