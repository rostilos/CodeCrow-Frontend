import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Lock, Key, Server, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function APIReference() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Reference</h1>
            <p className="text-muted-foreground mt-1">
              REST API documentation for CodeCrow web server
            </p>
          </div>
        </div>
      </div>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="bg-muted px-3 py-2 rounded-lg block text-sm">
            https://codecrow.example.com/api/v1
          </code>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Authentication</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            All API requests require authentication using JWT tokens obtained from the login endpoint.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
            <pre className="text-xs">{`Authorization: Bearer <jwt-token>`}</pre>
          </div>
          
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold text-sm">Login</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500">POST</Badge>
              <code className="text-sm">/auth/login</code>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
              <pre className="text-xs">{`{
  "username": "user@example.com",
  "password": "password123"
}`}</pre>
            </div>
            <p className="text-sm text-muted-foreground">
              Returns: <code className="bg-muted px-1 rounded">{"{ token, refreshToken, user }"}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EndpointItem
                method="POST"
                path="/auth/register"
                description="Register a new user"
                body={`{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword"
}`}
              />
              <EndpointItem
                method="GET"
                path="/users/me"
                description="Get current user profile"
                auth
              />
              <EndpointItem
                method="PUT"
                path="/users/me"
                description="Update current user profile"
                auth
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspaces */}
        <TabsContent value="workspaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EndpointItem
                method="GET"
                path="/workspaces"
                description="List all workspaces for current user"
                auth
              />
              <EndpointItem
                method="POST"
                path="/workspaces"
                description="Create a new workspace"
                auth
                body={`{
  "name": "My Workspace",
  "description": "Team workspace"
}`}
              />
              <EndpointItem
                method="GET"
                path="/workspaces/:id"
                description="Get workspace details"
                auth
              />
              <EndpointItem
                method="PUT"
                path="/workspaces/:id"
                description="Update workspace"
                auth
              />
              <EndpointItem
                method="DELETE"
                path="/workspaces/:id"
                description="Delete workspace"
                auth
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EndpointItem
                method="GET"
                path="/workspaces/:workspaceId/projects"
                description="List all projects in a workspace"
                auth
              />
              <EndpointItem
                method="POST"
                path="/workspaces/:workspaceId/projects"
                description="Create a new project"
                auth
                body={`{
  "name": "my-project",
  "description": "Project description",
  "repositoryUrl": "https://bitbucket.org/workspace/repo",
  "defaultBranch": "main"
}`}
              />
              <EndpointItem
                method="GET"
                path="/projects/:id"
                description="Get project details"
                auth
              />
              <EndpointItem
                method="GET"
                path="/projects/:id/issues"
                description="Get all issues for a project"
                auth
              />
              <EndpointItem
                method="POST"
                path="/projects/:id/tokens"
                description="Generate project webhook token"
                auth
              />
              <EndpointItem
                method="GET"
                path="/:workspaceSlug/project/:namespace/branch-analysis-config"
                description="Get branch analysis configuration for filtering webhooks"
                auth
              />
              <EndpointItem
                method="PUT"
                path="/:workspaceSlug/project/:namespace/branch-analysis-config"
                description="Update branch analysis configuration (patterns for PR/branch filtering)"
                auth
                body={`{
  "prTargetBranches": ["main", "develop", "release/*"],
  "branchPushPatterns": ["main", "develop"]
}`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EndpointItem
                method="GET"
                path="/projects/:id/analyses"
                description="List all analyses for a project"
                auth
              />
              <EndpointItem
                method="GET"
                path="/analyses/:id"
                description="Get analysis details with issues"
                auth
              />
              <EndpointItem
                method="GET"
                path="/branches/:id/issues"
                description="Get branch issues"
                auth
              />
              <EndpointItem
                method="GET"
                path="/pull-requests/:id/issues"
                description="Get pull request issues"
                auth
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <CardTitle>Webhook Endpoints</CardTitle>
              </div>
              <CardDescription>
                Endpoints for receiving Bitbucket webhooks (Pipeline Agent)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Webhook endpoints run on port 8082 (Pipeline Agent)</span>
              </div>
              
              <EndpointItem
                method="POST"
                path="/api/v1/bitbucket-cloud/webhook"
                description="Receive Bitbucket webhooks (PR created, PR updated, repo push)"
                body={`Headers:
Authorization: Bearer <project-token>
X-Event-Key: pullrequest:created | pullrequest:updated | repo:push
X-Hook-UUID: <webhook-uuid>`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Response Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Response Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <ResponseCode code="200" description="Success" color="green" />
            <ResponseCode code="201" description="Created" color="green" />
            <ResponseCode code="400" description="Bad Request - Invalid input" color="amber" />
            <ResponseCode code="401" description="Unauthorized - Missing or invalid token" color="red" />
            <ResponseCode code="403" description="Forbidden - Insufficient permissions" color="red" />
            <ResponseCode code="404" description="Not Found - Resource doesn't exist" color="amber" />
            <ResponseCode code="409" description="Conflict - Resource already exists" color="amber" />
            <ResponseCode code="500" description="Internal Server Error" color="red" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EndpointItemProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  auth?: boolean;
  body?: string;
}

function EndpointItem({ method, path, description, auth, body }: EndpointItemProps) {
  const methodColors = {
    GET: "bg-blue-500",
    POST: "bg-green-500",
    PUT: "bg-amber-500",
    DELETE: "bg-red-500",
    PATCH: "bg-purple-500",
  };

  return (
    <div className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3 mb-2">
        <Badge className={methodColors[method]}>{method}</Badge>
        <code className="text-sm font-medium">{path}</code>
        {auth && <Badge variant="outline" className="text-xs">Auth Required</Badge>}
      </div>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      {body && (
        <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs mt-2">
          <pre className="whitespace-pre-wrap">{body}</pre>
        </div>
      )}
    </div>
  );
}

function ResponseCode({ code, description, color }: { code: string; description: string; color: "green" | "amber" | "red" }) {
  const colors = {
    green: "text-green-500",
    amber: "text-amber-500",
    red: "text-red-500",
  };

  return (
    <div className="flex items-center gap-3 py-1">
      <code className={`font-bold ${colors[color]}`}>{code}</code>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
  );
}
