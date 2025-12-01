import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FolderGit2, Info, CheckCircle2 } from "lucide-react";

export default function CreateFirstProject() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <FolderGit2 className="mr-2 h-4 w-4 inline" />
          Step 4
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Create Your First Project</h1>
        <p className="text-xl text-muted-foreground">
          Set up a project to organize code reviews, link repositories, and configure AI analysis.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What is a Project?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Projects are the core organizational unit in CodeCrow. Each project represents a single codebase
              or repository that you want to analyze. Projects are linked to a VCS repository and an AI connection.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>One project per repository for focused code reviews</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Configure AI models and review settings per project</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Track analysis history and issue trends over time</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prerequisites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Before creating a project, ensure you have:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Created a workspace (Step 1)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Created a VCS connection (Step 2) - either via App installation or manual OAuth</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Have an AI connection ready (can be created during project setup)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
            <CardDescription>Create and configure your project using the step-by-step wizard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">Option A: Import from VCS Connection (Recommended)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Use the "Import Project" button on the Projects page to start a guided wizard:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Step 1</strong>: Select repository from your connected VCS account</li>
                  <li>• <strong>Step 2</strong>: Enter project name and description (for manual OAuth connections)</li>
                  <li>• <strong>Step 3</strong>: Select or create an AI connection</li>
                </ul>
              </div>

              <div className="border-l-2 border-muted pl-4">
                <h4 className="font-semibold mb-2">Option B: App Installation Flow</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  When installing via Bitbucket App, you'll be guided through:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Step 1</strong>: Select repositories to import</li>
                  <li>• <strong>Step 2</strong>: Select or create an AI connection</li>
                </ul>
              </div>

              <div className="border-l-2 border-muted pl-4">
                <h4 className="font-semibold mb-2">Option C: Manual Project Creation</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Use "New Project" for full manual control:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Step 1</strong>: Select repository from your VCS connections</li>
                  <li>• <strong>Step 2</strong>: Enter project name, namespace, and description</li>
                  <li>• <strong>Step 3</strong>: Select or create an AI connection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Connection Configuration</CardTitle>
            <CardDescription>Configure AI provider during project creation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              In the final step of project creation, you can select an existing AI connection or create a new one:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• <strong>Provider</strong>: Choose from OpenRouter, OpenAI, or Anthropic</li>
              <li>• <strong>Model</strong>: Enter the model identifier (e.g., "gpt-4", "claude-3-opus")</li>
              <li>• <strong>API Key</strong>: Your provider's API key</li>
              <li>• <strong>Token Limit</strong>: Maximum tokens for AI responses (optional)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Post-Creation Configuration</CardTitle>
            <CardDescription>Additional settings available after project creation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">Change AI Connection</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to <strong>Project Settings → AI</strong> to change or update the AI connection.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">Configure Analysis Scope</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  In <strong>Project Settings → Analysis Scope</strong>, configure which branches trigger analysis:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>PR Target Branches</strong>: Only analyze PRs targeting specific branches (e.g., <code className="bg-muted px-1 rounded">main</code>, <code className="bg-muted px-1 rounded">develop</code>)</li>
                  <li>• <strong>Branch Push Patterns</strong>: Only analyze pushes to specific branches</li>
                  <li>• Supports wildcards: <code className="bg-muted px-1 rounded">release/*</code> matches <code className="bg-muted px-1 rounded">release/1.0</code></li>
                  <li>• Leave empty to analyze all branches (default)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>For integration and automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm space-y-2">
              <div className="text-primary font-semibold">POST /{'{workspaceId}'}/project/create</div>
              <div className="text-muted-foreground">Request Body:</div>
              <pre className="text-xs overflow-x-auto">
{`{
  "name": "string",
  "namespace": "string",
  "description": "string",
  "creationMode": "IMPORT" | "MANUAL",
  "vcsProvider": "BITBUCKET_CLOUD",
  "vcsConnectionId": number,
  "repositorySlug": "string",
  "repositoryUUID": "string"
}`}
              </pre>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm space-y-2">
              <div className="text-primary font-semibold">PUT /{'{workspaceId}'}/project/{'{namespace}'}/ai/bind</div>
              <div className="text-muted-foreground">Request Body:</div>
              <pre className="text-xs overflow-x-auto">
{`{
  "aiConnectionId": number
}`}
              </pre>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm space-y-2">
              <div className="text-primary font-semibold">PUT /{'{workspaceId}'}/project/{'{namespace}'}/branch-analysis-config</div>
              <div className="text-muted-foreground">Request Body:</div>
              <pre className="text-xs overflow-x-auto">
{`{
  "prTargetBranches": ["main", "develop", "release/*"],
  "branchPushPatterns": ["main", "develop"]
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Namespace Tip:</strong> The namespace is permanent and used in URLs and API calls.
            Choose a meaningful, lowercase identifier without spaces (e.g., use hyphens for separation).
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
