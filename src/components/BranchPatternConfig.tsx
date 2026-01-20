import { useState, useEffect } from "react";
import { GitBranch, Plus, X, RefreshCw, Info, Loader2, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { projectService, type ProjectDTO } from "@/api_service/project/projectService";
import { useWorkspace } from "@/context/WorkspaceContext";

interface BranchPatternConfigProps {
  project: ProjectDTO;
  onUpdate?: (updatedProject: ProjectDTO) => void;
}

export default function BranchPatternConfig({ project, onUpdate }: BranchPatternConfigProps) {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  
  const [prPatterns, setPrPatterns] = useState<string[]>([]);
  const [branchPatterns, setBranchPatterns] = useState<string[]>([]);
  const [newPrPattern, setNewPrPattern] = useState("");
  const [newBranchPattern, setNewBranchPattern] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingPr, setSavingPr] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);

  const loadConfig = async () => {
    if (!currentWorkspace || !project.namespace) {
      console.log('[BranchPatternConfig] loadConfig skipped - no workspace or namespace', { 
        hasWorkspace: !!currentWorkspace, 
        namespace: project.namespace 
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log('[BranchPatternConfig] Loading config for', currentWorkspace.slug, project.namespace);
      const config = await projectService.getBranchAnalysisConfig(currentWorkspace.slug, project.namespace);
      console.log('[BranchPatternConfig] Loaded config:', config);
      setPrPatterns(config?.prTargetBranches || []);
      setBranchPatterns(config?.branchPushPatterns || []);
    } catch (error: any) {
      console.error('[BranchPatternConfig] Failed to load config:', error);
      toast({
        title: "Failed to load configuration",
        description: error.message || "Could not load branch analysis configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [project.namespace, currentWorkspace]);

  const saveConfig = async (newPrPatterns: string[], newBranchPatterns: string[], type: 'pr' | 'branch') => {
    if (!currentWorkspace || !project.namespace) return;
    
    if (type === 'pr') {
      setSavingPr(true);
    } else {
      setSavingBranch(true);
    }
    
    try {
      console.log('[BranchPatternConfig] Saving config:', { 
        prTargetBranches: newPrPatterns, 
        branchPushPatterns: newBranchPatterns 
      });
      const updatedProject = await projectService.updateBranchAnalysisConfig(
        currentWorkspace.slug,
        project.namespace,
        {
          prTargetBranches: newPrPatterns,
          branchPushPatterns: newBranchPatterns,
        }
      );
      console.log('[BranchPatternConfig] Save successful, updated project:', updatedProject);
      
      onUpdate?.(updatedProject);
    } catch (error: any) {
      console.error('[BranchPatternConfig] Save failed:', error);
      toast({
        title: "Failed to save",
        description: error.message || "Could not save configuration",
        variant: "destructive",
      });
      // Reload to restore previous state
      await loadConfig();
    } finally {
      if (type === 'pr') {
        setSavingPr(false);
      } else {
        setSavingBranch(false);
      }
    }
  };

  const handleAddPrPattern = async () => {
    const pattern = newPrPattern.trim();
    if (pattern && !prPatterns.includes(pattern)) {
      const newPatterns = [...prPatterns, pattern];
      setPrPatterns(newPatterns);
      setNewPrPattern("");
      await saveConfig(newPatterns, branchPatterns, 'pr');
    }
  };

  const handleRemovePrPattern = async (pattern: string) => {
    // Prevent removing the main branch
    const mainBranch = project.mainBranch || project.ragConfig?.branch || 'main';
    if (pattern === mainBranch) {
      toast({
        title: "Cannot remove main branch",
        description: "The main branch is required and cannot be removed from analysis patterns.",
        variant: "destructive",
      });
      return;
    }
    const newPatterns = prPatterns.filter(p => p !== pattern);
    setPrPatterns(newPatterns);
    await saveConfig(newPatterns, branchPatterns, 'pr');
  };

  const handleAddBranchPattern = async () => {
    const pattern = newBranchPattern.trim();
    if (pattern && !branchPatterns.includes(pattern)) {
      const newPatterns = [...branchPatterns, pattern];
      setBranchPatterns(newPatterns);
      setNewBranchPattern("");
      await saveConfig(prPatterns, newPatterns, 'branch');
    }
  };

  const handleRemoveBranchPattern = async (pattern: string) => {
    // Prevent removing the main branch
    const mainBranch = project.mainBranch || project.ragConfig?.branch || 'main';
    if (pattern === mainBranch) {
      toast({
        title: "Cannot remove main branch",
        description: "The main branch is required and cannot be removed from analysis patterns.",
        variant: "destructive",
      });
      return;
    }
    const newPatterns = branchPatterns.filter(p => p !== pattern);
    setBranchPatterns(newPatterns);
    await saveConfig(prPatterns, newPatterns, 'branch');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, addFn: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFn();
    }
  };

  const isSaving = savingPr || savingBranch;

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Analysis Scope Configuration</AlertTitle>
        <AlertDescription>
          Define which branches trigger automated code analysis from webhooks. If no patterns are configured, 
          all branches will be analyzed. Patterns support exact names and wildcards: 
          <code className="mx-1 px-1 bg-muted rounded">*</code> matches any characters except <code className="px-1 bg-muted rounded">/</code>, 
          <code className="mx-1 px-1 bg-muted rounded">**</code> matches any characters including <code className="px-1 bg-muted rounded">/</code>.
        </AlertDescription>
      </Alert>

      <div className="md:flex justify-between gap-4">
          <Card className="w-full">
              <CardHeader>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                          <GitBranch className="h-5 w-5" />
                          <div>
                              <CardTitle className="flex items-center gap-2">
                                  Pull Request Target Branches
                                  {savingPr && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                              </CardTitle>
                              <CardDescription>
                                  Only analyze PRs targeting these branches (e.g., main, develop, release/*)
                              </CardDescription>
                          </div>
                      </div>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={loadConfig}
                          disabled={loading || isSaving}
                      >
                          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex gap-2">
                      <Input
                          placeholder="Enter pattern (e.g., main, develop, release/*)"
                          value={newPrPattern}
                          onChange={(e) => setNewPrPattern(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, handleAddPrPattern)}
                          disabled={loading || savingPr}
                      />
                      <Button
                          onClick={handleAddPrPattern}
                          disabled={!newPrPattern.trim() || loading || savingPr}
                      >
                          {savingPr ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                              <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                              </>
                          )}
                      </Button>
                  </div>

                  {prPatterns.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-muted/30">
                          No patterns configured. All PR target branches will be analyzed.
                      </div>
                  ) : (
                      <div className="flex flex-wrap gap-2">
                          {prPatterns.map((pattern) => {
                              const mainBranch = project.mainBranch || project.ragConfig?.branch || 'main';
                              const isMainBranch = pattern === mainBranch;
                              return (
                                  <TooltipProvider key={pattern}>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                              <Badge
                                                  variant={isMainBranch ? "default" : "secondary"}
                                                  className={`pl-3 ${isMainBranch ? 'pr-3' : 'pr-1'} py-1.5 flex items-center gap-1`}
                                              >
                                                  {isMainBranch && <Lock className="h-3 w-3 mr-1" />}
                                                  <code className="text-xs">{pattern}</code>
                                                  {!isMainBranch && (
                                                      <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-5 w-5 p-0 hover:bg-destructive/20"
                                                          onClick={() => handleRemovePrPattern(pattern)}
                                                          disabled={savingPr}
                                                      >
                                                          <X className="h-3 w-3" />
                                                      </Button>
                                                  )}
                                              </Badge>
                                          </TooltipTrigger>
                                          {isMainBranch && (
                                              <TooltipContent>
                                                  <p>Main branch - cannot be removed</p>
                                              </TooltipContent>
                                          )}
                                      </Tooltip>
                                  </TooltipProvider>
                              );
                          })}
                      </div>
                  )}
              </CardContent>
          </Card>

          <Card className="w-full">
              <CardHeader>
                  <div className="flex items-center space-x-2">
                      <GitBranch className="h-5 w-5" />
                      <div>
                          <CardTitle className="flex items-center gap-2">
                              Branch Push Patterns
                              {savingBranch && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          </CardTitle>
                          <CardDescription>
                              Analyze pushes to branches matching these patterns. Also used for RAG delta indexes when enabled.
                          </CardDescription>
                      </div>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex gap-2">
                      <Input
                          placeholder="Enter pattern (e.g., main, develop)"
                          value={newBranchPattern}
                          onChange={(e) => setNewBranchPattern(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, handleAddBranchPattern)}
                          disabled={loading || savingBranch}
                      />
                      <Button
                          onClick={handleAddBranchPattern}
                          disabled={!newBranchPattern.trim() || loading || savingBranch}
                      >
                          {savingBranch ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                              <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                              </>
                          )}
                      </Button>
                  </div>

                  {branchPatterns.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-muted/30">
                          No patterns configured. All branch pushes will be analyzed.
                      </div>
                  ) : (
                      <div className="flex flex-wrap gap-2">
                          {branchPatterns.map((pattern) => {
                              const mainBranch = project.mainBranch || project.ragConfig?.branch || 'main';
                              const isMainBranch = pattern === mainBranch;
                              return (
                                  <TooltipProvider key={pattern}>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                              <Badge
                                                  variant={isMainBranch ? "default" : "secondary"}
                                                  className={`pl-3 ${isMainBranch ? 'pr-3' : 'pr-1'} py-1.5 flex items-center gap-1`}
                                              >
                                                  {isMainBranch && <Lock className="h-3 w-3 mr-1" />}
                                                  <code className="text-xs">{pattern}</code>
                                                  {!isMainBranch && (
                                                      <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-5 w-5 p-0 hover:bg-destructive/20"
                                                          onClick={() => handleRemoveBranchPattern(pattern)}
                                                          disabled={savingBranch}
                                                      >
                                                          <X className="h-3 w-3" />
                                                      </Button>
                                                  )}
                                              </Badge>
                                          </TooltipTrigger>
                                          {isMainBranch && (
                                              <TooltipContent>
                                                  <p>Main branch - cannot be removed</p>
                                              </TooltipContent>
                                          )}
                                      </Tooltip>
                                  </TooltipProvider>
                              );
                          })}
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
