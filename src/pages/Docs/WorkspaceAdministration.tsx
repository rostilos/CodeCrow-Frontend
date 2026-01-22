import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Users, Mail, CheckCircle2, Crown, Eye, User, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RoleInfo {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  permissions: {
    viewProjects: boolean;
    viewAnalysis: boolean;
    changeIssueStatus: boolean;
    createProjects: boolean;
    manageProjects: boolean;
    manageMembers: boolean;
    manageWorkspace: boolean;
    transferOwnership: boolean;
    deleteWorkspace: boolean;
  };
}

const roles: RoleInfo[] = [
  {
    name: 'OWNER',
    description: 'Full control over the workspace. Can transfer ownership and delete the workspace.',
    icon: <Crown className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    permissions: {
      viewProjects: true,
      viewAnalysis: true,
      changeIssueStatus: true,
      createProjects: true,
      manageProjects: true,
      manageMembers: true,
      manageWorkspace: true,
      transferOwnership: true,
      deleteWorkspace: true,
    },
  },
  {
    name: 'ADMIN',
    description: 'Can manage workspace settings and members. Cannot transfer ownership or delete workspace.',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    permissions: {
      viewProjects: true,
      viewAnalysis: true,
      changeIssueStatus: true,
      createProjects: true,
      manageProjects: true,
      manageMembers: true,
      manageWorkspace: true,
      transferOwnership: false,
      deleteWorkspace: false,
    },
  },
  {
    name: 'REVIEWER',
    description: 'Can review code and manage issue statuses. Ideal for code reviewers and QA.',
    icon: <Eye className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    permissions: {
      viewProjects: true,
      viewAnalysis: true,
      changeIssueStatus: true,
      createProjects: false,
      manageProjects: false,
      manageMembers: false,
      manageWorkspace: false,
      transferOwnership: false,
      deleteWorkspace: false,
    },
  },
  {
    name: 'MEMBER',
    description: 'Basic access to view projects and analysis results. Read-only access.',
    icon: <User className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    permissions: {
      viewProjects: true,
      viewAnalysis: true,
      changeIssueStatus: false,
      createProjects: false,
      manageProjects: false,
      manageMembers: false,
      manageWorkspace: false,
      transferOwnership: false,
      deleteWorkspace: false,
    },
  },
];

const permissionLabels: Record<string, string> = {
  viewProjects: 'View Projects',
  viewAnalysis: 'View Analysis Results',
  changeIssueStatus: 'Change Issue Status (Resolved/Open)',
  createProjects: 'Create Projects',
  manageProjects: 'Manage Projects',
  manageMembers: 'Manage Members',
  manageWorkspace: 'Workspace Settings',
  transferOwnership: 'Transfer Ownership',
  deleteWorkspace: 'Delete Workspace',
};

export default function WorkspaceAdministration() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="mb-8">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    <UserPlus className="mr-2 h-4 w-4 inline" />
                    Administration
                </Badge>
                <h1 className="text-4xl font-bold mb-4">Workspace Administration</h1>
                <p className="text-xl text-muted-foreground">
                    Manage your team, invite collaborators, and configure role-based permissions at the workspace level.
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Member Management</CardTitle>
                        <CardDescription>Invite and collaborate with your team</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Workspaces allow you to group projects and collaborate with other users.
                            Invite members via email to give them access to your workspace.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <Mail className="h-5 w-5 text-primary mr-2 mt-0.5" />
                                <div>
                                    <span className="font-semibold block text-foreground">Email Invitations</span>
                                    <span className="text-sm text-muted-foreground">Send invitations to team members. They will receive an email to join the workspace.</span>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <Users className="h-5 w-5 text-primary mr-2 mt-0.5" />
                                <div>
                                    <span className="font-semibold block text-foreground">Active Members List</span>
                                    <span className="text-sm text-muted-foreground">View all users in the workspace and manage their status.</span>
                                </div>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Workspace Roles</CardTitle>
                        <CardDescription>Understanding role hierarchy and permissions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-muted-foreground">
                            CodeCrow uses a granular permission system with four distinct roles.
                            The hierarchy from highest to lowest is: <strong>Owner → Admin → Reviewer → Member</strong>
                        </p>
                        
                        {/* Role Cards */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {roles.map((role) => (
                                <div key={role.name} className="p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        {role.icon}
                                        <Badge className={role.color}>{role.name}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{role.description}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Permissions Matrix */}
                <Card>
                    <CardHeader>
                        <CardTitle>Permissions Matrix</CardTitle>
                        <CardDescription>Detailed comparison of permissions across roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Permission</TableHead>
                                        {roles.map((role) => (
                                            <TableHead key={role.name} className="text-center">
                                                <Badge className={role.color}>{role.name}</Badge>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(permissionLabels).map(([key, label]) => (
                                        <TableRow key={key}>
                                            <TableCell className="font-medium">{label}</TableCell>
                                            {roles.map((role) => (
                                                <TableCell key={`${role.name}-${key}`} className="text-center">
                                                    {role.permissions[key as keyof typeof role.permissions] ? (
                                                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-red-400 mx-auto" />
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Key Role Differences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Eye className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold">Reviewer vs Member</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    The key difference between <Badge className="bg-green-100 text-green-800">REVIEWER</Badge> and 
                                    <Badge className="bg-blue-100 text-blue-800 ml-1">MEMBER</Badge> is that Reviewers can 
                                    <strong> change issue statuses</strong> (mark as resolved/open). This makes the Reviewer role 
                                    ideal for code reviewers, QA engineers, and team leads who need to manage analysis findings.
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Crown className="h-4 w-4 text-purple-600" />
                                    <span className="font-semibold">Owner Exclusive Actions</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Only the workspace <Badge className="bg-purple-100 text-purple-800">OWNER</Badge> can:
                                </p>
                                <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
                                    <li>Transfer ownership to another member</li>
                                    <li>Permanently delete the workspace</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Workspace Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                                <span><strong>Default AI Settings</strong>: Configure default AI providers for new projects.</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                                <span><strong>VCS Connections</strong>: Shared VCS connections accessible by all projects in the workspace.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
