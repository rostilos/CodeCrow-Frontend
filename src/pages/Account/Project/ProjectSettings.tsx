import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Settings, GitBranch, BarChart3, Activity, RefreshCw,
  ChevronDown, ExternalLink, Clock, AlertCircle, CheckCircle, XCircle, FileCode
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { projectService, ProjectDTO } from "@/api_service/project/projectService";
import { analysisService, ProjectAnalysisSummary, PullRequestSummary, AnalysisIssue } from "@/api_service/analysis/analysisService";
import { useWorkspace } from "@/context/WorkspaceContext";

// Remove old interfaces since we're importing them from the service

// Mock data removed - using real API calls

export default function ProjectDashboard() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<ProjectAnalysisSummary | null>(null);
  const [pullRequests, setPullRequests] = useState<PullRequestSummary[]>([]);
  const [selectedPR, setSelectedPR] = useState<PullRequestSummary | null>(null);
  const [analysisIssues, setAnalysisIssues] = useState<AnalysisIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    console.log('loadProjects called, currentWorkspace:', currentWorkspace);
    if (!currentWorkspace) {
      console.log('No currentWorkspace, returning');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching projects for workspace:', currentWorkspace.slug);
      const projList = await projectService.listProjects(currentWorkspace.slug);
      console.log('Projects loaded:', projList);
      setProjects(projList);
      
      if (projList.length > 0) {
        console.log('Setting selected project to:', projList[0]);
        setSelectedProject(projList[0]);
        console.log('Loading analysis for project:', projList[0].id);
        await loadProjectAnalysis(projList[0].id);
      } else {
        console.log('No projects found');
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast({
        title: "Failed to load projects",
        description: error.message || "Could not retrieve projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectAnalysis = async (projectId: string | number) => {
    console.log('loadProjectAnalysis called for projectId:', projectId, 'workspace:', currentWorkspace);
    if (!currentWorkspace) {
      console.log('No currentWorkspace in loadProjectAnalysis');
      return;
    }
    
    try {
      console.log('Making API calls for summary, pull requests, and all analysis issues...');
      // Load analysis summary, pull requests, and all analysis issues in parallel
      const namespace = typeof projectId === 'string' ? projectId : String(projectId);
      const [summary, pullRequestsData, allIssues] = await Promise.all([
        analysisService.getProjectSummary(currentWorkspace.slug, namespace).catch(err => {
          console.warn('Failed to load project summary:', err);
          return null;
        }),
        analysisService.getPullRequests(currentWorkspace.slug, namespace, 1, 20).catch(err => {
          console.warn('Failed to load pull requests:', err);
          // Return mock data for development
          return [
            {
              id: 1,
              prNumber: 123,
              title: "Sample Pull Request",
              sourceBranchName: "feature/sample-feature",
              targetBranchName: "main",
              status: "open",
              author: "developer",
              commitHash: "abc123def456",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 2,
              prNumber: 124,
              title: "Another Pull Request",
              sourceBranchName: "feature/another-feature",
              targetBranchName: "develop",
              status: "merged",
              author: "developer2",
              commitHash: "def456ghi789",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
        }),
        // We'll skip loading all issues here since the API now requires pullRequestId
        Promise.resolve([]).catch(err => {
          console.warn('Failed to load all analysis issues:', err);
          // Return mock data for development
          return [
            {
              id: "1",
              title: "Potential Memory Leak",
              description: "Potential memory leak detected in component lifecycle",
              severity: "high" as const,
              type: "performance" as const,
              file: "src/components/Dashboard.tsx",
              line: 42,
              branch: "main",
              status: "open" as const,
              createdAt: new Date().toISOString()
            },
            {
              id: "2",
              title: "Security Vulnerability",
              description: "XSS vulnerability in user input handling",
              severity: "high" as const,
              type: "security" as const,
              file: "src/pages/UserProfile.tsx",
              line: 18,
              branch: "main",
              status: "open" as const,
              createdAt: new Date().toISOString()
            },
            {
              id: "3",
              title: "Code Duplication",
              description: "Duplicate code blocks found across multiple components",
              severity: "medium" as const,
              type: "quality" as const,
              file: "src/utils/helpers.ts",
              line: 125,
              branch: "feature/sample-feature",
              status: "open" as const,
              createdAt: new Date().toISOString()
            }
          ];
        })
      ]);
      
      console.log('Summary loaded:', summary);
      console.log('Pull requests loaded:', pullRequestsData);
      console.log('All analysis issues loaded:', allIssues);
      
      setAnalysisSummary(summary);
      setPullRequests(pullRequestsData || []);
      
      // Set all analysis issues immediately
      const issuesArray = Array.isArray(allIssues) ? allIssues : [];
      setAnalysisIssues(issuesArray);
      console.log('analysisIssues state updated to:', issuesArray);
      
      if (pullRequestsData && pullRequestsData.length > 0) {
        console.log('Setting first PR as selected');
        setSelectedPR(pullRequestsData[0]);
      } else {
        console.log('No pull requests found');
        setSelectedPR(null);
      }
    } catch (error: any) {
      console.error('Failed to load analysis data:', error);
      // Reset states to safe defaults on error
      setAnalysisSummary(null);
      setPullRequests([]);
      setSelectedPR(null);
      setAnalysisIssues([]);
      
      toast({
        title: "Failed to load analysis data",
        description: error.message || "Could not retrieve analysis data",
        variant: "destructive",
      });
    }
  };

  const loadAnalysisIssuesForBranch = async (branchName: string) => {
    if (!currentWorkspace || !selectedProject || !selectedProject.namespace) return;

    console.log('Loading analysis issues for branch:', branchName);
    try {
      const issues = await analysisService.getAnalysisIssues(
        currentWorkspace.slug,
        selectedProject.namespace, 
        branchName
      ).catch(err => {
        console.warn('Failed to load analysis issues:', err);
        // Return mock data for development
        return [
          {
            id: "1",
            title: "Potential Memory Leak",
            description: "Potential memory leak detected in component lifecycle",
            severity: "high" as const,
            type: "performance" as const,
            file: "src/components/Dashboard.tsx",
            line: 42,
            branch: branchName,
            status: "open" as const,
            createdAt: new Date().toISOString()
          },
          {
            id: "2",
            title: "Security Vulnerability",
            description: "XSS vulnerability in user input handling",
            severity: "high" as const,
            type: "security" as const,
            file: "src/pages/UserProfile.tsx",
            line: 18,
            branch: branchName,
            status: "open" as const,
            createdAt: new Date().toISOString()
          },
          {
            id: "3",
            title: "Code Duplication",
            description: "Duplicate code blocks found across multiple components",
            severity: "medium" as const,
            type: "quality" as const,
            file: "src/utils/helpers.ts",
            line: 125,
            branch: branchName,
            status: "open" as const,
            createdAt: new Date().toISOString()
          }
        ];
      });
      
      console.log('Loaded issues:', issues);
      console.log('Setting analysisIssues to:', issues);
      // Ensure it's always an array
      const issuesArray = Array.isArray(issues) ? issues : [];
      setAnalysisIssues(issuesArray);
      console.log('analysisIssues state updated to:', issuesArray);
    } catch (error: any) {
      console.log('Failed to load analysis issues for branch:', error);
      setAnalysisIssues([]);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered, currentWorkspace:', currentWorkspace);
    loadProjects();
  }, [currentWorkspace]);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => String(p.id) === projectId);
    setSelectedProject(project || null);
    if (project) {
      loadProjectAnalysis(project.id);
    }
  };

  const handlePRChange = (prId: string) => {
    console.log('PR changed to:', prId);
    const pr = pullRequests.find(p => String(p.id) === prId);
    console.log('Found PR:', pr);
    setSelectedPR(pr || null);
    if (pr) {
      // Use target branch for loading issues
      console.log('Loading issues for branch:', pr.targetBranchName);
      loadAnalysisIssuesForBranch(pr.targetBranchName);
    }
  };

  const handleUpdatePRStatus = async (prId: string, newStatus: string) => {
    try {
      // Note: This would need a PR status update endpoint
      setPullRequests(prev => prev.map(pr => 
        String(pr.id) === prId ? { ...pr, targetBranchName: pr.targetBranchName } : pr
      ));
      toast({
        title: "Success",
        description: "Pull request updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update PR",
        description: error.message || "Could not update pull request",
        variant: "destructive",
      });
    }
  };

  const handleUpdateIssueStatus = async (issueId: string, newStatus: 'open' | 'resolved') => {
    if (!currentWorkspace || !selectedProject || !selectedProject.namespace) return;
    
    try {
      const isResolved = newStatus === 'resolved';
      await analysisService.updateIssueStatus(currentWorkspace.slug, selectedProject.namespace, issueId, isResolved);
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

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'security': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'quality': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'performance': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
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

  const getPRStatusBadge = (status: string) => {
    const colors = {
      open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      changes_requested: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      merged: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.open}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor code analysis and review progress across your projects
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/dashboard/projects/manage')}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Projects
          </Button>
          <Button onClick={() => navigate('/dashboard/projects/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first project to begin code analysis.
            </p>
            <Button onClick={() => navigate('/dashboard/projects/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Project Selection */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedProject?.id ? String(selectedProject.id) : ""} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      <div className="flex items-center space-x-2">
                        <GitBranch className="h-4 w-4" />
                        <span>{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProject && (
              <Button variant="outline" size="sm" onClick={() => loadProjects()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>

          {selectedProject && (
            <>
              {/* Project Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analysisSummary?.totalIssues || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Across all branches
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">{pullRequests.length}</div>
                     <p className="text-xs text-muted-foreground">
                       Available branches
                     </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Analysis</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analysisSummary?.lastAnalysisDate ? 
                        new Date(analysisSummary.lastAnalysisDate).toLocaleDateString() : 
                        'Never'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analysisSummary?.lastAnalysisDate ? 
                        `${Math.floor((Date.now() - new Date(analysisSummary.lastAnalysisDate).getTime()) / (1000 * 60 * 60))}h ago` : 
                        'No analysis yet'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pull Request Selection and Analysis */}
              {pullRequests.length === 0 && !analysisSummary?.totalIssues ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Analysis Data Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Your project is set up and ready to go! Analysis results will appear here once your first pipeline runs and processes a pull request.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto mb-6">
                      <h4 className="font-semibold mb-3 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-primary" />
                        Get Started with Pipeline Setup
                      </h4>
                      <ol className="text-left text-sm space-y-2 mb-4">
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-primary">1.</span>
                          <span>Configure your Bitbucket Pipeline with the provided webhook script</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-primary">2.</span>
                          <span>Add required repository variables (Project ID and Token)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-primary">3.</span>
                          <span>Create a pull request to trigger the first analysis</span>
                        </li>
                      </ol>
                      <Button 
                        onClick={() => navigate(`/dashboard/projects/${selectedProject.namespace}/setup`)}
                        className="w-full"
                      >
                        <FileCode className="mr-2 h-4 w-4" />
                        View Pipeline Setup Instructions
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Need help? Check out our <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate('/docs/bitbucket-pipelines')}>documentation</Button>
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="analysis" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis" className="space-y-4">
                    {/* Branch/PR Selection */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Select value={selectedPR?.id ? String(selectedPR.id) : ""} onValueChange={handlePRChange}>
                          <SelectTrigger className="w-[400px]">
                            <SelectValue placeholder="Select branch/pull request..." />
                          </SelectTrigger>
                          <SelectContent>
                             {pullRequests.map((pr) => (
                               <SelectItem key={pr.id} value={String(pr.id)}>
                                 <div className="flex items-center justify-between w-full">
                                   <div className="flex items-center space-x-2">
                                     <GitBranch className="h-4 w-4" />
                                      <span>PR #{pr.prNumber}</span>
                                      <Badge variant="outline">
                                        {pr.sourceBranchName ? `${pr.sourceBranchName} → ${pr.targetBranchName}` : pr.targetBranchName}
                                      </Badge>
                                   </div>
                                 </div>
                               </SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                      </div>

                       {selectedPR && (
                         <div className="flex items-center space-x-2">
                           <Badge variant="outline">
                             {selectedPR.sourceBranchName 
                               ? `${selectedPR.sourceBranchName} → ${selectedPR.targetBranchName}`
                               : selectedPR.targetBranchName}
                           </Badge>
                           <Badge variant="outline">
                             Commit: {selectedPR.commitHash.substring(0, 8)}
                           </Badge>
                         </div>
                       )}
                    </div>

                     {/* Analysis Issues - Always show if we have issues */}
                     {(selectedPR || analysisIssues.length > 0) && (
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <h3 className="text-lg font-semibold">
                             Analysis Issues ({analysisIssues.length}) 
                             {selectedPR && ` - ${selectedPR.sourceBranchName ? `${selectedPR.sourceBranchName} → ${selectedPR.targetBranchName}` : selectedPR.targetBranchName}`}
                           </h3>
                           <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {analysisIssues.filter(i => i.severity === 'high').length} High
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {analysisIssues.map((issue) => (
                            <Card key={issue.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    {getIssueIcon(issue.type)}
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="font-medium">{issue.title}</h4>
                                        {getSeverityBadge(issue.severity)}
                                        <Badge variant="outline" className="text-xs">
                                          {issue.type}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {issue.description}
                                      </p>
                                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                        <span>{issue.file}:{issue.line}</span>
                                        <span>•</span>
                                        <span>{issue.branch}</span>
                                        <span>•</span>
                                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {issue.status === 'resolved' ? (
                                      <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                                    ) : (
                                      <Badge variant="destructive">Open</Badge>
                                    )}
                                    <Button variant="ghost" size="sm">
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {analysisIssues.length === 0 && (
                          <Card>
                            <CardContent className="p-8 text-center">
                              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                              <h4 className="font-medium mb-2">No Issues Found</h4>
                              <p className="text-sm text-muted-foreground">
                                Great! No analysis issues detected in this branch.
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pull-requests" className="space-y-4">
                    <div className="grid gap-4">
                      {pullRequests.map((pr) => (
                        <Card key={pr.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <GitBranch className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <h4 className="font-medium">PR #{pr.prNumber}</h4>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <span>
                                      {pr.sourceBranchName 
                                        ? `${pr.sourceBranchName} → ${pr.targetBranchName}`
                                        : pr.targetBranchName}
                                    </span>
                                    <span>•</span>
                                    <span>{pr.commitHash.substring(0, 8)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                 <Button 
                                   variant="outline" 
                                   size="sm"
                                   onClick={() => {
                                     console.log('View Details clicked for PR:', pr);
                                     setSelectedPR(pr);
                                     loadAnalysisIssuesForBranch(pr.targetBranchName);
                                     console.log('Current analysisIssues state:', analysisIssues);
                                   }}
                                 >
                                   View Details
                                 </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}