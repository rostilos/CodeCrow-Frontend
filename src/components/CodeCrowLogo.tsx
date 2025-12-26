import { cn } from "@/lib/utils";

interface CodeCrowLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  festive?: boolean;
}

export function CodeCrowLogo({ className, size = "md", showText = true, festive = false }: CodeCrowLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-14 w-14",
  };

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative z-10">
        <img
          src="/logo.png"
          alt="CodeCrow"
          className={cn(sizeClasses[size], "shrink-0 object-contain")}
        />
        {/* Santa Hat */}
        {festive && (
          <div className="absolute -top-1.5 -left-0.25 w-6 h-6 rotate-[-45deg] pointer-events-none -z-10">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 14C19 17.866 15.866 21 12 21C8.13401 21 5 17.866 5 14C5 10.134 11 3 12 3C13 3 19 10.134 19 14Z" fill="#ef4444" />
              <path d="M12 3C11.4477 3 11 3.44772 11 4C11 4.55228 11.4477 5 12 5C12.5523 5 13 4.55228 13 4C13 3.44772 12.5523 3 12 3Z" fill="white" />
              <path d="M5 14C5 13.4477 5.44772 13 6 13H18C18.5523 13 19 13.4477 19 14V14.5C19 15.3284 18.3284 16 17.5 16H6.5C5.67157 16 5 15.3284 5 14.5V14Z" fill="white" />
            </svg>
          </div>
        )}
      </div>

      {showText && (
        <span className={cn("font-bold tracking-tight", textSizeClasses[size])}>
          Code<span className="text-primary">Crow</span>
        </span>
      )}
    </div>
  );
}

export function CodeCrowIcon({ className, size = "md" }: Omit<CodeCrowLogoProps, "showText">) {
  return <CodeCrowLogo className={className} size={size} showText={false} />;
}
