import { useState, useEffect } from "react";
import { Save, Plus, Trash2, FileCode, ShieldAlert, ShieldOff, GripVertical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  projectService,
  ProjectDTO,
  CustomRuleDTO,
  RuleType,
  CustomRuleRequestDTO,
} from "@/api_service/project/projectService";

interface CustomRulesConfigProps {
  project: ProjectDTO;
  onUpdate: (updatedProject: ProjectDTO) => void;
}

const MAX_RULES = 20;

const EMPTY_RULE: CustomRuleRequestDTO = {
  title: "",
  description: "",
  ruleType: "ENFORCE",
  filePatterns: [],
  enabled: true,
  priority: 0,
};

export default function CustomRulesConfig({ project, onUpdate }: CustomRulesConfigProps) {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<CustomRuleRequestDTO[]>([]);
  const [expandedRuleIndex, setExpandedRuleIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load rules from server
  useEffect(() => {
    if (!currentWorkspace || !project.namespace) return;
    loadRules();
  }, [currentWorkspace, project.namespace]);

  const loadRules = async () => {
    if (!currentWorkspace || !project.namespace) return;
    setLoading(true);
    try {
      const config = await projectService.getProjectRulesConfig(
        currentWorkspace.slug,
        project.namespace,
      );
      setRules(
        (config.rules || []).map((r: CustomRuleDTO) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          ruleType: r.ruleType,
          filePatterns: r.filePatterns || [],
          enabled: r.enabled,
          priority: r.priority,
        })),
      );
      setHasChanges(false);
    } catch {
      // Fresh project with no rules yet — that's fine
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentWorkspace || !project.namespace) return;

    // Validate rules
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!rule.title.trim()) {
        toast({
          title: "Validation Error",
          description: `Rule #${i + 1} must have a title.`,
          variant: "destructive",
        });
        setExpandedRuleIndex(i);
        return;
      }
      if (!rule.description.trim()) {
        toast({
          title: "Validation Error",
          description: `Rule "${rule.title}" must have a description.`,
          variant: "destructive",
        });
        setExpandedRuleIndex(i);
        return;
      }
    }

    setSaving(true);
    try {
      const updated = await projectService.updateProjectRules(
        currentWorkspace.slug,
        project.namespace,
        { rules },
      );
      onUpdate(updated);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Custom rules saved successfully.",
      });
      // Reload to get server-assigned IDs
      await loadRules();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save custom rules.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    if (rules.length >= MAX_RULES) {
      toast({
        title: "Limit Reached",
        description: `You can have up to ${MAX_RULES} custom rules.`,
        variant: "destructive",
      });
      return;
    }
    const newRules = [...rules, { ...EMPTY_RULE, priority: rules.length }];
    setRules(newRules);
    setExpandedRuleIndex(newRules.length - 1);
    setHasChanges(true);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
    if (expandedRuleIndex === index) setExpandedRuleIndex(null);
    setHasChanges(true);
  };

  const updateRule = (index: number, updates: Partial<CustomRuleRequestDTO>) => {
    setRules(rules.map((r, i) => (i === index ? { ...r, ...updates } : r)));
    setHasChanges(true);
  };

  const updateFilePatterns = (index: number, patternsStr: string) => {
    const patterns = patternsStr
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    updateRule(index, { filePatterns: patterns });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Custom Review Rules
            </CardTitle>
            <CardDescription>
              Define project-specific rules that the AI reviewer will enforce or suppress.
              Rules are applied during code review based on file patterns.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {rules.length} / {MAX_RULES}
            </Badge>
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Rules"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <FileCode className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-2">No custom rules configured</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add rules to customize how the AI reviews your code.
              For example, enforce naming conventions or suppress known false positives.
            </p>
            <Button onClick={addRule} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add First Rule
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {rules.map((rule, index) => {
                const isExpanded = expandedRuleIndex === index;
                return (
                  <div
                    key={rule.id || index}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Collapsed header */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedRuleIndex(isExpanded ? null : index)}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {rule.ruleType === "ENFORCE" ? (
                          <ShieldAlert className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        ) : (
                          <ShieldOff className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">
                          {rule.title || "Untitled Rule"}
                        </span>
                        <Badge variant={rule.ruleType === "ENFORCE" ? "default" : "secondary"} className="text-xs">
                          {rule.ruleType}
                        </Badge>
                        {rule.filePatterns.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {rule.filePatterns.length} pattern{rule.filePatterns.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => {
                            updateRule(index, { enabled: checked });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRule(index);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded editor */}
                    {isExpanded && (
                      <div className="border-t p-4 space-y-4 bg-muted/20">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`rule-title-${index}`}>Title *</Label>
                            <Input
                              id={`rule-title-${index}`}
                              value={rule.title}
                              onChange={(e) => updateRule(index, { title: e.target.value })}
                              placeholder="e.g., Require error handling in API controllers"
                              maxLength={200}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`rule-type-${index}`}>Rule Type</Label>
                            <Select
                              value={rule.ruleType}
                              onValueChange={(v) => updateRule(index, { ruleType: v as RuleType })}
                            >
                              <SelectTrigger id={`rule-type-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ENFORCE">
                                  <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-blue-500" />
                                    Enforce
                                  </div>
                                </SelectItem>
                                <SelectItem value="SUPPRESS">
                                  <div className="flex items-center gap-2">
                                    <ShieldOff className="h-4 w-4 text-orange-500" />
                                    Suppress
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`rule-desc-${index}`}>Description *</Label>
                          <Textarea
                            id={`rule-desc-${index}`}
                            value={rule.description}
                            onChange={(e) => updateRule(index, { description: e.target.value })}
                            placeholder="Describe what the AI should enforce or suppress. Be specific — the AI will use this text as its instruction."
                            rows={3}
                            maxLength={2000}
                          />
                          <p className="text-xs text-muted-foreground">
                            {rule.description.length}/2000 characters
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`rule-patterns-${index}`}>
                            File Patterns (optional)
                          </Label>
                          <Input
                            id={`rule-patterns-${index}`}
                            value={rule.filePatterns.join(", ")}
                            onChange={(e) => updateFilePatterns(index, e.target.value)}
                            placeholder="e.g., *.java, src/api/*.ts, *.py"
                          />
                          <p className="text-xs text-muted-foreground">
                            Comma-separated glob patterns. Leave empty to apply to all files.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`rule-priority-${index}`}>Priority</Label>
                          <Input
                            id={`rule-priority-${index}`}
                            type="number"
                            value={rule.priority}
                            onChange={(e) =>
                              updateRule(index, { priority: parseInt(e.target.value) || 0 })
                            }
                            min={0}
                            max={100}
                            className="w-24"
                          />
                          <p className="text-xs text-muted-foreground">
                            Higher priority rules are listed first in the AI prompt (0-100).
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Button onClick={addRule} variant="outline" size="sm" disabled={rules.length >= MAX_RULES}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </>
        )}

        <Alert>
          <AlertDescription>
            <strong>ENFORCE</strong> rules instruct the AI to flag violations.{" "}
            <strong>SUPPRESS</strong> rules tell the AI to ignore certain patterns.
            Rules with file patterns only apply to matching files; rules without patterns apply globally.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
