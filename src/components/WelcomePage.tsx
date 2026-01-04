import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
    ArrowRight, BookOpen, LayoutDashboard, Github, Key, Eye,
    ChevronDown, Play, Zap, GitBranch, Cpu, DollarSign, Check,
    ChevronRight, Settings, Workflow, Database, RefreshCw, TrendingUp, CheckCircle
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { authUtils } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProcessFlowchart } from "./ProcessFlowchart";
import { SnowEffect } from "./SnowEffect";
import { BulbGarland } from "./BulbGarland";

import demoAnalysisDashboard from "@/assets/demo-analysis-dashboard.png";
import demoDetailedInfo from "@/assets/demo-detailed-info.png";
import demoProjectOverview from "@/assets/demo-project-overview.png";
import demoRagContext from "@/assets/demo-rag-context.png";
import demoVcsReportBb from "@/assets/home-features-cards/demo-vcs-report-bb.png";
import demoVcsReportGh from "@/assets/home-features-cards/demo-vcs-report-gh.png";
import demoInteractiveAgentBb from "@/assets/home-features-cards/demo-interactive-agent-bb.png";
import demoInteractiveAgentGh from "@/assets/home-features-cards/demo-interactive-agent-gh.png";
import demoInteractiveAgentGh2 from "@/assets/home-features-cards/demo-interactive-agent-gh-2.png";
import demoDetailedInfoOnVcsBb from "@/assets/home-features-cards/detailed-info-on-vcs-bb.png";
import demoDetailedInfoOnVcsGh from "@/assets/home-features-cards/detailed-info-on-vcs-gh.png";

import demoEasySetup from "@/assets/demo-easy-setup.mp4";

interface FeatureSlide {
    mediaType: 'video' | 'screenshot';
    videoSrc?: string;
    imageSrc?: string;
}

interface FeatureCard {
    title: string;
    description: string;
    slides: FeatureSlide[];
}

// Zoomable Image Component
const ZoomableImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden cursor-zoom-in ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
        >
            <img
                src={src}
                alt={alt}
                className={`object-contain w-full h-full bg-white object-right transition-transform duration-200 ease-out origin-center`}
                style={{
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                    transform: isHovered ? 'scale(2)' : 'scale(1)',
                }}
            />
        </div>
    );
};

const features: FeatureCard[] = [
    {
        title: "Web Platform for Teams",
        description: "Centralized dashboard for your entire team. Manage analysis, review reports, track historical data, and collaborate on code quality improvements together.",
        slides: [
            {
                mediaType: "screenshot",
                imageSrc: demoProjectOverview,
            }
        ]
    },
    {
        title: "Interactive AI Agent",
        description: "Chat with CodeCrow's AI agent directly in your pull requests. Ask for clarification on analysis points, get detailed explanations of issues, or request specific suggestions on how to fix identified problems.",
        slides: [
            {
                mediaType: "screenshot",
                imageSrc: demoInteractiveAgentBb,
            },
            {
                mediaType: "screenshot",
                imageSrc: demoInteractiveAgentGh
            },
            {
                mediaType: "screenshot",
                imageSrc: demoInteractiveAgentGh2
            }
        ]
    },
    {
        title: "Detailed info right on your VCS platform",
        description: "Experience inline issues and analysis directly within your familiar VCS interface. No context switching needed.",
        slides: [
            {
                mediaType: "screenshot",
                imageSrc: demoDetailedInfoOnVcsBb
            },
            {
                mediaType: "screenshot",
                imageSrc: demoDetailedInfoOnVcsGh
            }
        ]
    },
    {
        title: "Predictable and Concise Reports",
        description: "Get clear, actionable insights without the noise. Every issue is categorized, prioritized, and explained with suggested fixes that actually make sense.",
        slides: [
            {
                mediaType: "screenshot",
                imageSrc: demoVcsReportBb,
            },
            {
                mediaType: "screenshot",
                imageSrc: demoVcsReportGh,
            }
        ]
    },
    {
        title: "Project-Aware Context, RAG Pipeline",
        description: "Our intelligent RAG pipeline understands your entire codebase. Only changed files are reprocessed — reducing API costs by up to 80% while maintaining full project context.",
        slides: [
            {
                mediaType: "screenshot",
                imageSrc: demoRagContext,
            }
        ]
    },
    {
        title: "Smart Cumulative Branch Analysis",
        description: "Track code quality across branches with incremental analysis. See historical trends, identify patterns, and watch your code quality improve over time.",
        slides: [
            {
                mediaType: "screenshot",
                imageSrc: demoAnalysisDashboard,
            }
        ]
    },
    {
        title: "Easy Setup",
        description: "Connect your repository in minutes. Automatic webhook and pipeline configuration with no complex setup required. Just install and start reviewing.",
        slides: [
            {
                mediaType: "video",
                videoSrc: demoEasySetup,
            }
        ]
    }
];

const CARD_HEADER_HEIGHT = 48; // px - base height of card header
const CARD_CONTENT_HEIGHT = 400; // px - height of expanded content

// Stacked Cards Component - inactive headers stack above with distance effect
const StackedCards = ({
    activeIndex,
    onCardSelect,
    onHoverChange,
}: {
    activeIndex: number;
    onCardSelect: (index: number) => void;
    onHoverChange?: (isHovered: boolean) => void;
}) => {
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    // Reset slide index and auto-play when active card changes
    useEffect(() => {
        setActiveSlideIndex(0);
        setIsAutoPlay(true);
    }, [activeIndex]);

    // Handle hover changes to notify parent
    useEffect(() => {
        onHoverChange?.(isHovered);
    }, [isHovered, onHoverChange]);

    // Auto-play effect
    useEffect(() => {
        // Pause if manually stopped (isAutoPlay=false) or if user is hovering (isHovered=true)
        if (!isAutoPlay || isHovered) return;

        const currentFeature = features[activeIndex];
        // SAFETY CHECK: Ensure we have a valid feature before accessing slides
        if (!currentFeature || !currentFeature.slides || currentFeature.slides.length <= 1) return;

        const interval = setInterval(() => {
            setActiveSlideIndex((prev) => (prev + 1) % currentFeature.slides.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [activeIndex, isAutoPlay, isHovered]);

    // Calculate positions considering scaled headers
    const getScaledHeaderHeight = (distanceFromBottom: number) => {
        const scale = 1 - distanceFromBottom * 0.06;
        return CARD_HEADER_HEIGHT * scale;
    };

    // Total height calculation
    const inactiveCount = features.length - 1;
    let totalInactiveHeight = 0;
    for (let i = 0; i < inactiveCount; i++) {
        totalInactiveHeight += getScaledHeaderHeight(inactiveCount - 1 - i);
    }
    const totalHeight = totalInactiveHeight + CARD_HEADER_HEIGHT + CARD_CONTENT_HEIGHT;

    return (
        <div
            className="relative w-full"
            style={{ height: `${totalHeight}px` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {features.map((feature, index) => {
                const isActive = activeIndex === index;
                // Use active slide for active card, default to first for others
                // SAFETY: Check bounds because activeSlideIndex might be stale from previous card before useEffect reset runs
                const safeSlideIndex = (isActive && feature.slides && feature.slides[activeSlideIndex]) ? activeSlideIndex : 0;
                // Double safety: ensure feature exists and slides array exists and has content
                if (!feature || !feature.slides || feature.slides.length === 0) return null;

                const currentSlide = feature.slides[safeSlideIndex];
                if (!currentSlide) return null; // Should not happen with safeSlideIndex logic but safe guard

                // Calculate visual position in the stack (0 = bottom/active, higher = further up)
                let visualPosition: number;
                if (isActive) {
                    visualPosition = 0; // Active is at bottom
                } else if (index < activeIndex) {
                    visualPosition = activeIndex - index; // Distance from active
                } else {
                    visualPosition = index - activeIndex; // Distance from active
                }

                // Reorder inactive cards so they stack above
                let stackOrder: number;
                if (isActive) {
                    stackOrder = features.length - 1; // Bottom
                } else if (index < activeIndex) {
                    stackOrder = activeIndex - index - 1;
                } else {
                    stackOrder = features.length - 1 - (index - activeIndex);
                }

                // Distance from bottom (0 = active at bottom, higher = further up)
                const distanceFromBottom = isActive ? 0 : (features.length - 1 - stackOrder);

                // Scale: active = 1, others get progressively smaller
                const scale = isActive ? 1 : 1 - distanceFromBottom * 0.06;
                const opacity = isActive ? 1 : 0.7 + (1 - distanceFromBottom * 0.08);

                // Calculate top position
                let topPosition = 0;
                if (isActive) {
                    topPosition = totalHeight - CARD_HEADER_HEIGHT - CARD_CONTENT_HEIGHT;
                } else {
                    // Stack above active, with cumulative scaled heights
                    for (let i = 0; i < stackOrder; i++) {
                        const dist = features.length - 2 - i;
                        topPosition += getScaledHeaderHeight(dist);
                    }
                }

                return (
                    <div
                        key={index}
                        onClick={() => onCardSelect(index)}
                        className="absolute left-0 right-0 cursor-pointer transition-all duration-500 ease-out origin-bottom"
                        style={{
                            top: `${topPosition}px`,
                            zIndex: isActive ? 50 : 10 + stackOrder,
                            transform: `scale(${scale})`,
                            opacity: Math.min(1, opacity),
                        }}
                    >
                        <div
                            className={`
                overflow-hidden rounded-2xl border bg-card
                transition-all duration-500 ease-out
                ${isActive
                                    ? 'shadow-2xl shadow-primary/20 border-primary/50'
                                    : 'shadow-md border-border/50 hover:border-primary/30'
                                }
              `}
                        >
                            {/* Card Header */}
                            <div
                                className={`
                  flex items-center gap-4 px-5 transition-colors duration-300
                  ${isActive ? 'bg-primary/5' : 'bg-card hover:bg-muted/50'}
                `}
                                style={{ height: `${CARD_HEADER_HEIGHT}px` }}
                            >
                                <h3 className={`
                  font-semibold transition-all duration-300
                  ${isActive ? 'text-primary text-lg' : 'text-foreground text-base'}
                `}>
                                    {feature.title}
                                </h3>
                                <div className="flex-1" />
                                <ChevronDown className={`
                  h-5 w-5 text-muted-foreground transition-transform duration-300
                  ${isActive ? 'rotate-180' : ''}
                `} />
                            </div>

                            {/* Card Content - Only visible when active */}
                            <div
                                className={`
                  transition-all duration-500 ease-out overflow-hidden
                  ${isActive ? 'opacity-100' : 'max-h-0 opacity-0'}
                `}
                                style={{ height: isActive ? `${CARD_CONTENT_HEIGHT}px` : 0 }}
                            >
                                <div className="flex flex-col lg:flex-row h-full">
                                    {/* Text Side */}
                                    <div className={`flex-1 ${currentSlide.mediaType === 'video' ? 'lg:w-2/6' : 'lg:w-2/5'} p-6 flex flex-col justify-center border-t border-border/20 grow-0 lg:grow`}>
                                        <p className="text-muted-foreground text-base leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>

                                    {/* Media Side */}
                                    <div className={`flex-1 ${currentSlide.mediaType === 'video' ? 'lg:w-4/6' : 'lg:w-3/5'} relative bg-muted/10 border-t lg:border-t-0 lg:border-l border-border/20 overflow-hidden group`}>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {currentSlide.mediaType === 'video' && currentSlide.videoSrc ? (
                                                <video
                                                    poster={demoAnalysisDashboard}
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    preload="none"
                                                    className="w-full h-full object-cover"
                                                >
                                                    <source src={currentSlide.videoSrc} type="video/mp4" />
                                                </video>
                                            ) : currentSlide.imageSrc ? (
                                                <ZoomableImage
                                                    src={currentSlide.imageSrc}
                                                    alt={feature.title}
                                                    className="w-full h-full"
                                                />
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-muted/30 flex items-center justify-center border border-border/20">
                                                        {currentSlide.mediaType === 'video' ? (
                                                            <Play className="w-8 h-8 text-muted-foreground" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded bg-muted-foreground/20" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {currentSlide.mediaType === 'video' ? 'Video placeholder' : 'Screenshot placeholder'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pagination Bullets - Only if multiple slides */}
                                        {isActive && feature.slides.length > 1 && (
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/10 z-10 transition-opacity duration-300">
                                                {feature.slides.map((_, slideIndex) => (
                                                    <button
                                                        key={slideIndex}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent card selection logic
                                                            setActiveSlideIndex(slideIndex);
                                                            setIsAutoPlay(false); // Stop auto-play on interaction
                                                        }}
                                                        className={`
                              h-2.5 rounded-full transition-all duration-300 relative overflow-hidden
                              ${slideIndex === activeSlideIndex
                                                                ? 'w-8 bg-muted-foreground/30'
                                                                : 'w-2.5 bg-muted-foreground/50 hover:bg-primary/50'
                                                            }
                            `}
                                                        aria-label={`Go to slide ${slideIndex + 1}`}
                                                    >
                                                        {slideIndex === activeSlideIndex && (
                                                            <div
                                                                className={`absolute inset-0 bg-primary ${isAutoPlay ? 'animate-progress origin-left' : 'w-full'}`}
                                                            />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Optional: Slide counter for clarity if requested */}
                                        {isActive && feature.slides.length > 1 && (
                                            <div className="absolute top-4 right-4 px-2 py-1 rounded-md bg-background/60 backdrop-blur-sm text-xs font-medium text-muted-foreground border border-border/10">
                                                {activeSlideIndex + 1} / {feature.slides.length}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Hero Section with cards starting at bottom
const HeroSection = ({
    handleGetStarted,
    handleDocs,
    activeTab,
    onTabChange,
    onHoverChange
}: {
    handleGetStarted: () => void;
    handleDocs: () => void;
    activeTab: number;
    onTabChange: (index: number) => void;
    onHoverChange?: (isHovered: boolean) => void;
}) => {
    return (
        <section className="relative overflow-hidden">
            <SnowEffect count={40} fallDistance="800px" />
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px'
                    }}
                />
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-accent/8 rounded-full blur-[100px]" />
            </div>

            {/* Main content */}
            <div className="relative z-10 pt-32 pb-12">
                <div className="container px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center mb-8">
                        {/* Badges */}
                        <div className="flex flex-wrap justify-center gap-3 mb-8">
                            <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-success/30 text-success bg-success/5">
                                <div className="h-2 w-2 rounded-full bg-success animate-pulse mr-2" />
                                Alpha Testing
                            </Badge>
                            <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                                <Key className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                BYOK
                            </Badge>
                            <Badge variant="outline" className="px-4 py-2 text-sm">
                                <Github className="h-3.5 w-3.5 mr-1.5" />
                                Open Source
                            </Badge>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            <span className="block text-foreground">AI-Powered</span>
                            <span className="block mt-1">
                                <span className="relative inline-block">
                                    <span className="relative z-10 text-primary">Code Review</span>
                                    <svg
                                        className="absolute -bottom-1 left-0 w-full h-3 text-primary/20"
                                        viewBox="0 0 200 12"
                                        preserveAspectRatio="none"
                                    >
                                        <path
                                            d="M0,8 Q50,0 100,8 T200,8"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </span>
                            </span>
                            <span className="block text-foreground mt-1">Platform</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                            Bring Your Own Key. Choose any LLM. Get intelligent code analysis with{' '}
                            <span className="text-foreground font-medium">full project context</span>{' '}
                            using RAG technology.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
                            <Button
                                size="lg"
                                onClick={handleGetStarted}
                                className="min-w-[180px] h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                Start Free Alpha
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleDocs}
                                className="min-w-[180px] h-12 text-base hover:-translate-y-0.5 transition-transform duration-300"
                            >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Documentation
                            </Button>
                        </div>

                        {/* Trust indicators */}
                        <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
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
                        </div>
                    </div>

                    {/* Stacked Cards - starts here in viewport */}
                    <div className="max-w-4xl mx-auto">
                        <StackedCards
                            activeIndex={activeTab}
                            onCardSelect={onTabChange}
                            onHoverChange={onHoverChange}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};


// Works Where You Code Section
const WorksWhereYouCodeSection = () => {
    const integrations = [
        {
            name: "Bitbucket Cloud",
            icon: "bitbucket",
            status: "Available",
            description: "Full OAuth2 integration with automatic pipeline configuration. Works with Bitbucket Pipelines out of the box.",
            available: true
        },
        {
            name: "GitHub",
            icon: "github",
            status: "Available",
            description: "GitHub App integration with Actions support. Automatic PR comments and status checks.",
            available: true
        },
        {
            name: "GitLab",
            icon: "gitlab",
            status: "Available",
            description: "Full OAuth2 integration with GitLab CI/CD. Automatic MR comments, webhooks, and pipeline triggers.",
            available: true
        },
    ];

    return (
        <section className="py-12 lg:py-32 relative overflow-hidden">
            {/* Primary gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />

            <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                            <Workflow className="h-3.5 w-3.5 mr-1.5" />
                            Seamless Integrations
                        </Badge>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                            Works Where <span className="text-primary">You Code</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Seamless integration with your existing CI/CD workflow. No context switching, no extra tools — just better code reviews.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                        {integrations.map((integration) => (
                            <div
                                key={integration.name}
                                className={`
                  group relative p-6 lg:p-8 rounded-2xl border bg-card
                  transition-all duration-300 hover:-translate-y-1 flex-col flex
                  ${integration.available
                                        ? 'border-primary/30 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:border-primary/50'
                                        : 'border-border/50 hover:border-primary/30'
                                    }
                `}
                            >
                                {integration.available && (
                                    <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                                )}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden
                    ${integration.available ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}
                  `}>
                                        {integration.icon === 'bitbucket' && (
                                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                                                <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
                                            </svg>
                                        )}
                                        {integration.icon === 'github' && (
                                            <Github className="h-6 w-6" />
                                        )}
                                        {integration.icon === 'gitlab' && (
                                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                                                <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.386 9.45.044 13.587a.924.924 0 00.331 1.023L12 23.054l11.625-8.443a.92.92 0 00.33-1.024" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{integration.name}</h3>
                                        <Badge
                                            variant={integration.available ? "default" : "secondary"}
                                            className={integration.available ? "bg-primary hover:bg-primary/90" : ""}
                                        >
                                            {integration.status}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-muted-foreground leading-relaxed grow">{integration.description}</p>

                                {integration.available && (
                                    <div className="mt-4 pt-4 border-t border-primary/20">
                                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                            <Check className="h-4 w-4" />
                                            Ready to use
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// AI Providers Section
const AIProvidersSection = () => {
    const providers = [
        {
            name: "OpenRouter",
            icon: "openrouter",
            description: "Access 100+ models through a single API. Pay-per-token pricing with automatic fallbacks.",
            highlight: true
        },
        {
            name: "Anthropic",
            icon: "anthropic",
            description: "Claude models optimized for code understanding and analysis.",
            highlight: false
        },
        {
            name: "OpenAI",
            icon: "openai",
            description: "GPT-4 and latest models for comprehensive code review.",
            highlight: false
        },
        {
            name: "Google",
            icon: "google",
            description: "Gemini models with excellent context windows for large codebases.",
            highlight: false
        },
    ];

    return (
        <section className="py-12 lg:py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
            
            <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                            <Cpu className="h-3.5 w-3.5 mr-1.5" />
                            BYOK - Bring Your Own Key
                        </Badge>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                            Choose Your <span className="text-primary">AI Provider</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Use your own API keys with full control over costs and model selection. No vendor lock-in.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {providers.map((provider) => (
                            <div
                                key={provider.name}
                                className={`
                                    group relative p-5 rounded-xl border bg-card
                                    transition-all duration-300 hover:-translate-y-1
                                    ${provider.highlight 
                                        ? 'border-primary/40 shadow-lg shadow-primary/10' 
                                        : 'border-border/50 hover:border-primary/30'
                                    }
                                `}
                            >
                                {provider.highlight && (
                                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                                        Recommended
                                    </Badge>
                                )}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center
                                        ${provider.highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}
                                    `}>
                                        {provider.icon === 'openrouter' && (
                                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        )}
                                        {provider.icon === 'anthropic' && (
                                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                                <path d="M17.604 3.332L12 20.668l-5.604-17.336h3.168L12 12.611l2.436-9.279h3.168zM6.396 3.332L12 20.668 6.396 3.332z"/>
                                            </svg>
                                        )}
                                        {provider.icon === 'openai' && (
                                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                                            </svg>
                                        )}
                                        {provider.icon === 'google' && (
                                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                            </svg>
                                        )}
                                    </div>
                                    <h3 className="font-bold">{provider.name}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{provider.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            <Key className="h-4 w-4 inline mr-1.5" />
                            Your API keys are stored securely and never shared. You maintain full control over your AI usage and costs.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

// FAQ Section
const FAQSection = () => {
    const faqs = [
        {
            question: "What is CodeCrow?",
            answer: "CodeCrow is an AI-powered code review platform that integrates with your repositories to automatically analyze code changes, identify issues, and provide actionable feedback on pull requests."
        },
        {
            question: "Do I need my own API key?",
            answer: "Yes, CodeCrow uses a BYOK (Bring Your Own Key) model. You provide your own API key from supported providers like OpenRouter, Anthropic, OpenAI, or Google, giving you full control over costs and model selection."
        },
        {
            question: "Which version control systems are supported?",
            answer: "CodeCrow supports Bitbucket Cloud, GitHub, and GitLab. All three platforms have full OAuth integration with automatic webhook setup and PR/MR analysis."
        },
        {
            question: "How does the RAG pipeline work?",
            answer: "Our RAG (Retrieval-Augmented Generation) pipeline indexes your codebase and only reprocesses changed files. This provides full project context while reducing API costs by up to 80%."
        },
        {
            question: "Is CodeCrow open source?",
            answer: "Yes! CodeCrow is fully open source under the MIT license. You can self-host it, contribute to development, or customize it for your needs."
        }
    ];

    return (
        <section className="py-12 relative">
            <div className="container px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                            FAQ
                        </Badge>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                            Frequently Asked <span className="text-primary">Questions</span>
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Everything you need to know about CodeCrow
                        </p>
                    </div>

                    <Accordion type="single" collapsible className="w-full space-y-3">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`faq-${index}`}
                                className="border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/30 data-[state=open]:bg-primary/5 transition-colors"
                            >
                                <AccordionTrigger className="text-left hover:text-primary py-5">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground pb-5">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
};

// Setup Once Section
const SetupOnceSection = ({ handleGetStarted }: { handleGetStarted: () => void }) => {
    const steps = [
        { step: "1", title: "Connect Repository", description: "Link your Bitbucket account with secure OAuth2 authentication", icon: GitBranch },
        { step: "2", title: "Add AI Key", description: "Configure your OpenRouter API credentials in the dashboard", icon: Key },
        { step: "3", title: "Configure Pipeline", description: "Add CodeCrow to your CI/CD workflow with one command", icon: Workflow },
    ];

    return (
        <section className="py-12 relative overflow-hidden">
            <div className="text-center mb-20">
                <Badge variant="secondary" className="mb-4 px-4 py-1.5">
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    Simple & Powerful
                </Badge>
                <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                    Setup Once, Review Forever
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Six steps from PR to production. Our intelligent pipeline handles the complexity —
                    you focus on shipping quality code.
                </p>
            </div>
            <ProcessFlowchart />
        </section>
    );
};

// Intelligent Context Section
const IntelligentContextSection = () => {
    const benefits = [
        { icon: Cpu, title: "Smart Caching", description: "Only changed files are reprocessed, dramatically reducing API costs per review" },
        { icon: DollarSign, title: "Up to 80% Savings", description: "Significant reduction in LLM API usage compared to full-file analysis" },
        { icon: Check, title: "Full Context", description: "Maintains complete project understanding without re-indexing unchanged code" },
    ];

    return (
        <section className="py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/5 to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

            <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
                    <div className="space-y-8">
                        <div>
                            <Badge variant="secondary" className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
                                <Database className="h-3.5 w-3.5 mr-1.5" />
                                Smart RAG Pipeline
                            </Badge>
                            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                                Intelligent Context, <br />
                                <span className="text-primary">
                                    Minimal Cost
                                </span>
                            </h2>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                Our Retrieval-Augmented Generation pipeline understands your entire codebase while processing only what's changed — dramatically reducing API costs and analysis time.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                                    <RefreshCw className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-1">Incremental Reindexing</h4>
                                    <p className="text-muted-foreground">Only changed files are reprocessed. On typical PRs, this means 80-95% of your codebase is cached and ready.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                                    <Database className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-1">Full Context Awareness</h4>
                                    <p className="text-muted-foreground">The AI understands your project structure, dependencies, and coding patterns — even files not in the current PR.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                                    <TrendingUp className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-1">Historical Intelligence</h4>
                                    <p className="text-muted-foreground">Track analysis history and code quality trends. See improvements over time and identify recurring patterns.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-3xl" />
                        <Card className="relative border-2 border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between pb-4 border-b border-border/50">
                                        <span className="text-sm font-medium text-muted-foreground">Analysis Comparison</span>
                                        <Badge variant="outline" className="text-xs">Per PR Review</Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Without RAG Pipeline</span>
                                                <span className="text-sm font-semibold text-red-500">~100% files processed</span>
                                            </div>
                                            <div className="h-3 bg-red-500/20 rounded-full overflow-hidden">
                                                <div className="h-full w-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">With Smart RAG</span>
                                                <span className="text-sm font-semibold text-green-500">~15-25% files processed</span>
                                            </div>
                                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full w-1/5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                        <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                                            <div className="text-3xl font-bold text-primary">80%</div>
                                            <div className="text-xs text-muted-foreground mt-1">Cost Reduction</div>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                                            <div className="text-3xl font-bold text-primary">5x</div>
                                            <div className="text-xs text-muted-foreground mt-1">Faster Analysis</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                        <span>Same quality, fraction of the cost</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
};

// CTA Section
const CTASection = ({ handleGetStarted }: { handleGetStarted: () => void }) => {
    return (
        <section className="py-12 relative overflow-hidden">
            {/* Primary gradient background */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />

            <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                        Ready to improve your <span className="text-primary">code reviews</span>?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10">
                        Join the alpha and start getting AI-powered insights on your codebase today.
                    </p>
                    <Button
                        size="lg"
                        onClick={handleGetStarted}
                        className="h-14 px-10 text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:-translate-y-1"
                    >
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        </section>
    );
};

// Footer
const Footer = () => {
    return (
        <footer className="border-t border-border/40 py-12">
            <div className="container px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <CodeCrowLogo size="sm" />
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} CodeCrow. Open source under MIT License.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default function WelcomePage() {
    const navigate = useNavigate();
    const isAuthenticated = authUtils.isAuthenticated();
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [activeTab, setActiveTab] = useState(0);
    const [isTabAutoPlay, setIsTabAutoPlay] = useState(true);
    const [isInteractionPaused, setIsInteractionPaused] = useState(false);
    const cardsRef = useRef<HTMLDivElement>(null);

    // Tab Auto-Play Effect
    useEffect(() => {
        // Pause if auto-play is disabled or user is interacting (hovering)
        if (!isTabAutoPlay || isInteractionPaused) return;

        const interval = setInterval(() => {
            setActiveTab((prev) => (prev + 1) % features.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [isTabAutoPlay, isInteractionPaused]);

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

    const handleLogin = () => navigate("/login");
    const handleGetStarted = () => navigate("/register");
    const handleDashboard = () => navigate("/workspace");
    const handleDocs = () => navigate("/docs");

    const scrollToCards = () => {
        cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleTabChange = (index: number) => {
        setActiveTab(index);
        setIsTabAutoPlay(false); // Stop auto-play on manual interaction
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
        ${lastScrollY > 50 ? 'bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm' : ''}
      `}>
                <SnowEffect fallDistance="65px" />
                <BulbGarland />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <nav className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <CodeCrowLogo size="md" festive={true} />
                        </div>
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

            {/* Hero with integrated cards */}
            <HeroSection
                handleGetStarted={handleGetStarted}
                handleDocs={handleDocs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onHoverChange={setIsInteractionPaused}
            />

            {/* Works Where You Code */}
            <WorksWhereYouCodeSection />

            {/* AI Providers */}
            <AIProvidersSection />

            {/* Setup Once */}
            <SetupOnceSection handleGetStarted={handleGetStarted} />

            {/* Intelligent Context */}
            <IntelligentContextSection />

            {/* FAQ */}
            <FAQSection />

            {/* CTA */}
            <CTASection handleGetStarted={handleGetStarted} />

            {/* Footer */}
            <Footer />
        </div>
    );
}