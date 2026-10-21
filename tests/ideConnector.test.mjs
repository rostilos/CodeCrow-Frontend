import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { configuration, dispatch, callTool } from "../public/codecrow-mcp.mjs";

const config = { workspace: "team", project: "api", repo: "/repo", token: "test-token" };
test("MCP initialize, tool discovery, notifications, errors and tool results", async () => {
  const init = await dispatch({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25" } }, config);
  assert.equal(init.result.protocolVersion, "2025-11-25");
  assert.equal(init.result.serverInfo.name, "codecrow");
  assert.equal(await dispatch({ jsonrpc: "2.0", method: "notifications/initialized" }, config), null);
  const list = await dispatch({ jsonrpc: "2.0", id: 2, method: "tools/list" }, config);
  assert(list.result.tools.some(t => t.name === "getReviewContext"));
  const result = await dispatch({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "getReviewContext" } }, config, async () => ({ issues: [] }));
  assert.deepEqual(result.result.structuredContent, { issues: [] });
  const denied = await dispatch({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "getReviewContext" } }, config, async () => { throw new Error("403"); });
  assert.equal(denied.result.isError, true);
  assert.equal((await dispatch({ jsonrpc: "2.0", id: 5, method: "no-such-method" }, config)).error.code, -32601);
});

test("review context automatically passes checkout identity and keeps uncommitted edits explicit", async () => {
  let requested;
  const result = await callTool(config, "getReviewContext", {}, async (_, path, options) => {
    requested = path; assert.equal(options.token, "test-token"); return { available: true };
  }, () => ({ branch: "feature/fix", commitHash: "abc", changedFiles: ["src/test.ts"] }));
  const url = new URL(requested, "https://test");
  assert.equal(url.pathname, "/team/project/api/developer-context");
  assert.equal(url.searchParams.get("branch"), "feature/fix");
  assert.equal(url.searchParams.get("commitHash"), "abc");
  assert.deepEqual(result.localChanges.changedFiles, ["src/test.ts"]);
});

test("invalid identifiers and credentials in URLs cannot be forwarded", async () => {
  await assert.rejects(callTool(config, "getIssueDetails", { issueId: "../another-project" }), /positive integer/);
  await assert.rejects(callTool(config, "updateIssueStatus", { issueId: 1, isResolved: "true" }), /boolean/);
  assert.throws(() => configuration({ CODECROW_API_URL: "https://secret@host/api", CODECROW_PROJECT: "p", CODECROW_WORKSPACE: "w" }), /credentials/);
  assert.throws(() => configuration({ CODECROW_API_URL: "http://remote/api", CODECROW_PROJECT: "p", CODECROW_WORKSPACE: "w" }), /HTTPS/);
  assert.equal(configuration({ CODECROW_API_URL: "http://localhost:8081/api", CODECROW_PROJECT: "p", CODECROW_WORKSPACE: "w" }).workspace, "w");
  assert.equal(configuration({ CODECROW_API_URL: "https://test/api", CODECROW_PROJECT: "p", CODECROW_WORKSPACE: "w" }).repo, process.cwd());
});

async function browserFixture(t) {
  const scratch = fileURLToPath(new URL("../../../.work/ide-setup-simplification/auth-tests/", import.meta.url));
  await mkdir(scratch, { recursive: true });
  const directory = await mkdtemp(`${scratch}session-`);
  const opened = [];
  t.mock.method(os, "homedir", () => directory);
  t.mock.method(childProcess, "spawn", (command, args) => {
    opened.push({ command, url: new URL(args.at(-1)) });
    return Object.assign(new EventEmitter(), { unref() {} });
  });
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  return { directory, opened, config: { api: "https://example.test/api", app: "https://example.test", workspace: "team", project: "api" } };
}

test("automatic browser approval is shared, cached privately and renewed once after concurrent 401s", async t => {
  const { directory, opened, config } = await browserFixture(t);
  let starts = 0, polls = 0, rejectedToken;
  const authorized = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/auth/ide/start")) {
      assert.equal(options.headers.Authorization, undefined);
      assert.equal(JSON.parse(options.body).workspaceSlug, "team");
      return Response.json({ deviceCode: `private-${++starts}`, userCode: `public-${starts}`, interval: 0.001, expiresIn: 10 });
    }
    if (url.endsWith("/auth/ide/poll")) {
      assert.equal(options.headers.Authorization, undefined);
      return Response.json({ status: ++polls % 2 ? "pending" : "approved" });
    }
    const token = options.headers.Authorization;
    authorized.push(token);
    return token === rejectedToken ? Response.json({}, { status: 401 }) : Response.json({ issueId: 1 });
  });
  const get = cfg => callTool(cfg, "getIssueDetails", { issueId: 1 });
  await Promise.all([get(config), get(config)]);
  assert.equal(starts, 1);
  assert.equal(opened.length, 1);
  assert.equal(opened[0].url.searchParams.get("code"), "public-1");
  assert.equal(opened[0].url.searchParams.get("workspace"), "team");
  assert(!opened[0].url.href.includes("private"));
  assert.deepEqual(authorized, ["Bearer private-1", "Bearer private-1"]);
  const files = await readdir(`${directory}/.codecrow`);
  assert.equal(files.length, 1);
  const cache = `${directory}/.codecrow/${files[0]}`;
  assert.equal(JSON.parse(await readFile(cache, "utf8")).token, "private-1");
  if (process.platform !== "win32") assert.equal((await stat(cache)).mode & 0o777, 0o600);
  await get({ ...config });
  assert.equal(starts, 1, "a new connector session reuses its saved credential");
  rejectedToken = "Bearer private-1";
  await Promise.all([get(config), get(config)]);
  assert.equal(starts, 2, "concurrent failures share a single new browser authorization");
  assert.equal(JSON.parse(await readFile(cache, "utf8")).token, "private-2");
  await writeFile(cache, "null");
  await get({ ...config });
  assert.equal(starts, 3, "an unusable cache starts browser authorization");
});

test("permission failures and manual token failures never open another browser", async t => {
  const { opened, config } = await browserFixture(t);
  let starts = 0, status = 403;
  t.mock.method(globalThis, "fetch", async url => {
    if (url.endsWith("/auth/ide/start")) {
      starts++;
      return Response.json({ deviceCode: "private-token", userCode: "code", interval: 0.001, expiresIn: 10 });
    }
    if (url.endsWith("/auth/ide/poll")) return Response.json({ status: "approved" });
    return Response.json({}, { status });
  });
  await assert.rejects(callTool(config, "getIssueDetails", { issueId: 1 }), /403/);
  assert.equal(starts, 1);
  await assert.rejects(callTool(config, "getIssueDetails", { issueId: 1 }), /403/);
  assert.equal(opened.length, 1);
  status = 401;
  await assert.rejects(callTool({ ...config, token: "manual" }, "getIssueDetails", { issueId: 1 }), /401/);
  assert.equal(opened.length, 1);
});

test("denied approval does not cache access, and the next attempt can authorize", async t => {
  const { directory, opened, config } = await browserFixture(t);
  let denied = true;
  t.mock.method(globalThis, "fetch", async url => {
    if (url.endsWith("/auth/ide/start")) return Response.json({ deviceCode: "private", userCode: "code", interval: 0.001, expiresIn: 10 });
    if (url.endsWith("/auth/ide/poll")) return denied ? Response.json({ message: "Request denied" }, { status: 404 }) : Response.json({ status: "approved" });
    return Response.json({ issueId: 1 });
  });
  await assert.rejects(callTool(config, "getIssueDetails", { issueId: 1 }), /Request denied/);
  await assert.rejects(readdir(`${directory}/.codecrow`), { code: "ENOENT" });
  denied = false;
  assert.equal((await callTool(config, "getIssueDetails", { issueId: 1 })).issueId, 1);
  assert.equal(opened.length, 2);
});

test("closing the connector interrupts a pending browser authorization", async t => {
  const { directory, config } = await browserFixture(t);
  const controller = new AbortController();
  config.signal = controller.signal;
  t.mock.method(globalThis, "fetch", async url => {
    if (url.endsWith("/auth/ide/start")) return Response.json({ deviceCode: "private", userCode: "code", interval: 0.001, expiresIn: 10 });
    controller.abort();
    return Response.json({ status: "pending" });
  });
  await assert.rejects(callTool(config, "getIssueDetails", { issueId: 1 }), { name: "AbortError" });
  await assert.rejects(readdir(`${directory}/.codecrow`), { code: "ENOENT" });
});
