import { useEffect, useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { AnalysisLimitsConfig, workspaceService } from "@/api_service/workspace/workspaceService";

const emptyLimits: AnalysisLimitsConfig = {
  maxFiles: null,
  maxFileSizeBytes: null,
  maxTotalDiffSizeBytes: null,
  maxTotalTokens: null,
};

const fields: Array<{ key: keyof AnalysisLimitsConfig; label: string; help: string; placeholder: string }> = [
  { key: "maxFiles", label: "Maximum changed files", help: "Skip the entire analysis when the PR contains more files.", placeholder: "150" },
  { key: "maxFileSizeBytes", label: "Maximum single-file diff (bytes)", help: "Skip before analysis if any one file diff exceeds this size.", placeholder: "5242880" },
  { key: "maxTotalDiffSizeBytes", label: "Maximum total diff (bytes)", help: "Hard cap for the complete diff payload.", placeholder: "20971520" },
  { key: "maxTotalTokens", label: "Maximum total estimated tokens", help: "PR-wide input budget; unlike the batch limit, this stops analysis.", placeholder: "1000000" },
];

export default function WorkspaceConfiguration() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [limits, setLimits] = useState<AnalysisLimitsConfig>(emptyLimits);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentWorkspace) return;
    workspaceService.getAnalysisLimits(currentWorkspace.slug)
      .then(setLimits)
      .catch(() => setLimits(emptyLimits));
  }, [currentWorkspace]);

  const save = async () => {
    if (!currentWorkspace) return;
    setSaving(true);
    try {
      const updated = await workspaceService.updateAnalysisLimits(currentWorkspace.slug, limits);
      setLimits(updated);
      toast({ title: "Analysis limits saved", description: "These limits now apply to projects without their own overrides." });
    } catch (error: unknown) {
      toast({
        title: "Unable to save limits",
        description: error instanceof Error ? error.message : "Please check the values.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Hard Analysis Limits</CardTitle>
        <CardDescription>
          Spending guards enforced before file enrichment, RAG parsing, or AI calls. Blank values inherit deployment defaults; project overrides take priority.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div className="space-y-2" key={field.key}>
              <Label htmlFor={`workspace-${field.key}`}>{field.label}</Label>
              <Input
                id={`workspace-${field.key}`}
                type="number"
                min={1}
                placeholder={`Deployment default: ${field.placeholder}`}
                value={limits[field.key] ?? ""}
                onChange={(event) => setLimits({
                  ...limits,
                  [field.key]: event.target.value === "" ? null : Number(event.target.value),
                })}
              />
              <p className="text-xs text-muted-foreground">{field.help}</p>
            </div>
          ))}
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Workspace Limits"}
        </Button>
      </CardContent>
    </Card>
  );
}
