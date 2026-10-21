import { useEffect, useState } from "react";
import { developerAccessService, type DeveloperToken } from "@/api_service/auth/developerAccessService";
import { projectService } from "@/api_service/project/projectService";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import McpSetup from "./McpSetup";
import { toast } from "sonner";

export default function DeveloperAccess() {
  const { currentWorkspace } = useWorkspace();
  const workspace = currentWorkspace?.slug;
  const [tokens, setTokens] = useState<DeveloperToken[]>([]);
  const [projects, setProjects] = useState<Array<{ namespace: string; name: string }>>([]);
  const [project, setProject] = useState("");
  const [name, setName] = useState("");
  const [days, setDays] = useState(90);
  const [write, setWrite] = useState(false);
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setSecret(""); setTokens([]); setProjects([]); setProject(""); setError(null);
    if (!workspace) return;
    Promise.all([developerAccessService.list(workspace), projectService.listProjects(workspace)])
      .then(([tokens, projects]) => {
        if (active) {
          const available = projects.filter(p => p.namespace).map(p => ({ namespace: p.namespace!, name: p.name }));
          setTokens(tokens); setProjects(available); setProject(available[0]?.namespace ?? "");
        }
      })
      .catch(e => { if (active) setError(e.message || "Developer access could not be loaded."); });
    return () => { active = false; };
  }, [workspace]);
  const create = async () => {
    if (!workspace) return;
    setBusy(true); setError(null); setSecret("");
    try {
      const result = await developerAccessService.create(workspace, name, write, days);
      setSecret(result.token); setTokens(current => [result.details, ...current]); setName("");
    } catch (e: any) { setError(e.message || "Token could not be created."); }
    finally { setBusy(false); }
  };
  const revoke = async (token: DeveloperToken) => {
    if (!workspace) return;
    setBusy(true); setError(null);
    try { await developerAccessService.revoke(workspace, token.id); setTokens(current => current.filter(t => t.id !== token.id)); setSecret(""); }
    catch (e: any) { setError(e.message || "Token could not be revoked."); }
    finally { setBusy(false); }
  };
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast.success("Copied"); }
    catch { toast.error("Copy failed. Select the text and copy it manually."); }
  };
  if (!workspace) return <p>Select a workspace to manage personal API tokens.</p>;
  return <div className="space-y-6">
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <McpSetup key={workspace} workspace={workspace} projects={projects} project={project} onProjectChange={setProject} />
    <Card><CardHeader><CardTitle>Personal API tokens</CardTitle>
      <CardDescription>For scripts and automation. Agent setup uses browser sign-in, so you do not need to create or copy a token. Tokens apply to {workspace} and inherit your current role.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); create(); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">Token name<Input value={name} maxLength={100} required onChange={e => setName(e.target.value)} placeholder="My IDE" /></label>
            <label className="space-y-2 text-sm">Expires in days<Input type="number" min={1} max={365} required value={days} onChange={e => setDays(Number(e.target.value))} /></label>
          </div>
          <label className="flex items-center gap-3 text-sm"><Checkbox checked={write} onCheckedChange={value => setWrite(value === true)} />Allow writes (read access is always included)</label>
          <Button type="submit" disabled={busy || !name.trim()}>Create token</Button>
        </form>
        {secret && <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-medium">Copy this token now. It cannot be shown again.</p>
          <Input aria-label="New API token" readOnly value={secret} className="font-mono" />
          <div className="flex gap-2"><Button variant="outline" onClick={() => copy(secret)}>Copy token</Button><Button variant="ghost" onClick={() => setSecret("")}>Dismiss</Button></div>
        </div>}
        <div className="space-y-3">{tokens.length === 0 ? <p className="text-sm text-muted-foreground">You have no personal tokens in this workspace.</p> :
          tokens.map(token => <div key={token.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div><p className="font-medium">{token.name}</p><p className="text-xs text-muted-foreground">{token.scopes.join(", ")} · Expires {new Date(token.expiresAt).toLocaleDateString()}</p></div>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => revoke(token)}>Revoke</Button>
          </div>)}</div>
      </CardContent>
    </Card>
  </div>;
}
