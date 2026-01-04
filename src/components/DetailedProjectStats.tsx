import {useState, useEffect, useRef} from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    AlertCircle,
    Info,
    TrendingUp,
    Calendar,
    GitBranch,
    Activity,
    BarChart3,
    CheckCircle2
} from 'lucide-react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {ProjectStatsData} from './ProjectStats';
import {ChartContainer, ChartTooltip, ChartTooltipContent} from '@/components/ui/chart';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer} from 'recharts';
import {analysisService, AnalysisTrendData, BranchIssuesTrendPoint} from '@/api_service/analysis/analysisService';
import {format} from 'date-fns';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {cn} from '@/lib/utils';

// Cache for trend data to avoid repeated API calls
const trendDataCache = new Map<string, { data: AnalysisTrendData[] | BranchIssuesTrendPoint[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

export interface DetailedProjectStatsData {
    totalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    lastAnalysisDate?: string;
    trend?: 'up' | 'down' | 'stable';
    securityIssues: number;
    qualityIssues: number;
    performanceIssues: number;
    styleIssues: number;
    resolvedIssuesCount: number;
    openIssuesCount: number;
    ignoredIssuesCount: number;
    averageResolutionTime?: number;
    issuesTrendData?: Array<{
        date: string;
        high: number;
        medium: number;
        low: number;
    }>;
    topFiles?: Array<{
        file: string;
        issues: number;
        severity: string;
    }>;
    recentAnalyses?: Array<{
        date: string;
        totalIssues: number;
        targetBranch: string;
        sourceBranch: string | null;
        status: string;
    }>;
}

interface DetailedProjectStatsProps {
    stats: DetailedProjectStatsData;
    workspaceSlug: string;
    projectNamespace: string;
    branchName?: string;
    onSeverityClick?: (severity: 'HIGH' | 'MEDIUM' | 'LOW') => void;
    onViewAllIssues?: () => void;
    onViewResolvedIssues?: () => void;
    onFileClick?: (filename: string) => void;
}

export default function DetailedProjectStats({
                                                 stats,
                                                 workspaceSlug,
                                                 projectNamespace,
                                                 branchName,
                                                 onSeverityClick,
                                                 onViewAllIssues,
                                                 onViewResolvedIssues,
                                                 onFileClick
                                             }: DetailedProjectStatsProps) {
    const [selectedTab, setSelectedTab] = useState('overview');
    const [trendData, setTrendData] = useState<AnalysisTrendData[]>([]);
    const [issuesTrendData, setIssuesTrendData] = useState<BranchIssuesTrendPoint[]>([]);
    const [isLoadingTrend, setIsLoadingTrend] = useState(false);
    const [timeframe, setTimeframe] = useState<number>(30);
    const [chartType, setChartType] = useState<'resolved' | 'issues'>('resolved');

    useEffect(() => {
        const fetchTrendData = async () => {
            const cacheKey = `${chartType}-${workspaceSlug}-${projectNamespace}-${branchName || ''}-${timeframe}`;
            const cached = trendDataCache.get(cacheKey);
            
            // Return cached data if valid
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                if (chartType === 'resolved') {
                    setTrendData(cached.data as AnalysisTrendData[]);
                } else {
                    setIssuesTrendData(cached.data as BranchIssuesTrendPoint[]);
                }
                return;
            }
            
            try {
                setIsLoadingTrend(true);
                if (chartType === 'resolved') {
                    const data = await analysisService.getAnalysisTrends(workspaceSlug, projectNamespace, timeframe);
                    setTrendData(data);
                    trendDataCache.set(cacheKey, { data, timestamp: Date.now() });
                } else {
                    if (branchName) {
                        const data = await analysisService.getBranchIssuesTrend(workspaceSlug, projectNamespace, branchName, undefined, timeframe);
                        setIssuesTrendData(data);
                        trendDataCache.set(cacheKey, { data, timestamp: Date.now() });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch trend data:', error);
            } finally {
                setIsLoadingTrend(false);
            }
        };

        fetchTrendData();
    }, [workspaceSlug, projectNamespace, branchName, timeframe, chartType]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
            case 'high':
                return 'hsl(var(--destructive) / 0.8)';
            case 'medium':
                return 'hsl(var(--warning))';
            case 'low':
                return 'hsl(var(--muted-foreground))';
            default:
                return 'hsl(var(--muted-foreground))';
        }
    };

    const getSeverityIcon = (severity: string, className: string = "h-4 w-4") => {
        switch (severity) {
            case 'critical':
                return <ShieldAlert className={className} style={{color: getSeverityColor('critical')}}/>;
            case 'high':
                return <AlertTriangle className={className} style={{color: getSeverityColor('high')}}/>;
            case 'medium':
                return <AlertCircle className={className} style={{color: getSeverityColor('medium')}}/>;
            case 'low':
                return <Info className={className} style={{color: getSeverityColor('low')}}/>;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="default"
                              className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            case 'in_progress':
                return <Badge variant="secondary">In Progress</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const totalIssuesByType = (stats.securityIssues || 0) + (stats.qualityIssues || 0) + (stats.performanceIssues || 0) + (stats.styleIssues || 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {onViewAllIssues && (
                    <Card
                        className="border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
                        onClick={onViewAllIssues}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open Issues</p>
                                    <p className="text-2xl font-bold mt-1">{stats.totalIssues}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Activity className="h-5 w-5 text-primary"/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                <Card
                    className={cn(
                        "border-l-4 border-l-destructive/80",
                        onSeverityClick && "cursor-pointer hover:shadow-md transition-all duration-200 hover:border-destructive/30"
                    )}
                    onClick={() => onSeverityClick?.('HIGH')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">High</p>
                                <p className="text-2xl font-bold mt-1">{stats.highIssues}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-destructive/10">
                                {getSeverityIcon('high', 'h-5 w-5')}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-l-4 border-l-warning",
                        onSeverityClick && "cursor-pointer hover:shadow-md transition-all duration-200 hover:border-warning/30"
                    )}
                    onClick={() => onSeverityClick?.('MEDIUM')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Medium</p>
                                <p className="text-2xl font-bold mt-1">{stats.mediumIssues}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-warning/10">
                                {getSeverityIcon('medium', 'h-5 w-5')}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-l-4 border-l-muted-foreground/30",
                        onSeverityClick && "cursor-pointer hover:shadow-md transition-all duration-200"
                    )}
                    onClick={() => onSeverityClick?.('LOW')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Low</p>
                                <p className="text-2xl font-bold mt-1">{stats.lowIssues}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-muted">
                                {getSeverityIcon('low', 'h-5 w-5')}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Resolved Issues Card */}
                <Card
                    className={cn(
                        "border-l-4 border-l-green-500",
                        onViewResolvedIssues && "cursor-pointer hover:shadow-md transition-all duration-200 hover:border-green-400/30"
                    )}
                    onClick={onViewResolvedIssues}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resolved</p>
                                <p className="text-2xl font-bold mt-1 text-green-600">{stats.resolvedIssuesCount || 0}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <CheckCircle2 className="h-5 w-5 text-green-600"/>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Overview Card */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-muted">
                            <BarChart3 className="h-4 w-4"/>
                        </div>
                        <div>
                            <CardTitle className="text-base">Analysis Overview</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                {stats.totalIssues} issues found across all branches
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Severity Distribution */}
                        <div>
                            <h4 className="text-sm font-medium mb-4">Severity Distribution</h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm text-muted-foreground">High Issues</span>
                                        <span className="text-sm font-medium">{stats.highIssues}</span>
                                    </div>
                                    <Progress
                                        value={stats.totalIssues > 0 ? (stats.highIssues / stats.totalIssues) * 100 : 0}
                                        className="h-2"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm text-muted-foreground">Medium Issues</span>
                                        <span className="text-sm font-medium">{stats.mediumIssues}</span>
                                    </div>
                                    <Progress
                                        value={stats.totalIssues > 0 ? (stats.mediumIssues / stats.totalIssues) * 100 : 0}
                                        className="h-2"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm text-muted-foreground">Low Issues</span>
                                        <span className="text-sm font-medium">{stats.lowIssues}</span>
                                    </div>
                                    <Progress
                                        value={stats.totalIssues > 0 ? (stats.lowIssues / stats.totalIssues) * 100 : 0}
                                        className="h-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Issue Types */}
                        <div>
                            <h4 className="text-sm font-medium mb-4">Issue Types</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Security</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-destructive h-2 rounded-full transition-all"
                                                style={{width: `${totalIssuesByType > 0 ? ((stats.securityIssues || 0) / totalIssuesByType) * 100 : 0}%`}}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8 text-right">{stats.securityIssues || 0}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Quality</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-warning h-2 rounded-full transition-all"
                                                style={{width: `${totalIssuesByType > 0 ? ((stats.qualityIssues || 0) / totalIssuesByType) * 100 : 0}%`}}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8 text-right">{stats.qualityIssues || 0}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Performance</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{width: `${totalIssuesByType > 0 ? ((stats.performanceIssues || 0) / totalIssuesByType) * 100 : 0}%`}}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8 text-right">{stats.performanceIssues || 0}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Style</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-muted-foreground h-2 rounded-full transition-all"
                                                style={{width: `${totalIssuesByType > 0 ? ((stats.styleIssues || 0) / totalIssuesByType) * 100 : 0}%`}}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8 text-right">{stats.styleIssues || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="files">Top Files</TabsTrigger>
                    <TabsTrigger value="branches">Branches</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4"/>
                                        Recent Analysis Trend
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        {chartType === 'resolved' ? 'Issue resolution rates over time ( By PR )' : 'Total issues breakdown by severity ( By PR )'}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={chartType}
                                            onValueChange={(value: 'resolved' | 'issues') => setChartType(value)}>
                                        <SelectTrigger className="w-[140px] h-9">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="resolved">Resolved Rate</SelectItem>
                                            <SelectItem value="issues">Total Issues</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={timeframe.toString()}
                                            onValueChange={(value) => setTimeframe(Number(value))}>
                                        <SelectTrigger className="w-[120px] h-9">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">Last 7 days</SelectItem>
                                            <SelectItem value="30">Last 30 days</SelectItem>
                                            <SelectItem value="60">Last 60 days</SelectItem>
                                            <SelectItem value="90">Last 90 days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingTrend ? (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    <Activity className="h-8 w-8 animate-pulse"/>
                                </div>
                            ) : chartType === 'resolved' && trendData.length === 0 ? (
                                <div
                                    className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mb-2"/>
                                    <p>No trend data available</p>
                                </div>
                            ) : chartType === 'issues' && issuesTrendData.length === 0 ? (
                                <div
                                    className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mb-2"/>
                                    <p>No issues trend data available</p>
                                </div>
                            ) : chartType === 'resolved' ? (
                                <ChartContainer
                                    config={{
                                        resolvedRate: {
                                            label: 'Resolved Rate',
                                            color: 'hsl(var(--accent))',
                                        },
                                    }}
                                    className="h-[350px]"
                                >
                                    <LineChart
                                        data={trendData}
                                        margin={{top: 10, right: 10, left: 0, bottom: 0}}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-muted/30"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                                            className="text-xs"
                                            stroke="hsl(var(--muted-foreground))"
                                            tick={{fill: 'hsl(var(--muted-foreground))'}}
                                            axisLine={{stroke: 'hsl(var(--border))'}}
                                        />
                                        <YAxis
                                            className="text-xs"
                                            domain={[0, 1]}
                                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                                            stroke="hsl(var(--muted-foreground))"
                                            tick={{fill: 'hsl(var(--muted-foreground))'}}
                                            axisLine={{stroke: 'hsl(var(--border))'}}
                                        />
                                        <ChartTooltip
                                            content={<ChartTooltipContent
                                                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy HH:mm')}
                                                formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`}
                                            />}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="resolvedRate"
                                            stroke="var(--color-resolvedRate)"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: 'var(--color-resolvedRate)',
                                                strokeWidth: 2,
                                                stroke: 'hsl(var(--background))'
                                            }}
                                            activeDot={{
                                                r: 6,
                                                fill: 'var(--color-resolvedRate)',
                                                stroke: 'hsl(var(--background))',
                                                strokeWidth: 2
                                            }}
                                            name="Resolved Rate"
                                        />
                                    </LineChart>
                                </ChartContainer>
                            ) : (
                                <ChartContainer
                                    config={{
                                        totalIssues: {
                                            label: 'Total Issues',
                                            color: 'hsl(var(--primary))',
                                        },
                                        highSeverityCount: {
                                            label: 'High Severity',
                                            color: 'hsl(var(--destructive))',
                                        },
                                        mediumSeverityCount: {
                                            label: 'Medium Severity',
                                            color: 'hsl(var(--warning))',
                                        },
                                        lowSeverityCount: {
                                            label: 'Low Severity',
                                            color: 'hsl(var(--muted-foreground))',
                                        },
                                    }}
                                    className="h-[350px]"
                                >
                                    <LineChart
                                        data={issuesTrendData}
                                        margin={{top: 10, right: 10, left: 0, bottom: 0}}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            className="stroke-muted/30"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                                            className="text-xs"
                                            stroke="hsl(var(--muted-foreground))"
                                            tick={{fill: 'hsl(var(--muted-foreground))'}}
                                            axisLine={{stroke: 'hsl(var(--border))'}}
                                        />
                                        <YAxis
                                            className="text-xs"
                                            stroke="hsl(var(--muted-foreground))"
                                            tick={{fill: 'hsl(var(--muted-foreground))'}}
                                            axisLine={{stroke: 'hsl(var(--border))'}}
                                        />
                                        <ChartTooltip
                                            content={<ChartTooltipContent
                                                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy HH:mm')}
                                            />}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="totalIssues"
                                            stroke="var(--color-totalIssues)"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: 'var(--color-totalIssues)',
                                                strokeWidth: 2,
                                                stroke: 'hsl(var(--background))'
                                            }}
                                            activeDot={{
                                                r: 6,
                                                fill: 'var(--color-totalIssues)',
                                                stroke: 'hsl(var(--background))',
                                                strokeWidth: 2
                                            }}
                                            name="Total Issues"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="highSeverityCount"
                                            stroke="var(--color-highSeverityCount)"
                                            strokeWidth={2}
                                            dot={{
                                                r: 3,
                                                fill: 'var(--color-highSeverityCount)',
                                                strokeWidth: 2,
                                                stroke: 'hsl(var(--background))'
                                            }}
                                            name="High Severity"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="mediumSeverityCount"
                                            stroke="var(--color-mediumSeverityCount)"
                                            strokeWidth={2}
                                            dot={{
                                                r: 3,
                                                fill: 'var(--color-mediumSeverityCount)',
                                                strokeWidth: 2,
                                                stroke: 'hsl(var(--background))'
                                            }}
                                            name="Medium Severity"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="lowSeverityCount"
                                            stroke="var(--color-lowSeverityCount)"
                                            strokeWidth={2}
                                            dot={{
                                                r: 3,
                                                fill: 'var(--color-lowSeverityCount)',
                                                strokeWidth: 2,
                                                stroke: 'hsl(var(--background))'
                                            }}
                                            name="Low Severity"
                                        />
                                    </LineChart>
                                </ChartContainer>
                            )}

                            <div className="grid md:grid-cols-2 gap-4 mt-6">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp
                                            className={`h-4 w-4 ${
                                                stats.trend === 'up' ? 'text-destructive' :
                                                    stats.trend === 'down' ? 'text-green-600' :
                                                        'text-muted-foreground'
                                            }`}
                                        />
                                        <span className="text-sm font-medium">Trend</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                    {stats.trend === 'up' ? 'Issues increasing' :
                        stats.trend === 'down' ? 'Issues decreasing' :
                            'Issues stable'}
                  </span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                                        <span className="text-sm font-medium">Last Analysis</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                    {stats.lastAnalysisDate ?
                        new Date(stats.lastAnalysisDate).toLocaleDateString() :
                        'No analysis yet'
                    }
                  </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Analysis History</CardTitle>
                            <CardDescription className="text-xs">Recent analysis runs and their results</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {stats.recentAnalyses && stats.recentAnalyses.length > 0 ? (
                                    [...stats.recentAnalyses]
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((analysis, index) => (
                                            <div key={index}
                                                 className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 rounded-md bg-muted">
                                                        <GitBranch className="h-3.5 w-3.5 text-muted-foreground"/>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {analysis.sourceBranch
                                                                ? `${analysis.sourceBranch} → ${analysis.targetBranch}`
                                                                : analysis.targetBranch
                                                            }
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(analysis.date).toLocaleDateString()} • {analysis.totalIssues} issues
                                                        </p>
                                                    </div>
                                                </div>
                                                {getStatusBadge(analysis.status)}
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-3">
                                            <Activity className="h-6 w-6"/>
                                        </div>
                                        <p className="text-sm">No analysis history available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="files" className="mt-4">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Files with Most Issues</CardTitle>
                            <CardDescription className="text-xs">Files that need the most attention</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {stats.topFiles && stats.topFiles.length > 0 ? (
                                    stats.topFiles.map((fileData, index) => (
                                        <div 
                                            key={index}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border",
                                                onFileClick && "cursor-pointer hover:bg-muted/30 hover:border-primary/30 transition-all"
                                            )}
                                            onClick={() => onFileClick?.(fileData.file)}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="p-1.5 rounded-md bg-muted shrink-0">
                                                    {getSeverityIcon(fileData.severity, 'h-3.5 w-3.5')}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-sm truncate">{fileData.file}</p>
                                                    <p className="text-xs text-muted-foreground">{fileData.issues} issues</p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={fileData.severity === 'critical' || fileData.severity === 'high' ? 'destructive' : 'secondary'}
                                                className="shrink-0 ml-2"
                                            >
                                                {fileData.severity}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-3">
                                            <Activity className="h-6 w-6"/>
                                        </div>
                                        <p className="text-sm">No file data available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="branches" className="mt-4">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Branch Analysis</CardTitle>
                            <CardDescription className="text-xs">Analysis results by branch</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-3">
                                    <GitBranch className="h-6 w-6"/>
                                </div>
                                <p className="text-sm">Branch statistics not available yet</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
