import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { CheckCircle, AlertCircle, Info, Loader2, Save, ListTodo } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { taskManagementService } from "@/api_service/taskManagement/taskManagementService";
import type { ProjectDTO } from "@/api_service/project/projectService";
import type {
  QaAutoDocTaskIdSource,
  TaskManagementConnectionResponse,
  TaskManagementProjectConfigRequest,
} from "@/api_service/taskManagement/taskManagement.interface";
import {
  DEFAULT_TASK_ID_PATTERN,
  TASK_ID_SOURCES,
} from "@/api_service/taskManagement/taskManagement.interface";

interface ProjectTaskManagementConfigurationProps {
  project: ProjectDTO;
  onUpdate: (updatedProject: ProjectDTO) => void;
}

export default function ProjectTaskManagementConfiguration({
  project,
  onUpdate,
}: ProjectTaskManagementConfigurationProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [connections, setConnections] = useState<
    TaskManagementConnectionResponse[]
  >([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [connectionId, setConnectionId] = useState("");
  const [taskIdPattern, setTaskIdPattern] = useState(DEFAULT_TASK_ID_PATTERN);
  const [taskIdSource, setTaskIdSource] =
    useState<QaAutoDocTaskIdSource>("BRANCH_NAME");
  const [patternValid, setPatternValid] = useState(true);
  const [patternPreview, setPatternPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const projectConnectionId =
    project.taskManagementConfig?.taskManagementConnectionId ?? null;
  const defaultConnection = connections.find((c) => c.defaultConnection);
  const isDefaultPreselected =
    !projectConnectionId &&
    !!defaultConnection &&
    connectionId === String(defaultConnection.id);

  const loadConnections = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setConnectionsLoading(true);
      const data = await taskManagementService.listConnections(
        currentWorkspace.slug,
      );
      const activeConnections = (data || []).filter(
        (c) => c.status === "CONNECTED" || c.status === "PENDING",
      );
      setConnections(activeConnections);
      if (!project.taskManagementConfig?.taskManagementConnectionId) {
        const defaultConn = activeConnections.find((c) => c.defaultConnection);
        if (defaultConn) {
          setConnectionId(String(defaultConn.id));
        }
      }
    } catch (error: any) {
      toast({
        title: "Failed to load Jira connections",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setConnectionsLoading(false);
    }
  }, [currentWorkspace, project.taskManagementConfig?.taskManagementConnectionId, toast]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    const config = project.taskManagementConfig;
    setConnectionId(
      config?.taskManagementConnectionId
        ? String(config.taskManagementConnectionId)
        : "",
    );
    setTaskIdPattern(config?.taskIdPattern || DEFAULT_TASK_ID_PATTERN);
    setTaskIdSource(config?.taskIdSource || "BRANCH_NAME");
  }, [project]);

  useEffect(() => {
    try {
      const re = new RegExp(taskIdPattern);
      setPatternValid(true);
      const examples = [
        "feature/WS-123-add-login",
        "bugfix/GR-2499-fix-crash",
        "PROJ-42",
      ];
      const matches = examples
        .map((example) => {
          const match = example.match(re);
          return match ? `"${example}" -> ${match[0]}` : null;
        })
        .filter(Boolean);
      setPatternPreview(
        matches.length > 0
          ? matches.join("\n")
          : "No matches for sample branches",
      );
    } catch {
      setPatternValid(false);
      setPatternPreview("Invalid regex pattern");
    }
  }, [taskIdPattern]);

  const saveConfig = async () => {
    if (!currentWorkspace || !project.id) return;
    if (!connectionId) {
      toast({
        title: "Missing Jira connection",
        description:
          "Bind a task management connection before enabling Jira task context or QA auto-documentation.",
        variant: "destructive",
      });
      return;
    }
    if (!patternValid) {
      toast({
        title: "Invalid pattern",
        description: "The task ID regex pattern is invalid.",
        variant: "destructive",
      });
      return;
    }

    const request: TaskManagementProjectConfigRequest = {
      taskManagementConnectionId: Number(connectionId),
      taskIdPattern:
        taskIdPattern !== DEFAULT_TASK_ID_PATTERN ? taskIdPattern : null,
      taskIdSource,
    };

    try {
      setSaving(true);
      const response =
        await taskManagementService.updateProjectTaskManagementConfig(
          currentWorkspace.slug,
          Number(project.id),
          request,
        );
      onUpdate({
        ...project,
        taskManagementConfig: response,
      });
      toast({
        title: "Task management saved",
        description:
          "This Jira connection is now bound to the project for task context and QA auto-documentation.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to save task management",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Task Management
        </CardTitle>
        <CardDescription>
          Bind a Jira connection and task key extraction strategy to this
          project. Jira Task Context and QA Auto-Documentation both use this
          binding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Task Management Connection</Label>
          {connectionsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading connections...
            </div>
          ) : connections.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active task management connections found. Create a Jira
                connection in workspace Task Management settings first.
              </AlertDescription>
            </Alert>
          ) : (
            <Select value={connectionId} onValueChange={setConnectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={String(conn.id)}>
                    <div className="flex items-center gap-2">
                      {conn.status === "CONNECTED" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                      )}
                      <span>{conn.connectionName}</span>
                      {conn.defaultConnection && (
                        <Badge variant="outline" className="text-[10px]">
                          Default
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs">
                        ({conn.baseUrl})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isDefaultPreselected && (
            <p className="text-xs text-muted-foreground">
              Workspace default connection is preselected. Save this page to
              bind it to the project.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Task ID Extraction</Label>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskIdSource">Extract From</Label>
              <Select
                value={taskIdSource}
                onValueChange={(value) =>
                  setTaskIdSource(value as QaAutoDocTaskIdSource)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_ID_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {
                  TASK_ID_SOURCES.find((source) => source.value === taskIdSource)
                    ?.description
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskIdPattern">
                Regex Pattern
                {!patternValid && (
                  <Badge variant="destructive" className="ml-2 text-[10px]">
                    Invalid
                  </Badge>
                )}
              </Label>
              <Input
                id="taskIdPattern"
                value={taskIdPattern}
                onChange={(event) => setTaskIdPattern(event.target.value)}
                className={!patternValid ? "border-destructive" : ""}
                placeholder={DEFAULT_TASK_ID_PATTERN}
              />
              <p className="text-xs text-muted-foreground">
                Default:{" "}
                <code className="bg-muted px-1 rounded">
                  {DEFAULT_TASK_ID_PATTERN}
                </code>{" "}
                matches keys like WS-123, GR-2499
              </p>
            </div>
          </div>

          {taskIdPattern && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
              <span className="text-muted-foreground font-sans text-xs font-medium">
                Pattern Preview:
              </span>
              {patternPreview.split("\n").map((line, index) => (
                <div
                  key={index}
                  className={
                    patternValid
                      ? "text-green-600 dark:text-green-400"
                      : "text-destructive"
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={saveConfig} disabled={saving || !patternValid}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Task Management"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
