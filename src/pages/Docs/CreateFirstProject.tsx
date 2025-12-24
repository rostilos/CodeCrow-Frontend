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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Creation Flow</CardTitle>
              <CardDescription>From zero to your first AI-powered analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative pb-4">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>

                <div className="relative flex items-start mb-8">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold z-10">1</div>
                  <div className="ml-12">
                    <h4 className="font-semibold">Create Workspace</h4>
                    <p className="text-sm text-muted-foreground">Initialize your organization workspace. This is where your projects and team will reside.</p>
                  </div>
                </div>

                <div className="relative flex items-start mb-8">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold z-10">2</div>
                  <div className="ml-12">
                    <h4 className="font-semibold">Create VCS Connection</h4>
                    <p className="text-sm text-muted-foreground">Link Bitbucket or GitHub. Choose between App installation (workspace access) or OAuth (user access).</p>
                  </div>
                </div>

                <div className="relative flex items-start mb-8">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold z-10">3</div>
                  <div className="ml-12">
                    <h4 className="font-semibold">Import/Create New Project</h4>
                    <p className="text-sm text-muted-foreground">Select a repository from your VCS connection. CodeCrow will fetch the necessary metadata.</p>
                  </div>
                </div>

                <div className="relative flex items-start mb-8">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold z-10">4</div>
                  <div className="ml-12">
                    <h4 className="font-semibold">Follow Installation Steps</h4>
                    <p className="text-sm text-muted-foreground">During project setup, you'll be prompted to choose an installation method (Webhook or Pipelines).</p>
                  </div>
                </div>

                <div className="relative flex items-start mb-8">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold z-10">5</div>
                  <div className="ml-12">
                    <h4 className="font-semibold">Configure Project Details</h4>
                    <p className="text-sm text-muted-foreground">Give your project a name, namespace, and description.</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold z-10">6</div>
                  <div className="ml-12">
                    <h4 className="font-semibold">Bind AI Connection</h4>
                    <p className="text-sm text-muted-foreground">Select or create an AI connection (OpenAI, Claude, etc.) to power your code reviews.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analysis Configuration</CardTitle>
              <CardDescription>Configure when and how CodeCrow should analyze your code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Pull Request Analysis</h4>
                  <p className="text-sm text-muted-foreground">Automatically analyze PRs when they are created, updated, or synchronized.</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Branch Analysis</h4>
                  <p className="text-sm text-muted-foreground">Trigger analysis on every push to monitored branches.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Installation Methods</h4>
                <div className="grid gap-3">
                  <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">Webhook (Recommended)</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automatic triggers via Bitbucket/GitHub webhooks. No manual config required after initial authorization.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Bitbucket Pipelines</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Integrate with your existing CI/CD. Requires adding a step to your <code className="bg-muted px-1 rounded">bitbucket-pipelines.yml</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Branch Filtering</h4>
                <p className="text-sm text-muted-foreground">
                  Define which branches trigger automated analysis using wildcards (e.g., <code className="bg-muted px-1 rounded">main</code>, <code className="bg-muted px-1 rounded">release/*</code>).
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>PR Target Branches</strong>: Only analyze PRs targeting these branches.</li>
                  <li>• <strong>Branch Push Patterns</strong>: Only analyze pushes to these branches.</li>
                </ul>
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
    </div>
  );
}
