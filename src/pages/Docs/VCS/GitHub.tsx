import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Github, CheckCircle, ArrowRight, Zap, Shield, Settings, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function VCSGitHub() {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                        <Github className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">GitHub Integration</h1>
                        <p className="text-muted-foreground mt-1">
                            Connect CodeCrow to your GitHub Organization or Personal account.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {/* GitHub App Section */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            GitHub App (Standard)
                        </CardTitle>
                        <CardDescription>The most secure and automated way to connect GitHub.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Installing the CodeCrow GitHub App grants granular permissions to your repositories.
                            CodeCrow will automatically manage webhooks and status checks for you.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4 text-xs">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>Granular repository selection</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>Automatic PR comments & Status checks</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>Required Scopes: <strong>repo, read:user, read:org</strong></span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>Secure OAuth-based authentication</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Installation Steps */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Installation Steps</h3>

                    <div className="space-y-3">
                        <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                            <div className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Create Connection in CodeCrow</h4>
                                <p className="text-xs text-muted-foreground">
                                    Go to <strong>Settings → VCS Connections</strong>, click "Add Connection", and select <strong>GitHub</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                            <div className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Install GitHub App</h4>
                                <p className="text-xs text-muted-foreground">
                                    You will be redirected to GitHub to install the "CodeCrow" App. Select the account (Organization or Personal) and choose "All repositories" or specific ones.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                            <div className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Finalize Setup</h4>
                                <p className="text-xs text-muted-foreground">
                                    After installation, GitHub will redirect you back to CodeCrow. Your GitHub connection is now active and ready for project creation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Alert className="bg-muted/50 border-border">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                        <strong>Tip:</strong> You can manage repository permissions and access anytime from your GitHub Account Settings under <strong>Installed GitHub Apps</strong>.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
