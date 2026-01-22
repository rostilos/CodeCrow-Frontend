import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, AlertTriangle, Clock, CheckCircle, XCircle, Loader2, Trash2, CalendarClock, Undo2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { workspaceService, WorkspaceMemberDTO, OwnershipTransferDTO, DeletionStatusDTO } from '@/api_service/workspace/workspaceService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { usePermissions } from '@/hooks/usePermissions';

export default function WorkspaceDangerZone() {
  const navigate = useNavigate();
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const { isWorkspaceOwner } = usePermissions();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [pendingTransfer, setPendingTransfer] = useState<OwnershipTransferDTO | null>(null);
  const [transferHistory, setTransferHistory] = useState<OwnershipTransferDTO[]>([]);
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatusDTO | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Transfer ownership state
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  
  // Delete workspace state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteWarningDialogOpen, setDeleteWarningDialogOpen] = useState(false);
  const [cancelDeleteDialogOpen, setCancelDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteTwoFactorCode, setDeleteTwoFactorCode] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      const [membersData, pending, history, deletion] = await Promise.all([
        workspaceService.getWorkspaceMembers(currentWorkspace.slug),
        workspaceService.getPendingOwnershipTransfer(currentWorkspace.slug),
        workspaceService.getOwnershipTransferHistory(currentWorkspace.slug),
        workspaceService.getDeletionStatus(currentWorkspace.slug),
      ]);
      
      setMembers(membersData.filter(m => m.role !== 'OWNER'));
      setPendingTransfer(pending);
      setTransferHistory(history.filter(t => t.status !== 'PENDING'));
      setDeletionStatus(deletion);
    } catch (error: any) {
      console.error('Failed to load transfer data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWorkspace]);

  const handleInitiateTransfer = async () => {
    if (!currentWorkspace || !selectedUserId || !twoFactorCode) return;

    try {
      setIsSubmitting(true);
      await workspaceService.initiateOwnershipTransfer(currentWorkspace.slug, {
        targetUserId: parseInt(selectedUserId),
        twoFactorCode,
      });
      
      toast({
        title: "Success",
        description: "Ownership transfer initiated. The new owner must accept within 24 hours."
      });
      
      setInitiateDialogOpen(false);
      setSelectedUserId('');
      setTwoFactorCode('');
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to initiate transfer",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTransfer = async () => {
    if (!currentWorkspace || !pendingTransfer) return;

    try {
      setIsSubmitting(true);
      await workspaceService.cancelOwnershipTransfer(
        currentWorkspace.slug, 
        pendingTransfer.id,
        cancelReason ? { reason: cancelReason } : undefined
      );
      
      toast({
        title: "Success",
        description: "Ownership transfer cancelled"
      });
      
      setCancelDialogOpen(false);
      setCancelReason('');
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to cancel transfer",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTransfer = async () => {
    if (!currentWorkspace || !pendingTransfer) return;

    try {
      setIsSubmitting(true);
      await workspaceService.completeOwnershipTransfer(
        currentWorkspace.slug, 
        pendingTransfer.id
      );
      
      toast({
        title: "Success",
        description: "You are now the workspace owner!"
      });
      
      await loadData();
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to complete transfer",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace || deleteConfirmation !== currentWorkspace.slug) return;

    try {
      setIsSubmitting(true);
      await workspaceService.scheduleWorkspaceDeletion(currentWorkspace.slug, {
        confirmationSlug: deleteConfirmation,
        twoFactorCode: deleteTwoFactorCode,
      });
      
      toast({
        title: "Deletion Scheduled",
        description: "The workspace will be permanently deleted in 7 days. You can cancel this within that period."
      });
      
      setDeleteDialogOpen(false);
      setDeleteConfirmation('');
      setDeleteTwoFactorCode('');
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to schedule deletion",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!currentWorkspace) return;

    try {
      setIsSubmitting(true);
      await workspaceService.cancelWorkspaceDeletion(currentWorkspace.slug);
      
      toast({
        title: "Deletion Cancelled",
        description: "The workspace deletion has been cancelled."
      });
      
      setCancelDeleteDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to cancel deletion",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isOwner = isWorkspaceOwner();

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Danger Zone</AlertTitle>
        <AlertDescription>
          Actions in this section can have irreversible consequences. Please proceed with caution.
        </AlertDescription>
      </Alert>

      {/* Pending Transfer Alert - for new owner */}
      {pendingTransfer && !isOwner && pendingTransfer.canBeCompleted && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <Crown className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Ownership Transfer Pending
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            <p className="mb-3">
              You have been selected to become the new owner of this workspace.
              This transfer expires on {formatDate(pendingTransfer.expiresAt)}.
            </p>
            <Button onClick={handleCompleteTransfer} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Crown className="h-4 w-4 mr-2" />}
              Accept Ownership
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Transfer Ownership Card - for current owner */}
      {isOwner && (
        <Card className="border-destructive/30">
          <CardHeader>
            <div className="flex items-center">
              <Crown className="mr-2 h-5 w-5 text-destructive" />
              <div>
                <CardTitle>Transfer Ownership</CardTitle>
                <CardDescription>
                  Transfer workspace ownership to another member
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingTransfer ? (
              <div className="space-y-4">
                <Alert variant="default" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                    Transfer In Progress
                  </AlertTitle>
                  <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                    <p>
                      You initiated a transfer to <strong>{pendingTransfer.toUsername}</strong>.
                    </p>
                    <p className="mt-1 text-sm">
                      Expires: {formatDate(pendingTransfer.expiresAt)}
                    </p>
                  </AlertDescription>
                </Alert>
                
                {pendingTransfer.canBeCancelled && (
                  <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Transfer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Ownership Transfer</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel the transfer to {pendingTransfer.toUsername}?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cancel-reason">Reason (optional)</Label>
                          <Textarea
                            id="cancel-reason"
                            placeholder="Enter reason for cancellation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                          Keep Transfer
                        </Button>
                        <Button variant="destructive" onClick={handleCancelTransfer} disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Cancel Transfer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Transferring ownership will give another user full control of this workspace, 
                  including the ability to delete it. This action requires 2FA verification.
                </p>

                {members.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No eligible members</AlertTitle>
                    <AlertDescription>
                      There are no other members in this workspace to transfer ownership to.
                      Invite members first.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Dialog open={initiateDialogOpen} onOpenChange={setInitiateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                        <Crown className="h-4 w-4 mr-2" />
                        Transfer Ownership
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Transfer Workspace Ownership</DialogTitle>
                        <DialogDescription>
                          Select a member to transfer ownership. They must accept within 24 hours.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-owner">New Owner</Label>
                          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((member) => (
                                <SelectItem key={member.id} value={member.id.toString()}>
                                  {member.username} ({member.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="2fa-code">2FA Code</Label>
                          <Input
                            id="2fa-code"
                            type="text"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setInitiateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleInitiateTransfer} 
                          disabled={!selectedUserId || twoFactorCode.length !== 6 || isSubmitting}
                        >
                          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Transfer Ownership
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Workspace Card - for owner only */}
      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center">
              <Trash2 className="mr-2 h-5 w-5 text-destructive" />
              <div>
                <CardTitle className="text-destructive">Delete Workspace</CardTitle>
                <CardDescription>
                  {deletionStatus?.isScheduledForDeletion 
                    ? "This workspace is scheduled for deletion"
                    : "Permanently delete this workspace and all its data"
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {deletionStatus?.isScheduledForDeletion ? (
              /* Scheduled for deletion - show cancel option */
              <div className="space-y-4">
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                  <CalendarClock className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800 dark:text-orange-200">
                    Deletion Scheduled
                  </AlertTitle>
                  <AlertDescription className="text-orange-700 dark:text-orange-300">
                    <p>
                      This workspace is scheduled to be permanently deleted on{' '}
                      <strong>{formatDate(deletionStatus.scheduledDeletionAt!)}</strong>.
                    </p>
                    <p className="mt-1 text-sm">
                      All projects, analysis history, connections, and member data will be permanently removed.
                    </p>
                  </AlertDescription>
                </Alert>

                <Dialog open={cancelDeleteDialogOpen} onOpenChange={setCancelDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950">
                      <Undo2 className="h-4 w-4 mr-2" />
                      Cancel Deletion
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Workspace Deletion</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel the scheduled deletion of this workspace?
                      </DialogDescription>
                    </DialogHeader>
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        Your workspace and all its data will be preserved.
                      </AlertDescription>
                    </Alert>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCancelDeleteDialogOpen(false)}>
                        Keep Scheduled
                      </Button>
                      <Button 
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleCancelDeletion} 
                        disabled={isSubmitting}
                      >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Cancel Deletion
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              /* Not scheduled - show delete option */
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>This action has serious consequences</AlertTitle>
                  <AlertDescription>
                    Deleting this workspace will permanently remove:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All projects and their configurations</li>
                      <li>All analysis history and results</li>
                      <li>All VCS and AI connections</li>
                      <li>All member associations</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* First warning dialog */}
                <Dialog open={deleteWarningDialogOpen} onOpenChange={setDeleteWarningDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Are you absolutely sure?
                      </DialogTitle>
                    </DialogHeader>
                    <Alert variant="destructive" className="my-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Warning!</AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">
                          You are about to schedule the deletion of workspace <strong>"{currentWorkspace?.name}"</strong>.
                        </p>
                        <p className="mb-2">
                          The workspace will be permanently deleted after a <strong>7-day grace period</strong>.
                          During this time, you can cancel the deletion.
                        </p>
                        <p className="font-semibold text-destructive">
                          After 7 days, all data will be permanently lost and cannot be recovered!
                        </p>
                      </AlertDescription>
                    </Alert>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteWarningDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          setDeleteWarningDialogOpen(false);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        I understand, continue
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Confirmation dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-destructive">Confirm Workspace Deletion</DialogTitle>
                      <DialogDescription>
                        Please type <strong>{currentWorkspace?.slug}</strong> and enter your 2FA code to confirm.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                        <CalendarClock className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-700 dark:text-orange-300">
                          The workspace will be scheduled for deletion and permanently removed after 7 days.
                        </AlertDescription>
                      </Alert>
                      <div>
                        <Label htmlFor="confirm-slug">Type workspace slug to confirm</Label>
                        <Input
                          id="confirm-slug"
                          type="text"
                          placeholder={currentWorkspace?.slug}
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="delete-2fa-code">2FA Code</Label>
                        <Input
                          id="delete-2fa-code"
                          type="text"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          value={deleteTwoFactorCode}
                          onChange={(e) => setDeleteTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeleteConfirmation('');
                        setDeleteTwoFactorCode('');
                      }}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={handleDeleteWorkspace} 
                        disabled={deleteConfirmation !== currentWorkspace?.slug || deleteTwoFactorCode.length !== 6 || isSubmitting}
                      >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Schedule Deletion
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transfer History */}
      {transferHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transfer History</CardTitle>
            <CardDescription>
              Previous ownership transfer records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transferHistory.map((transfer) => (
                <div 
                  key={transfer.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {transfer.fromUsername} → {transfer.toUsername}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transfer.initiatedAt)}
                    </p>
                  </div>
                  {getStatusBadge(transfer.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info for non-owners */}
      {!isOwner && !pendingTransfer && (
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Restricted Access</CardTitle>
                <CardDescription>
                  Only the workspace owner can perform actions in the Danger Zone
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Contact the workspace owner if you need ownership transferred or 
              the workspace deleted.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
