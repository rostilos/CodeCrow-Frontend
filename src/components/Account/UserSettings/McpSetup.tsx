import { useState } from "react";
import { API_CONFIG } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { mcpClients, mcpConfiguration, type McpClient } from "./mcpClients";

export default function McpSetup({ workspace, projects, project, onProjectChange }: {
  workspace: string;
  projects: Array<{ namespace: string; name: string }>;
  project: string;
  onProjectChange: (project: string) => void;
}) {
  const [client, setClient] = useState<McpClient | "">("");
  const [directory, setDirectory] = useState("");
  const guide = client ? mcpClients[client] : null;
  const config = client && project ? mcpConfiguration(client, {
    api: new URL(API_CONFIG.BASE_URL, window.location.origin).href.replace(/\/$/, ""),
    app: window.location.origin, workspace, project, directory,
  }) : null;
  const copy = async () => {
    if (!config) return;
    try { await navigator.clipboard.writeText(config); toast.success("Configuration copied"); }
    catch { toast.error("Copy failed. Select the text and copy it manually."); }
  };
  return <Card>
    <CardHeader><CardTitle>Connect your coding agent</CardTitle>
      <CardDescription>Choose the agent you use to fix code. Each agent has its own MCP configuration, even when several run inside the same editor.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><label id="mcp-project-label" className="text-sm font-medium">CodeCrow project</label>
          <Select value={project} onValueChange={value => { setDirectory(""); onProjectChange(value); }}>
            <SelectTrigger aria-labelledby="mcp-project-label"><SelectValue placeholder="Choose project" /></SelectTrigger>
            <SelectContent>{projects.map(p => <SelectItem key={p.namespace} value={p.namespace}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><label id="mcp-agent-label" className="text-sm font-medium">Coding agent</label>
          <Select value={client} onValueChange={value => setClient(value as McpClient)}>
            <SelectTrigger aria-labelledby="mcp-agent-label"><SelectValue placeholder="Choose your agent" /></SelectTrigger>
            <SelectContent>{Object.entries(mcpClients).map(([id, entry]) => <SelectItem key={id} value={id}>{entry.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      {!project && <p className="text-sm text-muted-foreground">Create or join a project in this workspace to connect your agent.</p>}
      {!guide ? <p className="text-sm text-muted-foreground">Using Codex inside VS Code? Select Codex. Using Copilot Chat? Select GitHub Copilot (VS Code).</p> : <>
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="font-medium">{guide.label}</p>
          <p className="mt-1 break-words text-muted-foreground">Configuration: <code>{guide.file}</code> · {guide.format}</p>
          <a href={guide.docs} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-primary underline underline-offset-4">Official setup reference</a>
        </div>
        <p className="text-sm text-muted-foreground">Requires Node.js 20.3 or later and Git on the machine running your agent.</p>
        <ol className="list-decimal space-y-5 pl-5 text-sm">
          <li><p className="font-medium">Save the connector in your project</p>
            <p className="mt-1">Download <code>codecrow-mcp.mjs</code> into your local project’s root folder, alongside the code you work on. Your agent runs it through Node; no executable permission or <code>chmod</code> is needed.</p>
            <Button asChild variant="outline" size="sm" className="mt-2"><a href="/codecrow-mcp.mjs" download>Download connector</a></Button>
          </li>
          <li><p className="font-medium">Configure {guide.label}</p>
            <p className="mt-1">{guide.save}</p>
            {guide.directory && <div className="mt-3 space-y-2">
              <label htmlFor="mcp-directory" className="font-medium">Local project folder</label>
              <Input id="mcp-directory" value={directory} onChange={event => setDirectory(event.target.value)} placeholder="/home/you/projects/backend or C:\Projects\backend" aria-describedby="mcp-directory-help" />
              <p id="mcp-directory-help" className="text-xs text-muted-foreground">Paste the absolute path of the folder where you saved the connector. This setup uses it as the agent’s working directory. For a remote agent, use its remote path. The path stays in your browser.</p>
              {!config && project && <p role="status" className="text-xs text-muted-foreground">Enter a full folder path to generate your configuration.</p>}
            </div>}
            {config && <pre aria-label={`${guide.label} configuration`} className="mt-3 max-w-full overflow-auto rounded-lg bg-muted p-4 text-xs">{config}</pre>}
            <Button className="mt-3" variant="outline" disabled={!config} onClick={copy}>Copy configuration</Button>
          </li>
          <li><p className="font-medium">Start or reload the connection</p><p className="mt-1">{guide.start}</p></li>
          <li><p className="font-medium">Authorize in your browser</p>
            <p className="mt-1">On first connection, CodeCrow opens your browser automatically. Sign in, compare the workspace and verification code with the connector’s log, and click <strong>Authorize IDE</strong>. Enable writes there if your agent should update issue statuses. The connector remembers your authorization.</p>
          </li>
          <li><p className="font-medium">Confirm the agent can use CodeCrow</p>
            <p className="mt-1">{guide.verify}</p>
            <p className="mt-2">Look for <code>getReviewContext</code>, then ask: <strong>“Use CodeCrow’s getReviewContext for my current branch, then fix its findings.”</strong></p>
            <p className="mt-1 text-muted-foreground">A running server in another agent does not confirm this connection. CodeCrow’s setup page cannot inspect the tools loaded by your local agent.</p>
          </li>
        </ol>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">Connection or repository troubleshooting</summary>
          <p className="mt-2 text-muted-foreground">If the browser does not open, use the authorization URL in the connector’s log. After an expired request, retry the tool or restart the connection. If approval took longer than your agent’s tool timeout, retry after authorizing.</p>
          <p className="mt-2 text-muted-foreground">The repository is your local Git checkout. The connector reads its branch, commit and changed paths from the working directory configured above. Start CLI agents from the project root. For a remote agent, the connector, Node.js and Git must be on that machine. Custom setups can override the checkout with <code>CODECROW_REPO</code>.</p>
        </details>
        <p className="text-xs text-muted-foreground">No manual token is needed. Browser access expires after 90 days and can be revoked under Personal API tokens. Your agent controls tool approvals. The connector retrieves saved findings; it does not upload or analyze local file contents.</p>
      </>}
    </CardContent>
  </Card>;
}
