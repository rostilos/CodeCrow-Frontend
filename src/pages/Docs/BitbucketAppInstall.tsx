import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MousePointer, CheckCircle, ArrowRight, ExternalLink, Zap, Shield, Settings, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function BitbucketAppInstall() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <MousePointer className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Install CodeCrow App</h1>
            <p className="text-muted-foreground mt-1">
              One-click installation from Bitbucket Marketplace
            </p>
          </div>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/30">Automatic Installation</Badge>
      </div>

      {/* Benefits */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Why Choose Automatic Installation?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">OAuth Pre-configured</h4>
                <p className="text-xs text-muted-foreground">No need to create OAuth consumers manually</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Automatic Webhooks</h4>
                <p className="text-xs text-muted-foreground">Webhooks configured for all selected repos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Pipeline Templates</h4>
                <p className="text-xs text-muted-foreground">Pre-configured bitbucket-pipelines.yml</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">AI Connection Setup</h4>
                <p className="text-xs text-muted-foreground">Configure during installation flow</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Steps */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Installation Steps</h2>

        {/* Step 1 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
              <CardTitle className="text-base">Visit Bitbucket Marketplace</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Navigate to the CodeCrow app page on Bitbucket Marketplace and click "Install".
            </p>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Bitbucket Marketplace
            </Button>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
              <CardTitle className="text-base">Grant Permissions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review and approve the required permissions for CodeCrow to access your repositories.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Required Permissions
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Read repository contents</li>
                <li>• Read and write pull requests</li>
                <li>• Read repository metadata</li>
                <li>• Manage webhooks</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</div>
              <CardTitle className="text-base">Configure AI Connection</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              During the installation flow, you'll be prompted to configure your AI provider.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 border rounded-lg text-center">
                <Cpu className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">OpenRouter</p>
                <p className="text-xs text-muted-foreground">Recommended</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Cpu className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">OpenAI</p>
                <p className="text-xs text-muted-foreground">GPT-4 / GPT-4o</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <Cpu className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Anthropic</p>
                <p className="text-xs text-muted-foreground">Claude 3.5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">4</div>
              <CardTitle className="text-base">Select Repositories</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose which repositories you want to enable for automated code review. 
              You can add more repositories later from the dashboard.
            </p>
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Settings className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Pipelines will be automatically configured for selected repositories.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 5 */}
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold">
                <CheckCircle className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">You're All Set!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              CodeCrow is now installed and configured. Create a pull request in any of your 
              enabled repositories to see it in action.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/dashboard/projects")}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/docs/pull-request")}>
                Create First PR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Installation CTA */}
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Need More Control?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use manual installation for custom OAuth configuration and enterprise setups.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/docs/vcs-connection")}
              className="shrink-0"
            >
              Manual Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
