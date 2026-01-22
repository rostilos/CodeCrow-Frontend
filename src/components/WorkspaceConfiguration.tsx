import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Mail, Shield, Bell, Construction } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function WorkspaceConfiguration() {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Construction className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configuration Options Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              Advanced workspace configuration options are currently in development. 
              Check back soon for new features!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications - Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              <div>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Configure email notifications for workspace events
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 opacity-50 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analysis Completion</Label>
              <p className="text-sm text-muted-foreground">
                Notify members when code analysis completes
              </p>
            </div>
            <Switch disabled />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Member Joined</Label>
              <p className="text-sm text-muted-foreground">
                Notify admins when new members join the workspace
              </p>
            </div>
            <Switch disabled />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">
                Send weekly summary of workspace activity
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings - Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              <div>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security requirements for workspace members
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 opacity-50 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Force all workspace members to enable two-factor authentication
              </p>
            </div>
            <Switch disabled />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out inactive users after specified time
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Default Project Settings - Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              <div>
                <CardTitle>Default Project Settings</CardTitle>
                <CardDescription>
                  Set defaults for new projects in this workspace
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 opacity-50 pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-enable RAG</Label>
              <p className="text-sm text-muted-foreground">
                Automatically enable RAG analysis for new projects
              </p>
            </div>
            <Switch disabled />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Default AI Provider</Label>
              <p className="text-sm text-muted-foreground">
                Set the default AI provider for new projects
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
