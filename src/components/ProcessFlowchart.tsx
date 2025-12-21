import { GitPullRequest, FileCode, CheckCircle, MessageSquare, ArrowDown, RefreshCcw, Database, Zap, Brain } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-parallax";

const StepCard = ({ step, index, Icon, isVisible }: { step: any; index: number; Icon: any; isVisible: boolean }) => (
    <div className="relative z-10">
        <div
            className={`p-6 rounded-xl border-2 ${step.borderColor} ${step.bgColor} backdrop-blur-sm hover:scale-105 transition-all duration-500 shadow-lg ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
        >
            <div className="flex items-center gap-4">
                <div
                    className={`h-14 w-14 rounded-full ${step.bgColor} border-2 ${step.borderColor} flex items-center justify-center flex-shrink-0 shadow-md`}
                >
                    <Icon className={`h-7 w-7 ${step.color}`} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold mb-1 text-lg">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.detail && (
                        <p className="text-xs text-muted-foreground/70 mt-1 italic">{step.detail}</p>
                    )}
                </div>
            </div>

            <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-lg z-10">
                {index + 1}
            </div>
        </div>
    </div>
);

export const ProcessFlowchart = () => {
    const { ref, isVisible } = useScrollAnimation(0.15);

    const steps = [
        {
            icon: GitPullRequest,
            title: "Create PR",
            description: "Push code & create pull request",
            detail: "Automatic webhook triggers analysis",
            color: "text-primary",
            bgColor: "bg-primary/10",
            borderColor: "border-primary/30",
        },
        {
            icon: Database,
            title: "Smart Indexing",
            description: "RAG identifies changed files",
            detail: "Only new/modified files are processed",
            color: "text-violet-500",
            bgColor: "bg-violet-500/10",
            borderColor: "border-violet-500/30",
        },
        {
            icon: Brain,
            title: "Context Retrieval",
            description: "Full codebase context loaded",
            detail: "Cached context + fresh changes",
            color: "text-cyan-500",
            bgColor: "bg-cyan-500/10",
            borderColor: "border-cyan-500/30",
        },
        {
            icon: FileCode,
            title: "AI Analysis",
            description: "Deep code review with full context",
            detail: "BYOK: Use your preferred LLM",
            color: "text-accent",
            bgColor: "bg-accent/10",
            borderColor: "border-accent/30",
        },
        {
            icon: MessageSquare,
            title: "Report Posted",
            description: "Results in your PR comments",
            detail: "Actionable suggestions with code fixes",
            color: "text-warning",
            bgColor: "bg-warning/10",
            borderColor: "border-warning/30",
        },
        {
            icon: CheckCircle,
            title: "Fix & Deploy",
            description: "Apply suggestions & merge",
            detail: "Track improvements over time",
            color: "text-success",
            bgColor: "bg-success/10",
            borderColor: "border-success/30",
        },
    ];

    return (
        <div ref={ref} className="relative max-w-5xl mx-auto px-4 py-16">
            <div
                className={`hidden md:block absolute left-1/2 top-16 
                            bottom-16 w-0.5 bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/10 transform 
                            mt-[30px] mb-[11 0px]
                            -translate-x-1/2 transition-all duration-1000 ${
                    isVisible ? "scale-y-100" : "scale-y-0"
                }`}
                style={{ transformOrigin: 'top' }}
            />

            <div className="relative">
                {steps.map((step, index) => {
                    const Icon = step.icon as any;
                    const isLeft = index % 2 === 0;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={index}>
                            <div className="md:hidden">
                                <StepCard step={step} index={index} Icon={Icon} isVisible={isVisible} />
                                {!isLast && (
                                    <div className="flex justify-center my-6">
                                        <div
                                            className={`transition-all duration-700 ${
                                                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
                                            }`}
                                            style={{ transitionDelay: `${index * 120 + 100}ms` }}
                                        >
                                            <ArrowDown className="h-8 w-8 text-muted-foreground/40" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="hidden md:flex justify-center relative mb-6">
                                <div
                                    className={`absolute left-1/2 top-8 transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-700 ${
                                        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
                                    }`}
                                    style={{ transitionDelay: `${index * 120 + 50}ms` }}
                                >
                                    <div className={`w-5 h-5 rounded-full ${step.bgColor} border-2 ${step.borderColor} flex items-center justify-center shadow-lg`}>
                                        <div className={`w-2 h-2 rounded-full ${step.color.replace('text-', 'bg-')}`} />
                                    </div>
                                </div>

                                <div className={`w-1/2 relative ${isLeft ? 'pr-10' : 'pl-10'} ${isLeft ? 'mr-auto' : 'ml-auto'}`}>
                                    <div
                                        className={`w-[40px] absolute top-8 -translate-y-1/2 h-0.5 bg-muted-foreground/30 z-10 ${
                                            isLeft ? 'right-0' : 'left-0'
                                        } transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                                        style={{
                                            transitionDelay: `${index * 120 + 100}ms`,
                                            transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
                                            transformOrigin: isLeft ? 'right' : 'left',
                                        }}
                                    />
                                    <StepCard step={step} index={index} Icon={Icon} isVisible={isVisible} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};