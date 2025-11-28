import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, GitBranch, Shield, Users, Star, LayoutDashboard, BookOpen, FileCode, BarChart, CheckCircle2, AlertTriangle, FileSearch, Zap, Clock, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "@/lib/auth";
import demoVcsReport from "@/assets/demo-vcs-report.png";
import demoDetailedInfo from "@/assets/demo-detailed-info.png";
import { ProcessFlowchart } from "./ProcessFlowchart";
import { useParallax, useScrollAnimation } from "@/hooks/use-parallax";
import { useState, useEffect } from "react";

// Hero Section with Parallax
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
    <section className="mx-auto px-6 relative overflow-hidden min-h-[100dvh] flex items-center justify-center pt-16">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none"
      />
      <div className="container text-center max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <Badge className="bg-primary/20 text-primary border-primary/30 animate-fade-in">
            ✨ AI-Powered Code Review Platform
          </Badge>
        </div>
        
        <h2 
          className="text-3xl md:text-5xl font-bold mb-6 animate-fade-in leading-tight"
        >
          <span className="inline-block bg-gradient-primary bg-clip-text text-transparent">
            Transform Your Code Review Process
          </span>
        </h2>
        
        <p 
          className="text-l md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in"
        >
          CodeCrow provides intelligent AI-powered code reviews integrated with your favorite tools. 
          Configure your account, connect your repositories, and let AI enhance your development workflow.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <Button size="lg" variant="gradient" className="text-lg px-8 hover-scale" onClick={handleGetStarted}>
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 hover-scale" onClick={handleDocs}>
            <BookOpen className="mr-2 h-5 w-5" />
            View Documentation
          </Button>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center">
          <button
              onClick={scrollToNext}
              className=" flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-300 cursor-pointer group"
              aria-label="Scroll to next section"
              style={{ animation: 'bounce 3s infinite' }}
          >
              <span className="text-sm font-medium">Scroll to explore</span>
              <ChevronDown className="h-6 w-6 group-hover:translate-y-1 transition-transform duration-300" />
          </button>
      </div>
    </section>
  );
};

// Benefits Section with Scroll Animations
const BenefitsSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);
  
  const benefits = [
    {
      icon: Clock,
      title: "Continuous Code Review",
      description: "Automated analysis on every commit and pull request",
      content: "Get instant feedback as you code. CodeCrow analyzes changes in real-time, ensuring quality standards are maintained throughout development.",
      color: "primary",
    },
    {
      icon: GitBranch,
      title: "Same PR Workflow",
      description: "Analysis posted directly in your pull requests",
      content: "No context switching. Review AI-generated insights right where you're already working—in your Bitbucket pull requests.",
      color: "accent",
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Catch vulnerabilities before they reach production",
      content: "Identify security issues, code smells, and potential bugs early in the development cycle, reducing costly fixes later.",
      color: "success",
    },
    {
      icon: Zap,
      title: "Instant Fix Suggestions",
      description: "AI-powered remediation with code patches",
      content: "Don't just identify problems—get specific, actionable solutions with ready-to-apply code changes that fix the issues.",
      color: "primary",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Shared insights across your development team",
      content: "Centralized dashboard for tracking code quality trends, managing issues, and collaborating on improvements.",
      color: "accent",
    },
    {
      icon: BarChart,
      title: "Quality Metrics",
      description: "Track code quality improvement over time",
      content: "Visualize your team's progress with detailed analytics on code quality, issue resolution, and development patterns.",
      color: "success",
    },
  ];
  
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <Badge className="mb-6 bg-success/20 text-success border-success/30 animate-fade-in">
          💎 Key Benefits
        </Badge>
        <h3 className="text-4xl font-bold mb-4 animate-fade-in">Why Teams Choose CodeCrow</h3>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-fade-in">
          Continuous code review that adapts to your workflow
        </p>
      </div>

      <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <Card 
              key={index}
              className={`border-2 border-${benefit.color}/20 bg-gradient-to-br from-card to-${benefit.color}/5 hover:shadow-xl hover:shadow-${benefit.color}/10 transition-all duration-500 hover-scale ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className={`h-12 w-12 rounded-lg bg-${benefit.color}/20 flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 text-${benefit.color}`} />
                </div>
                <CardTitle>{benefit.title}</CardTitle>
                <CardDescription>{benefit.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {benefit.content}
                </p>
              </CardContent>
            </Card>
          );
        })}
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
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Header */}
      <header className={`bg-none fixed top-0 left-0 right-0 backdrop-blur-sm z-50 transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="h-8 w-8 text-primary" />
              <h1 className="md:block hidden text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CodeCrow
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Button variant="default" onClick={handleDashboard}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleLogin}>Login</Button>
                  <Button variant="gradient" onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section with Parallax */}
      <HeroSection 
        handleGetStarted={handleGetStarted}
        handleDocs={handleDocs}
      />

      {/* How It Works Section with Flowchart */}
      <section id="how-it-works" className="bg-gradient-to-b from-background to-primary/5 overflow-hidden">
        <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 animate-fade-in">
            🚀 Seamless Integration
          </Badge>
          <h3 className="text-4xl font-bold mb-4 animate-fade-in">How CodeCrow Works</h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-fade-in">
            Automated code analysis that integrates directly into your development workflow
          </p>
        </div>

        {/* Process Flowchart */}
        <div className="mb-20">
          <ProcessFlowchart />
        </div>

        <div className="space-y-16 max-w-6xl mx-auto">
          {/* Step 1: VCS Integration */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                Step 1: Automatic Analysis
              </Badge>
              <h4 className="text-3xl font-bold mb-4">
                Predictable Reports on Your VCS Platform
              </h4>
              <p className="text-muted-foreground text-lg mb-6">
                CodeCrow automatically analyzes every pull request and posts detailed reports 
                directly in your Bitbucket pull requests.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Comprehensive Summary</p>
                    <p className="text-sm text-muted-foreground">
                      Get an overview of all issues with severity levels and counts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-warning mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Issues Overview Table</p>
                    <p className="text-sm text-muted-foreground">
                      Clear categorization of high, medium, and low severity issues
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileSearch className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Detailed Issue List</p>
                    <p className="text-sm text-muted-foreground">
                      Each issue includes file path, line number, and initial fix suggestions
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Card className="p-4 bg-muted/50 border-2 overflow-hidden hover:shadow-xl transition-all duration-300 hover-scale">
                <img 
                  src={demoVcsReport} 
                  alt="VCS Platform Report showing analysis results with issue summary and severity breakdown" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </Card>
            </div>
          </div>

          {/* Step 2: Detailed Analysis */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Card className="p-4 bg-muted/50 border-2 overflow-hidden hover:shadow-xl transition-all duration-300 hover-scale">
                <img 
                  src={demoDetailedInfo} 
                  alt="Detailed issue analysis showing security vulnerability with code diff and fix suggestions" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </Card>
            </div>
            <div>
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
                Step 2: Deep Dive
              </Badge>
              <h4 className="text-3xl font-bold mb-4">
                Detailed Information with Fix Suggestions
              </h4>
              <p className="text-muted-foreground text-lg mb-6">
                Click through to your CodeCrow dashboard for in-depth analysis, complete with 
                code snippets, patches, and step-by-step remediation guidance.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileCode className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Complete Context</p>
                    <p className="text-sm text-muted-foreground">
                      Full issue description with affected files and line numbers
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Code Diff Patches</p>
                    <p className="text-sm text-muted-foreground">
                      Ready-to-apply code changes with before/after comparisons
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Actionable Guidance</p>
                    <p className="text-sm text-muted-foreground">
                      Clear explanations and best practices to prevent similar issues
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Benefits Section with Scroll Animations */}
      <BenefitsSection />

      {/* Integration Features Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">Powerful Integrations</h3>
          <p className="text-muted-foreground text-lg">
            Everything you need to supercharge your code review workflow
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover-scale">
            <CardHeader>
              <GitBranch className="h-12 w-12 text-primary mb-4" />
              <CardTitle>VCS Integration</CardTitle>
              <CardDescription>
                Seamlessly connect with your code hosting platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Bitbucket, GitHub, GitLab
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Auto-sync repositories
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  PR/MR automation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 hover-scale">
            <CardHeader>
              <Shield className="h-12 w-12 text-accent mb-4" />
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Intelligent code review with machine learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Security vulnerability detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Code quality insights
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Performance optimization
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-success/50 hover:shadow-lg hover:shadow-success/10 transition-all duration-300 hover-scale">
            <CardHeader>
              <Users className="h-12 w-12 text-success mb-4" />
              <CardTitle>Team Dashboard</CardTitle>
              <CardDescription>
                Centralized project and team management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Real-time collaboration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Issue tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Analytics & reporting
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="border-border bg-gradient-to-br from-card via-card to-primary/5 hover:shadow-2xl transition-all duration-500">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
            <h3 className="text-3xl font-bold mb-4">Join Our Alpha Testing</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Be among the first to experience the future of AI-powered code reviews. 
              We're currently in alpha testing and looking for developers to help shape CodeCrow.
              Join now and get early access to all premium features.
            </p>
            <Button size="lg" variant="gradient" className="text-lg px-8 hover-scale" onClick={handleGetStarted}>
              <Star className="mr-2 h-5 w-5" />
              Join Alpha Testing
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Code className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">CodeCrow</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 CodeCrow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
