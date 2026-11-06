import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Exercise the actual dashboard predicate without mounting unrelated dashboard services.
const source = await readFile(new URL("../src/pages/ProjectDashboard.tsx", import.meta.url), "utf8");
const tree = ts.createSourceFile("ProjectDashboard.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let predicate;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(tree) === "filteredIssues") {
    predicate = node.initializer.arguments[0].getText(tree);
  }
  ts.forEachChild(node, visit);
}
visit(tree);
assert.ok(predicate);
const code = ts.transpileModule(`export default (filters) => ${predicate}`, {
  compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { default: withFilters } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const defaults = { severity: "ALL", status: "open", category: "ALL", filePath: "", author: "" };
const issues = [
  { id: "audit", reviewCheckId: "composer-audit", issueCategory: "SECURITY", file: "composer.lock", status: "open", severity: "high" },
  { id: "security", issueCategory: "SECURITY", file: "composer.json", status: "open", severity: "high" },
  { id: "resolved", reviewCheckId: "composer-audit", issueCategory: "SECURITY", file: "composer.lock", status: "resolved", severity: "low" },
];

test("Composer link selects audit provenance, not all security findings or Composer files", () => {
  const url = new URL("https://app.example/dashboard/team/projects/repo?prId=100&version=2&reviewCheckId=composer-audit&subTab=issues");
  const filter = withFilters({ ...defaults, reviewCheckId: url.searchParams.get("reviewCheckId") });
  assert.deepEqual(issues.filter(filter).map(issue => issue.id), ["audit"]);
});

test("source filtering composes with status and severity and can be cleared", () => {
  assert.deepEqual(issues.filter(withFilters({ ...defaults, reviewCheckId: "composer-audit", status: "resolved", severity: "LOW" })).map(issue => issue.id), ["resolved"]);
  assert.deepEqual(issues.filter(withFilters(defaults)).map(issue => issue.id), ["audit", "security"]);
  assert.deepEqual(issues.filter(withFilters({ ...defaults, reviewCheckId: "unknown-check" })), []);
});
