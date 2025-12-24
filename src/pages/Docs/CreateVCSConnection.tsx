import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, Info, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateVCSConnection() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <GitBranch className="mr-2 h-4 w-4 inline" />
          Step 2
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Create VCS Connection</h1>
        <p className="text-xl text-muted-foreground">
          Connect CodeCrow to your Bitbucket Cloud account to access repositories and enable automated code reviews.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What is a VCS Connection?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              A Version Control System (VCS) connection allows CodeCrow to securely access your code repositories.
              CodeCrow supports Bitbucket Cloud and GitHub with flexible authentication methods tailored to your security needs.
            </p>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Bitbucket Connection Options</h4>
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="bg-primary/80">Connect App</Badge>
                    <span className="font-medium">Workspace-based Permissions</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Best for complete workspace automation. Requires allowing "Apps from untrusted URLs" in Bitbucket settings during installation.
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-1">
                    <li>Automatic webhook management</li>
                    <li>Full workspace repository access</li>
                    <li>Synchronized user permissions</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">OAuth App</Badge>
                    <span className="font-medium">User-based Permissions</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Standard OAuth approach. Access is limited to repositories the authorizing user can see.
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-1">
                    <li>Easiest setup flow</li>
                    <li>Respects personal Bitbucket permissions</li>
                    <li>Supports webhook triggers</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Manual OAuth</Badge>
                    <span className="font-medium">Granular Control</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Manually create your own OAuth consumer in Bitbucket. Best for strict corporate policies.
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-1">
                    <li>Custom consumer name and branding</li>
                    <li>Specific permission selection</li>
                    <li>Requires manual key/secret entry</li>
                  </ul>
                </div>
              </div>

              <h4 className="font-semibold text-foreground mt-6">GitHub Integration</h4>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">GitHub App (Recommended)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Install the CodeCrow GitHub App to your organization or personal account. This provides the most secure and automated experience.
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• Automatic Webhook configuration</p>
                    <p>• Granular repo selection</p>
                    <p>• PR comment & Status check support</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bitbucket Manual Setup Steps</CardTitle>
            <CardDescription>If choosing the Manual OAuth option</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">1. Create OAuth Consumer in Bitbucket</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Navigate to your Bitbucket workspace settings and create an OAuth consumer:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 mb-3">
                  <li>• Go to <code className="bg-muted px-1 py-0.5 rounded">Workspace Settings → OAuth consumers</code></li>
                  <li>• Click "Add consumer"</li>
                  <li>• Set a name (e.g., "CodeCrow Integration")</li>
                  <li>• Set callback URL to: <code className="bg-muted px-1 rounded">https://app.codecrow.io/api/vcs/callback</code></li>
                  <li>• <strong>Permissions</strong>: Repository (Read), Pull Requests (Read/Write), Webhooks (Read/Write)</li>
                </ul>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">2. Register in CodeCrow</h4>
                <p className="text-sm text-muted-foreground">
                  Copy the <strong>Key</strong> and <strong>Secret</strong> from Bitbucket and enter them in CodeCrow under <strong>Settings → VCS Connections → Add Connection</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Endpoint</CardTitle>
            <CardDescription>For integration and automation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm space-y-2">
              <div className="text-primary font-semibold">POST /{'{workspaceId}'}/vcs/bitbucket_cloud/create</div>
              <div className="text-muted-foreground">Request Body:</div>
              <pre className="text-xs overflow-x-auto">
                {`{
  "name": "string",
  "oauthKey": "string",
  "oauthSecret": "string",
  "callbackUrl": "string"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Note:</strong> OAuth credentials are encrypted and stored securely.
            CodeCrow never stores your Bitbucket password. You can revoke access at any time from your Bitbucket settings.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
