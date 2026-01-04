import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ArrowRight, Zap, Shield, Settings, Info, Key, Globe, Server, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// GitLab icon component
const GitLabIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
    </svg>
);

export default function VCSGitLab() {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-orange-500/10">
                        <GitLabIcon className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">GitLab Integration</h1>
                        <p className="text-muted-foreground mt-1">
                            Connect CodeCrow to GitLab.com or your self-hosted GitLab instance.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {/* OAuth App Section */}
                <Card className="border-orange-500/20 bg-orange-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-orange-500" />
                            GitLab OAuth (Recommended)
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 ml-2">1-Click Setup</Badge>
                        </CardTitle>
                        <CardDescription>Quick and secure OAuth-based integration for GitLab.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Connect your GitLab account with one click using OAuth 2.0. CodeCrow will automatically
                            configure webhooks and gain access to your repositories for merge request analysis.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4 text-xs">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>One-click secure authentication</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>Automatic webhook setup</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>Support for GitLab.com & self-hosted</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>MR comments posted as your account</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Installation Steps */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">User Setup (1-Click Connect)</h3>
                    <p className="text-sm text-muted-foreground">
                        For end users, connecting GitLab is simple:
                    </p>

                    <div className="space-y-3">
                        <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                            <div className="bg-orange-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Navigate to Code Hosting Settings</h4>
                                <p className="text-xs text-muted-foreground">
                                    Go to <strong>Settings → Code Hosting → GitLab</strong> tab.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                            <div className="bg-orange-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Click "Connect with GitLab"</h4>
                                <p className="text-xs text-muted-foreground">
                                    Select the "OAuth App" tab and click the button. You'll be redirected to GitLab to authorize CodeCrow.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                            <div className="bg-orange-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Authorize Access</h4>
                                <p className="text-xs text-muted-foreground">
                                    Review the requested permissions and click "Authorize". You'll be redirected back to CodeCrow with your connection active.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Setup Section */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Administrator Setup
                        </CardTitle>
                        <CardDescription>
                            Server configuration required for self-hosted CodeCrow deployments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="gitlab-com" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="gitlab-com" className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    GitLab.com
                                </TabsTrigger>
                                <TabsTrigger value="self-hosted" className="flex items-center gap-2">
                                    <Server className="h-4 w-4" />
                                    Self-Hosted
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="gitlab-com" className="space-y-4 pt-4">
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Step 1: Create GitLab OAuth Application</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                                        <li>Go to <a href="https://gitlab.com/-/user_settings/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitLab.com User Settings → Applications</a></li>
                                        <li>Click <strong>"Add new application"</strong></li>
                                        <li>Fill in the application details:
                                            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                <li><strong>Name:</strong> CodeCrow (or your preferred name)</li>
                                                <li><strong>Redirect URI:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">https://your-server.com/api/integrations/gitlab/app/callback</code></li>
                                                <li><strong>Confidential:</strong> Yes (checked)</li>
                                            </ul>
                                        </li>
                                        <li>Select the required scopes:
                                            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                <li><code className="bg-muted px-1 py-0.5 rounded text-xs">api</code> - Full API access</li>
                                                <li><code className="bg-muted px-1 py-0.5 rounded text-xs">read_user</code> - Read user profile</li>
                                                <li><code className="bg-muted px-1 py-0.5 rounded text-xs">read_repository</code> - Read repositories</li>
                                                <li><code className="bg-muted px-1 py-0.5 rounded text-xs">write_repository</code> - Write to repositories (for MR comments)</li>
                                            </ul>
                                        </li>
                                        <li>Click <strong>"Save application"</strong></li>
                                        <li>Copy the <strong>Application ID</strong> and <strong>Secret</strong></li>
                                    </ol>

                                    <h4 className="font-semibold mt-6">Step 2: Configure CodeCrow Server</h4>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Add the following to your <code className="bg-muted px-1 py-0.5 rounded text-xs">application.properties</code>:
                                    </p>
                                    <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                                        <pre>{`# GitLab OAuth Configuration
codecrow.gitlab.oauth.client-id=YOUR_APPLICATION_ID
codecrow.gitlab.oauth.client-secret=YOUR_SECRET
# Leave empty for GitLab.com
codecrow.gitlab.oauth.base-url=`}</pre>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="self-hosted" className="space-y-4 pt-4">
                                <div className="space-y-4">
                                    <h4 className="font-semibold">Step 1: Create GitLab OAuth Application</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                                        <li>Go to your GitLab instance: <code className="bg-muted px-1 py-0.5 rounded text-xs">https://your-gitlab.com/-/user_settings/applications</code></li>
                                        <li>Click <strong>"Add new application"</strong></li>
                                        <li>Fill in the application details:
                                            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                <li><strong>Name:</strong> CodeCrow</li>
                                                <li><strong>Redirect URI:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">https://your-codecrow-server.com/api/integrations/gitlab/app/callback</code></li>
                                                <li><strong>Confidential:</strong> Yes (checked)</li>
                                            </ul>
                                        </li>
                                        <li>Select the required scopes: <code className="bg-muted px-1 py-0.5 rounded text-xs">api</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">read_user</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">read_repository</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">write_repository</code></li>
                                        <li>Click <strong>"Save application"</strong></li>
                                        <li>Copy the <strong>Application ID</strong> and <strong>Secret</strong></li>
                                    </ol>

                                    <h4 className="font-semibold mt-6">Step 2: Configure CodeCrow Server</h4>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Add the following to your <code className="bg-muted px-1 py-0.5 rounded text-xs">application.properties</code>:
                                    </p>
                                    <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                                        <pre>{`# GitLab OAuth Configuration (Self-Hosted)
codecrow.gitlab.oauth.client-id=YOUR_APPLICATION_ID
codecrow.gitlab.oauth.client-secret=YOUR_SECRET
# Set to your self-hosted GitLab URL
codecrow.gitlab.oauth.base-url=https://gitlab.yourcompany.com`}</pre>
                                    </div>

                                    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                                        <Info className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-sm">
                                            <strong>Important:</strong> Ensure your self-hosted GitLab instance is accessible from your CodeCrow server and that SSL certificates are valid.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* PAT Alternative */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Personal Access Token (Alternative)
                        </CardTitle>
                        <CardDescription>
                            For users who prefer manual token-based authentication.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            If OAuth is not available or you prefer token-based authentication:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                            <li>Go to GitLab → <strong>User Settings → Access Tokens</strong></li>
                            <li>Create a new token with scopes: <code className="bg-muted px-1 py-0.5 rounded text-xs">api</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">read_user</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">read_repository</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">write_repository</code></li>
                            <li>In CodeCrow, select "Personal Access Token" tab and enter your token</li>
                            <li>Webhooks must be configured manually for each project</li>
                        </ol>
                    </CardContent>
                </Card>

                {/* Project Access Token (Repository Token) */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Project Access Token (Single Repository)
                        </CardTitle>
                        <CardDescription>
                            For connecting a single repository when you don't have group-level access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Use Project Access Tokens when you only need to connect one specific repository:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                            <li>Go to your GitLab project → <strong>Settings → Access Tokens</strong></li>
                            <li><strong>Important:</strong> Select role <code className="bg-muted px-1 py-0.5 rounded text-xs">Maintainer</code> (required for webhook management)</li>
                            <li>Select scopes: <code className="bg-muted px-1 py-0.5 rounded text-xs">api</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">read_repository</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">write_repository</code></li>
                            <li>In CodeCrow, choose "Repository Token" and enter the token with the repository path</li>
                        </ol>
                        <Alert className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                <strong>Note:</strong> The token must have <strong>Maintainer</strong> role to create webhooks automatically. 
                                Without Maintainer role, you'll need to create webhooks manually in GitLab.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Required Permissions */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Required Permissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 text-sm">
                            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <code className="bg-background px-2 py-1 rounded text-xs font-semibold shrink-0">api</code>
                                <span className="text-muted-foreground">Full API access - required for creating webhooks and posting MR comments</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <code className="bg-background px-2 py-1 rounded text-xs font-semibold shrink-0">read_user</code>
                                <span className="text-muted-foreground">Read user profile information for connection display</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <code className="bg-background px-2 py-1 rounded text-xs font-semibold shrink-0">read_repository</code>
                                <span className="text-muted-foreground">Read repository content for code analysis</span>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <code className="bg-background px-2 py-1 rounded text-xs font-semibold shrink-0">write_repository</code>
                                <span className="text-muted-foreground">Write access for posting inline comments on merge requests</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Alert className="bg-muted/50 border-border">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                        <strong>Tip:</strong> After connecting, you can import projects from your GitLab groups and personal repositories. CodeCrow will automatically set up webhooks to trigger analysis on merge request events.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
}
