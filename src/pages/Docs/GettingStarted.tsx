import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function GettingStarted() {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: "Create Workspace",
      description: "Set up your team workspace to organize projects and collaborate with team members.",
      path: "/docs/workspace",
    },
    {
      number: 2,
      title: "Create VCS Connection",
      description: "Connect your Bitbucket Cloud account to sync repositories and manage code reviews.",
      path: "/docs/vcs-connection",
    },
    {
      number: 3,
      title: "Create AI Connection",
      description: "Configure AI provider (OpenAI, Anthropic, or OpenRouter) for intelligent code analysis.",
      path: "/docs/ai-connection",
    },
    {
      number: 4,
      title: "Create Your First Project",
      description: "Set up a new project and link it to your repository for automated code reviews.",
      path: "/docs/first-project",
    },
    {
      number: 5,
      title: "Generate Project Token",
      description: "Create an authentication token for secure webhook integration.",
      path: "/docs/project-token",
    },
    {
      number: 6,
      title: "Setup Bitbucket Pipelines",
      description: "Configure CI/CD pipeline to trigger automatic code reviews on pull requests.",
      path: "/docs/bitbucket-pipelines",
    },
    {
      number: 7,
      title: "Create Pull Request",
      description: "Submit your first pull request and watch CodeCrow analyze your code.",
      path: "/docs/pull-request",
    },
  ];

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      {/* Hero */}
      <div className="mb-12">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <Zap className="mr-2 h-4 w-4 inline" />
          Quick Start Guide
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Getting Started with CodeCrow</h1>
        <p className="text-xl text-muted-foreground">
          Follow these steps to set up CodeCrow and start automating your code reviews with AI-powered insights.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.number} className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {step.number}
                </span>
                {step.title}
              </CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="group"
                onClick={() => navigate(step.path)}
              >
                Read More
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estimated Time */}
      <Card className="mt-12 border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Estimated Setup Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete setup typically takes <strong>15-20 minutes</strong> for first-time configuration.
            Once configured, adding new projects takes just a few minutes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
