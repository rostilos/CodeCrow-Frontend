import { useState } from "react";
import { reviewFeedbackService, type FeedbackVerdict } from "@/api_service/analysis/reviewFeedbackService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function ReviewFindingFeedback({ workspace, project, issueId }: {
  workspace: string; project: string; issueId: string;
}) {
  const [verdict, setVerdict] = useState<FeedbackVerdict>("VALID");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    setSaving(true);
    try {
      await reviewFeedbackService.record(workspace, project, issueId, verdict, explanation.trim());
      setSaved(true);
      toast({ title: "Feedback saved", description: "Project owners can review the candidate in Custom Rules." });
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message;
      toast({ title: "Feedback could not be saved", description: message || "Please try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return <Card>
    <CardHeader>
      <CardTitle className="text-base">Was this finding correct?</CardTitle>
      <CardDescription>
        Explain the repository behavior that supports your judgment. An owner must activate a learned rule before it affects future reviews.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex gap-2" role="group" aria-label="Finding judgment">
        <Button type="button" disabled={saving} variant={verdict === "VALID" ? "default" : "outline"}
          aria-pressed={verdict === "VALID"} onClick={() => { setVerdict("VALID"); setSaved(false); }}>Correct finding</Button>
        <Button type="button" disabled={saving} variant={verdict === "FALSE_POSITIVE" ? "default" : "outline"}
          aria-pressed={verdict === "FALSE_POSITIVE"} onClick={() => { setVerdict("FALSE_POSITIVE"); setSaved(false); }}>False positive</Button>
      </div>
      <Label htmlFor={`feedback-${issueId}`}>Reason</Label>
      <Textarea id={`feedback-${issueId}`} value={explanation} maxLength={2000} disabled={saving}
        placeholder="For example: the caller validates this value before invoking the function."
        onChange={event => { setExplanation(event.target.value); setSaved(false); }} />
      <div className="flex items-center gap-3">
        <Button type="button" disabled={saving || !explanation.trim() || saved} onClick={submit}>
          {saving ? "Saving…" : saved ? "Feedback saved" : "Save feedback"}
        </Button>
        <p className="text-xs text-muted-foreground">A later submission updates your judgment and keeps its history.</p>
      </div>
    </CardContent>
  </Card>;
}
