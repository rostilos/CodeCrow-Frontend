import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Workflow, Info, CheckCircle2, Github, Terminal, Shield, Key } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavLink } from "react-router-dom";
import { DocNavigation } from "./DocNavigation";

export default function SetupPipelines() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl font-sans">
            <div className="mb-8">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    <Workflow className="mr-2 h-4 w-4 inline" />
                    Step 6
                </Badge>
                <h1 className="text-4xl font-bold mb-4">Manual Pipeline Setup</h1>
                <p className="text-xl text-muted-foreground">
                    Integrate CodeCrow analysis into your existing CI/CD runners for custom execution control.
                </p>
            </div>

            <div className="space-y-6">
                <Alert className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm italic">
                        <strong>Note:</strong> This is an advanced setup. If you chose "Webhooks" during project creation,
                        analysis triggers automatically and you can skip this section.
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="bitbucket" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="bitbucket" className="flex items-center gap-2">
                            <BitbucketIcon className="h-4 w-4" />
                            Bitbucket Pipelines
                        </TabsTrigger>
                        <TabsTrigger value="github" className="flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            GitHub Actions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="bitbucket" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configure bitbucket-pipelines.yml</CardTitle>
                                <CardDescription>Add the CodeCrow analysis step to your pipeline.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                                    <pre className="text-xs">
                                        {`pipelines:
  pull-requests:
    '**':
      - step:
          name: CodeCrow AI review
          image: codecrowai/bitbucket-analysis-executor:latest
          clone:
            enabled: false
          script:
            - analysis-executor`}
                                    </pre>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-primary" />
                                        Required Variables
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Define these in <strong>Repository settings → Pipelines → Repository variables</strong>:
                                    </p>
                                    <ul className="text-xs list-disc ml-5 space-y-1">
                                        <li><code className="font-bold">CODECROW_PROJECT_TOKEN</code>: Your secure project token (<NavLink to="/docs/project-token" className="text-primary hover:underline font-normal">generate here</NavLink>).</li>
                                        <li><code className="font-bold">CODECROW_PROJECT_ID</code>: Your project namespace.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="github" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configure GitHub Action</CardTitle>
                                <CardDescription>Add CodeCrow analysis to your workflow file.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                                    <pre className="text-xs">
                                        {`name: CodeCrow Analysis
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: CodeCrow AI Review
        uses: codecrow-ai/github-action@v1
        with:
          project-id: \${{ secrets.CODECROW_PROJECT_ID }}
          project-token: \${{ secrets.CODECROW_PROJECT_TOKEN }}`}
                                    </pre>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-primary" />
                                        Required Secrets
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Add these under <strong>Settings → Secrets and variables → Actions</strong>:
                                    </p>
                                    <ul className="text-xs list-disc ml-5 space-y-1">
                                        <li><code className="font-bold">CODECROW_PROJECT_TOKEN</code>: Your secure project token (<NavLink to="/docs/project-token" className="text-primary hover:underline font-normal">generate here</NavLink>).</li>
                                        <li><code className="font-bold">CODECROW_PROJECT_ID</code>: Your project namespace.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <DocNavigation
                    prev={{ title: "Project Token", url: "/docs/project-token" }}
                    next={{ title: "Create Pull Request", url: "/docs/pull-request" }}
                />
            </div>
        </div>
    );
}

function BitbucketIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
        </svg>
    );
}
