import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Settings,
    Globe,
    GitBranch,
    Filter,
    Cpu,
    Database,
    Hammer,
    AlertTriangle,
    LayoutDashboard,
    MessageSquare,
    History
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function ProjectAdministration() {
    const sections = [
        { title: "General", icon: Settings, desc: "Basics like name, description and project ID.", href: "general" },
        { title: "Activity", icon: History, desc: "Track background jobs and analysis history.", href: "activity" },
        { title: "Code Hosting", icon: Globe, desc: "Manage VCS connections and repository settings.", href: "hosting" },
        { title: "Branches", icon: GitBranch, desc: "Define branches patterns for automatic analysis.", href: "branches" },
        { title: "Analysis Scope", icon: Filter, desc: "Include/exclude paths and toggle analysis triggers.", href: "scope" },
        { title: "AI Connections", icon: Cpu, desc: "Choose LLM models and manage API keys.", href: "ai" },
        { title: "RAG Indexing", icon: Database, desc: "Manage vector embeddings and search accuracy.", href: "rag" },
        { title: "Interactive Commands", icon: MessageSquare, desc: "Control CodeCrow via PR comments (/analyze, /ask).", href: "../../commands/overview" },
        { title: "Task Management", icon: Hammer, desc: "Jira, Linear and GitHub integration (Coming Soon).", href: "tasks", disabled: true },
        { title: "Danger Zone", icon: AlertTriangle, desc: "Irreversible actions like project deletion.", href: "danger" },
    ];

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Project Administration</h1>
                <p className="text-muted-foreground">
                    Configure how CodeCrow interacts with your repository and performs analysis.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {sections.map((section) => (
                    <NavLink
                        key={section.href}
                        to={section.disabled ? "#" : `/docs/admin/project/${section.href}`}
                        className={section.disabled ? "cursor-not-allowed opacity-60" : "group transform transition-all hover:-translate-y-1"}
                    >
                        <Card className="h-full border-muted-foreground/10 hover:border-primary/50 hover:shadow-lg transition-all">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                                    <section.icon className="h-5 w-5 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                                        {section.title}
                                        {section.disabled && <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    {section.desc}
                                </p>
                            </CardContent>
                        </Card>
                    </NavLink>
                ))}
            </div>

            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="p-3 bg-primary/10 rounded-full shrink-0">
                            <LayoutDashboard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1">Accessing Settings</h4>
                            <p className="text-sm text-muted-foreground">
                                You can access these settings for any active project by navigating to your <strong>Dashboard</strong>,
                                selecting your project, and clicking the <strong>Settings</strong> icon in the sidebar.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
