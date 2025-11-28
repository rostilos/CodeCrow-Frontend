import { useState, useEffect } from "react";
import { GitBranch, Check, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { projectService, type BranchDTO, type ProjectDTO } from "@/api_service/project/projectService";
import { useWorkspace } from "@/context/WorkspaceContext";

interface DefaultBranchSelectorProps {
  project: ProjectDTO;
  onUpdate?: (updatedProject: ProjectDTO) => void;
}

export default function DefaultBranchSelector({ project, onUpdate }: DefaultBranchSelectorProps) {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(project.defaultBranchId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadBranches = async () => {
    if (!currentWorkspace || !project.namespace) return;
    
    setLoading(true);
    try {
      const branchList = await projectService.getProjectBranches(currentWorkspace.slug, project.namespace);
      setBranches(branchList);
    } catch (error: any) {
      toast({
        title: "Failed to load branches",
        description: error.message || "Could not load analyzed branches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [project.namespace, currentWorkspace]);

  const handleSetDefaultBranch = async () => {
    if (!currentWorkspace || !project.namespace || !selectedBranchId) return;
    
    setSaving(true);
    try {
      const updatedProject = await projectService.setDefaultBranch(
        currentWorkspace.slug,
        project.namespace,
        { branchId: selectedBranchId }
      );
      
      toast({
        title: "Success",
        description: "Default branch updated successfully",
      });
      
      onUpdate?.(updatedProject);
    } catch (error: any) {
      toast({
        title: "Failed to set default branch",
        description: error.message || "Could not update default branch",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const currentBranch = branches.find(b => b.id === selectedBranchId);
  const hasChanges = selectedBranchId !== project.defaultBranchId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5" />
            <div>
              <CardTitle>Default Branch</CardTitle>
              <CardDescription>
                Set the default branch for project statistics and analysis
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadBranches}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading branches...</div>
        ) : branches.length === 0 ? (
          <div className="text-center py-8">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Analyzed Branches</h3>
            <p className="text-muted-foreground text-sm">
              Run your first analysis to see available branches
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Default Branch</label>
              <Select
                value={selectedBranchId ? String(selectedBranchId) : ""}
                onValueChange={(value) => setSelectedBranchId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a branch..." />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      <div className="flex items-center justify-between w-full">
                        <span>{branch.branchName}</span>
                        {branch.id === project.defaultBranchId && (
                          <Check className="h-4 w-4 ml-2 text-green-600" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentBranch && (
              <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Branch Statistics</span>
                  {currentBranch.id === project.defaultBranchId && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Current Default
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Issues:</span>
                    <span className="ml-2 font-semibold">{currentBranch.totalIssues}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resolved:</span>
                    <span className="ml-2 font-semibold">{currentBranch.resolvedCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">High Severity:</span>
                    <span className="ml-2 font-semibold text-orange-600">{currentBranch.highSeverityCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Medium Severity:</span>
                    <span className="ml-2 font-semibold text-yellow-600">{currentBranch.mediumSeverityCount}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  Last updated: {new Date(currentBranch.updatedAt).toLocaleDateString()}
                </div>
              </div>
            )}

            <Button
              onClick={handleSetDefaultBranch}
              disabled={!hasChanges || saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Set as Default Branch
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
