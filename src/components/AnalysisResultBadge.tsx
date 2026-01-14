import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AnalysisResultType = 'PASSED' | 'FAILED' | 'SKIPPED' | null | undefined;

interface AnalysisResultBadgeProps {
  result: AnalysisResultType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

const resultConfig = {
  PASSED: {
    label: 'Passed',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400',
  },
  SKIPPED: {
    label: 'Skipped',
    icon: MinusCircle,
    variant: 'secondary' as const,
    className: 'bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400',
  },
};

const sizeConfig = {
  sm: {
    badge: 'text-[10px] px-1.5 py-0',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3.5 w-3.5',
  },
  lg: {
    badge: 'text-sm px-2.5 py-1',
    icon: 'h-4 w-4',
  },
};

export function AnalysisResultBadge({ 
  result, 
  size = 'md', 
  showIcon = true, 
  showLabel = true,
  className 
}: AnalysisResultBadgeProps) {
  if (!result) return null;
  
  const config = resultConfig[result];
  if (!config) return null;
  
  const Icon = config.icon;
  const sizes = sizeConfig[size];
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium gap-1 border',
        sizes.badge,
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={sizes.icon} />}
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}

// Helper function to get plain text representation
export function getAnalysisResultText(result: AnalysisResultType): string {
  if (!result) return '';
  return resultConfig[result]?.label || '';
}

// Helper function to get color class for icons
export function getAnalysisResultColor(result: AnalysisResultType): string {
  if (!result) return '';
  switch (result) {
    case 'PASSED': return 'text-green-600 dark:text-green-400';
    case 'FAILED': return 'text-red-600 dark:text-red-400';
    case 'SKIPPED': return 'text-gray-500 dark:text-gray-400';
    default: return '';
  }
}
