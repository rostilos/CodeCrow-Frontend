import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Users, Mail, CheckCircle2 } from "lucide-react";

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
                        <CardTitle>Permissions & Roles</CardTitle>
                        <CardDescription>Control access to projects and settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            CodeCrow uses a granular permission system to ensure security and proper access control.
                        </p>
                        <div className="grid gap-4">
                            <div className="p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <span className="font-bold">Workspace Owner</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Full control over the workspace, including billing, member management, and workspace deletion.
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <span className="font-bold">Workspace Admin</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Can manage projects, VCS connections, and AI connections. Can invite new members.
                                </p>
                            </div>
                            <div className="p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <span className="font-bold">Member</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Can view projects and participate in code reviews. Limited access to settings.
                                </p>
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

                {/* Placeholder for Screenshot */}
                <div className="border-2 border-dashed border-muted rounded-xl p-12 text-center text-muted-foreground">
                    [ Screenshot Placeholder: Workspace Member Management ]
                </div>
            </div>
        </div>
    );
}
