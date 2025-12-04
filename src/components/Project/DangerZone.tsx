import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Trash2, Unlink, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { projectService, ProjectDTO } from "@/api_service/project/projectService";
import { twoFactorService } from "@/api_service/auth/twoFactorService";
import { useToast } from "@/hooks/use-toast";

interface DangerZoneProps {
  project: ProjectDTO;
  workspaceSlug: string;
  onProjectUpdate?: (project: ProjectDTO) => void;
}

export default function DangerZone({ project, workspaceSlug, onProjectUpdate }: DangerZoneProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [has2FA, setHas2FA] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState<string | null>(null);
  
  // Delete project state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingAction, setPendingAction] = useState<"delete" | "unbind" | null>(null);
  
  // Unbind VCS state
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);

  useEffect(() => {
    check2FAStatus();
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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmText("");
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== project.namespace) {
      toast({
        title: "Error",
        description: "Please type the project namespace correctly to confirm",
        variant: "destructive",
      });
      return;
    }

    if (has2FA) {
      setPendingAction("delete");
      setShowDeleteConfirm(false);
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
      executeDelete();
    }
  };

  const executeDelete = async () => {
    setLoading(true);
    try {
      await projectService.deleteProject(workspaceSlug, project.namespace!);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      navigate("/dashboard/projects");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnbindClick = () => {
    if (has2FA) {
      setPendingAction("unbind");
      setShow2FADialog(true);
      if (twoFactorType === 'EMAIL') {
        twoFactorService.resendEmailCode().catch(() => {});
      }
    } else {
      setShowUnbindConfirm(true);
    }
  };

  const executeUnbind = async () => {
    setLoading(true);
    try {
      const updated = await projectService.unbindRepository(workspaceSlug, project.namespace!);
      toast({
        title: "Success",
        description: "Repository unbound from project",
      });
      onProjectUpdate?.(updated);
      setShowUnbindConfirm(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unbind repository",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      // For now, we'll pass the 2FA code to the action endpoints
      // In a full implementation, the backend should verify the 2FA code
      // before executing destructive actions
      
      if (pendingAction === "delete") {
        await projectService.deleteProjectWithVerification(
          workspaceSlug,
          project.namespace!,
          verificationCode
        );
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
        navigate("/dashboard/projects");
      } else if (pendingAction === "unbind") {
        const updated = await projectService.unbindRepositoryWithVerification(
          workspaceSlug,
          project.namespace!,
          verificationCode
        );
        toast({
          title: "Success",
          description: "Repository unbound from project",
        });
        onProjectUpdate?.(updated);
        setShowUnbindConfirm(false);
      }
      
      setShow2FADialog(false);
      setVerificationCode("");
      setPendingAction(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Operation failed. Please check your verification code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible and destructive actions. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unbind VCS Connection */}
          {project.vcsConnectionId && (
            <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">Disconnect Repository</h4>
                <p className="text-sm text-muted-foreground">
                  Remove the VCS connection from this project. Analysis history will be preserved.
                </p>
                {project.projectVcsWorkspace && project.projectRepoSlug && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Currently connected: <strong>{project.projectVcsWorkspace}/{project.projectRepoSlug}</strong>
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleUnbindClick}
                disabled={loading}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          )}

          {/* Delete Project */}
          <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium">Delete Project</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all its data including analysis history, branches, and settings.
                This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
          </div>

          {has2FA && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>Two-factor authentication is enabled. You'll need to verify your identity for destructive actions.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <strong>{project.name}</strong>? This action will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All code analysis results and history</li>
                <li>All branch data and issues</li>
                <li>All project settings and configurations</li>
                <li>All API tokens associated with this project</li>
              </ul>
              <p className="font-medium">
                Type <code className="bg-muted px-1 py-0.5 rounded">{project.namespace}</code> to confirm:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Enter project namespace"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={loading || deleteConfirmText !== project.namespace}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unbind Confirmation Dialog */}
      <AlertDialog open={showUnbindConfirm} onOpenChange={setShowUnbindConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Repository</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect the repository from this project? 
              Analysis history will be preserved, but you won't be able to run new analyses until you connect a repository again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeUnbind}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2FA Verification Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Verify Your Identity
            </DialogTitle>
            <DialogDescription>
              {twoFactorType === 'EMAIL' 
                ? "Enter the verification code sent to your email"
                : "Enter the code from your authenticator app"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="mt-1"
              />
            </div>

            {twoFactorType === 'EMAIL' && (
              <Button
                variant="link"
                className="px-0 h-auto"
                onClick={handleResendCode}
                disabled={loading}
              >
                Resend verification code
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShow2FADialog(false);
                setVerificationCode("");
                setPendingAction(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handle2FAVerify}
              disabled={loading || !verificationCode}
              variant={pendingAction === "delete" ? "destructive" : "default"}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
