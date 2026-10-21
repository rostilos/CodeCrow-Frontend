import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { analysisService, type QaDocProgress, type QaDocProgressUpdate } from "@/api_service/analysis/analysisService";
import { QaDocTestCasesSection } from "@/components/QaDocTestCasesSection";
import type { QaDocTestCase } from "@/components/QaDocTestCases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function QaDocExecution({ workspace, project, prNumber, revision, testCases }: {
  workspace: string; project: string; prNumber: number; revision: string; testCases: QaDocTestCase[];
}) {
  const [progress, setProgress] = useState<QaDocProgress | null>(null);
  const [environment, setEnvironment] = useState("develop");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const [reload, setReload] = useState(0);
  const accept = (next: QaDocProgress) => {
    if (next.revision !== revision) throw new Error("QA document changed. Reload this page to see the current test cases.");
    setProgress(next);
    setEnvironment(current => current in next.environments ? current : Object.keys(next.environments)[0] ?? "");
  };

  useEffect(() => {
    let active = true;
    setBusy(true);
    analysisService.getQaDocProgress(workspace, project, prNumber)
      .then(next => { if (active) { accept(next); setError(null); } })
      .catch(e => { if (active) setError(e.message ?? "Progress could not be loaded."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [workspace, project, prNumber, revision, reload]);

  const update = async (change: Omit<QaDocProgressUpdate, "revision">) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      accept(await analysisService.updateQaDocProgress(workspace, project, prNumber, { ...change, revision }));
      if (change.action === "add") { setEnvironment(change.environment.trim()); setName(""); }
    } catch (e: any) {
      setError(e.message ?? "Progress was not saved. Please retry.");
    } finally { setBusy(false); inFlight.current = false; }
  };
  const completed = progress?.environments[environment] ?? [];
  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <label className="text-sm font-medium" htmlFor="qa-environment">Test environment</label>
            <Select value={environment} onValueChange={setEnvironment} disabled={busy}>
              <SelectTrigger id="qa-environment"><SelectValue placeholder="Add an environment" /></SelectTrigger>
              <SelectContent>{Object.keys(progress?.environments ?? {}).map(env =>
                <SelectItem key={env} value={env}>{env}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" aria-label="Refresh saved progress" disabled={busy}
            onClick={() => setReload(n => n + 1)}><RefreshCw className="h-4 w-4" /></Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" size="icon" disabled={busy || !environment}
              aria-label={`Delete ${environment} environment`}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete {environment}?</AlertDialogTitle>
                <AlertDialogDescription>Its saved checks will be deleted for everyone. The test cases and other environments will remain.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => update({ action: "delete", environment })}>Delete environment</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <form className="flex gap-2" onSubmit={event => { event.preventDefault(); update({ action: "add", environment: name }); }}>
          <Input aria-label="New environment name" placeholder="New environment, e.g. staging-eu" maxLength={80}
            value={name} onChange={event => setName(event.target.value)} disabled={busy || !progress} />
          <Button type="submit" variant="outline" disabled={busy || !progress || !name.trim()} className="gap-2"><Plus className="h-4 w-4" />Add</Button>
        </form>
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>{completed.length} of {testCases.length} checked{environment ? ` in ${environment}` : ""}</span>
            <span role="status" className="text-muted-foreground">{busy ? "Saving / loading…" : error ? "Not saved" : progress ? "Saved for your team" : ""}</span></div>
          <Progress aria-label="Test completion" value={testCases.length ? completed.length / testCases.length * 100 : 0} />
          <p className="text-xs text-muted-foreground">Each environment uses the same test cases with independent checks. New content or a new commit resets checks.</p>
        </div>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <QaDocTestCasesSection testCases={testCases} completed={completed}
        disabled={busy || !progress || !environment}
        onCheck={(testCase, checked) => update({ action: "check", environment, testCase, checked })} />
    </div>
  );
}
