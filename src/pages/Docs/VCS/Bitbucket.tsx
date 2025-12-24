import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Info, Zap, Shield, Settings, ExternalLink, ChevronDown, Rocket, User, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VCSBitbucket() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 font-sans">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                        <BitbucketIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bitbucket Cloud Integration</h1>
                        <p className="text-muted-foreground mt-1">
                            Choose the best way to connect CodeCrow to your Bitbucket workspace.
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="oauth-app" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12">
                    <TabsTrigger value="oauth-app" className="gap-2">
                        <User className="h-4 w-4" />
                        OAuth App
                    </TabsTrigger>
                    <TabsTrigger value="connect-app" className="gap-2">
                        <Rocket className="h-4 w-4" />
                        Connect App
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Manual OAuth
                    </TabsTrigger>
                </TabsList>

                {/* Option 1: OAuth App */}
                <TabsContent value="oauth-app" className="space-y-6 mt-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader shadow-sm="true">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    OAuth App (Recommended)
                                </CardTitle>
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Fastest Setup</Badge>
                            </div>
                            <CardDescription>Perfect for personal workspaces and quick starts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                The OAuth App uses standard Atlassian authorization to link your individual Bitbucket account to CodeCrow.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>1-Click Authorization</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Comments posted as <strong>YOU</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Access to all your workspaces</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Auto-configured Webhooks</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">How to Connect</h3>
                        <ol className="space-y-3">
                            <li className="flex gap-4 p-4 border rounded-lg bg-background">
                                <div className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                <p className="text-sm">In CodeCrow, go to <strong>Settings → VCS Connections</strong> and click "Add Connection".</p>
                            </li>
                            <li className="flex gap-4 p-4 border rounded-lg bg-background">
                                <div className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                <p className="text-sm">Select <strong>Bitbucket</strong> and choose the <strong>OAuth App</strong> tab.</p>
                            </li>
                            <li className="flex gap-4 p-4 border rounded-lg bg-background">
                                <div className="bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                <p className="text-sm">Click <strong>Connect with Bitbucket</strong> and authorize CodeCrow in the popup.</p>
                            </li>
                        </ol>
                    </div>
                </TabsContent>

                {/* Option 2: Connect App */}
                <TabsContent value="connect-app" className="space-y-6 mt-6">
                    <Card className="border-blue-500/20 bg-blue-500/5">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-blue-600">
                                    <Globe className="h-5 w-5" />
                                    Connect App (Workspace-Level)
                                </CardTitle>
                                <Badge variant="outline" className="border-blue-500/30 text-blue-600">Enterprise Ready</Badge>
                            </div>
                            <CardDescription>Installs CodeCrow directly into the Bitbucket UI.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                This method treats CodeCrow as a first-class citizen in your workspace. It's not tied to any specific user's credentials.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                    <span>Comments posted by <strong>CodeCrow Bot</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                    <span>Shared workspace integration</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                    <span>Native Bitbucket UI sidebar</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                    <span>Secure Workspace-only scope</span>
                                </div>
                            </div>

                            <Alert className="bg-blue-500/10 border-blue-500/20">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-sm font-bold text-blue-800">Note: Development Mode Required</AlertTitle>
                                <AlertDescription className="text-xs text-blue-700 leading-relaxed">
                                    Due to Atlassian deprecating OAuth Connect Apps on the Marketplace, you must briefly enable
                                    <strong> "Enable development mode"</strong> in your Bitbucket Workspace settings to install
                                    this integration via a custom URL.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Installation Guide</h3>
                        <div className="bg-muted/50 p-4 rounded-xl space-y-4">
                            <div className="flex gap-4">
                                <div className="font-bold text-primary">01.</div>
                                <p className="text-sm">Enable <strong>Development Mode</strong> in Bitbucket <em>(Settings → App Management → Settings)</em>.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="font-bold text-primary">02.</div>
                                <p className="text-sm">Click <strong>Install Connect App</strong> in CodeCrow's connection screen.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="font-bold text-primary">03.</div>
                                <p className="text-sm">Bitbucket will redirect you to authorize the installation.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="font-bold text-primary">04.</div>
                                <p className="text-sm">Click <strong>Manage App</strong> in Bitbucket once redirected back to finalize the handshake.</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Option 3: Manual OAuth */}
                <TabsContent value="manual" className="space-y-6 mt-6">
                    <Card className="border-amber-500/20 bg-amber-500/5">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-amber-600">
                                    <Shield className="h-5 w-5" />
                                    Manual OAuth (Full Control)
                                </CardTitle>
                                <Badge variant="outline" className="border-amber-500/30 text-amber-600">Advanced</Badge>
                            </div>
                            <CardDescription>Bring your own credentials for full compliance control.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Best for enterprise setups or when your organization requires strict control over OAuth consumers.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-amber-500" />
                                    <span>Custom OAuth Credentials</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-amber-500" />
                                    <span>Override API & Frontend URLs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-amber-500" />
                                    <span>Compliance Friendly</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-amber-500" />
                                    <span>Granular permission scoping</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4 text-sm">
                        <h3 className="text-lg font-bold">Setup Instructions</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            1. Create an OAuth consumer in your Bitbucket Workspace settings.<br />
                            2. Required Permissions: <strong>Account: Read</strong>, <strong>Repositories: Read</strong>, <strong>Pull Requests: Read</strong>, <strong>Webhooks: Read & Write</strong>.<br />
                            3. Copy the <strong>Key</strong> and <strong>Secret</strong> into CodeCrow's "Manual OAuth" configuration form.
                        </p>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Ensure the <strong>Callback URL</strong> in Bitbucket matches the one provided in the CodeCrow setup screen.
                            </AlertDescription>
                        </Alert>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function BitbucketIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
        </svg>
    );
}
