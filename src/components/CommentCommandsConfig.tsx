import { useState, useEffect } from "react";
import { Save, MessageSquare, Shield, Clock, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { projectService, ProjectDTO, CommentCommandsConfigDTO } from "@/api_service/project/projectService";

interface CommentCommandsConfigProps {
  project: ProjectDTO;
  onUpdate: (updatedProject: ProjectDTO) => void;
}

const AVAILABLE_COMMANDS = [
  { id: "analyze", label: "Analyze", description: "Trigger PR analysis" },
  { id: "summarize", label: "Summarize", description: "Generate PR summary with diagrams" },
  { id: "ask", label: "Ask", description: "Answer questions about code/analysis" },
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
    }
  }, [project.commentCommandsConfig]);
  
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
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Allow on Public Repositories</div>
                  <div className="text-sm text-muted-foreground">
                    Only high-privilege users can trigger commands on public repos
                  </div>
                </div>
              </div>
              <Switch 
                checked={allowPublicRepoCommands}
                onCheckedChange={setAllowPublicRepoCommands}
              />
            </div>
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
