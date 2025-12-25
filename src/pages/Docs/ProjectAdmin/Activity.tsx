import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History, BadgeCheck, Clock, RefreshCw, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ActivitySettings() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
                <p className="text-muted-foreground">
                    Background jobs and analysis history for your project.
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Job History
                        </CardTitle>
                        <CardDescription>Track all background operations and their outcomes.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left p-4 font-bold">Job</th>
                                    <th className="text-left p-4 font-bold">Type</th>
                                    <th className="text-left p-4 font-bold">Status</th>
                                    <th className="text-left p-4 font-bold whitespace-nowrap">Duration</th>
                                    <th className="text-left p-4 font-bold">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium">Initial RAG Indexing</div>
                                    </td>
                                    <td className="p-4">
                                        <Badge variant="secondary">Initial Indexing</Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-green-500 font-bold">
                                            <CheckCircle2 className="h-4 w-4" />
                                            COMPLETED
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">4m 5s</td>
                                    <td className="p-4 text-muted-foreground">about 5 hours ago</td>
                                </tr>
                                <tr className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium">Branch Analysis: al-ways-production</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">al-ways-production</div>
                                    </td>
                                    <td className="p-4">
                                        <Badge variant="secondary">Branch Analysis</Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-green-500 font-bold">
                                            <CheckCircle2 className="h-4 w-4" />
                                            COMPLETED
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">36ms</td>
                                    <td className="p-4 text-muted-foreground">1 day ago</td>
                                </tr>
                                <tr className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium">PR #136 Analysis</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">release/WS-128 • PR #136</div>
                                    </td>
                                    <td className="p-4">
                                        <Badge variant="secondary">PR Analysis</Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-green-500 font-bold">
                                            <CheckCircle2 className="h-4 w-4" />
                                            COMPLETED
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">10ms</td>
                                    <td className="p-4 text-muted-foreground">1 day ago</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between px-2">
                <p className="text-xs text-muted-foreground">Showing history of all background jobs.</p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <span className="text-xs font-medium">Page 1 of 3</span>
                    <Button variant="outline" size="sm">Next</Button>
                </div>
            </div>
        </div>
    );
}
