import { useState, useEffect, useMemo } from "react";
import { Save, MessageSquare, Shield, Clock, AlertTriangle, Info, Users, RefreshCw, Trash2, UserPlus, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { 
  projectService, 
  ProjectDTO, 
  CommentCommandsConfigDTO, 
  CommandAuthorizationMode,
  AllowedUserDTO
} from "@/api_service/project/projectService";

interface CommentCommandsConfigProps {
  project: ProjectDTO;
  onUpdate: (updatedProject: ProjectDTO) => void;
}

const AVAILABLE_COMMANDS = [
  { id: "analyze", label: "Analyze", description: "Trigger PR analysis" },
  { id: "summarize", label: "Summarize", description: "Generate PR summary with diagrams" },
  { id: "ask", label: "Ask", description: "Answer questions about code/analysis" },
];

const AUTHORIZATION_MODES: { value: CommandAuthorizationMode; label: string; description: string }[] = [
  { value: "ANYONE", label: "Anyone", description: "Any user who can comment can execute commands (use with caution for public repos)" },
  { value: "PR_AUTHOR_ONLY", label: "PR Author Only", description: "Only the author of the PR can execute commands" },
  { value: "ALLOWED_USERS_ONLY", label: "Allowed Users Only", description: "Only users explicitly added to the allowed list can execute commands" },
];

export default function CommentCommandsConfig({ project, onUpdate }: CommentCommandsConfigProps) {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [rateLimit, setRateLimit] = useState(10);
  const [rateLimitWindow, setRateLimitWindow] = useState(60);
  const [allowPublicRepoCommands, setAllowPublicRepoCommands] = useState(false);
  const [allowedCommands, setAllowedCommands] = useState<string[]>(["analyze", "summarize", "ask"]);
  const [authorizationMode, setAuthorizationMode] = useState<CommandAuthorizationMode>("ALLOWED_USERS_ONLY");
  const [allowPrAuthor, setAllowPrAuthor] = useState(true);
  
  // Allowed users state
  const [allowedUsers, setAllowedUsers] = useState<AllowedUserDTO[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [syncingUsers, setSyncingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  // Filter allowed users based on search query
  const filteredAllowedUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return allowedUsers;
    const query = userSearchQuery.toLowerCase();
    return allowedUsers.filter(user => 
      user.vcsUsername?.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query) ||
      user.vcsUserId?.toLowerCase().includes(query)
    );
  }, [allowedUsers, userSearchQuery]);
  
  // Check if App integration is available (includes OAuth which now also has webhooks)
  const isAppIntegration = project.vcsConnectionType === 'APP' || 
                           project.vcsConnectionType === 'CONNECT_APP' ||
                           project.vcsConnectionType === 'GITHUB_APP' ||
                           project.vcsConnectionType === 'OAUTH_MANUAL';
  
  useEffect(() => {
    if (project.commentCommandsConfig) {
      const config = project.commentCommandsConfig;
      setEnabled(config.enabled);
      setRateLimit(config.rateLimit ?? 10);
      setRateLimitWindow(config.rateLimitWindowMinutes ?? 60);
      setAllowPublicRepoCommands(config.allowPublicRepoCommands ?? false);
      setAllowedCommands(config.allowedCommands ?? ["analyze", "summarize", "ask"]);
      setAuthorizationMode(config.authorizationMode ?? "ALLOWED_USERS_ONLY");
      setAllowPrAuthor(config.allowPrAuthor ?? true);
    }
  }, [project.commentCommandsConfig]);
  
  // Load allowed users when mode is ALLOWED_USERS_ONLY
  useEffect(() => {
    if (enabled && authorizationMode === "ALLOWED_USERS_ONLY" && currentWorkspace && project.namespace) {
      loadAllowedUsers();
    }
  }, [enabled, authorizationMode, currentWorkspace, project.namespace]);
  
  const loadAllowedUsers = async () => {
    if (!currentWorkspace || !project.namespace) return;
    
    setLoadingUsers(true);
    try {
      const response = await projectService.getAllowedUsers(currentWorkspace.slug, project.namespace);
      setAllowedUsers(response.users);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load allowed users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const syncUsersFromVcs = async () => {
    if (!currentWorkspace || !project.namespace) return;
    
    setSyncingUsers(true);
    try {
      const result = await projectService.syncAllowedUsersFromVcs(currentWorkspace.slug, project.namespace);
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `Added ${result.added} users, updated ${result.updated} users`,
        });
        await loadAllowedUsers();
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync users from VCS",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to sync users",
        variant: "destructive",
      });
    } finally {
      setSyncingUsers(false);
    }
  };
  
  const removeUser = async (vcsUserId: string) => {
    if (!currentWorkspace || !project.namespace) return;
    
    try {
      await projectService.removeAllowedUser(currentWorkspace.slug, project.namespace, vcsUserId);
      setAllowedUsers(allowedUsers.filter(u => u.vcsUserId !== vcsUserId));
      toast({
        title: "Success",
        description: "User removed from allowed list",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to remove user",
        variant: "destructive",
      });
    }
  };
  
  const toggleUserEnabled = async (user: AllowedUserDTO) => {
    if (!currentWorkspace || !project.namespace) return;
    
    try {
      const updated = await projectService.setAllowedUserEnabled(
        currentWorkspace.slug, 
        project.namespace, 
        user.vcsUserId, 
        !user.enabled
      );
      setAllowedUsers(allowedUsers.map(u => u.vcsUserId === user.vcsUserId ? updated : u));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };
  
  const handleSave = async () => {
    if (!currentWorkspace || !project.namespace) return;
    
    setLoading(true);
    try {
      const updatedProject = await projectService.updateCommentCommandsConfig(
        currentWorkspace.slug,
        project.namespace,
        {
          enabled,
          rateLimit,
          rateLimitWindowMinutes: rateLimitWindow,
          allowPublicRepoCommands,
          allowedCommands: allowedCommands.length === AVAILABLE_COMMANDS.length ? undefined : allowedCommands,
          authorizationMode,
          allowPrAuthor,
        }
      );
      
      onUpdate(updatedProject);
      toast({
        title: "Success",
        description: "Comment commands configuration saved successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCommandToggle = (commandId: string, checked: boolean) => {
    if (checked) {
      setAllowedCommands([...allowedCommands, commandId]);
    } else {
      setAllowedCommands(allowedCommands.filter(c => c !== commandId));
    }
  };
  
  if (!isAppIntegration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comment Commands
          </CardTitle>
          <CardDescription>
            Trigger analysis and interact with CodeCrow via PR comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>App Integration Required</AlertTitle>
            <AlertDescription>
              Comment commands are only available when your project is connected via a 
              Bitbucket Cloud App or GitHub App integration. This ensures proper webhook 
              configuration and user authorization.
              <br /><br />
              To enable this feature, reconnect your repository using the App integration 
              method in the Code Hosting settings tab.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <div>
              <CardTitle>Comment Commands</CardTitle>
              <CardDescription>
                Trigger analysis and interact with CodeCrow via PR comments
              </CardDescription>
            </div>
          </div>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">Enable Comment Commands</div>
              <div className="text-sm text-muted-foreground">
                Allow users to trigger analysis via PR comments
              </div>
            </div>
          </div>
          <Switch 
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
        
        {enabled && (
          <>
            {/* Available Commands Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Available Commands</AlertTitle>
              <AlertDescription>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li><code className="bg-muted px-1 rounded">/codecrow analyze</code> - Trigger PR analysis</li>
                  <li><code className="bg-muted px-1 rounded">/codecrow summarize</code> - Generate summary with diagrams</li>
                  <li><code className="bg-muted px-1 rounded">/codecrow ask &lt;question&gt;</code> - Ask about code or analysis</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {/* Allowed Commands */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Allowed Commands
              </Label>
              <div className="grid gap-3">
                {AVAILABLE_COMMANDS.map((command) => (
                  <div key={command.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`command-${command.id}`}
                      checked={allowedCommands.includes(command.id)}
                      onCheckedChange={(checked) => handleCommandToggle(command.id, !!checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`command-${command.id}`} className="font-medium cursor-pointer">
                        /codecrow {command.label.toLowerCase()}
                      </Label>
                      <p className="text-sm text-muted-foreground">{command.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Authorization Mode */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label className="font-medium">Who Can Execute Commands</Label>
              </div>
              
              <Select value={authorizationMode} onValueChange={(v) => setAuthorizationMode(v as CommandAuthorizationMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select authorization mode" />
                </SelectTrigger>
                <SelectContent>
                  {AUTHORIZATION_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div>
                        <div className="font-medium text-left">{mode.label}</div>
                        <div className="text-xs text-muted-foreground">{mode.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Always allow PR author toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Always Allow PR Author</div>
                  <div className="text-xs text-muted-foreground">
                    PR authors can always execute commands on their own PRs
                  </div>
                </div>
                <Switch 
                  checked={allowPrAuthor}
                  onCheckedChange={setAllowPrAuthor}
                  disabled={authorizationMode === "PR_AUTHOR_ONLY"}
                />
              </div>
              
              {/* Allowed Users List (only shown for ALLOWED_USERS_ONLY mode) */}
              {authorizationMode === "ALLOWED_USERS_ONLY" && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Allowed Users ({allowedUsers.filter(u => u.enabled).length} enabled)</Label>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={syncUsersFromVcs}
                        disabled={syncingUsers}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncingUsers ? 'animate-spin' : ''}`} />
                        Sync from VCS
                      </Button>
                    </div>
                  </div>
                  
                  {/* Search input for filtering users */}
                  {allowedUsers.length > 5 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name or username..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  )}
                  
                  {loadingUsers ? (
                    <div className="text-center py-4 text-muted-foreground">Loading users...</div>
                  ) : allowedUsers.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Allowed Users</AlertTitle>
                      <AlertDescription>
                        No users are in the allowed list. Click "Sync from VCS" to import collaborators 
                        with write access, or commands will only work for PR authors (if enabled).
                      </AlertDescription>
                    </Alert>
                  ) : filteredAllowedUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No users match "{userSearchQuery}"
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {filteredAllowedUsers.map((user) => (
                        <div 
                          key={user.vcsUserId} 
                          className={`flex items-center justify-between p-2 rounded border ${!user.enabled ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback>{user.vcsUsername.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{user.displayName || user.vcsUsername}</div>
                              <div className="text-xs text-muted-foreground">@{user.vcsUsername}</div>
                            </div>
                            {user.syncedFromVcs && (
                              <Badge variant="secondary" className="text-xs">synced</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={user.enabled}
                              onCheckedChange={() => toggleUserEnabled(user)}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeUser(user.vcsUserId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Rate Limiting */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label className="font-medium">Rate Limiting</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Max Commands</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    min={1}
                    max={100}
                    value={rateLimit}
                    onChange={(e) => setRateLimit(parseInt(e.target.value) || 10)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum commands per window
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateLimitWindow">Window (minutes)</Label>
                  <Input
                    id="rateLimitWindow"
                    type="number"
                    min={1}
                    max={1440}
                    value={rateLimitWindow}
                    onChange={(e) => setRateLimitWindow(parseInt(e.target.value) || 60)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Rate limit window duration
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Currently: {rateLimit} command{rateLimit !== 1 ? 's' : ''} per {rateLimitWindow} minute{rateLimitWindow !== 1 ? 's' : ''} per project
              </p>
            </div>
            
            {/* Public Repository Settings */}
            {/*<div className="flex items-center justify-between p-4 border rounded-lg">*/}
            {/*  <div className="flex items-center gap-3">*/}
            {/*    <Shield className="h-5 w-5 text-primary" />*/}
            {/*    <div>*/}
            {/*      <div className="font-medium">Allow on Public Repositories</div>*/}
            {/*      <div className="text-sm text-muted-foreground">*/}
            {/*        Only high-privilege users can trigger commands on public repos*/}
            {/*      </div>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*  <Switch */}
            {/*    checked={allowPublicRepoCommands}*/}
            {/*    onCheckedChange={setAllowPublicRepoCommands}*/}
            {/*  />*/}
            {/*</div>*/}
          </>
        )}
        
        <Button 
          onClick={handleSave}
          disabled={loading || (enabled && allowedCommands.length === 0)}
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Configuration"}
        </Button>
        
        {enabled && allowedCommands.length === 0 && (
          <p className="text-sm text-destructive">
            Please select at least one command to enable
          </p>
        )}
      </CardContent>
    </Card>
  );
}
