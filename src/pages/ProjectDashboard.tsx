import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, GitBranch, Users, Key, Settings, Calendar, Activity, AlertCircle, RefreshCw, Info, Check, ChevronsUpDown, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/context/WorkspaceContext';
import { projectService, ProjectDTO } from '@/api_service/project/projectService';
import { useToast } from '@/hooks/use-toast';
import DetailedProjectStats, { DetailedProjectStatsData } from '@/components/DetailedProjectStats';
import { analysisService } from '@/api_service/analysis/analysisService';
import { usePermissions } from "@/hooks/usePermissions";
import BranchPRHierarchy from '@/components/BranchPRHierarchy';
import IssuesByFileDisplay from '@/components/IssuesByFileDisplay';
import IssueFilterSidebar, { IssueFilters } from '@/components/IssueFilterSidebar';
import type { 
  AnalysisIssue, 
  PullRequestSummary,
  PullRequestDTO,
  AnalysisIssueSummary
} from '@/api_service/analysis/analysisService';

export default function ProjectDashboard() {
  const { namespace } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedProjectStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pullRequests, setPullRequests] = useState<PullRequestSummary[]>([]);
  const [analysisIssues, setAnalysisIssues] = useState<AnalysisIssue[]>([]);
  const [issueSummary, setIssueSummary] = useState<AnalysisIssueSummary | null>(null);
  const [selectedPR, setSelectedPR] = useState<PullRequestSummary | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [maxVersion, setMaxVersion] = useState<number>(1);
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [prSelectOpen, setPrSelectOpen] = useState(false);
  const [prSearchQuery, setPrSearchQuery] = useState('');
  const [filters, setFilters] = useState<IssueFilters>({
    severity: 'ALL',
    status: 'open',
    filePath: '',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [branchIssues, setBranchIssues] = useState<AnalysisIssue[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const { canManageWorkspace } = usePermissions();
  const [branches, setBranches] = useState<string[]>([]);
  const [defaultBranchName, setDefaultBranchName] = useState<string | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionType, setSelectionType] = useState<'branch' | 'pr'>('branch');
  const [branchStats, setBranchStats] = useState<DetailedProjectStatsData | null>(null);



  useEffect(() => {
    loadProject();
    loadProjectAnalysis();
    loadBranches();
    
    // Read filters from URL
    const newFilters: IssueFilters = {
      severity: 'ALL',
      status: 'open', // Default to showing only open issues
      filePath: '',
      dateFrom: undefined,
      dateTo: undefined,
    };
    
    const severityParam = searchParams.get('severity');
    if (severityParam && ['HIGH', 'MEDIUM', 'LOW', 'ALL'].includes(severityParam.toUpperCase())) {
      newFilters.severity = severityParam.toUpperCase();
    }
    
    const statusParam = searchParams.get('status');
    if (statusParam && ['open', 'resolved', 'ALL'].includes(statusParam.toLowerCase())) {
      newFilters.status = statusParam.toLowerCase();
    }
    
    const fileParam = searchParams.get('filePath');
    if (fileParam) {
      newFilters.filePath = fileParam;
    }
    
    const dateFromParam = searchParams.get('dateFrom');
    if (dateFromParam) {
      newFilters.dateFrom = new Date(dateFromParam);
    }
    
    const dateToParam = searchParams.get('dateTo');
    if (dateToParam) {
      newFilters.dateTo = new Date(dateToParam);
    }
    
    setFilters(newFilters);
    
    // Restore branch selection from URL
    const urlBranch = searchParams.get('branch');
    if (urlBranch) {
      setSelectionType('branch');
      setSelectedBranch(urlBranch);
      loadBranchData(urlBranch);
    }
  }, [namespace, currentWorkspace]);

  const activeTab = searchParams.get('tab') || 'analysis';

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    setSearchParams(newParams);
  };

  const loadProject = async () => {
    if (!namespace || !currentWorkspace) return;
    try {
      setLoading(true);
      const proj = await projectService.getProjectByNamespace(currentWorkspace.slug, namespace);
      setProject(proj);
    } catch (error: any) {
      toast({
        title: "Failed to load project",
        description: error.message || "Could not retrieve project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedStats = async () => {
    if (!namespace || !currentWorkspace) return;
    try {
      setStatsLoading(true);
      const stats = await analysisService.getProjectDetailedStats(currentWorkspace.slug, namespace);
      setDetailedStats(stats);
    } catch (error: any) {
      console.warn('Failed to load detailed stats:', error);
      // Don't show error toast for stats, just log it
    } finally {
      setStatsLoading(false);
    }
  };

  const loadBranches = async () => {
    if (!currentWorkspace || !namespace) return;
    
    try {
      const projectData = await projectService.getProjectByNamespace(currentWorkspace.slug, namespace);
      const defaultBranch = projectData.defaultBranchStats?.branchName || null;
      setDefaultBranchName(defaultBranch);
      
      const data = await analysisService.getPullRequestsByBranch(currentWorkspace.slug, namespace);
      const branchList = Object.keys(data);
      setBranches(branchList);
      
      // Auto-select default branch or first branch if no selection
      const urlPrId = searchParams.get('prId');
      const urlBranch = searchParams.get('branch');
      
      if (!urlPrId && !urlBranch && branchList.length > 0) {
        const branchToSelect = defaultBranch && branchList.includes(defaultBranch) 
          ? defaultBranch 
          : branchList[0];
        setSelectedBranch(branchToSelect);
        setSelectionType('branch');
        loadBranchData(branchToSelect);
        
        // Update URL
        const newParams = new URLSearchParams(searchParams);
        newParams.set('branch', branchToSelect);
        setSearchParams(newParams, { replace: true });
      }
    } catch (error: any) {
      console.error('Failed to load branches:', error);
      toast({
        title: "Error loading branches",
        description: error.message || "Could not load branches",
        variant: "destructive",
      });
    }
  };

  const loadBranchData = async (branchName: string) => {
    if (!currentWorkspace || !namespace) return;
    
    setBranchLoading(true);
    setStatsLoading(true);
    try {
      const [stats, issues] = await Promise.all([
        analysisService.getProjectDetailedStats(currentWorkspace.slug, namespace, branchName),
        analysisService.getBranchIssues(currentWorkspace.slug, namespace, branchName)
      ]);
      setBranchStats(stats);
      setBranchIssues(issues);
    } catch (error: any) {
      console.error('Failed to load branch data:', error);
      toast({
        title: "Error loading branch data",
        description: error.message || "Could not load branch information",
        variant: "destructive",
      });
    } finally {
      setBranchLoading(false);
      setStatsLoading(false);
    }
  };

  const loadProjectAnalysis = async () => {
    if (!namespace || !currentWorkspace) return;

    try {
      setAnalysisLoading(true);
      const pullRequestsData = await analysisService.getPullRequests(currentWorkspace.slug, namespace);
      // Sort by PR number in descending order (highest first)
      const sortedPullRequests = pullRequestsData.sort((a, b) => b.prNumber - a.prNumber);
      setPullRequests(sortedPullRequests);
      
      // Check if there's a PR ID in the URL params
      const urlPrId = searchParams.get('prId');
      const urlVersion = searchParams.get('version');
      let prToSelect: PullRequestSummary | null = null;
      
      if (urlPrId && sortedPullRequests.length > 0) {
        const foundPR = sortedPullRequests.find(p => String(p.id) === urlPrId);
        if (foundPR) {
          prToSelect = foundPR;
          setSelectionType('pr');
          setSelectedPR(foundPR);
          const versionToLoad = urlVersion ? parseInt(urlVersion) : undefined;
          await loadAnalysisIssuesForPR(foundPR, versionToLoad);
        }
      }
    } catch (error: any) {
      console.error('Failed to load project analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const loadAnalysisIssuesForPR = async (pr: PullRequestSummary, version?: number) => {
    if (!currentWorkspace || !namespace) return;

    try {
      const response = await analysisService.getAnalysisIssues(
        currentWorkspace.slug,
        namespace, 
        String(pr.prNumber),
        version
      );
      setAnalysisIssues(response.issues);
      setIssueSummary(response.summary);
      setMaxVersion(response.maxVersion || 1);
      
      // Set version to what was actually loaded (version param or latest)
      const loadedVersion = version !== undefined ? version : (response.maxVersion || 1);
      setSelectedVersion(loadedVersion);
    } catch (error: any) {
      console.error('Failed to load analysis issues:', error);
      setAnalysisIssues([]);
      setIssueSummary(null);
      setMaxVersion(1);
    }
  };

  const loadBranchIssues = async (branchName: string) => {
    if (!currentWorkspace || !namespace) return;

    try {
      setBranchLoading(true);
      const issues = await analysisService.getBranchIssues(currentWorkspace.slug, namespace, branchName);
      setBranchIssues(issues);
      setSelectedBranch(branchName);
    } catch (error: any) {
      console.error('Failed to load branch issues:', error);
      toast({
        title: "Failed to load branch issues",
        description: error.message || "Could not load issues for this branch",
        variant: "destructive",
      });
      setBranchIssues([]);
    } finally {
      setBranchLoading(false);
    }
  };

  const loadPRAnalysis = async (pr: PullRequestSummary) => {
    setAnalysisLoading(true);
    try {
      await loadAnalysisIssuesForPR(pr);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handlePRChange = async (pr: PullRequestSummary) => {
    setSelectedPR(pr);
    setSelectOpen(false);
    setSelectionType('pr');
    
    // Update URL with prId
    const newParams = new URLSearchParams(searchParams);
    newParams.set('prId', String(pr.id));
    newParams.delete('branch');
    setSearchParams(newParams, { replace: true });
    
    await loadPRAnalysis(pr);
  };

  const handleBranchChange = async (branchName: string) => {
    setSelectedBranch(branchName);
    setSelectOpen(false);
    setSelectionType('branch');
    
    // Update URL with branch
    const newParams = new URLSearchParams(searchParams);
    newParams.set('branch', branchName);
    newParams.delete('prId');
    setSearchParams(newParams, { replace: true });
    
    await loadBranchData(branchName);
  };

  const handleVersionChange = (version: string) => {
    const versionNum = parseInt(version);
    setSelectedVersion(versionNum);
    
    // Update URL params to persist version selection
    if (selectedPR) {
      const params: Record<string, string> = { 
        prId: String(selectedPR.id), 
        version: String(versionNum) 
      };
      setSearchParams(params);
      loadAnalysisIssuesForPR(selectedPR, versionNum);
    }
  };

  const handleBranchSelect = (branchName: string) => {
    loadBranchIssues(branchName);
  };

  const handleFiltersChange = (newFilters: IssueFilters) => {
    setFilters(newFilters);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    
    if (newFilters.severity !== 'ALL') {
      newParams.set('severity', newFilters.severity);
    } else {
      newParams.delete('severity');
    }
    
    // Only add status to URL if it's not the default 'open'
    if (newFilters.status !== 'open') {
      newParams.set('status', newFilters.status);
    } else {
      newParams.delete('status');
    }
    
    if (newFilters.filePath) {
      newParams.set('filePath', newFilters.filePath);
    } else {
      newParams.delete('filePath');
    }
    
    if (newFilters.dateFrom) {
      newParams.set('dateFrom', newFilters.dateFrom.toISOString());
    } else {
      newParams.delete('dateFrom');
    }
    
    if (newFilters.dateTo) {
      newParams.set('dateTo', newFilters.dateTo.toISOString());
    } else {
      newParams.delete('dateTo');
    }
    
    setSearchParams(newParams);
  };

  const handlePRSelect = (pr: PullRequestDTO) => {
    const prSummary: PullRequestSummary = {
      id: pr.id,
      prNumber: pr.prNumber,
      commitHash: pr.commitHash,
      sourceBranchName: pr.sourceBranchName || null,
      targetBranchName: pr.targetBranchName,
    };
    setSelectedPR(prSummary);
    loadAnalysisIssuesForPR(prSummary);
  };

  const handleUpdateIssueStatus = async (issueId: string, newStatus: 'open' | 'resolved') => {
    if (!currentWorkspace || !namespace) return;
    
    try {
      const isResolved = newStatus === 'resolved';
      await analysisService.updateIssueStatus(currentWorkspace.slug, namespace, issueId, isResolved);
      setAnalysisIssues(prev => prev.map(issue => 
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));
      toast({
        title: "Success",
        description: "Issue status updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update issue status",
        description: error.message || "Could not update issue status",
        variant: "destructive",
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300", 
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    };
    
    return (
      <Badge className={colors[severity as keyof typeof colors] || colors.medium}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  // Filter issues by all criteria
  const filteredIssues = analysisIssues.filter(issue => {
    // Severity filter
    if (filters.severity !== 'ALL') {
      const issueSeverity = issue.severity?.toUpperCase();
      if (issueSeverity !== filters.severity) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status !== 'ALL') {
      if (issue.status !== filters.status) {
        return false;
      }
    }
    
    // Date filter (from)
    if (filters.dateFrom && issue.createdAt) {
      const issueDate = new Date(issue.createdAt);
      const filterDate = new Date(filters.dateFrom);
      filterDate.setHours(0, 0, 0, 0);
      issueDate.setHours(0, 0, 0, 0);
      if (issueDate < filterDate) {
        return false;
      }
    }
    
    // Date filter (to)
    if (filters.dateTo && issue.createdAt) {
      const issueDate = new Date(issue.createdAt);
      const filterDate = new Date(filters.dateTo);
      filterDate.setHours(23, 59, 59, 999);
      issueDate.setHours(0, 0, 0, 0);
      if (issueDate > filterDate) {
        return false;
      }
    }
    
    // File path filter
    if (filters.filePath && issue.file) {
      if (!issue.file.toLowerCase().includes(filters.filePath.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  // Filter branches and PRs based on search query
  const filteredBranches = branches.filter((branch) => {
    if (!searchQuery) return true;
    return branch.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredPullRequests = pullRequests.filter((pr) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const prNumber = String(pr.prNumber).toLowerCase();
    const sourceBranch = (pr.sourceBranchName || '').toLowerCase();
    const targetBranch = pr.targetBranchName.toLowerCase();
    const commitHash = pr.commitHash.toLowerCase();
    
    return (
      prNumber.includes(searchLower) ||
      sourceBranch.includes(searchLower) ||
      targetBranch.includes(searchLower) ||
      commitHash.includes(searchLower)
    );
  });

  // Filtered issues based on current selection
  const currentFilteredIssues = selectionType === 'branch' 
    ? branchIssues.filter((issue) => {
        // Apply severity filter
        if (filters.severity !== 'ALL' && issue.severity.toUpperCase() !== filters.severity) {
          return false;
        }
        
        // Apply status filter
        if (filters.status === 'open' && issue.status !== 'open') {
          return false;
        }
        if (filters.status === 'resolved' && issue.status !== 'resolved') {
          return false;
        }
        
        // Apply file path filter
        if (filters.filePath && !issue.file.toLowerCase().includes(filters.filePath.toLowerCase())) {
          return false;
        }
        
        // Apply date filters
        if (filters.dateFrom) {
          const issueDate = new Date(issue.createdAt);
          if (issueDate < filters.dateFrom) {
            return false;
          }
        }
        
        if (filters.dateTo) {
          const issueDate = new Date(issue.createdAt);
          if (issueDate > filters.dateTo) {
            return false;
          }
        }
        
        return true;
      })
    : filteredIssues;

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'security': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'quality': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'performance': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard/projects');
  };

  const handleGoToSettings = () => {
    navigate(`/dashboard/projects/${namespace}/settings`);
  };

  const handleSeverityClick = (severity: 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (selectedBranch) {
      navigate(`/dashboard/projects/${namespace}/branches/${encodeURIComponent(selectedBranch)}/issues?severity=${severity}`);
    }
  };

  const handleFileClick = (filename: string) => {
    if (selectedBranch) {
      navigate(`/dashboard/projects/${namespace}/branches/${encodeURIComponent(selectedBranch)}/issues?filePath=${encodeURIComponent(filename)}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted/50 rounded-lg w-1/4 animate-pulse"></div>
          <div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested project could not be found.</p>
          <Button onClick={() => navigate('/dashboard/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-lg font-semibold truncate">{project.name}</h1>
              <span className="text-muted-foreground">/</span>
              <Popover open={selectOpen} onOpenChange={(open) => {
                setSelectOpen(open);
                if (!open) setSearchQuery('');
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={selectOpen}
                    className="max-w-[400px] justify-between h-9"
                    size="sm"
                  >
                    {selectionType === 'branch' && selectedBranch ? (
                      <span className="truncate flex items-center gap-2">
                        <GitBranch className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{selectedBranch}</span>
                        {defaultBranchName === selectedBranch && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Default</Badge>
                        )}
                      </span>
                    ) : selectionType === 'pr' && selectedPR ? (
                      <span className="truncate">
                        PR #{selectedPR.prNumber} - {selectedPR.sourceBranchName ? `${selectedPR.sourceBranchName} → ${selectedPR.targetBranchName}` : selectedPR.targetBranchName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select branch or PR</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search branches or pull requests..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No branches or pull requests found.</CommandEmpty>

                      {filteredBranches.length > 0 && (
                        <CommandGroup heading="Branches">
                          {filteredBranches.map((branch) => (
                            <CommandItem
                              key={branch}
                              value={branch}
                              onSelect={() => handleBranchChange(branch)}
                              className="text-sm"
                            >
                              <GitBranch className="mr-2 h-4 w-4 shrink-0" />
                              <span className="truncate flex-1">{branch}</span>
                              {defaultBranchName === branch && (
                                <Badge variant="secondary" className="ml-2 text-[10px]">Default</Badge>
                              )}
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4 shrink-0",
                                  selectionType === 'branch' && selectedBranch === branch ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {filteredBranches.length > 0 && filteredPullRequests.length > 0 && (
                        <div className="px-2 py-1.5">
                          <Separator />
                        </div>
                      )}

                      {filteredPullRequests.length > 0 && (
                        <CommandGroup heading="Pull Requests">
                          {filteredPullRequests.map((pr) => (
                            <CommandItem
                              key={pr.id}
                              value={String(pr.id)}
                              onSelect={() => handlePRChange(pr)}
                              className="text-sm"
                            >
                              <GitBranch className="mr-2 h-4 w-4 shrink-0" />
                              <span className="truncate">
                                PR #{pr.prNumber} - {pr.sourceBranchName ? `${pr.sourceBranchName} → ${pr.targetBranchName}` : pr.targetBranchName}
                              </span>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4 shrink-0",
                                  selectionType === 'pr' && selectedPR?.id === pr.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectionType === 'pr' && (
                <IssueFilterSidebar
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  issueCount={currentFilteredIssues.length}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => loadProjectAnalysis()}
                disabled={analysisLoading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${analysisLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {canManageWorkspace() && (
                <Button
                  variant="outline"
                  onClick={handleGoToSettings}
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-6">
        {selectionType === 'branch' && selectedBranch ? (
          <>
            {statsLoading ? (
              <div className="text-center py-16">
                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading branch statistics...</p>
              </div>
            ) : branchStats ? (
              <DetailedProjectStats
                stats={branchStats}
                workspaceSlug={currentWorkspace!.slug}
                projectNamespace={namespace!}
                branchName={selectedBranch}
                onSeverityClick={handleSeverityClick}
                onViewAllIssues={() => navigate(`/dashboard/projects/${namespace}/branches/${encodeURIComponent(selectedBranch!)}/issues`)}
                onFileClick={handleFileClick}
              />
            ) : (
              <Alert className="max-w-xl mx-auto">
                <Info className="h-4 w-4" />
                <AlertTitle>No statistics available</AlertTitle>
                <AlertDescription>
                  Statistics for branch "{selectedBranch}" could not be loaded.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : selectionType === 'pr' && selectedPR ? (
          <div className="space-y-4">
            {/* PR Info Card */}
            {(selectedPR.title || selectedPR.description) && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {selectedPR.title && (
                        <CardTitle className="text-base font-medium">
                          {selectedPR.title}
                        </CardTitle>
                      )}
                      {selectedPR.description && (
                        <CardDescription className="mt-2 whitespace-pre-wrap text-sm">
                          {selectedPR.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}
            
            {/* Analysis Issues Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Analysis Issues</CardTitle>
                    <CardDescription className="mt-1">
                      {currentFilteredIssues.length} issue{currentFilteredIssues.length !== 1 ? 's' : ''} found in PR #{selectedPR.prNumber}
                    </CardDescription>
                  </div>
                  {maxVersion > 1 && (
                    <Select value={String(selectedVersion)} onValueChange={handleVersionChange}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Version" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: maxVersion }, (_, i) => i + 1).map((v) => (
                          <SelectItem key={v} value={String(v)}>
                            Version {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {analysisLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
                    Loading analysis...
                  </div>
                ) : currentFilteredIssues.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success/50" />
                    <p className="font-medium">No issues found</p>
                    <p className="text-sm mt-1">No analysis issues match the current filters</p>
                  </div>
                ) : (
                  <IssuesByFileDisplay
                    issues={currentFilteredIssues}
                    projectNamespace={namespace!}
                    onUpdateIssueStatus={handleUpdateIssueStatus}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert className="max-w-xl mx-auto">
            <Info className="h-4 w-4" />
            <AlertTitle>No selection</AlertTitle>
            <AlertDescription>
              Please select a branch or pull request to view analysis results.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}