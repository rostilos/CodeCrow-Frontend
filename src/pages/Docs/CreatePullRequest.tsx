import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitPullRequest, Info, CheckCircle2, Clock } from "lucide-react";

import { DocNavigation } from "./DocNavigation";

export default function CreatePullRequest() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <GitPullRequest className="mr-2 h-4 w-4 inline" />
          Step 7
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Create Pull Request</h1>
        <p className="text-xl text-muted-foreground">
          Submit a pull request and watch CodeCrow automatically analyze your code changes.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What Happens When You Create a PR?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When you create or update a pull request targeting your configured branch, CodeCrow automatically:
            </p>
            <ol className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                <span>Receives event notification from your VCS (Webhook or Pipeline)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                <span>Calculates diff and pulls relevant context from your <strong>RAG Index</strong> (if enabled)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                <span>Analyzes code using your configured AI model and project-wide context</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                <span>Generates comprehensive code review report and posts findings</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-3 mt-0.5 flex-shrink-0">5</span>
                <span>Posts results to your CodeCrow dashboard</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
            <CardDescription>Create your first AI-reviewed pull request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">1. Create a Feature Branch</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Create a new branch for your changes:
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">git checkout -b feature/my-new-feature</code>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">2. Make Code Changes</h4>
                <p className="text-sm text-muted-foreground">
                  Implement your feature or fix. CodeCrow will analyze all modified files in the pull request.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">3. Commit and Push Changes</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Commit your changes and push to Bitbucket:
                </p>
                <div className="space-y-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded block">git add .</code>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">git commit -m "Add new feature"</code>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">git push origin feature/my-new-feature</code>
                </div>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">4. Create Pull Request in Bitbucket</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  In Bitbucket, create a pull request:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Navigate to your repository → Pull requests → Create pull request</li>
                  <li>• Select your feature branch as source</li>
                  <li>• Select your target branch (e.g., develop) - must match pipeline configuration</li>
                  <li>• Add title and description</li>
                  <li>• Click "Create pull request"</li>
                </ul>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">5. Monitor Pipeline Execution</h4>
                <p className="text-sm text-muted-foreground">
                  After creating the PR, Bitbucket Pipelines will automatically run. Watch the pipeline logs
                  to confirm the CodeCrow webhook was sent successfully.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">6. Wait for Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  CodeCrow will process your code. Analysis time depends on:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 mt-2">
                  <li>• Size of code changes (number of files and lines)</li>
                  <li>• AI model selected (GPT-4 is slower but more thorough)</li>
                  <li>• Current system load</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Typical analysis time: <strong>1-2 minutes</strong> for most pull requests.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">7. Review Results in CodeCrow</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to your CodeCrow project dashboard → Project Analysis to view detailed results including:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 mt-2">
                  <li>• Security vulnerabilities and risks</li>
                  <li>• Code quality issues and suggestions</li>
                  <li>• Performance optimization opportunities</li>
                  <li>• Best practice recommendations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What CodeCrow Analyzes</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                Security
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>• SQL injection vulnerabilities</li>
                <li>• XSS attack vectors</li>
                <li>• Authentication issues</li>
                <li>• Data exposure risks</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                Code Quality
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>• Code complexity metrics</li>
                <li>• Duplicate code detection</li>
                <li>• Naming conventions</li>
                <li>• Code structure issues</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                Performance
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>• Inefficient algorithms</li>
                <li>• Database query optimization</li>
                <li>• Memory leak detection</li>
                <li>• Resource usage patterns</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2" />
                Best Practices
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>• Design pattern usage</li>
                <li>• Error handling</li>
                <li>• Documentation quality</li>
                <li>• Test coverage gaps</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Analysis Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>0-5 seconds:</strong> Webhook received, pull request queued for analysis</p>
            <p><strong>10-20 seconds:</strong> Code fetching and pre-processing</p>
            <p><strong>20s-2 minutes:</strong> AI analysis in progress</p>
            <p><strong>10-20 seconds:</strong> Report generation and posting to dashboard</p>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro Tip:</strong> For faster iterations during development, consider running analysis only on specific
            target branches (e.g., develop, main) rather than every feature branch. This reduces analysis costs and queue time
            while still catching issues before merging to production.
          </AlertDescription>
        </Alert>

        <Card className="border-primary bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader>
            <CardTitle>🎉 Congratulations!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You've successfully completed the CodeCrow setup! Your pull requests will now receive automatic AI-powered code reviews.
            </p>
            <div className="bg-background/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Next Steps:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Review analysis results and address findings</li>
                <li>• Customize review settings in Project Settings</li>
                <li>• Invite team members to collaborate</li>
                <li>• Explore advanced features like custom rules and filters</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <DocNavigation
          prev={{ title: "Pipeline Setup", url: "/docs/pipeline-setup" }}
        />
      </div>
    </div>
  );
}
