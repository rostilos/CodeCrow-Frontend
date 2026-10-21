import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const load = source => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString("base64")}`);
const { authUtils } = await load(readFileSync(new URL("../src/lib/auth.ts", import.meta.url), "utf8"));
const config = readFileSync(new URL("../src/config/api.ts", import.meta.url), "utf8")
  .replace("import.meta.env.VITE_API_URL", "'https://codecrow.test/api'");
const { API_CONFIG, getApiUrl } = await load(config);
globalThis.authTestDependencies = { authUtils, API_CONFIG, getApiUrl };
const source = readFileSync(new URL("../src/api_service/api.ts", import.meta.url), "utf8")
  .replace(/^import .*;\r?$/gm, "");
const { ApiService } = await load(`const { authUtils, API_CONFIG, getApiUrl } = globalThis.authTestDependencies;\n${source}`);
const api = new ApiService();
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const token = exp => `header.${btoa(JSON.stringify({ exp }))}.sig`;
beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) };
  globalThis.window = { location: { href: "/login" } };
  authUtils.setTokens(token(1), "expired-refresh");
});

test("first Google login bypasses the expired session and stores the new login", async () => {
  const urls = [];
  globalThis.fetch = async (url, options) => {
    urls.push(url);
    assert.equal(options.headers.Authorization, undefined);
    return response({ accessToken: token(Date.now() / 1000 + 3600), refreshToken: "new-refresh", roles: [] });
  };
  await api.request("/auth/google", { method: "POST", body: '{"credential":"google"}' });
  assert.deepEqual(urls, ["https://codecrow.test/api/auth/google"]);
  assert.equal(authUtils.getRefreshToken(), "new-refresh");
  assert.equal(authUtils.isAuthenticated(), true);
});

test("valid JWTs with URL-safe base64 payloads remain signed in", () => {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600, sub: "user?~~~" })).toString("base64url");
  assert.match(payload, /[-_]/);
  authUtils.setTokens(`header.${payload}.sig`, "refresh");
  assert.equal(authUtils.isAuthenticated(), true);
  assert.equal(authUtils.shouldRefreshToken(), false);
});

test("invalid login does not try an expired refresh or reload the login page", async () => {
  globalThis.window.location.href = "/login?next=ide";
  let calls = 0;
  globalThis.fetch = async () => { calls++; return response({ message: "Invalid credential" }, 401); };
  await assert.rejects(api.request("/auth/google"), { message: "Invalid credential" });
  assert.equal(calls, 1);
  assert.equal(window.location.href, "/login?next=ide");
});

test("an in-flight failed refresh cannot erase a newly signed-in session", async () => {
  let release;
  globalThis.fetch = async url => url.endsWith("/auth/refresh")
    ? new Promise(resolve => { release = resolve; }) : response({ ok: true });
  const pending = api.request("/workspaces");
  authUtils.setTokens(token(Date.now() / 1000 + 3600), "fresh-login");
  release(response({}, 401));
  await pending;
  assert.equal(authUtils.getRefreshToken(), "fresh-login");
  assert.equal(authUtils.isAuthenticated(), true);
});

test("concurrent protected requests wait for the same refresh", async () => {
  let release;
  let refreshes = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/auth/refresh")) {
      refreshes++;
      return new Promise(resolve => { release = resolve; });
    }
    assert.equal(options.headers.Authorization, `Bearer ${authUtils.getToken()}`);
    return response({ ok: true });
  };
  const one = api.request("/workspaces"), two = api.request("/projects");
  release(response({ accessToken: token(Date.now() / 1000 + 3600), refreshToken: "rotated" }));
  await Promise.all([one, two]);
  assert.equal(refreshes, 1);
});
