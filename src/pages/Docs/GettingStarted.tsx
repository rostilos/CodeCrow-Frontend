import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight, Clock, BookOpen, Briefcase, GitBranch, FolderGit2, Key, Workflow, GitPullRequest, MousePointer, Settings, Github, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Bitbucket logo SVG component
function BitbucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/>
    </svg>
  );
}

export default function GettingStarted() {
  const navigate = useNavigate();

  const commonSteps = [
    {
      number: 1,
      title: "Create Workspace",
      description: "Set up your team workspace to organize projects and collaborate with team members.",
      path: "/docs/workspace",
      icon: Briefcase,
    },
  ];

  const bitbucketManualSteps = [
    {
      number: 2,
      title: "Manual VCS Connection",
      description: "Configure OAuth consumer credentials and connect your Bitbucket workspace manually.",
      path: "/docs/vcs-connection",
      icon: Settings,
    },
    {
      number: 3,
      title: "Create Project",
      description: "Import repositories and configure AI connection in a step-by-step wizard.",
      path: "/docs/first-project",
      icon: FolderGit2,
    },
    {
      number: 4,
      title: "Generate Token",
      description: "Create an authentication token for secure webhook integration.",
      path: "/docs/project-token",
      icon: Key,
    },
    {
      number: 5,
      title: "Setup Pipelines",
      description: "Configure CI/CD pipeline to trigger automatic code reviews on pull requests.",
      path: "/docs/bitbucket-pipelines",
      icon: Workflow,
    },
    {
      number: 6,
      title: "Create Pull Request",
      description: "Submit your first pull request and watch CodeCrow analyze your code.",
      path: "/docs/pull-request",
      icon: GitPullRequest,
    },
  ];

  const bitbucketAutoSteps = [
    {
      number: 2,
      title: "Connect Bitbucket App",
      description: "Simplified setup via CodeCrow's Bitbucket connection flow.",
      path: "/docs/bitbucket-app-install",
      icon: MousePointer,
    },
    {
      number: 3,
      title: "Select Repositories & AI",
      description: "Choose repositories to import and configure AI connection in a 2-step wizard.",
      path: "/docs/first-project",
      icon: FolderGit2,
    },
    {
      number: 4,
      title: "Create Pull Request",
      description: "Submit your first pull request and watch CodeCrow analyze your code.",
      path: "/docs/pull-request",
      icon: GitPullRequest,
    },
  ];

  const renderSteps = (steps: typeof commonSteps, startNumber = 1) => (
    <div className="space-y-2">
      {steps.map((step, idx) => (
        <Card 
          key={step.number} 
          className="group cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
          onClick={() => navigate(step.path)}
        >
          <CardContent className="flex items-center gap-4 py-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
              {startNumber + idx}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <step.icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">{step.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {step.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Getting Started</h1>
            <p className="text-muted-foreground mt-1">
              Set up CodeCrow and start automating your code reviews
            </p>
          </div>
        </div>
      </div>

      {/* Quick Overview */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Quick Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            CodeCrow provides AI-powered code review automation for your repositories. 
            It analyzes pull requests in real-time, identifying potential issues, 
            security vulnerabilities, and code quality improvements.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Estimated setup time: <strong className="text-foreground">5-15 minutes</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Step 1 - Common */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Step 1: Create Workspace</h2>
        {renderSteps(commonSteps)}
      </div>

      {/* VCS Provider Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Step 2: Choose Your VCS Provider</h2>
        
        <Tabs defaultValue="bitbucket" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="bitbucket" className="py-3">
              <BitbucketIcon className="h-4 w-4 mr-2" />
              Bitbucket Cloud
            </TabsTrigger>
            <TabsTrigger value="github" className="py-3" disabled>
              <Github className="h-4 w-4 mr-2" />
              GitHub
              <Badge variant="secondary" className="ml-2 text-[10px]">Coming Soon</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bitbucket" className="mt-4 space-y-6">
            {/* Installation Options */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Automatic Installation */}
              <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Automatic Installation</CardTitle>
                  </div>
                  <Badge className="w-fit">Recommended</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Install CodeCrow directly from Bitbucket Marketplace with one click. 
                    OAuth, webhooks, and pipelines are configured automatically.
                  </p>
                  <ul className="text-sm space-y-1.5">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      One-click OAuth setup
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Automatic webhook configuration
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Pre-configured pipeline templates
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      AI connection selection during setup
                    </li>
                  </ul>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    ~5 minutes
                  </div>
                </CardContent>
              </Card>

              {/* Manual Installation */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">Manual Installation</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit">Advanced</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure OAuth consumer manually with full control over permissions 
                    and settings. Best for enterprise or custom setups.
                  </p>
                  <ul className="text-sm space-y-1.5">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Create OAuth consumer in Bitbucket
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Configure credentials manually
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Set up webhooks per repository
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Full control over configuration
                    </li>
                  </ul>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    ~15 minutes
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Steps based on installation type */}
            <Tabs defaultValue="auto" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="auto">Automatic Setup Steps</TabsTrigger>
                <TabsTrigger value="manual">Manual Setup Steps</TabsTrigger>
              </TabsList>

              <TabsContent value="auto" className="mt-4 space-y-3">
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className="text-sm">Fastest way to get started with CodeCrow</p>
                </div>
                {renderSteps(bitbucketAutoSteps, 2)}
              </TabsContent>

              <TabsContent value="manual" className="mt-4 space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Full control over your configuration</p>
                </div>
                {renderSteps(bitbucketManualSteps, 2)}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="github" className="mt-4">
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Github className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">GitHub Support Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We're working on GitHub integration. Sign up for our newsletter to be notified when it's available.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Developer Docs CTA */}
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Looking for Technical Documentation?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Check out our developer docs for architecture, API reference, and deployment guides.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/docs/dev/architecture")}
              className="shrink-0"
            >
              Developer Docs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
