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
              Currently, CodeCrow supports Bitbucket Cloud with OAuth2 authentication.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Secure OAuth2 authentication with Bitbucket Cloud</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Access repositories across multiple Bitbucket workspaces</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Reuse connections across multiple CodeCrow projects</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prerequisites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Before creating a VCS connection, ensure you have:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>An active Bitbucket Cloud account</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>OAuth Consumer credentials (Key and Secret) from Bitbucket</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Admin access to your Bitbucket workspace</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
            <CardDescription>Create OAuth credentials and connect to Bitbucket</CardDescription>
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
                  <li>• Set callback URL to your CodeCrow domain</li>
                  <li>• Enable required permissions: <strong>Repository (Read), Pull Requests (Read/Write)</strong></li>
                </ul>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/" target="_blank" rel="noopener noreferrer">
                    OAuth Setup Guide
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">2. Copy OAuth Credentials</h4>
                <p className="text-sm text-muted-foreground">
                  After creating the OAuth consumer, copy the <strong>Key</strong> and <strong>Secret</strong>. 
                  Keep these secure - you'll need them in the next step.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">3. Navigate to Code Hosting Settings</h4>
                <p className="text-sm text-muted-foreground">
                  In CodeCrow, go to <strong>Account → Code Hosting → Bitbucket Cloud</strong> and click "Add Connection".
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">4. Enter Connection Details</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Provide the following information:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Name</strong>: Descriptive name for the connection (e.g., "Company Bitbucket")</li>
                  <li>• <strong>OAuth Key</strong>: The consumer key from step 2</li>
                  <li>• <strong>OAuth Secret</strong>: The consumer secret from step 2</li>
                  <li>• <strong>Workspace</strong>: Your Bitbucket workspace name. You can find it in the URL path on Bitbucket ( https://bitbucket.org/{'<workspace_name>/<repo_slug>'}/overview/ )</li>
                </ul>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">5. Authorize and Test</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Create Connection". If validation was successful, you will see the connection in the list with the status “Connected.”
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
