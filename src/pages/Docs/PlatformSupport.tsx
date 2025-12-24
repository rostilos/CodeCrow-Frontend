import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Info, Minus } from "lucide-react";

import { DocNavigation } from "./DocNavigation";

export default function PlatformSupport() {
    const platforms = [
        { name: "Bitbucket", status: "Production", color: "text-blue-500" },
        { name: "GitHub", status: "Production", color: "text-primary" },
        { name: "GitLab", status: "Planned", color: "text-orange-500" },
    ];

    const features = [
        { name: "PR Analysis", bitbucket: true, github: true, gitlab: false },
        { name: "Branch Analysis", bitbucket: true, github: true, gitlab: false },
        { name: "Task Context Retrieval", bitbucket: false, github: false, gitlab: false },
        { name: "/ask", bitbucket: true, github: true, gitlab: false },
        { name: "/analyze", bitbucket: true, github: true, gitlab: false },
        { name: "/review", bitbucket: true, github: true, gitlab: false },
        { name: "Continuous Analysis", bitbucket: true, github: true, gitlab: false },
        { name: "RAG Pipeline", bitbucket: true, github: true, gitlab: false },
    ];

    const StatusIcon = ({ supported }: { supported: boolean | null }) => {
        if (supported === null) return <Minus className="h-5 w-5 text-muted-foreground/30 mx-auto" />;
        return supported ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
        ) : (
            <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
        );
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="mb-8">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    Compatibility
                </Badge>
                <h1 className="text-4xl font-bold mb-4">Capabilities by Platform</h1>
                <p className="text-xl text-muted-foreground">
                    Compare features and integration support across different Version Control Systems.
                </p>
            </div>

            <div className="space-y-8">
                <Card className="overflow-hidden border-border/50">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle>Feature Matrix</CardTitle>
                        <CardDescription>
                            Detailed breakdown of supported capabilities per platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/20">
                                        <th className="text-left p-4 font-semibold text-muted-foreground">Feature</th>
                                        {platforms.map((p) => (
                                            <th key={p.name} className="p-4 font-semibold text-center">
                                                <div className={p.color}>{p.name}</div>
                                                <div className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider mt-1">
                                                    {p.status}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {features.map((f) => (
                                        <tr key={f.name} className="hover:bg-muted/10 transition-colors">
                                            <td className="p-4 font-medium">{f.name}</td>
                                            <td className="p-4 text-center"><StatusIcon supported={f.bitbucket} /></td>
                                            <td className="p-4 text-center"><StatusIcon supported={f.github} /></td>
                                            <td className="p-4 text-center"><StatusIcon supported={f.gitlab} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Planned Integrations</h2>
                    <div className="grid gap-4">
                        <Card className="bg-muted/30 border-dashed">
                            <CardContent className="pt-6">
                                <div className="flex gap-4">
                                    <div className="p-3 rounded-xl bg-orange-500/10 shrink-0 h-fit">
                                        <Info className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">GitLab Support</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            We are actively working on GitLab Self-Managed and GitLab.com integration.
                                            Support for PR analysis and Webhook-based triggers is expected in Q1 2026.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/30 border-dashed">
                            <CardContent className="pt-6">
                                <div className="flex gap-4">
                                    <div className="p-3 rounded-xl bg-primary/10 shrink-0 h-fit">
                                        <CheckCircle2 className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Task Context Retrieval</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Deep integration with Jira, GitHub Issues, and Linear is in development.
                                            This will allow CodeCrow to use original task requirements to validate PR changes.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <DocNavigation
                    prev={{ title: "Overview", url: "/docs" }}
                    next={{ title: "Create Workspace", url: "/docs/workspace" }}
                />
            </div>
        </div>
    );
}
