import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Link2, Key, Table, Users, FolderKanban, GitBranch, AlertTriangle } from "lucide-react";

export default function DatabaseSchema() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database Schema</h1>
            <p className="text-muted-foreground mt-1">
              PostgreSQL database structure and relationships
            </p>
          </div>
        </div>
      </div>

      {/* ER Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Entity Relationship Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre>{`┌──────────────┐
│     User     │
│──────────────│
│ id (PK)      │
│ username     │
│ email        │
│ password     │
│ roles        │
└──────┬───────┘
       │ 1:N
       │
┌──────▼──────────────┐         ┌─────────────────┐
│ WorkspaceMember     │    N:1  │   Workspace     │
│─────────────────────│◄────────│─────────────────│
│ workspace_id (FK)   │         │ id (PK)         │
│ user_id (FK)        │         │ name            │
│ role                │         │ description     │
└─────────────────────┘         └────────┬────────┘
                                         │ 1:N
                            ┌────────────▼────────────┐
                            │      Project            │
                            │─────────────────────────│
                            │ id (PK)                 │
                            │ workspace_id (FK)       │
                            │ name, description       │
                            │ repository_url          │
                            │ default_branch          │
                            └────────┬────────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
         ┌──────▼────────┐    ┌─────▼─────┐      ┌──────▼────────┐
         │    Branch     │    │ProjectToken│      │  CodeAnalysis │
         │───────────────│    │────────────│      │───────────────│
         │ id (PK)       │    │ id (PK)    │      │ id (PK)       │
         │ project_id(FK)│    │ project_id │      │ project_id(FK)│
         │ name          │    │ token      │      │ pr_id (FK)    │
         └───┬───────────┘    │ expires_at │      │ status        │
             │                └────────────┘      └───┬───────────┘
             │ 1:N                                    │ 1:N
    ┌────────┼──────────┐                     ┌───────▼──────────────┐
    │        │          │                     │ CodeAnalysisIssue    │
┌───▼──────┐ │  ┌───────▼────────┐            │────────────────────  │
│BranchFile│ │  │  BranchIssue   │            │ file, line           │
│──────────│ │  │────────────────│            │ severity, category   │
│ path     │ │  │ file, line     │            │ description          │
│ hash     │ │  │ severity       │            └──────────────────────┘
└──────────┘ │  │ resolved       │
             │  └────────────────┘
        ┌────▼───────────┐    ┌──────────────┐
        │RagIndexStatus  │    │ PullRequest  │
        │────────────────│    │──────────────│
        │ branch_id (FK) │    │ project_id   │
        │ status         │    │ number, title│
        │ completed_at   │    │ source_branch│
        └────────────────┘    └──────────────┘`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Core Tables */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Core Tables</h2>

        {/* User */}
        <TableCard
          name="User"
          icon={<Users className="h-4 w-4" />}
          description="User accounts and authentication"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "username", type: "VARCHAR(255)", unique: true },
            { name: "email", type: "VARCHAR(255)", unique: true },
            { name: "password", type: "VARCHAR(255)", note: "BCrypt hashed" },
            { name: "roles", type: "VARCHAR[]", note: "USER, ADMIN" },
            { name: "created_at", type: "TIMESTAMP" },
          ]}
        />

        {/* Workspace */}
        <TableCard
          name="Workspace"
          icon={<FolderKanban className="h-4 w-4" />}
          description="Top-level organizational units"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "name", type: "VARCHAR(255)" },
            { name: "description", type: "TEXT", nullable: true },
            { name: "created_at", type: "TIMESTAMP" },
          ]}
        />

        {/* WorkspaceMember */}
        <TableCard
          name="WorkspaceMember"
          icon={<Link2 className="h-4 w-4" />}
          description="Workspace membership and roles"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "workspace_id", type: "UUID", fk: "Workspace" },
            { name: "user_id", type: "UUID", fk: "User" },
            { name: "role", type: "VARCHAR(50)", note: "OWNER, ADMIN, MEMBER, VIEWER" },
            { name: "joined_at", type: "TIMESTAMP" },
          ]}
        />

        {/* Project */}
        <TableCard
          name="Project"
          icon={<FolderKanban className="h-4 w-4" />}
          description="Repository projects within workspaces"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "workspace_id", type: "UUID", fk: "Workspace" },
            { name: "name", type: "VARCHAR(255)" },
            { name: "description", type: "TEXT", nullable: true },
            { name: "repository_url", type: "VARCHAR(500)" },
            { name: "default_branch", type: "VARCHAR(255)", note: "default: main" },
            { name: "created_at", type: "TIMESTAMP" },
          ]}
        />

        {/* Branch */}
        <TableCard
          name="Branch"
          icon={<GitBranch className="h-4 w-4" />}
          description="Git branches tracked for analysis"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "project_id", type: "UUID", fk: "Project" },
            { name: "name", type: "VARCHAR(255)" },
            { name: "created_at", type: "TIMESTAMP" },
          ]}
        />

        {/* BranchIssue */}
        <TableCard
          name="BranchIssue"
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Issues found in branch analysis"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "branch_id", type: "UUID", fk: "Branch" },
            { name: "file", type: "VARCHAR(500)" },
            { name: "line", type: "INTEGER" },
            { name: "severity", type: "VARCHAR(50)", note: "HIGH, MEDIUM, LOW, INFO" },
            { name: "category", type: "VARCHAR(100)" },
            { name: "description", type: "TEXT" },
            { name: "resolved", type: "BOOLEAN", note: "default: false" },
            { name: "resolved_at", type: "TIMESTAMP", nullable: true },
            { name: "created_at", type: "TIMESTAMP" },
          ]}
        />

        {/* ProjectToken */}
        <TableCard
          name="ProjectToken"
          icon={<Key className="h-4 w-4" />}
          description="Webhook authentication tokens"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "project_id", type: "UUID", fk: "Project" },
            { name: "token", type: "VARCHAR(500)", note: "JWT token" },
            { name: "name", type: "VARCHAR(255)" },
            { name: "expires_at", type: "TIMESTAMP" },
            { name: "created_at", type: "TIMESTAMP" },
          ]}
        />
      </div>

      {/* Analysis Tables */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Analysis Tables</h2>

        <TableCard
          name="CodeAnalysis"
          icon={<Database className="h-4 w-4" />}
          description="Pull request analysis records"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "project_id", type: "UUID", fk: "Project" },
            { name: "pr_id", type: "UUID", fk: "PullRequest", nullable: true },
            { name: "status", type: "VARCHAR(50)", note: "PENDING, PROCESSING, COMPLETED, FAILED" },
            { name: "created_at", type: "TIMESTAMP" },
            { name: "completed_at", type: "TIMESTAMP", nullable: true },
          ]}
        />

        <TableCard
          name="CodeAnalysisIssue"
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Issues found in PR analysis"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "analysis_id", type: "UUID", fk: "CodeAnalysis" },
            { name: "file", type: "VARCHAR(500)" },
            { name: "line", type: "INTEGER" },
            { name: "severity", type: "VARCHAR(50)" },
            { name: "category", type: "VARCHAR(100)" },
            { name: "description", type: "TEXT" },
            { name: "suggestion", type: "TEXT", nullable: true },
            { name: "code_snippet", type: "TEXT", nullable: true },
          ]}
        />

        <TableCard
          name="AnalysisLock"
          icon={<Key className="h-4 w-4" />}
          description="Prevents concurrent analysis of same branch"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "repository", type: "VARCHAR(500)" },
            { name: "branch", type: "VARCHAR(255)" },
            { name: "locked_at", type: "TIMESTAMP" },
            { name: "locked_by", type: "VARCHAR(255)" },
          ]}
        />

        <TableCard
          name="RagIndexStatus"
          icon={<Database className="h-4 w-4" />}
          description="RAG indexing status per branch"
          columns={[
            { name: "id", type: "UUID", pk: true },
            { name: "branch_id", type: "UUID", fk: "Branch" },
            { name: "status", type: "VARCHAR(50)", note: "PENDING, INDEXING, COMPLETED, FAILED" },
            { name: "started_at", type: "TIMESTAMP" },
            { name: "completed_at", type: "TIMESTAMP", nullable: true },
            { name: "error_message", type: "TEXT", nullable: true },
          ]}
        />
      </div>
    </div>
  );
}

interface Column {
  name: string;
  type: string;
  pk?: boolean;
  fk?: string;
  unique?: boolean;
  nullable?: boolean;
  note?: string;
}

interface TableCardProps {
  name: string;
  icon: React.ReactNode;
  description: string;
  columns: Column[];
}

function TableCard({ name, icon, description, columns }: TableCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium">Column</th>
                <th className="text-left py-2 pr-4 font-medium">Type</th>
                <th className="text-left py-2 font-medium">Constraints</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.name} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">{col.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground text-xs">{col.type}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {col.pk && <Badge variant="default" className="text-[10px]">PK</Badge>}
                      {col.fk && <Badge variant="outline" className="text-[10px]">FK → {col.fk}</Badge>}
                      {col.unique && <Badge variant="secondary" className="text-[10px]">UNIQUE</Badge>}
                      {col.nullable && <Badge variant="secondary" className="text-[10px]">NULL</Badge>}
                      {col.note && <span className="text-xs text-muted-foreground">{col.note}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
