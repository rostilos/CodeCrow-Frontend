import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Briefcase, Info, CheckCircle2 } from "lucide-react";

import { DocNavigation } from "./DocNavigation";

export default function CreateWorkspace() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <Briefcase className="mr-2 h-4 w-4 inline" />
          Step 1
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Create Workspace</h1>
        <p className="text-xl text-muted-foreground">
          A workspace is your team's central hub for managing projects, code reviews, and collaborations.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What is a Workspace?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Workspaces allow you to organize projects, invite team members, and manage permissions.
              Each workspace can have multiple projects, VCS connections, and AI configurations.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Organize multiple projects under one workspace</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Invite team members with role-based access control</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Share VCS and AI connections across projects</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
            <CardDescription>Follow these steps to create your first workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">1. Navigate to Workspace Selection</h4>
                <p className="text-sm text-muted-foreground">
                  After logging in, if you don't have any workspaces, you'll be automatically redirected to the workspace selection page.
                  Otherwise, click on the workspace switcher in the sidebar.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">2. Click "Create New Workspace"</h4>
                <p className="text-sm text-muted-foreground">
                  Click the "Create New Workspace" button to open the workspace creation dialog.
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">3. Enter Workspace Details</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Provide the following information:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Name</strong>: A unique name for your workspace (e.g., "My Company", "Team Alpha")</li>
                  <li>• <strong>Description</strong> (optional): Brief description of the workspace purpose</li>
                </ul>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">4. Submit and Start Using</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Create Workspace" to finalize. You'll be automatically redirected to your new workspace dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Endpoint</CardTitle>
            <CardDescription>For integration and automation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm space-y-2">
              <div className="text-primary font-semibold">POST /workspace/create</div>
              <div className="text-muted-foreground">Request Body:</div>
              <pre className="text-xs overflow-x-auto">
                {`{
  "name": "string",
  "description": "string" (optional)
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> The user who creates the workspace automatically becomes the OWNER with full administrative privileges.
            You can invite other team members and assign roles (ADMIN, MEMBER, VIEWER) after creation.
          </AlertDescription>
        </Alert>

        <DocNavigation
          prev={{ title: "Overview", url: "/docs" }}
          next={{ title: "Connect VCS", url: "/docs/vcs-connection" }}
        />
      </div>
    </div>
  );
}
