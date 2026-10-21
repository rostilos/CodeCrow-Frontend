import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { developerAccessService } from "@/api_service/auth/developerAccessService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";

export default function IdeAuthorize() {
  const [params] = useSearchParams();
  const code = params.get("code") ?? "", workspace = params.get("workspace") ?? "";
  const [write, setWrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const decide = async (approve: boolean) => {
    setBusy(true); setError(null);
    try {
      await developerAccessService.approve(code, workspace, approve, write, 90);
      setDone(approve ? "IDE authorized. Return to your editor; the connection will finish automatically." : "Connection denied.");
    } catch (e: any) { setError(e.message || "Authorization failed."); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen flex items-center justify-center bg-background p-6">
    <Card className="w-full max-w-lg">
      <CardHeader><CodeCrowLogo /><CardTitle className="pt-4">Connect your IDE</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {done ? <p role="status">{done}</p> : <>
          <p>Allow your IDE’s agent to read projects and review findings in <strong>{workspace}</strong> using your current workspace permissions.</p>
          <div className="rounded-lg border p-4 text-center"><p className="text-sm text-muted-foreground">Confirm this matches the code in your IDE’s CodeCrow server log</p>
            <p className="mt-2 font-mono text-xl tracking-widest">{code}</p></div>
          <p className="text-sm text-muted-foreground">Only approve a connection you started. Your IDE remembers this authorization for 90 days. You can revoke it in Account settings → API tokens &amp; IDE.</p>
          <label className="flex items-start gap-3 text-sm"><Checkbox checked={write} onCheckedChange={value => setWrite(value === true)} disabled={busy} />
            Allow writes within my existing role (for example, changing issue status as a Reviewer).</label>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex gap-3"><Button disabled={busy || !code || !workspace} onClick={() => decide(true)}>Authorize IDE</Button>
            <Button variant="outline" disabled={busy} onClick={() => decide(false)}>Deny</Button></div>
        </>}
      </CardContent>
    </Card>
  </main>;
}
