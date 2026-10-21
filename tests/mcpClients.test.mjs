import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import ts from "typescript";

const source = await readFile(new URL("../src/components/Account/UserSettings/mcpClients.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 } }).outputText;
const { mcpClients, mcpConfiguration } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const options = { api: "https://api.example.test/api", app: "https://app.example.test", workspace: "team", project: "backend", directory: "/Users/alex/Project with spaces" };
const env = { CODECROW_API_URL: options.api, CODECROW_APP_URL: options.app, CODECROW_WORKSPACE: "team", CODECROW_PROJECT: "backend" };
const toml = config => new Promise((resolve, reject) => {
  const child = execFile("python3", ["-c", "import json,sys,tomllib; print(json.dumps(tomllib.loads(sys.stdin.read())))"], { timeout: 10000 }, (error, stdout) => {
    if (error) reject(error);
    else { try { resolve(JSON.parse(stdout)); } catch (error) { reject(error); } }
  });
  child.stdin.end(config);
});

test("every requested agent has setup, activation, verification and official reference instructions", () => {
  assert.deepEqual(Object.keys(mcpClients).sort(), ["antigravity", "claude", "codex", "copilot", "gemini", "jetbrains", "opencode"]);
  for (const client of Object.values(mcpClients)) {
    assert(client.file && client.save && client.start && client.verify);
    assert.equal(new URL(client.docs).protocol, "https:");
  }
});

test("Codex gets parseable TOML with a working directory and no manual credential", async () => {
  const config = await toml(mcpConfiguration("codex", options));
  assert.deepEqual(config, { mcp_servers: { codecrow: { command: "node", args: ["./codecrow-mcp.mjs"], cwd: options.directory, env } } });
  assert.equal(mcpClients.codex.file, ".codex/config.toml");
});

test("Copilot uses VS Code's workspace and servers schema", () => {
  const config = JSON.parse(mcpConfiguration("copilot", options));
  assert.deepEqual(config, { servers: { codecrow: { type: "stdio", command: "node", args: ["./codecrow-mcp.mjs"], env, cwd: "${workspaceFolder}" } } });
  assert.match(mcpClients.copilot.start, /MCP: List Servers/);
});

test("OpenCode uses an array command, environment and local transport", () => {
  const config = JSON.parse(mcpConfiguration("opencode", options));
  assert.deepEqual(config, { mcp: { codecrow: { type: "local", command: ["node", "./codecrow-mcp.mjs"], cwd: ".", environment: env, enabled: true } } });
});

test("Claude, Gemini, Antigravity and JetBrains use their supported stdio fields", () => {
  for (const client of ["claude", "gemini", "antigravity", "jetbrains"]) {
    const config = JSON.parse(mcpConfiguration(client, options));
    const server = config.mcpServers.codecrow;
    assert.equal(server.command, "node");
    assert.deepEqual(server.args, ["./codecrow-mcp.mjs"]);
    assert.deepEqual(server.env, env);
    assert.equal(server.trust, undefined, "do not bypass client tool approvals");
    assert.equal(server.type, client === "claude" ? "stdio" : undefined);
    assert.equal(server.cwd, client === "gemini" ? "." : client === "antigravity" ? options.directory : undefined);
  }
});

test("required working directories do not produce copyable placeholder configurations", () => {
  for (const client of ["codex", "antigravity"]) {
    for (const directory of ["", " ", "backend", "./backend", "~/backend", "C:backend"]) {
      assert.equal(mcpConfiguration(client, { ...options, directory }), null);
    }
    for (const directory of ["/", "/code/backend", "C:\\Projects\\backend", "C:/Projects/backend", "\\\\server\\share\\project"]) {
      assert(mcpConfiguration(client, { ...options, directory }));
    }
  }
  for (const client of ["copilot", "claude", "gemini", "opencode", "jetbrains"]) {
    assert(mcpConfiguration(client, { ...options, directory: "" }));
  }
});

test("JSON and TOML preserve quoted paths and supplied values without injecting configuration", async () => {
  const directory = 'C:\\Projects\\Alex "demo"';
  const project = 'backend"\\name\n[mcp_servers.unwanted]\ncommand="no"';
  for (const client of Object.keys(mcpClients)) {
    const text = mcpConfiguration(client, { ...options, directory, project });
    const parsed = client === "codex" ? await toml(text) : JSON.parse(text);
    const root = parsed.mcp_servers ?? parsed.servers ?? parsed.mcp ?? parsed.mcpServers;
    assert.deepEqual(Object.keys(root), ["codecrow"]);
    const server = root.codecrow;
    assert.equal((server.env ?? server.environment).CODECROW_PROJECT, project);
    if (mcpClients[client].directory) assert.equal(server.cwd, directory);
    assert(!text.includes("CODECROW_TOKEN"));
  }
});
