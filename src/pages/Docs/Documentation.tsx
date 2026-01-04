import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, GitBranch, Settings, Zap, Terminal, FileCode, AlertCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";

export default function Documentation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 lg:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="hover:opacity-80 transition-opacity"
          >
            <CodeCrowLogo size="md" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge className="mb-6" variant="secondary">
            <BookOpen className="mr-2 h-3 w-3" />
            Documentation
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">CodeCrow Documentation</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know to get started with CodeCrow and master AI-powered code reviews
          </p>
        </div>

        {/* Quick Start Guide */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Zap className="mr-3 h-8 w-8 text-primary" />
            Getting Started
          </h2>
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>Get up and running with CodeCrow in minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm mr-2">1</span>
                  Create Your Account
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  [Placeholder] Sign up for a CodeCrow account and verify your email address. You'll gain immediate access to the platform.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm mr-2">2</span>
                  Connect Your Repository
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  [Placeholder] Link your Bitbucket repository. CodeCrow will automatically sync your code.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm mr-2">3</span>
                  Configure AI Settings
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  [Placeholder] Choose your preferred AI model and customize review parameters to match your team's needs.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm mr-2">4</span>
                  Start Reviewing
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  [Placeholder] Trigger your first AI-powered code review and watch as CodeCrow analyzes your codebase.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-16" />

        {/* Repository Integration */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <GitBranch className="mr-3 h-8 w-8 text-primary" />
            Repository Integration
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCode className="mr-2 h-5 w-5 text-primary" />
                  Bitbucket Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  [Placeholder] Connect your Bitbucket Cloud or Bitbucket Server repositories. Learn how to:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Generate OAuth credentials</li>
                  <li>• Configure webhooks</li>
                  <li>• Set up automatic PR reviews</li>
                  <li>• Manage repository permissions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCode className="mr-2 h-5 w-5 text-primary" />
                  GitHub & GitLab
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect GitHub and GitLab repositories with 1-click OAuth integration:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• GitHub App installation & OAuth</li>
                  <li>• GitLab OAuth application setup</li>
                  <li>• Automatic webhook configuration</li>
                  <li>• Merge/Pull request analysis</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-16" />

        {/* Setup & Configuration */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Settings className="mr-3 h-8 w-8 text-primary" />
            Administration & Setup
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Project Administration</CardTitle>
                <CardDescription>Manage project settings, analysis scope, and AI connections</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure how CodeCrow interacts with your repository:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Analysis Configuration (Webhooks vs Pipelines)</li>
                  <li>• Branch Analysis Scope</li>
                  <li>• RAG Settings & Pipeline</li>
                  <li>• AI Model Selection</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Workspace & RAG</CardTitle>
                <CardDescription>Manage your team and advanced AI capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up your organization and knowledge base:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Workspace Member Permissions</li>
                  <li>• RAG (Retrieval-Augmented Generation)</li>
                  <li>• Activity Monitoring</li>
                  <li>• Usage & Billing (if applicable)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-16" />

        {/* AI Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Zap className="mr-3 h-8 w-8 text-primary" />
            AI-Powered Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Security Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  [Placeholder] Detect vulnerabilities, identify security risks, and get recommendations for fixes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Code Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  [Placeholder] Analyze code complexity, identify code smells, and improve maintainability.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  [Placeholder] Get suggestions for performance optimization and resource usage improvements.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-16" />

        {/* API Reference */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <Terminal className="mr-3 h-8 w-8 text-primary" />
            API Reference
          </h2>
          <Card className="border-border">
            <CardHeader>
              <CardTitle>REST API Documentation</CardTitle>
              <CardDescription>Integrate CodeCrow into your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                [Placeholder] Complete API documentation with endpoints, authentication methods, and code examples.
              </p>

              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm">
                <div className="text-muted-foreground mb-2">Example API Request:</div>
                <code className="text-primary">
                  POST /api/v1/analysis/trigger
                  <br />
                  Authorization: Bearer YOUR_API_TOKEN
                  <br />
                  Content-Type: application/json
                </code>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Authentication & Authorization</p>
                <p>• Project Management Endpoints</p>
                <p>• Analysis Trigger & Results</p>
                <p>• Webhook Configuration</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-16" />

        {/* Troubleshooting */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center">
            <AlertCircle className="mr-3 h-8 w-8 text-primary" />
            Troubleshooting & FAQ
          </h2>
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Connection Issues</h4>
                <p className="text-sm text-muted-foreground">
                  [Placeholder] Solutions for repository connection problems, authentication errors, and webhook configuration issues.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Analysis Errors</h4>
                <p className="text-sm text-muted-foreground">
                  [Placeholder] Troubleshooting guide for failed analyses, timeout errors, and incomplete results.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Integration Problems</h4>
                <p className="text-sm text-muted-foreground">
                  [Placeholder] Help with third-party integrations, API rate limits, and permission issues.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Support CTA */}
        <section className="text-center py-12">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-accent/5 inline-block">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-3">Need More Help?</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="sm">Contact Support</Button>
                <Button size="sm" onClick={() => navigate("/register")}>
                  Start Using CodeCrow
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
