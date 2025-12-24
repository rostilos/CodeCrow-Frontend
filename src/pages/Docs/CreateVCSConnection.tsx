import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, Info, CheckCircle2, ExternalLink, Github, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

import { DocNavigation } from "./DocNavigation";

export default function CreateVCSConnection() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <GitBranch className="mr-2 h-4 w-4 inline" />
          VCS Connection
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Connect Your Source Control</h1>
        <p className="text-xl text-muted-foreground">
          Link CodeCrow to your repository provider to enable automated AI code reviews.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">What is a VCS Connection?</h2>
          <p className="text-muted-foreground leading-relaxed">
            In CodeCrow, a <strong>VCS (Version Control System) Connection</strong> is a secure link
            between our platform and your repository hosting provider. It literally connects
            CodeCrow to your <strong>Bitbucket Workspace</strong> or <strong>GitHub Organization</strong>.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border rounded-xl bg-card/50">
              <h4 className="font-bold flex items-center gap-2 mb-2 text-primary">
                <GitBranch className="h-4 w-4" />
                Workspace Sync
              </h4>
              <p className="text-xs text-muted-foreground">
                Once connected, CodeCrow can discover all repositories within your workspace/org,
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

        <Card>
          <CardHeader>
            <CardTitle>Supported Platforms</CardTitle>
            <CardDescription>CodeCrow integrates deeply with leading VCS providers.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 pt-2">
            {/* Bitbucket Card */}
            <NavLink to="/docs/vcs-connection/bitbucket" className="group">
              <div className="p-6 border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all h-full flex flex-col justify-between">
                <div>
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <BitbucketIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Bitbucket Cloud</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Choose between <strong>OAuth App</strong> (personal), <strong>Connect App</strong> (workspace),
                    or <strong>Manual OAuth</strong> for full enterprise control.
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
