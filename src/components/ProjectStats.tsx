import { AlertTriangle, ShieldAlert, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export interface ProjectStatsData {
  totalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  lastAnalysisDate?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface ProjectStatsProps {
  stats: ProjectStatsData;
  compact?: boolean;
}

export default function ProjectStats({ stats, compact = false }: ProjectStatsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'hsl(var(--destructive) / 0.8)';
      case 'medium':
        return 'hsl(var(--warning))';
      case 'low':
        return 'hsl(var(--muted-foreground))';
      case 'info':
        return 'hsl(var(--primary) / 0.6)';
      default:
        return 'hsl(var(--muted-foreground))';
    }
  };

  const getSeverityIcon = (severity: string, className: string = "h-3 w-3") => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className={className} style={{ color: getSeverityColor('high') }} />;
      case 'medium':
        return <AlertCircle className={className} style={{ color: getSeverityColor('medium') }} />;
      case 'low':
        return <Info className={className} style={{ color: getSeverityColor('low') }} />;
      case 'info':
        return <Info className={className} style={{ color: getSeverityColor('info') }} />;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className="text-lg font-semibold">{stats.totalIssues}</div>
          <span className="text-muted-foreground">issues</span>
        </div>

        {stats.highIssues > 0 && (
          <div className="flex items-center space-x-1">
            {getSeverityIcon('high')}
            <span className="font-medium">{stats.highIssues}</span>
          </div>
        )}
        
        {stats.mediumIssues > 0 && (
          <div className="flex items-center space-x-1">
            {getSeverityIcon('medium')}
            <span className="font-medium">{stats.mediumIssues}</span>
          </div>
        )}
        
        {stats.lowIssues > 0 && (
          <div className="flex items-center space-x-1">
            {getSeverityIcon('low')}
            <span className="font-medium">{stats.lowIssues}</span>
          </div>
        )}

        {stats.trend && (
          <div className="flex items-center space-x-1">
            <TrendingUp 
              className={`h-3 w-3 ${
                stats.trend === 'up' ? 'text-destructive rotate-0' : 
                stats.trend === 'down' ? 'text-success rotate-180' : 
                'text-muted-foreground'
              }`} 
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Issues Overview</h3>
            <p className="text-sm text-muted-foreground">
              {stats.lastAnalysisDate ? 
                `Last scan: ${new Date(stats.lastAnalysisDate).toLocaleDateString()}` : 
                'No analysis yet'
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.totalIssues}</div>
            <div className="text-sm text-muted-foreground">Total Issues</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-3 rounded-lg bg-destructive/5">
            {getSeverityIcon('high', 'h-6 w-6 mb-2')}
            <div className="text-xl font-bold">{stats.highIssues}</div>
            <div className="text-xs text-muted-foreground">High</div>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded-lg bg-warning/10">
            {getSeverityIcon('medium', 'h-6 w-6 mb-2')}
            <div className="text-xl font-bold">{stats.mediumIssues}</div>
            <div className="text-xs text-muted-foreground">Medium</div>
          </div>
          
          <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
            {getSeverityIcon('low', 'h-6 w-6 mb-2')}
            <div className="text-xl font-bold">{stats.lowIssues}</div>
            <div className="text-xs text-muted-foreground">Low</div>
          </div>
        </div>

        {/* Progress bar showing severity distribution */}
        {stats.totalIssues > 0 && (
          <div className="mt-4">
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              {stats.highIssues > 0 && (
                <div 
                  className="bg-destructive/80" 
                  style={{ width: `${(stats.highIssues / stats.totalIssues) * 100}%` }}
                />
              )}
              {stats.mediumIssues > 0 && (
                <div 
                  className="bg-warning" 
                  style={{ width: `${(stats.mediumIssues / stats.totalIssues) * 100}%` }}
                />
              )}
              {stats.lowIssues > 0 && (
                <div 
                  className="bg-muted-foreground" 
                  style={{ width: `${(stats.lowIssues / stats.totalIssues) * 100}%` }}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
