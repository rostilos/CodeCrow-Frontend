import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Info, CheckCircle2, AlertTriangle } from "lucide-react";

export default function GenerateProjectToken() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <Key className="mr-2 h-4 w-4 inline" />
          Step 5
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Generate Project Token</h1>
        <p className="text-xl text-muted-foreground">
          Create a secure authentication token for webhook integration and API access.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What is a Project Token?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Project tokens are bearer tokens used to authenticate webhook requests and API calls from your CI/CD pipeline.
              Each token is scoped to a specific project and can have custom expiration periods.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Secure authentication for webhooks from Bitbucket Pipelines</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Create multiple tokens with different lifetimes</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Revoke tokens at any time for security</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
            <CardDescription>Generate a token for your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">1. Navigate to Project Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Open your project and go to <strong>Settings → API Tokens</strong>.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">2. Click "Generate New Token"</h4>
                <p className="text-sm text-muted-foreground">
                  Click the "Create Token" button to open the token creation dialog.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">3. Configure Token Settings</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Provide token configuration:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Name</strong>: Descriptive name (e.g., "Production Pipeline Token")</li>
                  <li>• <strong>Lifetime</strong>: Token validity period (e.g., "30d", "90d", "1y")</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Common lifetime formats: "7d" (7 days), "30d" (30 days), "90d" (90 days), "1y" (1 year)
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">4. Copy and Secure the Token</h4>
                <p className="text-sm text-muted-foreground">
                  After generation, the token will be displayed <strong>only once</strong>. 
                  Copy it immediately and store it securely. You'll need this token in the next step for Bitbucket Pipelines configuration.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">5. Store Token in Bitbucket</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to your Bitbucket repository settings and add the token as a repository variable
                  named <code className="bg-muted px-1 py-0.5 rounded">CODECROW_PROJECT_TOKEN</code>.
                  This will be used in your pipeline configuration in Step 6.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Managing Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Viewing Active Tokens</h4>
              <p className="text-sm text-muted-foreground">
                You can see all active tokens in the Token Management section, including their names, 
                creation dates, and expiration dates.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Revoking Tokens</h4>
              <p className="text-sm text-muted-foreground">
                If a token is compromised or no longer needed, revoke it immediately from the Token Management interface.
                Revoked tokens cannot be restored.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Token Rotation</h4>
              <p className="text-sm text-muted-foreground">
                For security best practices, rotate tokens periodically by creating a new token, 
                updating your pipeline configuration, and revoking the old token.
              </p>
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
              <div className="text-primary font-semibold">POST /{'{workspaceId}'}/project/{'{namespace}'}/token/generate</div>
              <div className="text-muted-foreground">Request Body:</div>
              <pre className="text-xs overflow-x-auto">
{`{
  "name": "string",
  "lifetime": "string"
}`}
              </pre>
              <div className="text-muted-foreground">Response:</div>
              <pre className="text-xs overflow-x-auto">
{`{
  "token": "string"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Warning:</strong> Project tokens grant access to trigger code reviews and access project data.
            Never commit tokens to your repository or share them publicly. Store them as secure environment variables
            in your CI/CD system. If a token is compromised, revoke it immediately.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
