import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, CheckCircle, FileCode, AlertCircle, Webhook, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { projectService, ProjectDTO } from "@/api_service/project/projectService";
import { useWorkspace } from "@/context/WorkspaceContext";

const CODECROW_WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL;

export default function ProjectSetupInstructions() {
  const navigate = useNavigate();
  const { namespace } = useParams<{ namespace: string }>();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProject();
  }, [namespace, currentWorkspace]);

  const loadProject = async () => {
    if (!currentWorkspace || !namespace) return;
    
    setLoading(true);
    try {
      const proj = await projectService.getProjectByNamespace(currentWorkspace.slug, namespace);
      setProject(proj);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check if project uses webhook installation method or app-based connection
  const isWebhookInstallation = project?.installationMethod === 'WEBHOOK';
  const isAppBasedConnection = project?.vcsConnectionType === 'APP' || project?.vcsConnectionType === 'CONNECT_APP' || project?.vcsConnectionType === 'GITHUB_APP';
  const isOAuthConnection = project?.vcsConnectionType === 'OAUTH_MANUAL';
  // Both app connections and OAuth connections with webhooks count as auto-integration
  const isAutoIntegration = isWebhookInstallation || isAppBasedConnection || isOAuthConnection;
  
  // Determine which provider is being used
  const isGitHub = project?.vcsProvider === 'GITHUB';
  const isBitbucket = project?.vcsProvider === 'BITBUCKET_CLOUD';

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [label]: true });
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [label]: false });
      }, 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const webhookScript = `#!/bin/bash

URL="\${CODECROW_BASE_URL}/api/processing/bitbucket/webhook"

BEARER_TOKEN="\${CODECROW_PROJECT_TOKEN}"

JSON_BODY='{
    "pullRequestId": "'"$BITBUCKET_PR_ID"'",
    "projectId": "'"$CODECROW_PROJECT_ID"'",
    "targetBranchName": "'"$BITBUCKET_PR_DESTINATION_BRANCH"'",
    "sourceBranchName": "'"$BITBUCKET_BRANCH"'",
    "commitHash": "'"$BITBUCKET_COMMIT"'"
}'

echo "--- Sending Webhook Request ---"
echo "URL: $URL"
echo "Body: $JSON_BODY"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \\
    -X POST \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer \${BEARER_TOKEN}" \\
    -d "$JSON_BODY" \\
    "$URL")

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅ Webhook sent successfully! HTTP Status: $HTTP_CODE"
else
    echo "❌ Webhook request failed! HTTP Status: $HTTP_CODE"
    exit 1 # Fail the pipeline step on error
fi
`;

  const pipelineYaml = `pipelines:
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
              analysis-executor`;

  // GitHub Actions workflow YAML
  const githubActionsYaml = `name: CodeCrow AI Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - main
      - develop

jobs:
  codecrow-analysis:
    runs-on: ubuntu-latest
    name: CodeCrow AI Review
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Run CodeCrow Analysis
        uses: codecrowai/github-analysis-action@v1
        with:
          project-id: \${{ secrets.CODECROW_PROJECT_ID }}
          project-token: \${{ secrets.CODECROW_PROJECT_TOKEN }}
          base-url: \${{ secrets.CODECROW_BASE_URL }}
`;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Project not found. Please check the project namespace.
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => navigate("/dashboard/projects")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            size="sm"
            className="mb-6"
            onClick={() => navigate(`/dashboard/projects/${namespace}/settings`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isGitHub ? 'GitHub Actions Setup Instructions' : 'Pipeline Setup Instructions'}
            </h1>
            <p className="text-muted-foreground">
              {isGitHub 
                ? `Configure GitHub Actions for ${project.name}` 
                : `Configure Bitbucket Pipelines for ${project.name}`}
            </p>
          </div>
        </div>
      </div>
      
      {/* Show auto-integration message for app-based connections or webhook installations */}
      {isAutoIntegration && (
        <Alert className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">
          <Webhook className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-600 dark:text-green-400">
            {isAppBasedConnection 
              ? `${isGitHub ? 'GitHub App' : 'Bitbucket App'} Integration Active`
              : 'Automatic Webhook Integration'}
          </AlertTitle>
          <AlertDescription>
            <p className="mt-2">
              {isAppBasedConnection 
                ? `This project is connected via the CodeCrow ${isGitHub ? 'GitHub' : 'Bitbucket'} App. CodeCrow will automatically analyze your code when pull requests are created or updated.`
                : 'This project is configured with automatic webhook integration. CodeCrow will automatically analyze your code when pull requests are created or updated.'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              No additional {isGitHub ? 'GitHub Actions' : 'pipeline'} setup is required. The instructions below are optional and can be used for custom triggers or CI/CD integration.
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Show note that pipeline setup is optional for auto-integration projects */}
      {isAutoIntegration && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The instructions below are optional. You may want to configure {isGitHub ? 'GitHub Actions' : 'pipelines'} for additional custom analysis triggers or CI/CD integration.
          </AlertDescription>
        </Alert>
      )}

      {!isAutoIntegration && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Follow these steps to integrate CodeCrow with your {isGitHub ? 'GitHub Actions' : 'Bitbucket Pipelines'} for automated code analysis.
          </AlertDescription>
        </Alert>
      )}

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCode className="mr-2 h-5 w-5" />
            Project Information
          </CardTitle>
          <CardDescription>Essential details needed for {isGitHub ? 'workflow' : 'pipeline'} configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Project ID</label>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-base px-3 py-1 font-mono">
                  {project.id}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(String(project.id), "Project ID")}
                >
                  {copiedStates["Project ID"] ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Repository</label>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-base px-3 py-1 font-mono">
                  {project.projectRepoSlug || "Not configured"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Repository Variables/Secrets */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Configure {isGitHub ? 'Repository Secrets' : 'Repository Variables'}</CardTitle>
          <CardDescription>
            {isGitHub 
              ? 'Add these secrets in your GitHub repository: Settings → Secrets and variables → Actions → New repository secret'
              : 'Add these variables in your Bitbucket repository settings: Settings → Repository variables'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <div className="font-mono text-sm font-medium">CODECROW_PROJECT_ID</div>
                <div className="text-xs text-muted-foreground mt-1">Your project's unique identifier</div>
              </div>
              <div className="flex items-center space-x-2">
                <code className="px-2 py-1 bg-background rounded text-sm">{project.id}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(String(project.id), "CODECROW_PROJECT_ID")}
                >
                  {copiedStates["CODECROW_PROJECT_ID"] ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <div className="font-mono text-sm font-medium">CODECROW_PROJECT_TOKEN</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Generate a project token from project settings (secured variable)
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/dashboard/projects/${namespace}/settings?tab=tokens`)}
              >
                Generate Token
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                    <div className="font-mono text-sm font-medium">CODECROW_BASE_URL</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        URL to codecrow webhook
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-background rounded text-sm">{CODECROW_WEBHOOK_URL}</code>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(String(CODECROW_WEBHOOK_URL), "CODECROW_WEBHOOK_URL")}
                    >
                        {copiedStates["CODECROW_WEBHOOK_URL"] ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Pipeline/Workflow YAML */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Configure {isGitHub ? 'GitHub Actions Workflow' : 'Pipeline YAML'}</CardTitle>
          <CardDescription>
            {isGitHub 
              ? <>Create this file at <code className="text-sm bg-muted px-1 rounded">.github/workflows/codecrow.yml</code></>
              : <>Add this configuration to your <code className="text-sm bg-muted px-1 rounded">bitbucket-pipelines.yml</code> file</>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{isGitHub ? githubActionsYaml : pipelineYaml}</code>
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(isGitHub ? githubActionsYaml : pipelineYaml, isGitHub ? "GitHub Actions YAML" : "Pipeline YAML")}
            >
              {copiedStates[isGitHub ? "GitHub Actions YAML" : "Pipeline YAML"] ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Test */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Test the Integration</CardTitle>
          <CardDescription>Verify your setup is working correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-sm">Commit and push your changes to the repository</li>
            <li className="text-sm">Create a test pull request</li>
            <li className="text-sm">Monitor the {isGitHub ? 'Actions workflow execution' : 'pipeline execution in Bitbucket Pipelines'}</li>
            <li className="text-sm">Check the analysis results in CodeCrow dashboard</li>
          </ol>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => navigate(isGitHub ? "/docs/github-actions" : "/docs/bitbucket-pipelines")}
        >
          View Full Documentation
        </Button>
        <Button
          onClick={() => navigate(`/dashboard/projects/${namespace}/settings`)}
        >
          Go to Project Settings
        </Button>
      </div>
    </div>
  );
}
