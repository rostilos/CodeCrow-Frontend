import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DocNavigationProps {
    prev?: { title: string; url: string };
    next?: { title: string; url: string };
}

export function DocNavigation({ prev, next }: DocNavigationProps) {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-between gap-4 mt-12 pt-8 border-t">
            {prev ? (
                <Button
                    variant="outline"
                    className="flex flex-col items-start h-auto py-3 px-6 gap-1 group"
                    onClick={() => navigate(prev.url)}
                >
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                        <ChevronLeft className="h-3 w-3" />
                        Previous
                    </span>
                    <span className="font-bold text-sm">{prev.title}</span>
                </Button>
            ) : (
                <div />
            )}

            {next ? (
                <Button
                    variant="outline"
                    className="flex flex-col items-end h-auto py-3 px-6 gap-1 group ml-auto"
                    onClick={() => navigate(next.url)}
                >
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                        Next
                        <ChevronRight className="h-3 w-3" />
                    </span>
                    <span className="font-bold text-sm">{next.title}</span>
                </Button>
            ) : (
                <div />
            )}
        </div>
    );
}
