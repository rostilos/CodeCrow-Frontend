import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const load = source => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
}).outputText).toString("base64")}`);
const requests = [];
const source = await readFile(new URL("../src/api_service/analysis/reviewCheckService.ts", import.meta.url), "utf8");
globalThis.reviewCheckRequests = requests;
const { reviewCheckService } = await load(source.replace('import { ApiService } from "../api";', `
class ApiService { request(...args) { globalThis.reviewCheckRequests.push(args); return Promise.resolve(); } }
`));

test("check results and status actions use their own project-scoped endpoints", async () => {
  requests.length = 0;
  await reviewCheckService.list("tenant one", "project/two", 42, 3);
  await reviewCheckService.updateStatus("tenant one", "project/two", { id: 7, resolved: false });
  await reviewCheckService.updateStatus("tenant one", "project/two", { id: 7, resolved: true });
  const base = "/tenant%20one/project/project%2Ftwo/analysis/review-checks";
  assert.equal(requests[0][0], `${base}?pullRequestId=42&prVersion=3`);
  assert.equal(requests[1][0], `${base}/findings/7/status`);
  assert.equal(requests[1][1].method, "PUT");
  assert.equal(JSON.parse(requests[1][1].body).resolved, true);
  assert.equal(JSON.parse(requests[2][1].body).resolved, false);
  assert.ok(requests.every(request => request[2] === true));
});

const dashboard = await readFile(new URL("../src/pages/ProjectDashboard.tsx", import.meta.url), "utf8");
const tree = ts.createSourceFile("ProjectDashboard.tsx", dashboard, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const initializers = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name)) {
    const name = node.name.elements[0].name.getText(tree);
    if (["prTab", "selectionType"].includes(name)) initializers[name] = node.initializer.arguments[0].getText(tree);
  }
  ts.forEachChild(node, visit);
}
visit(tree);
const { initial } = await load(`export const initial = searchParams => ({
  tab: (${initializers.prTab})(), selection: (${initializers.selectionType})()
});`);

test("current and legacy Composer links open checks on the first render, before URL persistence", () => {
  for (const subTab of ["checks", "issues"]) {
    const params = new URLSearchParams(`prId=100&version=3&reviewCheckId=composer-audit&subTab=${subTab}`);
    assert.deepEqual(initial(params), { tab: "checks", selection: "pr" });
  }
  assert.deepEqual(initial(new URLSearchParams("prNumber=42&subTab=checks")), { tab: "checks", selection: "pr" });
  assert.deepEqual(initial(new URLSearchParams()), { tab: "preview", selection: "branch" });
});
