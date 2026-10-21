export const mcpClients = {
  codex: {
    label: "Codex (CLI / IDE extension)",
    file: ".codex/config.toml",
    format: "TOML",
    directory: true,
    save: "Create .codex/config.toml in this project's root folder. If it exists, merge the CodeCrow tables below into it, preserving your other settings.",
    start: "Open this project in Codex and trust it when prompted. Restart the Codex CLI or IDE extension after saving; project configuration is loaded only for trusted projects.",
    verify: "Open Codex's MCP servers settings, or use /mcp in the Codex CLI, and inspect CodeCrow's tools. codex mcp list confirms registration, but a successful tool call confirms the connection.",
    docs: "https://developers.openai.com/codex/mcp/",
  },
  claude: {
    label: "Claude Code",
    file: ".mcp.json",
    format: "JSON",
    directory: false,
    save: "Create .mcp.json in your project's root folder, or merge the codecrow entry into its existing mcpServers object. This is Claude Code's project configuration.",
    start: "Start Claude Code from this project root, or reopen the project in its IDE extension. Accept the project MCP server approval when prompted.",
    verify: "Run /mcp in Claude Code and inspect the codecrow server and its tools. If it is pending approval or disabled, enable it there.",
    docs: "https://code.claude.com/docs/en/mcp",
  },
  opencode: {
    label: "OpenCode",
    file: "opencode.json",
    format: "JSON",
    directory: false,
    save: "Create opencode.json in your project root, or merge the codecrow entry into the mcp object of your existing opencode.json or opencode.jsonc.",
    start: "Restart OpenCode from this project root after saving. The configuration enables CodeCrow when OpenCode starts.",
    verify: "Run opencode mcp list from this project to check the connection. Make sure CodeCrow tools are enabled for the agent you are using.",
    docs: "https://opencode.ai/docs/mcp-servers/",
  },
  copilot: {
    label: "GitHub Copilot (VS Code)",
    file: ".vscode/mcp.json",
    format: "JSON",
    directory: false,
    save: "Open this project root as a VS Code workspace folder. Create .vscode/mcp.json there, or merge the codecrow entry into its existing servers object.",
    start: "Open the Command Palette → MCP: List Servers → codecrow → Start Server. Accept the server trust prompt. You can also use Start above the entry in mcp.json when that control is shown.",
    verify: "In Copilot Chat's Agent mode, enable CodeCrow in the tools picker. MCP: List Servers → codecrow → Show Output displays connection errors and the browser authorization link.",
    docs: "https://code.visualstudio.com/docs/agents/reference/mcp-configuration",
  },
  gemini: {
    label: "Gemini CLI",
    file: ".gemini/settings.json",
    format: "JSON",
    directory: false,
    save: "Create .gemini/settings.json in your project root, or merge the codecrow entry into its existing mcpServers object. Preserve your other Gemini settings.",
    start: "Start or restart Gemini CLI from this project root. Review the workspace trust prompt if one appears.",
    verify: "Use /mcp inside Gemini CLI to inspect CodeCrow's connection and discovered tools.",
    docs: "https://geminicli.com/docs/tools/mcp-server/",
  },
  antigravity: {
    label: "Google Antigravity",
    file: ".agents/mcp_config.json",
    format: "JSON",
    directory: true,
    save: "Create .agents/mcp_config.json in your project root and merge the codecrow entry into mcpServers. In the IDE, MCP Servers → Manage MCP Servers → View raw config shows the active configuration; use that file if your installation uses a global configuration.",
    start: "Reopen the project in Antigravity after saving. Open the agent panel's … menu → MCP Servers to manage the connection. In Antigravity CLI, use /mcp to reload server configurations.",
    verify: "Inspect CodeCrow in the MCP manager and confirm its tools are enabled. Check that you edited the configuration used by the current project.",
    docs: "https://antigravity.google/docs/mcp",
  },
  jetbrains: {
    label: "JetBrains AI Assistant (PhpStorm)",
    file: "AI Assistant → Model Context Protocol (MCP)",
    format: "JSON",
    directory: false,
    save: "Open Settings → Tools → AI Assistant → Model Context Protocol (MCP), add a server and paste the JSON. Set Working directory to this project's root folder and choose Project as the server level.",
    start: "Click OK, enable the CodeCrow server and click Apply. Use Reconnect after later configuration changes.",
    verify: "Inspect the server's Status and available tools in AI Assistant's MCP settings. This configuration belongs to AI Assistant; other agents in PhpStorm use their own setup.",
    docs: "https://www.jetbrains.com/help/ai-assistant/mcp.html",
  },
} as const;

export type McpClient = keyof typeof mcpClients;

export function mcpConfiguration(client: McpClient, options: {
  api: string; app: string; workspace: string; project: string; directory: string;
}): string | null {
  const directory = options.directory.trim();
  if (mcpClients[client].directory && !/^(\/|[A-Za-z]:[\\/]|\\\\[^\\]+\\)/.test(directory)) return null;
  const env = {
    CODECROW_API_URL: options.api, CODECROW_APP_URL: options.app,
    CODECROW_WORKSPACE: options.workspace, CODECROW_PROJECT: options.project,
  };
  const server = { command: "node", args: ["./codecrow-mcp.mjs"], env };
  if (client === "codex") {
    // JSON string escaping also produces valid TOML basic strings.
    return [
      "[mcp_servers.codecrow]", 'command = "node"',
      `args = ${JSON.stringify(server.args)}`, `cwd = ${JSON.stringify(directory)}`,
      "", "[mcp_servers.codecrow.env]",
      ...Object.entries(env).map(([key, value]) => `${key} = ${JSON.stringify(value)}`),
    ].join("\n");
  }
  let config: object;
  switch (client) {
    case "copilot":
      config = { servers: { codecrow: { type: "stdio", ...server, cwd: "${workspaceFolder}" } } }; break;
    case "opencode":
      config = { mcp: { codecrow: { type: "local", command: ["node", ...server.args], cwd: ".", environment: env, enabled: true } } }; break;
    case "antigravity":
      config = { mcpServers: { codecrow: { ...server, cwd: directory } } }; break;
    case "gemini":
      config = { mcpServers: { codecrow: { ...server, cwd: "." } } }; break;
    case "claude":
      config = { mcpServers: { codecrow: { type: "stdio", ...server } } }; break;
    case "jetbrains":
      config = { mcpServers: { codecrow: server } }; break;
  }
  return JSON.stringify(config, null, 2);
}
