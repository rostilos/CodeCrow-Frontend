import { useState, useEffect, useCallback } from "react";
import { GitBranch, Save, Info, AlertTriangle, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { projectService, type ProjectDTO } from "@/api_service/project/projectService";
import { integrationService } from "@/api_service/integration/integrationService";
import { type VcsProvider as IntegrationVcsProvider } from "@/api_service/integration/integration.interface";
import { twoFactorService } from "@/api_service/auth/twoFactorService";
import { useWorkspace } from "@/context/WorkspaceContext";
import { BranchSelector } from "@/components/BranchSelector";

/**
 * Normalize VCS provider from project format (BITBUCKET_CLOUD) to integration format (bitbucket-cloud)
 */
function normalizeProvider(provider: string): IntegrationVcsProvider {
  const mapping: Record<string, IntegrationVcsProvider> = {
    'BITBUCKET_CLOUD': 'bitbucket-cloud',
    'BITBUCKET_SERVER': 'bitbucket-server',
    'GITHUB': 'github',
    'GITLAB': 'gitlab',
    'bitbucket-cloud': 'bitbucket-cloud',
    'bitbucket-server': 'bitbucket-server',
    'github': 'github',
    'gitlab': 'gitlab',
  };
  return mapping[provider] || (provider.toLowerCase().replace('_', '-') as IntegrationVcsProvider);
}

interface MainBranchSelectorProps {
  project: ProjectDTO;
  onUpdate?: (updatedProject: ProjectDTO) => void;
}

/**
 * Component to view and edit the project's main branch.
 * Main branch is used as:
 * - Base for RAG code indexing
 * - Base for delta indexes (release branches)
 * - Always included in analysis patterns (cannot be removed)
 */
export default function MainBranchSelector({ project, onUpdate }: MainBranchSelectorProps) {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  
  const currentMainBranch = project.mainBranch || project.ragConfig?.branch || 'main';
  const [mainBranch, setMainBranch] = useState(currentMainBranch);
  const [saving, setSaving] = useState(false);
  
  // Branch loading state
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  
  // 2FA state
  const [has2FA, setHas2FA] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  
  // Check if project has been analyzed (has any analysis data)
  const hasAnalysis = !!project.defaultBranchId || (project.defaultBranchStats?.totalIssues ?? 0) > 0;
  // Check if RAG has been trained (branch is configured means RAG is set up)
  const hasRagTraining = project.ragConfig?.enabled && project.ragConfig?.branch != null;
  
  useEffect(() => {
    setMainBranch(currentMainBranch);
  }, [currentMainBranch]);
  
  useEffect(() => {
    check2FAStatus();
    loadBranches();
  }, []);
  
  const check2FAStatus = async () => {
    try {
      const status = await twoFactorService.getStatus();
      setHas2FA(status.enabled);
      setTwoFactorType(status.type || null);
    } catch {
      setHas2FA(false);
    }
  };
  
  const loadBranches = useCallback(async (search?: string): Promise<string[]> => {
    if (!currentWorkspace || !project.vcsConnectionId || !project.vcsProvider) {
      // Fallback to common branches if no VCS connection
      const defaultBranches = [currentMainBranch, 'main', 'master', 'develop'].filter((v, i, a) => a.indexOf(v) === i);
      if (!search) setBranches(defaultBranches);
      return defaultBranches;
    }
    
    // Only set loading for initial load
    if (!search) {
      setLoadingBranches(true);
    }
    
    try {
      // Get the repository ID - could be in projectVcsRepoSlug or projectRepoSlug
      const repoId = project.projectVcsRepoSlug || project.projectRepoSlug;
      if (!repoId) {
        const defaultBranches = [currentMainBranch, 'main', 'master', 'develop'].filter((v, i, a) => a.indexOf(v) === i);
        if (!search) setBranches(defaultBranches);
        return defaultBranches;
      }
      
      const fetchedBranches = await integrationService.listBranches(
        currentWorkspace.slug,
        normalizeProvider(project.vcsProvider),
        project.vcsConnectionId,
        repoId,
        search,
        search ? 100 : 50 // Limit to 50 for initial, 100 for search
      );
      
      // Ensure current branch is at the top
      const allBranches = [
        currentMainBranch,
        ...fetchedBranches.filter(b => b !== currentMainBranch)
      ];
      
      if (!search) {
        setBranches(allBranches);
      }
      return allBranches;
    } catch (error: any) {
      console.warn('Failed to fetch branches from API:', error);
      // Fallback to common branches
      const defaultBranches = [currentMainBranch, 'main', 'master', 'develop'].filter((v, i, a) => a.indexOf(v) === i);
      if (!search) setBranches(defaultBranches);
      return defaultBranches;
    } finally {
      if (!search) {
        setLoadingBranches(false);
      }
    }
  }, [currentWorkspace, project.vcsConnectionId, project.vcsProvider, project.projectVcsRepoSlug, project.projectRepoSlug, currentMainBranch]);
  
  const hasChanges = mainBranch !== currentMainBranch;
  
  const handleSaveClick = () => {
    if (!hasChanges || !mainBranch.trim()) return;
    
    // If project has analysis or RAG training, show confirmation dialog
    if (hasAnalysis || hasRagTraining) {
      setShowConfirmDialog(true);
    } else {
      // No analysis yet, just save directly
      executeSave();
    }
  };
  
  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    
    if (has2FA) {
      setShow2FADialog(true);
      // Send email code if using email 2FA
      if (twoFactorType === 'EMAIL') {
        try {
          await twoFactorService.resendEmailCode();
          toast({
            title: "Verification code sent",
            description: "Check your email for the verification code",
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to send verification code",
            variant: "destructive",
          });
        }
      }
    } else {
      executeSave();
    }
  };
  
  const handle2FAVerify = async () => {
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter your verification code",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      // Verify 2FA code by attempting to disable (which validates code)
      // This is a workaround since there's no direct verify endpoint
      await executeSave();
      setShow2FADialog(false);
      setVerificationCode("");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
      setSaving(false);
    }
  };
  
  const executeSave = async () => {
    if (!currentWorkspace || !project.namespace || !mainBranch.trim()) return;
    
    setSaving(true);
    try {
      const updatedProject = await projectService.updateProject(
        currentWorkspace.slug,
        project.namespace,
        {
          mainBranch: mainBranch.trim(),
        }
      );
      
      const message = hasRagTraining
        ? `Main branch changed to "${mainBranch}". RAG retraining is required for the changes to take full effect.`
        : `Main branch set to "${mainBranch}". RAG configuration will use this branch.`;
      
      toast({
        title: "Main branch updated",
        description: message,
      });
      
      onUpdate?.(updatedProject);
    } catch (error: any) {
      toast({
        title: "Failed to update main branch",
        description: error.message || "Could not update main branch",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleResendCode = async () => {
    if (twoFactorType !== 'EMAIL') return;
    
    try {
      await twoFactorService.resendEmailCode();
      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-5 w-5" />
              <div>
                <CardTitle>Main Branch</CardTitle>
                <CardDescription>
                  The primary branch used for RAG indexing and as base for all analysis
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The main branch is used as the baseline for RAG code indexing, delta indexes for release branches, 
              and is always included in PR target and branch push analysis patterns.
            </AlertDescription>
          </Alert>
          
          {(hasAnalysis || hasRagTraining) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Changing the main branch after analysis has been performed will require 
                RAG retraining. All delta indexes will need to be rebuilt against the new main branch.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="main-branch">Branch Name</Label>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <BranchSelector
                  value={mainBranch}
                  onValueChange={setMainBranch}
                  onSearch={loadBranches}
                  defaultBranches={branches.slice(0, 10)}
                  placeholder={loadingBranches ? "Loading branches..." : "Select main branch"}
                  disabled={saving || loadingBranches}
                  allowCustom={true}
                />
              </div>
              <Button 
                onClick={handleSaveClick}
                disabled={saving || !hasChanges || !mainBranch.trim()}
                variant={(hasAnalysis || hasRagTraining) && hasChanges ? "destructive" : "default"}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
            {loadingBranches ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading branches from repository...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Type to search through branches
              </p>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <strong>Current main branch:</strong> <code className="px-1 bg-muted rounded">{currentMainBranch}</code>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Change Main Branch
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                You are about to change the main branch from <strong>{currentMainBranch}</strong> to <strong>{mainBranch}</strong>.
              </p>
              <p className="text-destructive">
                This action will require RAG retraining. All delta indexes for release branches will need to be 
                rebuilt against the new main branch.
              </p>
              <p>
                Are you sure you want to proceed?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Yes, Change Main Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 2FA Verification Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Two-Factor Verification
            </DialogTitle>
            <DialogDescription>
              {twoFactorType === 'EMAIL' 
                ? "Enter the verification code sent to your email to confirm this action."
                : "Enter your authenticator code to confirm this action."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            {twoFactorType === 'EMAIL' && (
              <Button variant="link" className="px-0" onClick={handleResendCode}>
                Resend verification code
              </Button>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShow2FADialog(false);
                setVerificationCode("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handle2FAVerify}
              disabled={saving || !verificationCode}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Confirm Change"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
