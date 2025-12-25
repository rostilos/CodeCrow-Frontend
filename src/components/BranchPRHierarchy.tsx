import { useState, useEffect } from "react";
import { GitBranch, GitPullRequest, Clock, Check, ChevronsUpDown, Star, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { analysisService, type PullRequestsByBranchResponse, type PullRequestDTO, type DetailedStatsResponse } from "@/api_service/analysis/analysisService";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { projectService } from "@/api_service/project/projectService";
import DetailedProjectStats from "@/components/DetailedProjectStats";

interface BranchPRHierarchyProps {
  projectNamespace: string;
  onSelectBranch?: (branchName: string) => void;
  onSelectPR?: (pr: PullRequestDTO) => void;
}

export default function BranchPRHierarchy({ projectNamespace, onSelectBranch, onSelectPR }: BranchPRHierarchyProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const routes = useWorkspaceRoutes();
  const [prsByBranch, setPrsByBranch] = useState<PullRequestsByBranchResponse>({});
  const [loading, setLoading] = useState(false);
  const [selectedBranchName, setSelectedBranchName] = useState<string | null>(null);
  const [branchSelectOpen, setBranchSelectOpen] = useState(false);
  const [defaultBranchName, setDefaultBranchName] = useState<string | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadPRsByBranch = async () => {
    if (!currentWorkspace || !projectNamespace) return;
    
    setLoading(true);
    try {
      // Load project to get default branch
      const project = await projectService.getProjectByNamespace(currentWorkspace.slug, projectNamespace);
      const defaultBranch = project.defaultBranchStats?.branchName || null;
      setDefaultBranchName(defaultBranch);
      
      // Load PRs by branch
      const data = await analysisService.getPullRequestsByBranch(currentWorkspace.slug, projectNamespace);
      setPrsByBranch(data);
      
      // Auto-select default branch or first branch
      const branches = Object.keys(data);
      if (branches.length > 0 && !selectedBranchName) {
        const branchToSelect = defaultBranch && branches.includes(defaultBranch) 
          ? defaultBranch 
          : branches[0];
        setSelectedBranchName(branchToSelect);
        onSelectBranch?.(branchToSelect);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load branches",
        description: error.message || "Could not load branch/PR hierarchy",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPRsByBranch();
  }, [projectNamespace, currentWorkspace]);

  const loadBranchStats = async (branchName: string) => {
    if (!currentWorkspace || !projectNamespace) return;
    
    setStatsLoading(true);
    try {
      const stats = await analysisService.getProjectDetailedStats(
        currentWorkspace.slug,
        projectNamespace, 
        branchName
      );
      
      setDetailedStats(stats);
    } catch (error: any) {
      toast({
        title: "Failed to load branch stats",
        description: error.message || "Could not load branch statistics",
        variant: "destructive",
      });
      setDetailedStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleBranchChange = (branchName: string) => {
    setSelectedBranchName(branchName);
    setBranchSelectOpen(false);
    loadBranchStats(branchName);
    onSelectBranch?.(branchName);
  };

  useEffect(() => {
    if (selectedBranchName) {
      loadBranchStats(selectedBranchName);
    }
  }, [selectedBranchName]);

  const handlePRClick = (pr: PullRequestDTO) => {
    onSelectPR?.(pr);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch Overview</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const branches = Object.keys(prsByBranch);

  if (branches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch Overview</CardTitle>
          <CardDescription>No branches analyzed yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Run your first analysis to see branches and pull requests
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleViewBranchIssues = () => {
    if (selectedBranchName) {
      navigate(routes.branchIssues(projectNamespace, selectedBranchName));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Branch Overview</CardTitle>
          <CardDescription>
            Select a branch to view its statistics and issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Branch Selector */}
          <Popover open={branchSelectOpen} onOpenChange={setBranchSelectOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={branchSelectOpen}
                className="w-full justify-between"
              >
                {selectedBranchName ? (
                  <span className="truncate flex items-center">
                    <GitBranch className="mr-2 h-4 w-4" />
                    {selectedBranchName}
                    {selectedBranchName === defaultBranchName && (
                      <Badge variant="default" className="ml-2 text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                    <Badge variant="secondary" className="ml-2">
                      {prsByBranch[selectedBranchName]?.length || 0} pull request(s)
                    </Badge>
                  </span>
                ) : (
                  <span>Select branch</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-background z-50" align="start">
              <Command>
                <CommandInput placeholder="Search branches..." />
                <CommandList>
                  <CommandEmpty>No branches found.</CommandEmpty>
                  <CommandGroup>
                    {branches.map((branchName) => {
                      const prs = prsByBranch[branchName] || [];
                      const isDefault = branchName === defaultBranchName;
                      return (
                        <CommandItem
                          key={branchName}
                          value={branchName}
                          onSelect={() => handleBranchChange(branchName)}
                          className="text-sm"
                        >
                          <GitBranch className="mr-2 h-4 w-4" />
                          <span className="flex-1">{branchName}</span>
                          {isDefault && (
                            <Badge variant="default" className="ml-2 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          <Badge variant="secondary" className="ml-2">
                            {prs.length}
                          </Badge>
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              selectedBranchName === branchName ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Branch Detailed Stats */}
      {selectedBranchName && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Branch Statistics: {selectedBranchName}</h2>
            <Button 
              size="sm"
              onClick={handleViewBranchIssues}
              disabled={!detailedStats || detailedStats.totalIssues === 0}
            >
              View All Issues
            </Button>
          </div>
          {statsLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-muted rounded" />
            </div>
          ) : detailedStats && currentWorkspace ? (
            <DetailedProjectStats 
              stats={detailedStats}
              workspaceSlug={currentWorkspace.slug}
              projectNamespace={projectNamespace}
              branchName={selectedBranchName}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No statistics available for this branch
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
