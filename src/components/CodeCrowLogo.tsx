import { cn } from "@/lib/utils";

interface CodeCrowLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export function CodeCrowLogo({ className, size = "md", showText = true }: CodeCrowLogoProps) {
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
      <img 
        src="/logo.png" 
        alt="CodeCrow" 
        className={cn(sizeClasses[size], "shrink-0 object-contain")}
      />
      
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
