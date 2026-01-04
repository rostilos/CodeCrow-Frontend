import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, Info, CheckCircle2, ExternalLink, Github, ArrowRight, Shield, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

import { DocNavigation } from "./DocNavigation";

// GitLab logo SVG component
function GitLabIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
    </svg>
  );
}

export default function CreateVCSConnection() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <GitBranch className="mr-2 h-4 w-4 inline" />
            VCS Connection
          </Badge>
          <Badge variant="outline">Optional</Badge>
        </div>
        <h1 className="text-4xl font-bold mb-4">Connect Your Source Control</h1>
        <p className="text-xl text-muted-foreground">
          Link CodeCrow to your repository provider to enable automated AI code reviews.
        </p>
      </div>

      <div className="space-y-8">
        {/* Optional Step Notice */}
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>This step is optional.</strong> You can create a workspace-level VCS connection to 
            import any repository from your organization instantly. Alternatively, skip this step and 
            use a <strong>Repository Access Token</strong> during project creation for per-repository access.
          </AlertDescription>
        </Alert>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">What is a VCS Connection?</h2>
          <p className="text-muted-foreground leading-relaxed">
            In CodeCrow, a <strong>VCS (Version Control System) Connection</strong> is a secure link
            between our platform and your repository hosting provider. It connects
            CodeCrow to your <strong>Bitbucket Workspace</strong>, <strong>GitHub Organization</strong>, or <strong>GitLab Group</strong>.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border rounded-xl bg-card/50">
              <h4 className="font-bold flex items-center gap-2 mb-2 text-primary">
                <GitBranch className="h-4 w-4" />
                Workspace Sync
              </h4>
              <p className="text-xs text-muted-foreground">
                Once connected, CodeCrow can discover all repositories within your workspace/org/group,
                making project creation a 1-click experience.
              </p>
            </div>
            <div className="p-4 border rounded-xl bg-card/50">
              <h4 className="font-bold flex items-center gap-2 mb-2 text-primary">
                <Shield className="h-4 w-4" />
                Secure Access
              </h4>
              <p className="text-xs text-muted-foreground">
                Connections use fine-grained permissions. We only request access to what we need
                to read code and post comments.
              </p>
            </div>
          </div>
        </section>
        
        {/* Repository-based Alternative */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5 text-orange-600" />
              Alternative: Repository Access Token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you prefer not to create a workspace-level connection, or don't have access to your 
              organization's settings, you can skip this step entirely. During project creation, 
              you'll have the option to use a <strong>Repository Access Token</strong>.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <h4 className="font-bold text-xs">Limited Scope</h4>
                <p className="text-[10px] text-muted-foreground">Token grants access to a single repository only</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs">No Admin Required</h4>
                <p className="text-[10px] text-muted-foreground">Create tokens without workspace admin privileges</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs">Fine-grained Control</h4>
                <p className="text-[10px] text-muted-foreground">Ideal for multi-team repos or CI/CD bots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Platforms</CardTitle>
            <CardDescription>CodeCrow integrates deeply with leading VCS providers.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 pt-2">
            {/* Bitbucket Card */}
            <NavLink to="/docs/vcs-connection/bitbucket" className="group">
              <div className="p-6 border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all h-full flex flex-col justify-between">
                <div>
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <BitbucketIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Bitbucket Cloud</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Choose between <strong>OAuth App</strong> (1-click), <strong>Connect App</strong> (workspace),
                    or <strong>Manual OAuth</strong> for enterprise control.
                  </p>
                </div>
                <div className="flex items-center text-primary font-medium text-sm">
                  Setup Guide <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </NavLink>

            {/* GitHub Card */}
            <NavLink to="/docs/vcs-connection/github" className="group">
              <div className="p-6 border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all h-full flex flex-col justify-between">
                <div>
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <Github className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">GitHub</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Install the CodeCrow GitHub App for organization-wide security analysis and PR feedback.
                  </p>
                </div>
                <div className="flex items-center text-primary font-medium text-sm">
                  Setup Guide <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </NavLink>

            {/* GitLab Card */}
            <NavLink to="/docs/vcs-connection/gitlab" className="group">
              <div className="p-6 border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all h-full flex flex-col justify-between">
                <div>
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <GitLabIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">GitLab</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Connect via <strong>OAuth App</strong> (1-click) or <strong>Manual OAuth</strong>. Supports both GitLab.com and self-hosted instances.
                  </p>
                </div>
                <div className="flex items-center text-primary font-medium text-sm">
                  Setup Guide <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </NavLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why Connect Your VCS?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Automatic Triggers</h4>
                <p className="text-xs text-muted-foreground">CodeCrow listens for PR events and pushes to start analysis instantly.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Inline Comments</h4>
                <p className="text-xs text-muted-foreground">AI findings are posted directly on the lines of code that need attention.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm">Status Checks</h4>
                <p className="text-xs text-muted-foreground">Gate your merge process based on AI security and quality reports.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Security First:</strong> CodeCrow uses OAuth 2.0 and App Installations. We never see your VCS password, and you can revoke access anytime from your provider's settings.
          </AlertDescription>
        </Alert>

        <DocNavigation
          prev={{ title: "Create Workspace", url: "/docs/workspace" }}
          next={{ title: "AI Connection", url: "/docs/ai-connection" }}
        />
      </div>
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
