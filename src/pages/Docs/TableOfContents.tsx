import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface TOCItem {
    id: string;
    text: string;
    level: number;
}

export function TableOfContents() {
    const [headings, setHeadings] = useState<TOCItem[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const { pathname } = useLocation();

    useEffect(() => {
        // Delay slightly to ensure DOM is rendered after route transition
        const timer = setTimeout(() => {
            const elements = Array.from(document.querySelectorAll("main h1, main h2, main h3"))
                .filter((element) => {
                    const htmlElement = element as HTMLElement;
                    // Filter out hidden elements or explicit no-toc
                    return htmlElement.offsetParent !== null && !htmlElement.classList.contains("no-toc");
                })
                .map((element) => {
                    if (!element.id) {
                        // Create an ID if it doesn't exist
                        element.id = element.textContent
                            ?.toLowerCase()
                            .trim()
                            .replace(/\s+/g, "-")
                            .replace(/[^\w-]/g, "") || "id-" + Math.random().toString(36).substr(2, 5);
                    }

                    // Extract text, excluding children with 'no-toc-text' class
                    const clone = element.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll(".no-toc-text").forEach(el => el.remove());
                    const cleanText = clone.textContent?.trim() || "";

                    return {
                        id: element.id,
                        text: cleanText,
                        level: parseInt(element.tagName.substring(1)),
                    };
                });

            setHeadings(elements);

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setActiveId(entry.target.id);
                        }
                    });
                },
                { rootMargin: "0px 0px -80% 0px" }
            );

            elements.forEach((item) => {
                const element = document.getElementById(item.id);
                if (element) observer.observe(element);
            });

            return () => observer.disconnect();
        }, 100);

        return () => clearTimeout(timer);
    }, [pathname]);

    if (headings.length === 0) return null;

    return (
        <div className="hidden xl:block w-64 shrink-0 pr-4 mt-8 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-auto scrollbar-hide">
            <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-3">
                    On this page
                </h4>
                <nav className="space-y-1">
                    {headings.map((heading) => (
                        <a
                            key={heading.id}
                            href={`#${heading.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(heading.id)?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                });
                                setActiveId(heading.id);
                            }}
                            className={cn(
                                "block py-1.5 px-3 text-sm rounded-md transition-all duration-200 border-l-2",
                                activeId === heading.id
                                    ? "border-primary bg-primary/5 text-primary font-medium"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                heading.level === 3 && "ml-4 text-xs",
                                heading.level === 2 && "ml-2",
                                heading.level === 1 && "font-bold text-sm"
                            )}
                        >
                            {heading.text}
                        </a>
                    ))}
                </nav>
            </div>
        </div>
    );
}
