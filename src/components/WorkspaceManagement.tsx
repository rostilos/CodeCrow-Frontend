import { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, Trash2, Copy, CheckCircle, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { workspaceService, WorkspaceMemberDTO, InviteRequest, ChangeRoleRequest, RemoveMemberRequest } from '@/api_service/workspace/workspaceService';
import { authService } from '@/api_service/auth/authService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function WorkspaceManagement() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newInvite, setNewInvite] = useState<InviteRequest>({
    username: '',
    role: 'MEMBER'
  });
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'MEMBER'
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMemberDTO | null>(null);
  const [newRole, setNewRole] = useState<string>('MEMBER');

  const loadMembers = async () => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      const workspaceMembers = await workspaceService.getWorkspaceMembers(currentWorkspace.slug);
      setMembers(workspaceMembers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load workspace members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [currentWorkspace]);

  const handleInviteUser = async () => {
    if (!currentWorkspace || !newInvite.username) return;

    try {
      await workspaceService.inviteToWorkspace(currentWorkspace.slug, newInvite);
      toast({
        title: "Success",
        description: "User invited to workspace successfully"
      });
      setInviteDialogOpen(false);
      setNewInvite({ username: '', role: 'MEMBER' });
      await loadMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to invite user",
        variant: "destructive"
      });
    }
  };

  const handleRegisterAndInvite = async () => {
    if (!currentWorkspace || !newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRegistering(true);
      
      // Register the new user
      await authService.register({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password
      });

      // Invite the newly registered user to the workspace
      await workspaceService.inviteToWorkspace(currentWorkspace.slug, {
        username: newUser.username,
        role: newUser.role
      });

      toast({
        title: "Success",
        description: "User registered and invited to workspace successfully"
      });
      
      setInviteDialogOpen(false);
      setNewUser({ username: '', email: '', password: '', role: 'MEMBER' });
      await loadMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to register and invite user",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleChangeRole = async () => {
    if (!currentWorkspace || !selectedMember) return;

    try {
      await workspaceService.changeRole(currentWorkspace.slug, {
        username: selectedMember.username,
        newRole: newRole as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
      });
      toast({
        title: "Success",
        description: "User role changed successfully"
      });
      setChangeRoleDialogOpen(false);
      setSelectedMember(null);
      await loadMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to change user role",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (member: WorkspaceMemberDTO) => {
    if (!currentWorkspace) return;

    try {
      await workspaceService.removeMember(currentWorkspace.slug, {
        username: member.username
      });
      toast({
        title: "Success",
        description: `${member.username} has been removed from the workspace`
      });
      await loadMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const openChangeRoleDialog = (member: WorkspaceMemberDTO) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setChangeRoleDialogOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'member': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              <div>
                <CardTitle>Workspace Members</CardTitle>
                <CardDescription>
                  Manage workspace members and their permissions
                </CardDescription>
              </div>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add User to Workspace</DialogTitle>
                  <DialogDescription>
                    Invite an existing user or register a new user to your workspace.
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="invite" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="invite">Invite Existing</TabsTrigger>
                    <TabsTrigger value="register">Register New</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="invite" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter username"
                        value={newInvite.username || ''}
                        onChange={(e) => setNewInvite({
                          ...newInvite,
                          username: e.target.value || ''
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="invite-role">Role</Label>
                      <Select
                        value={newInvite.role}
                        onValueChange={(role) => setNewInvite({ ...newInvite, role })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleInviteUser} disabled={!newInvite.username}>
                        Send Invite
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="new-username">Username</Label>
                      <Input
                        id="new-username"
                        type="text"
                        placeholder="Enter username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-email">Email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        placeholder="Enter email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(role) => setNewUser({ ...newUser, role })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleRegisterAndInvite} 
                        disabled={!newUser.username || !newUser.email || !newUser.password || isRegistering}
                      >
                        {isRegistering ? "Registering..." : "Register & Invite"}
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Members Found</h3>
                <p className="text-muted-foreground">Start by inviting users to your workspace.</p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatarUrl} alt={member.username} referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.username ? member.username.charAt(0).toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{member.username || 'Unknown User'}</h4>
                      <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRoleColor(member.role)}>
                      {member.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openChangeRoleDialog(member)}
                    >
                      <UserCog className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedMember?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="change-role">New Role</Label>
              <Select
                value={newRole}
                onValueChange={setNewRole}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}