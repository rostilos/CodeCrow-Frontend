import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Code, GitBranch, Shield, Users, Star, LayoutDashboard, BookOpen, FileCode, 
  BarChart, CheckCircle2, AlertTriangle, FileSearch, Zap, Clock, ChevronDown, 
  ArrowRight, Sparkles, Key, Eye, Database, Server, TrendingUp, MousePointer,
  Github, ExternalLink, Cpu, MessageSquare, Image as ImageIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "@/lib/auth";
import demoVcsReport from "@/assets/demo-vcs-report.png";
import demoDetailedInfo from "@/assets/demo-detailed-info.png";
import demoAnalysisDashboard from "@/assets/demo-analysis-dashboard.png";
import demoProjectOverview from "@/assets/demo-project-overview.png";
import { ProcessFlowchart } from "./ProcessFlowchart";
import { useScrollAnimation } from "@/hooks/use-parallax";
import { useState, useEffect } from "react";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

// Bitbucket Icon Component
function BitbucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/>
    </svg>
  );
}

// Hero Section with modern gradient design
const HeroSection = ({ handleGetStarted, handleDocs }: { handleGetStarted: () => void; handleDocs: () => void }) => {
  const scrollToNext = () => {
    const nextSection = document.querySelector('#features');
    if (nextSection) {
      const offsetTop = nextSection.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative overflow-hidden min-h-[100dvh] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
              Alpha Testing
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
              <Key className="h-3.5 w-3.5 mr-1.5 text-primary" />
              BYOK
            </Badge>
            <Badge variant="outline" className="px-3 py-2 text-sm">
              <Github className="h-3.5 w-3.5 mr-1.5" />
              Open Source
            </Badge>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
            <span className="text-foreground">AI-Powered</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Code Review
            </span>
            <br />
            <span className="text-foreground">Platform</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Bring Your Own Key. Choose any LLM. Get intelligent code analysis with 
            <span className="text-foreground font-medium"> full project context</span> using RAG technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" onClick={handleGetStarted} className="min-w-[200px] h-14 text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
              Start Free Alpha
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleDocs} className="min-w-[200px] h-14 text-lg">
              <BookOpen className="mr-2 h-5 w-5" />
              Documentation
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Free During Alpha</span>
            </div>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Use Your Own API Key</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">100% Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Setup in Minutes</span>
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
        aria-label="Scroll to next section"
      >
        <span className="text-sm font-medium">Discover Features</span>
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </button>
    </section>
  );
};

const KeyFeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);
  
  const features = [
    {
      icon: Key,
      title: "BYOK - Bring Your Own Key",
      description: "Use any LLM provider: OpenRouter, OpenAI, Anthropic, or any compatible API. Choose your model, control your budget, and tune the analysis relevance.",
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-500/10 to-orange-600/10",
    },
    {
      icon: Eye,
      title: "Full Transparency",
      description: "Our code is 100% open-source. No hidden algorithms, no black boxes. Audit the code, contribute improvements, and trust what's running on your data.",
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-500/10 to-teal-600/10",
    },
    {
      icon: Database,
      title: "RAG Pipeline",
      description: "Retrieval-Augmented Generation keeps full project context during analysis. The AI understands your codebase structure, dependencies, and patterns.",
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-500/10 to-purple-600/10",
    },
    {
      icon: Server,
      title: "MCP Servers",
      description: "Model Context Protocol servers provide additional context enrichment. Direct connection to VCS platforms for deeper repository understanding.",
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-500/10 to-cyan-600/10",
    },
    {
      icon: TrendingUp,
      title: "Continuous Analysis",
      description: "Track branches with incremental analysis. Store historical data for trend analytics. Watch your code quality improve over time.",
      gradient: "from-rose-500 to-pink-600",
      bgGradient: "from-rose-500/10 to-pink-600/10",
    },
    {
      icon: MousePointer,
      title: "Simple Installation",
      description: "Connect via Bitbucket Cloud integration in minutes. Automatic webhook and pipeline configuration with no complex setup required.",
      gradient: "from-indigo-500 to-blue-600",
      bgGradient: "from-indigo-500/10 to-blue-600/10",
    },
  ];
  
  return (
    <section id="features" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Why CodeCrow
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Built for Modern Teams
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Powerful features designed to give you complete control over your code review process
          </p>
        </div>

        <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className={`group relative border-0 bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm hover:shadow-xl transition-all duration-500 overflow-hidden ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <CardContent className="relative p-8">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default function WelcomePage() {
  const navigate = useNavigate();
  const isAuthenticated = authUtils.isAuthenticated();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleGetStarted = () => {
    navigate("/register");
  };

  const handleDashboard = () => {
    navigate("/workspace");
  };

  const handleDocs = () => {
    navigate("/docs");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      } ${lastScrollY > 50 ? 'bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm' : ''}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <CodeCrowLogo size="md" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated ? (
                <Button onClick={handleDashboard}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleLogin}>Sign in</Button>
                  <Button onClick={handleGetStarted}>Get Started</Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection 
        handleGetStarted={handleGetStarted}
        handleDocs={handleDocs}
      />

      {/* Key Features Section */}
      <KeyFeaturesSection />

      {/* How It Works Section with Screenshots */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-muted/20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              How It Works
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">See It In Action</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From PR analysis to detailed fixes — everything happens automatically
            </p>
          </div>

          {/* Process Flowchart */}
          <div className="mb-24">
            <ProcessFlowchart />
          </div>

          <div className="space-y-32 max-w-7xl mx-auto">
            {/* Screenshot 1: Analysis Dashboard - Issues by File */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-6">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Analysis Dashboard
                </Badge>
                <h3 className="text-3xl sm:text-4xl font-bold">
                  Track Issues Across Files
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  View all detected issues organized by file with severity indicators. 
                  Filter by HIGH, MEDIUM, or LOW priority to focus on what matters most.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Severity Classification</p>
                      <p className="text-muted-foreground">Issues tagged as HIGH, MEDIUM, or LOW based on impact</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <FileSearch className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold">File-Based Organization</p>
                      <p className="text-muted-foreground">Issues grouped by file path for easy navigation</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Issue Status Tracking</p>
                      <p className="text-muted-foreground">Mark issues as Open or Resolved to track progress</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-2xl opacity-50" />
                  <Card className="relative overflow-hidden border-0 shadow-2xl rounded-xl">
                    <img 
                      src={demoAnalysisDashboard} 
                      alt="VCS Pull Request Report" 
                      className="w-full h-auto"
                    />
                  </Card>
                </div>
              </div>
            </div>

            {/* Screenshot 2: Project Overview with Charts */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-primary/20 rounded-2xl blur-2xl opacity-50" />
                  <Card className="relative overflow-hidden border-0 shadow-2xl rounded-xl">
                    <img 
                      src={demoProjectOverview} 
                      alt="VCS Pull Request Report" 
                      className="w-full h-auto"
                    />
                  </Card>
                </div>
              </div>
              <div className="space-y-6">
                <Badge className="bg-accent/10 text-accent border-accent/20">
                  Project Overview
                </Badge>
                <h3 className="text-3xl sm:text-4xl font-bold">
                  Analytics & Trend Tracking
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Get a bird's-eye view of your project health. Track issue trends over time, 
                  see severity distribution, and monitor resolution rates.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <BarChart className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Severity Distribution</p>
                      <p className="text-muted-foreground">Visual breakdown of HIGH, MEDIUM, LOW issues</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Resolution Trends</p>
                      <p className="text-muted-foreground">Track issue resolution rates over time</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <GitBranch className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Branch Analysis History</p>
                      <p className="text-muted-foreground">Historical data for all analyzed branches</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Screenshot 3: Issue Details with Fix */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-6">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Issue Details
                </Badge>
                <h3 className="text-3xl sm:text-4xl font-bold">
                  AI-Generated Fix Suggestions
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Each issue comes with a detailed description and a ready-to-apply code patch. 
                  Understand the problem and fix it in seconds.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <FileCode className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Detailed Descriptions</p>
                      <p className="text-muted-foreground">Understand why the issue matters and its impact</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Code className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Code Diff Patches</p>
                      <p className="text-muted-foreground">Copy-paste ready fixes with before/after view</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <GitBranch className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Branch & Line Context</p>
                      <p className="text-muted-foreground">Exact file location with branch information</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-2xl opacity-50" />
                  <Card className="relative overflow-hidden border-0 shadow-2xl rounded-xl">
                    <img 
                      src={demoDetailedInfo} 
                      alt="Issue Details with Suggested Fix" 
                      className="w-full h-auto"
                    />
                  </Card>
                </div>
              </div>
            </div>

            {/* Screenshot 4: VCS PR Report */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-2xl opacity-50" />
                  <Card className="relative overflow-hidden border-0 shadow-2xl rounded-xl">
                    <img 
                      src={demoVcsReport} 
                      alt="VCS Pull Request Report" 
                      className="w-full h-auto"
                    />
                  </Card>
                </div>
              </div>
              <div className="space-y-6">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  VCS Integration
                </Badge>
                <h3 className="text-3xl sm:text-4xl font-bold">
                  Reports Right in Your PRs
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Get formatted analysis reports posted directly to your pull requests. 
                  In-code highlights and structured summaries without leaving your VCS platform.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold">PR Comment Reports</p>
                      <p className="text-muted-foreground">Structured summaries posted as PR comments</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Code className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-semibold">In-Code Highlights</p>
                      <p className="text-muted-foreground">Issues linked to specific files and line numbers</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <FileSearch className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Severity Overview</p>
                      <p className="text-muted-foreground">Quick glance at HIGH, MEDIUM, LOW issue counts</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VCS Platform Integration */}
      <section className="py-24 lg:py-32">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <GitBranch className="h-3.5 w-3.5 mr-1.5" />
              Native Integration
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Works Where You Code</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Seamless integration with your favorite VCS platforms
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="group relative overflow-hidden border-2 border-transparent hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <BitbucketIcon className="h-7 w-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Bitbucket Cloud</CardTitle>
                <CardDescription className="text-base">
                  Quick setup via Bitbucket Connection with automatic webhooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>OAuth Integration</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>PR Comments Integration</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Automatic Token Refresh</span>
                  </li>
                </ul>
                <Badge className="mt-4 bg-green-500/10 text-green-600 border-green-500/20">
                  Available Now
                </Badge>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 border-dashed border-muted-foreground/20">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Github className="h-7 w-7 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-muted-foreground">GitHub</CardTitle>
                <CardDescription className="text-base">
                  GitHub App with Actions integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>GitHub App Integration</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>PR Review Comments</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Actions Workflow</span>
                  </li>
                </ul>
                <Badge variant="outline" className="mt-4">
                  Coming Soon
                </Badge>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 border-dashed border-muted-foreground/20">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-muted-foreground">
                    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z"/>
                  </svg>
                </div>
                <CardTitle className="text-xl text-muted-foreground">GitLab</CardTitle>
                <CardDescription className="text-base">
                  GitLab CI/CD pipeline integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>OAuth Integration</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>MR Comments</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/60">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Pipeline Triggers</span>
                  </li>
                </ul>
                <Badge variant="outline" className="mt-4">
                  Coming Soon
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent mb-8 shadow-lg shadow-primary/25">
              <Star className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to Transform Your Code Reviews?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join our free alpha program. Use your own API key, choose any LLM, 
              and experience intelligent code analysis with full project context.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="h-14 px-8 text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                <Star className="mr-2 h-5 w-5" />
                Start Free Alpha
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.open('https://github.com/rostilos/codecrow', '_blank')} className="h-14 px-8 text-lg">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Button>
            </div>
            
            {/* Additional trust signals */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>No Data Stored</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <span>Your Keys, Your Control</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <span>Open Source</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-muted/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <CodeCrowLogo size="sm" />
              <span className="text-sm text-muted-foreground">
                AI-Powered Code Review Platform
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com/rostilos/codecrow" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Github className="h-5 w-5" />
                <span className="text-sm">GitHub</span>
              </a>
              <Button variant="ghost" size="sm" onClick={handleDocs}>
                Documentation
              </Button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 CodeCrow. Open source under MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
