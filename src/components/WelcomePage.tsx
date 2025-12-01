import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, GitBranch, Shield, Users, Star, LayoutDashboard, BookOpen, FileCode, BarChart, CheckCircle2, AlertTriangle, FileSearch, Zap, Clock, ChevronDown, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "@/lib/auth";
import demoVcsReport from "@/assets/demo-vcs-report.png";
import demoDetailedInfo from "@/assets/demo-detailed-info.png";
import { ProcessFlowchart } from "./ProcessFlowchart";
import { useScrollAnimation } from "@/hooks/use-parallax";
import { useState, useEffect } from "react";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

// Hero Section
const HeroSection = ({ handleGetStarted, handleDocs }: { handleGetStarted: () => void; handleDocs: () => void }) => {
  const scrollToNext = () => {
    const nextSection = document.querySelector('#how-it-works');
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
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI-Powered Code Review Platform
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Ship Better Code</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Faster & Safer</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Intelligent AI-powered code analysis that integrates seamlessly with your workflow. 
            Get actionable insights, security fixes, and quality improvements on every pull request.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={handleGetStarted} className="min-w-[180px]">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleDocs} className="min-w-[180px]">
              <BookOpen className="mr-2 h-4 w-4" />
              Documentation
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Setup in minutes</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
        aria-label="Scroll to next section"
      >
        <span className="text-sm font-medium">Learn more</span>
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </button>
    </section>
  );
};

// Benefits Section
const BenefitsSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);
  
  const benefits = [
    {
      icon: Clock,
      title: "Continuous Review",
      description: "Automated analysis on every commit and pull request",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: GitBranch,
      title: "Native Integration",
      description: "Results posted directly in your pull requests",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Catch vulnerabilities before production",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Zap,
      title: "Instant Fixes",
      description: "AI-powered remediation with code patches",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Shared insights across your development team",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: BarChart,
      title: "Quality Metrics",
      description: "Track improvement over time",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];
  
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Teams Choose CodeCrow</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need for continuous, intelligent code review
          </p>
        </div>

        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={index}
                className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 75}ms` }}
              >
                <CardContent className="p-6">
                  <div className={`h-11 w-11 rounded-xl ${benefit.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-5 w-5 ${benefit.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
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
      } ${lastScrollY > 50 ? 'bg-background/95 backdrop-blur-md border-b border-border/40' : ''}`}>
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Seamless Integration
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How CodeCrow Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Automated code analysis that integrates directly into your development workflow
            </p>
          </div>

          {/* Process Flowchart */}
          <div className="mb-20">
            <ProcessFlowchart />
          </div>

          <div className="space-y-20 max-w-6xl mx-auto">
            {/* Step 1: VCS Integration */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <Badge variant="outline" className="mb-4">
                  Step 1
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Automated Reports in Your PRs
                </h3>
                <p className="text-muted-foreground text-lg mb-6">
                  CodeCrow automatically analyzes every pull request and posts detailed reports 
                  directly in your version control platform.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center mt-0.5 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Comprehensive Summary</p>
                      <p className="text-sm text-muted-foreground">Overview of all issues with severity levels</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-warning/10 flex items-center justify-center mt-0.5 shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">Clear Categorization</p>
                      <p className="text-sm text-muted-foreground">Issues sorted by high, medium, and low severity</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center mt-0.5 shrink-0">
                      <FileSearch className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Detailed Issue List</p>
                      <p className="text-sm text-muted-foreground">File paths, line numbers, and fix suggestions</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <Card className="overflow-hidden border-0 shadow-lg">
                  <img 
                    src={demoVcsReport} 
                    alt="VCS Platform Report" 
                    className="w-full h-auto"
                  />
                </Card>
              </div>
            </div>

            {/* Step 2: Detailed Analysis */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Card className="overflow-hidden border-0 shadow-lg">
                  <img 
                    src={demoDetailedInfo} 
                    alt="Detailed issue analysis" 
                    className="w-full h-auto"
                  />
                </Card>
              </div>
              <div>
                <Badge variant="outline" className="mb-4">
                  Step 2
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Deep Dive with Fix Suggestions
                </h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Access your CodeCrow dashboard for in-depth analysis with 
                  code snippets, patches, and step-by-step remediation guidance.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                      <FileCode className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Complete Context</p>
                      <p className="text-sm text-muted-foreground">Full issue description with affected files</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Code className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Code Diff Patches</p>
                      <p className="text-sm text-muted-foreground">Ready-to-apply code changes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center mt-0.5 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Actionable Guidance</p>
                      <p className="text-sm text-muted-foreground">Best practices to prevent similar issues</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Integration Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Integrations</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to supercharge your code review workflow
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border hover:border-primary/30 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">VCS Integration</CardTitle>
                <CardDescription>
                  Connect with your code hosting platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Bitbucket, GitHub, GitLab</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Auto-sync repositories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>PR/MR automation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover:border-accent/30 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Intelligent code review with ML
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Security detection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Code quality insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Performance optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border hover:border-success/30 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="h-11 w-11 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <CardTitle className="text-lg">Team Dashboard</CardTitle>
                <CardDescription>
                  Centralized project management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Real-time collaboration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Issue tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Analytics & reporting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <Card className="max-w-3xl mx-auto border-0 shadow-lg bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Star className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Join Our Alpha Testing</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Be among the first to experience AI-powered code reviews. 
                Get early access to all premium features.
              </p>
              <Button size="lg" onClick={handleGetStarted}>
                <Star className="mr-2 h-4 w-4" />
                Join Alpha Testing
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CodeCrowLogo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2025 CodeCrow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
