import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Workflow, Info, CheckCircle2 } from "lucide-react";

export default function SetupBitbucketPipelines() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <Workflow className="mr-2 h-4 w-4 inline" />
          Step 6
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Setup Bitbucket Pipelines</h1>
        <p className="text-xl text-muted-foreground">
          Configure CI/CD pipeline to automatically trigger CodeCrow analysis on pull requests.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Bitbucket Pipelines allows you to automatically trigger CodeCrow analysis whenever a pull request is created or updated.
              This integration sends webhook notifications to CodeCrow, which then analyzes the code changes and posts results back to your pull request.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Automatic analysis on every pull request</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Configurable branch targeting (e.g., only for develop branch)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Secure token-based authentication</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prerequisites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Before setting up the pipeline, ensure you have:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Completed Steps 1-5 (workspace, connections, project, token)</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Bitbucket Pipelines enabled for your repository</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Your project token from Step 5</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Configure Repository Variables</CardTitle>
            <CardDescription>Store sensitive configuration securely</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">Navigate to Repository Settings</h4>
                <p className="text-sm text-muted-foreground">
                  In Bitbucket, go to your repository → <strong>Repository settings → Pipelines → Repository variables</strong>
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">Add Required Variables</h4>
                <p className="text-sm text-muted-foreground mb-2">Create the following repository variables:</p>
                <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                  <div>
                    <code className="text-primary">CODECROW_BASE_URL</code>
                    <p className="text-muted-foreground ml-4">Your CodeCrow API base URL (e.g., https://api.codecrow.io)</p>
                  </div>
                  <div>
                    <code className="text-primary">CODECROW_PROJECT_TOKEN</code>
                    <p className="text-muted-foreground ml-4">The project token generated in Step 5 (mark as Secured)</p>
                  </div>
                  <div>
                    <code className="text-primary">CODECROW_PROJECT_ID</code>
                    <p className="text-muted-foreground ml-4">Your CodeCrow project namespace or ID</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure Pipeline YAML</CardTitle>
            <CardDescription>Add CodeCrow step to your pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold mb-2">Update bitbucket-pipelines.yml</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Add the CodeCrow analysis step to your <code className="bg-muted px-1 py-0.5 rounded">bitbucket-pipelines.yml</code> file:
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <pre className="text-xs overflow-x-auto">
{`pipelines:
  branches:
    develop:
      - parallel:
          steps:
          - step:
              name: CodeCrow AI review
              image: codecrowai/bitbucket-analysis-executor:latest
              clone:
                enabled: false
              script:
                - analysis-executor
  pull-requests:
    '**':
      - step:
          name: CodeCrow AI review
          image: codecrowai/bitbucket-analysis-executor:latest
          clone:
            enabled: false
          script:
            - |
              if [ "\${BITBUCKET_PR_DESTINATION_BRANCH}" != "develop" ]; then
                printf 'CodeCrow AI review skipped: Not targeting develop branch.'
                exit 0
              fi
              analysis-executor`}
              </pre>
            </div>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Branch Targeting:</strong> The example above only triggers analysis for pull requests targeting the "develop" branch.
                Modify <code className="text-xs">BITBUCKET_PR_DESTINATION_BRANCH</code> check to match your workflow (e.g., "main", "master", or remove to analyze all PRs).
                <br /><br />
                <strong>Server-Side Filtering:</strong> Alternatively, configure branch patterns in <strong>Project Settings → Analysis Scope</strong> to filter analysis on the server side.
                This allows the pipeline to run for all PRs while CodeCrow determines which ones to analyze based on configured patterns.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Scope Configuration</CardTitle>
            <CardDescription>Server-side filtering for automated analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Instead of filtering branches in the pipeline script, you can configure branch patterns in CodeCrow 
              to control which branches trigger analysis. This provides centralized control without modifying pipeline configuration.
            </p>
            
            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold mb-2">Configure in Project Settings</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Navigate to <strong>Project Settings → Analysis Scope</strong> and configure:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <strong>PR Target Branches</strong>: Patterns for PR target branches (e.g., <code className="bg-muted px-1 rounded">main</code>, <code className="bg-muted px-1 rounded">develop</code>, <code className="bg-muted px-1 rounded">release/*</code>)</li>
                <li>• <strong>Branch Push Patterns</strong>: Patterns for branch push/merge analysis</li>
              </ul>
            </div>

            <div className="border-l-2 border-primary pl-4">
              <h4 className="font-semibold mb-2">Pattern Syntax</h4>
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <ul className="space-y-1">
                  <li><code className="text-primary">main</code> - Exact match</li>
                  <li><code className="text-primary">release/*</code> - Matches <code>release/1.0</code>, <code>release/2.0</code></li>
                  <li><code className="text-primary">feature/**</code> - Matches <code>feature/auth</code>, <code>feature/auth/oauth</code></li>
                </ul>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Default Behavior:</strong> If no patterns are configured, all branches are analyzed. 
                This maintains backward compatibility with existing pipelines.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Test the Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">Commit Pipeline Configuration</h4>
                <p className="text-sm text-muted-foreground">
                  Commit both the webhook script and updated <code className="bg-muted px-1 py-0.5 rounded">bitbucket-pipelines.yml</code> to your repository.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">Create a Test Pull Request</h4>
                <p className="text-sm text-muted-foreground">
                  Create a test pull request targeting your configured branch (e.g., develop).
                  The pipeline should automatically trigger the CodeCrow analysis step.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">Monitor Pipeline Execution</h4>
                <p className="text-sm text-muted-foreground">
                  Watch the pipeline logs in Bitbucket to ensure the webhook is sent successfully.
                  You should see a success message with HTTP status 200-299.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">Check CodeCrow Dashboard</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to your CodeCrow project dashboard to verify that the analysis was triggered.
                  Results will appear after AI processing completes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Webhook Returns 401 Unauthorized</h4>
              <p className="text-sm text-muted-foreground">
                Verify that <code className="bg-muted px-1 py-0.5 rounded">CODECROW_PROJECT_TOKEN</code> is correctly set in repository variables
                and matches the token generated in Step 5.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Webhook Returns 404 Not Found</h4>
              <p className="text-sm text-muted-foreground">
                Check that <code className="bg-muted px-1 py-0.5 rounded">CODECROW_BASE_URL</code> and <code className="bg-muted px-1 py-0.5 rounded">CODECROW_PROJECT_ID</code> are correct.
                Ensure the project namespace matches your CodeCrow configuration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
