import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight, Clock, BookOpen, Briefcase, GitBranch, FolderGit2, Key, Workflow, GitPullRequest, MousePointer, Settings, Github, DatabaseZap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DocNavigation } from "./DocNavigation";

// Bitbucket logo SVG component
function BitbucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
    </svg>
  );
}

export default function GettingStarted() {
  const navigate = useNavigate();

  const commonSteps = [
    {
      number: 1,
      title: "Create Workspace",
      description: "Set up your organization to organize projects and collaborate with team members.",
      path: "/docs/workspace",
      icon: Briefcase,
    },
  ];

  const bitbucketManualSteps = [
    {
      number: 3,
      title: "Bind AI Connection",
      description: "Choose your preferred LLM model (OpenAI, Claude) to power the analysis.",
      path: "/docs/ai-connection",
      icon: Zap,
    },
    {
      number: 4,
      title: "Create First Project",
      description: "Follow the 5-step wizard: Repository -> Details -> AI -> Analysis -> Install.",
      path: "/docs/first-project",
      icon: FolderGit2,
    },
    {
      number: 5,
      title: "Setup RAG (Optional)",
      description: "Enrich AI with project-wide context by indexing your entire codebase.",
      path: "/docs/setup-rag",
      icon: DatabaseZap,
    },
    {
      number: 6,
      title: "Manual Pipeline Setup",
      description: "Only if you chose Pipeline method instead of Webhooks.",
      path: "/docs/pipeline-setup",
      icon: Workflow
    },
    {
      number: 7,
      title: "Create Pull Request",
      description: "Submit a PR and watch CodeCrow analyze your code in real-time.",
      path: "/docs/pull-request",
      icon: GitPullRequest,
    },
  ];

  const bitbucketAutoSteps = [
    {
      number: 3,
      title: "Bind AI Connection",
      description: "Choose OpenAI or Claude to power the analysis.",
      path: "/docs/ai-connection",
      icon: Zap,
    },
    {
      number: 4,
      title: "Create First Project",
      description: "Import repositories and bind AI in our streamlined setup wizard.",
      path: "/docs/first-project",
      icon: FolderGit2,
    },
    {
      number: 5,
      title: "Setup RAG (Optional)",
      description: "Enable project-wide context indexing for better review accuracy.",
      path: "/docs/setup-rag",
      icon: DatabaseZap,
    },
    {
      number: 6,
      title: "Create Pull Request",
      description: "Submit your code changes and get AI feedback directly in your PR.",
      path: "/docs/pull-request",
      icon: GitPullRequest,
    },
  ];

  const renderSteps = (steps: any[], startNumber = 1) => (
    <div className="space-y-2">
      {steps.map((step, idx) => (
        <Card
          key={step.number}
          className="group cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
          onClick={() => navigate(step.path)}
        >
          <CardContent className="flex items-center gap-4 py-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
              {step.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <step.icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm no-toc">{step.title}</h3>
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
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Getting Started</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Follow this guide to set up CodeCrow and automate your CI/CD code reviews.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Overview */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Platform Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            CodeCrow uses advanced LLMs and Retrieval-Augmented Generation (RAG) to provide
            intelligent, context-aware code reviews. It integrates directly with your VCS
            (GitHub/Bitbucket) to analyze every PR and push.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Estimated setup time: <strong className="text-foreground">5-10 minutes</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Step 1 - Common */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold no-toc-text">1</span>
          Initial Setup
        </h2>
        {renderSteps(commonSteps)}
      </div>

      {/* Understanding VCS Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold no-toc-text">2</span>
          Connect VCS Platform
        </h2>
        <Card className="border-border/50">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A <strong>VCS Connection</strong> is a secure bridge between CodeCrow and your Git provider.
              It allows CodeCrow to automatically discover repositories in your <strong>Bitbucket Workspace</strong>
              or <strong>GitHub Organization</strong>.
            </p>

            <div className="grid md:grid-cols-2 gap-4 pb-4">
              {/* Provider choice inside Step 2 */}
              <Card className="cursor-pointer hover:border-primary transition-colors bg-muted/30" onClick={() => navigate("/docs/vcs-connection/github")}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Github className="h-5 w-5 text-primary" />
                  <div className="text-sm font-bold">GitHub App</div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary transition-colors bg-muted/30" onClick={() => navigate("/docs/vcs-connection/bitbucket")}>
                <CardContent className="p-4 flex items-center gap-3">
                  <BitbucketIcon className="h-5 w-5 text-primary" />
                  <div className="text-sm font-bold">Bitbucket Integration</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                <div>
                  <p className="font-bold text-xs">Automated Triggers</p>
                  <p className="text-[10px] text-muted-foreground">CodeCrow listens for PR and push events to start analysis.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-blue-500/10"><CheckCircle className="h-4 w-4 text-blue-600" /></div>
                <div>
                  <p className="font-bold text-xs">Workspace discovery</p>
                  <p className="text-[10px] text-muted-foreground">Import any repository from your entire org in one click.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* AI Connection Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold no-toc-text">3</span>
          Finalize Configuration
        </h2>

        <Tabs defaultValue="github" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="github" className="py-3">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </TabsTrigger>
            <TabsTrigger value="bitbucket" className="py-3">
              <BitbucketIcon className="h-4 w-4 mr-2" />
              Bitbucket Cloud
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="mt-4 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">GitHub App Integration</CardTitle>
                  <Badge className="w-fit scale-75 origin-left">Automatic</Badge>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Install the CodeCrow App to your organization. Full automation for webhooks and status checks.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Manual Setup</CardTitle>
                  <Badge variant="outline" className="w-fit scale-75 origin-left">Advanced</Badge>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Use OAuth apps for personal repositories or specific permission requirements.
                </CardContent>
              </Card>
            </div>
            {renderSteps(bitbucketAutoSteps)}
          </TabsContent>

          <TabsContent value="bitbucket" className="mt-4 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">OAuth App</CardTitle>
                  <Badge className="w-fit scale-75 origin-left">Recommended</Badge>
                </CardHeader>
                <CardContent className="text-[10px] text-muted-foreground">
                  Quickest 1-click personal setup. Comments post as you.
                </CardContent>
              </Card>
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Connect App</CardTitle>
                  <Badge variant="outline" className="w-fit scale-75 origin-left border-blue-500/30 text-blue-600">Workspace</Badge>
                </CardHeader>
                <CardContent className="text-[10px] text-muted-foreground">
                  Full workspace integration. Comments post as CodeCrow Bot.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Manual OAuth</CardTitle>
                  <Badge variant="outline" className="w-fit scale-75 origin-left">Advanced</Badge>
                </CardHeader>
                <CardContent className="text-[10px] text-muted-foreground">
                  Custom credentials & full control over permission scopes.
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="auto" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-8">
                <TabsTrigger value="auto" className="text-xs">Quick Setup</TabsTrigger>
                <TabsTrigger value="manual" className="text-xs">Manual Setup</TabsTrigger>
              </TabsList>
              <TabsContent value="auto" className="mt-4">
                {renderSteps(bitbucketAutoSteps)}
              </TabsContent>
              <TabsContent value="manual" className="mt-4">
                {renderSteps(bitbucketManualSteps)}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Developer Docs CTA */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm">Need a Technical Deep Dive?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Explore our architecture, self-hosted options, and advanced API integrations.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/docs/dev/architecture")}
              className="shrink-0"
            >
              Developer Docs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <DocNavigation
        next={{ title: "Create Workspace", url: "/docs/workspace" }}
      />
    </div>
  );
}
