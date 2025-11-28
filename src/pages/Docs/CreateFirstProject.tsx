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
                <span>Created a VCS connection (Step 2)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Created an AI connection (Step 3)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
            <CardDescription>Create and configure your first project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">1. Navigate to Projects</h4>
                <p className="text-sm text-muted-foreground">
                  From your workspace dashboard, click <strong>"New Project"</strong> or navigate to
                  <strong> Account → Projects → Create Project</strong>.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">2. Enter Project Details</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Provide basic project information:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Name</strong>: Descriptive project name (e.g., "Backend API", "Mobile App")</li>
                  <li>• <strong>Namespace</strong>: Unique identifier (lowercase, no spaces, e.g., "backend-api")</li>
                  <li>• <strong>Description</strong>: Brief description of the project (optional)</li>
                  <li>• <strong>Creation Mode</strong>: Choose IMPORT (to link existing repo) or MANUAL</li>
                </ul>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">3. Link Repository</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Connect your Bitbucket repository:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Select your VCS connection from the dropdown</li>
                  <li>• Choose <strong>VCS Provider</strong>: BITBUCKET_CLOUD</li>
                  <li>• Enter <strong>Repository Slug</strong>: The repository identifier (e.g., "my-repo")</li>
                  <li>• Optionally provide <strong>Repository UUID</strong> for precise identification</li>
                </ul>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">4. Bind AI Connection</h4>
                <p className="text-sm text-muted-foreground">
                  After creating the project, navigate to <strong>Project Settings → AI</strong> and select
                  the AI connection you created in Step 3. This enables AI-powered code analysis for this project.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">5. Configure Project Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Optionally customize review settings, target branches, and analysis parameters in
                  <strong> Project Settings</strong>.
                </p>
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
