import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Save,
  FileText,
  AlertCircle,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { taskManagementService } from "@/api_service/taskManagement/taskManagementService";
import type { ProjectDTO } from "@/api_service/project/projectService";
import type {
  QaAutoDocConfigRequest,
  QaAutoDocTemplateMode,
  TaskCommentVisibility,
} from "@/api_service/taskManagement/taskManagement.interface";
import {
  TEMPLATE_MODES,
  MAX_CUSTOM_TEMPLATE_LENGTH,
  OUTPUT_LANGUAGES,
} from "@/api_service/taskManagement/taskManagement.interface";

interface QaAutoDocConfigurationProps {
  project: ProjectDTO;
  onUpdate: (updatedProject: ProjectDTO) => void;
}

function visibilityKey(visibility: TaskCommentVisibility) {
  return `${visibility.type}:${visibility.identifier || visibility.value}`;
}

function upsertVisibility(
  options: TaskCommentVisibility[],
  visibility: TaskCommentVisibility,
) {
  const key = visibilityKey(visibility);
  if (options.some((option) => visibilityKey(option) === key)) {
    return options;
  }
  return [visibility, ...options];
}

export default function QaAutoDocConfiguration({
  project,
  onUpdate,
}: QaAutoDocConfigurationProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const boundConnectionId =
    project.taskManagementConfig?.taskManagementConnectionId ?? null;
  const hasTaskManagementBinding = boundConnectionId != null;

  // ── Form state ──
  const [enabled, setEnabled] = useState(false);
  const [templateMode, setTemplateMode] =
    useState<QaAutoDocTemplateMode>("BASE");
  const [customTemplate, setCustomTemplate] = useState("");
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [commentVisibilityKey, setCommentVisibilityKey] = useState("none");

  // ── UI state ──
  const [saving, setSaving] = useState(false);
  const [visibilityOptions, setVisibilityOptions] = useState<
    TaskCommentVisibility[]
  >([]);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [visibilityLoaded, setVisibilityLoaded] = useState(false);

  // ── Sync form state from project prop ──
  useEffect(() => {
    const config =
      (project as any).qaAutoDocConfig ||
      (project as any).qaAutoDoc ||
      (project as any).config?.qaAutoDoc;
    if (config) {
      setEnabled(config.enabled ?? false);
      setTemplateMode(config.templateMode || "BASE");
      setCustomTemplate(config.customTemplate || "");
      setOutputLanguage(config.outputLanguage || "English");
      const savedVisibility = config.commentVisibility || null;
      setCommentVisibilityKey(
        savedVisibility ? visibilityKey(savedVisibility) : "none",
      );
      if (savedVisibility) {
        setVisibilityOptions((current) =>
          upsertVisibility(current, savedVisibility),
        );
      } else {
        setVisibilityOptions([]);
      }
      setVisibilityLoaded(false);
    }
  }, [project]);

  const loadVisibilityOptions = async () => {
    if (!currentWorkspace || !boundConnectionId) {
      toast({
        title: "Missing project task connection",
        description:
          "Bind a Jira connection in this project's Task Management settings before fetching visibility options.",
        variant: "destructive",
      });
      return;
    }

    try {
      setVisibilityLoading(true);
      const data = await taskManagementService.listCommentVisibilityOptions(
        currentWorkspace.slug,
        boundConnectionId,
      );
      setVisibilityOptions(data || []);
      setVisibilityLoaded(true);
      toast({
        title: "Jira visibility options loaded",
        description: `${data?.length ?? 0} options are available for comment visibility.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to load Jira visibility options",
        description: error.message || "Check that the Jira token can browse users, groups, and project roles.",
        variant: "destructive",
      });
    } finally {
      setVisibilityLoading(false);
    }
  };

  const buildConfigRequest = (nextEnabled: boolean): QaAutoDocConfigRequest => ({
    enabled: nextEnabled,
    templateMode,
    customTemplate: templateMode === "CUSTOM" ? customTemplate : null,
    outputLanguage: outputLanguage || "English",
    commentVisibility: selectedVisibility(),
  });

  const saveConfig = async (
    nextEnabled: boolean,
    successMessage = "QA auto-documentation settings have been updated.",
  ) => {
    if (!currentWorkspace || !project.id) return;
    if (nextEnabled && !hasTaskManagementBinding) {
      toast({
        title: "Missing project task connection",
        description:
          "Bind a task management connection to this project before enabling QA auto-documentation.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setSaving(true);
      const request = buildConfigRequest(nextEnabled);
      await taskManagementService.updateQaAutoDocConfig(
        currentWorkspace.slug,
        project.id,
        request,
      );
      toast({
        title: "Configuration saved",
        description: successMessage,
      });
      // Optimistically update the project with the new config
      onUpdate({
        ...project,
        qaAutoDocConfig: request,
      } as any);
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ── Save handler ──
  const handleSave = async () => {
    await saveConfig(enabled);
  };

  const handleEnabledChange = async (checked: boolean) => {
    if (checked) {
      setEnabled(true);
      return;
    }

    setEnabled(false);
    const saved = await saveConfig(
      false,
      "QA auto-documentation has been disabled.",
    );
    if (!saved) {
      setEnabled(true);
    }
  };

  const selectedVisibility = (): TaskCommentVisibility | null => {
    if (commentVisibilityKey === "none") return null;
    return (
      visibilityOptions.find((option) => visibilityKey(option) === commentVisibilityKey) ||
      null
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              QA Auto-Documentation
            </CardTitle>
            <CardDescription className="mt-1">
              Automatically generate QA testing documentation, store the latest
              doc per PR in CodeCrow, and post it as a comment on the linked
              Jira ticket after each code review.
            </CardDescription>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleEnabledChange}
            disabled={saving || !hasTaskManagementBinding}
          />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2 md:flex-1">
                <Label>Jira Comment Visibility</Label>
                <Select
                  value={commentVisibilityKey}
                  onValueChange={setCommentVisibilityKey}
                  disabled={!hasTaskManagementBinding}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Jira visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No restriction</SelectItem>
                    {visibilityOptions.map((option) => (
                      <SelectItem key={visibilityKey(option)} value={visibilityKey(option)}>
                        {option.type === "role" ? "Project role: " : "Group: "}
                        {option.displayName || option.value || option.identifier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Restrict QA documentation comments to a Jira group or project
                  role when the ticket is visible to a broader audience.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={loadVisibilityOptions}
                disabled={!hasTaskManagementBinding || visibilityLoading}
              >
                {visibilityLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {visibilityLoading ? "Fetching…" : "Fetch Jira Visibility"}
              </Button>
            </div>
            {visibilityLoaded && (
              <p className="text-xs text-muted-foreground">
                {visibilityOptions.length} options loaded from the selected
                Jira connection.
              </p>
            )}
          </div>

          <Separator />

          {/* Template Mode */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Documentation Template
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATE_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setTemplateMode(mode.value)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    templateMode === mode.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium text-sm">{mode.label}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mode.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom template editor */}
            {templateMode === "CUSTOM" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customTemplate">Custom Template</Label>
                  <span
                    className={`text-xs ${customTemplate.length > MAX_CUSTOM_TEMPLATE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {customTemplate.length} / {MAX_CUSTOM_TEMPLATE_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="customTemplate"
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  rows={8}
                  placeholder={`Write your custom QA documentation template here. Available placeholders:\n\n{project_name} — Project name\n{pr_number} — PR number\n{task_key} — Jira task key\n{pr_title} — PR title\n{issues_found} — Number of issues\n{files_analyzed} — Number of files\n\nExample:\n## QA Testing Notes for {task_key}\n\n### Changes in PR #{pr_number}\n...\n### Test Scenarios\n...`}
                  className="font-mono text-sm"
                  maxLength={MAX_CUSTOM_TEMPLATE_LENGTH}
                />
                <p className="text-xs text-muted-foreground">
                  Use placeholders like{" "}
                  <code className="bg-muted px-1 rounded">{"{task_key}"}</code>{" "}
                  and{" "}
                  <code className="bg-muted px-1 rounded">{"{pr_title}"}</code>{" "}
                  for dynamic content.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Output Language */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">Output Language</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>
                      Choose the language for the generated QA documentation.
                      The AI will write all test scenarios, descriptions, and
                      instructions in the selected language.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={outputLanguage} onValueChange={setOutputLanguage}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The generated QA documentation will be written entirely in the
              selected language.
            </p>
          </div>

          <Separator />

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || (enabled && !hasTaskManagementBinding)}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save Configuration"}
            </Button>
          </div>
        </CardContent>
      )}

      {!enabled && (
        <CardContent className="space-y-4">
          {!hasTaskManagementBinding && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bind a Jira connection in this project's Task Management
                settings before enabling QA auto-documentation.
              </AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground">
            Enable QA auto-documentation to automatically generate testing notes
            for reviewed PRs, keep the latest QA Doc in the project dashboard,
            and post it as a comment on the linked Jira ticket.
          </p>
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || (enabled && !hasTaskManagementBinding)}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save Configuration"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
