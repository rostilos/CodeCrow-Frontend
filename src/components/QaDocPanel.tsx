import {
  AlertCircle,
  CalendarClock,
  ClipboardCheck,
  FileText,
  FolderKanban,
  GitBranch,
  GitCommit,
  ListChecks,
  Settings2,
  TicketCheck,
} from "lucide-react";
import type { QaDocDocumentResponse } from "@/api_service/analysis/analysisService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { QaDocTestCasesSection } from "@/components/QaDocTestCasesSection";

export type QaDocTab = "overview" | "test-cases" | "environment";

interface QaDocPanelProps {
  projectName?: string | null;
  taskSummary?: string | null;
  prNumber?: number | null;
  prTitle?: string | null;
  sourceBranch?: string | null;
  targetBranch?: string | null;
  qaDoc: QaDocDocumentResponse | null;
  loading: boolean;
  error: string | null;
  initialTab?: QaDocTab;
}

export function QaDocPanel({
  projectName,
  taskSummary,
  prNumber,
  prTitle,
  sourceBranch,
  targetBranch,
  qaDoc,
  loading,
  error,
  initialTab,
}: QaDocPanelProps) {
  const testCases = qaDoc?.testCases ?? [];
  const environmentContent = qaDoc?.environmentMarkdown;
  const overviewContent =
    qaDoc?.overviewMarkdown !== null && qaDoc?.overviewMarkdown !== undefined
      ? qaDoc.overviewMarkdown
      : qaDoc?.markdownContent;
  const hasDocument = Boolean(
    qaDoc?.available &&
      (overviewContent || testCases.length > 0 || environmentContent),
  );

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl">QA documentation</CardTitle>
              <CardDescription className="mt-1">
                {prNumber
                  ? `PR #${prNumber}${prTitle ? ` · ${prTitle}` : ""}`
                  : taskSummary || "Shared QA documentation"}
              </CardDescription>
              {(sourceBranch || targetBranch) && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {sourceBranch || "unknown"} → {targetBranch || "unknown"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {qaDoc?.available && (
            <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
              {projectName && (
                <Badge variant="outline" className="gap-1.5 font-normal">
                  <FolderKanban className="h-3.5 w-3.5" />
                  {projectName}
                </Badge>
              )}
              {qaDoc.generatedAt && (
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {new Date(qaDoc.generatedAt).toLocaleString()}
                </Badge>
              )}
              {qaDoc.taskId && (
                <Badge variant="outline" className="gap-1.5 font-normal">
                  <TicketCheck className="h-3.5 w-3.5" />
                  {qaDoc.taskId}
                </Badge>
              )}
              {qaDoc.commitHash && (
                <Badge variant="outline" className="gap-1.5 font-mono font-normal">
                  <GitCommit className="h-3.5 w-3.5" />
                  {qaDoc.commitHash.slice(0, 7)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            Loading QA documentation...
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>QA documentation could not be loaded</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : hasDocument ? (
          <Tabs
            defaultValue={
              initialTab ?? (testCases.length > 0 ? "test-cases" : "overview")
            }
            className="space-y-0"
          >
            <div className="border-b bg-muted/20 px-5 pt-4 sm:px-6">
              <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0 sm:w-auto">
                <TabsTrigger
                  value="overview"
                  className="gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-none"
                >
                  <FileText className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="test-cases"
                  className="gap-2 rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-none"
                >
                  <ListChecks className="h-4 w-4" />
                  Test cases
                  <Badge variant="secondary" className="px-1.5 py-0">
                    {testCases.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="environment"
                  className="gap-2 whitespace-nowrap rounded-t-lg rounded-b-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:shadow-none"
                >
                  <Settings2 className="h-4 w-4" />
                  Environment &amp; setup
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="m-0 p-5 sm:p-6">
              <div className="rounded-xl border bg-background p-5">
                <MarkdownRenderer
                  content={overviewContent || "No overview is available."}
                />
              </div>
            </TabsContent>

            <TabsContent
              value="test-cases"
              forceMount
              className="m-0 p-5 data-[state=inactive]:hidden sm:p-6"
            >
              <QaDocTestCasesSection
                key={`${qaDoc?.prNumber ?? "shared"}-${qaDoc?.generatedAt ?? ""}-${qaDoc?.commitHash ?? ""}-${qaDoc?.taskId ?? ""}`}
                testCases={testCases}
              />
            </TabsContent>

            <TabsContent value="environment" className="m-0 p-5 sm:p-6">
              <div className="rounded-xl border bg-background p-5">
                <MarkdownRenderer
                  content={
                    environmentContent ||
                    "No environment or setup notes are available for this QA document."
                  }
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="font-medium">QA documentation has not been generated yet</p>
            <p className="mt-1 text-sm">
              The latest generated QA document will appear here when available.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
