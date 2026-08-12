import { useId } from "react";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  QaDocTestCases,
  type QaDocTestCase,
} from "@/components/QaDocTestCases";

interface QaDocTestCasesSectionProps {
  testCases: QaDocTestCase[];
}

export function QaDocTestCasesSection({
  testCases,
}: QaDocTestCasesSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 id={headingId} className="font-semibold tracking-tight">
            Manual test scenarios
          </h2>
          <p className="text-sm text-muted-foreground">
            Select a test-case title to view its setup, steps, and expected result.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 bg-background font-normal">
          <ListChecks className="h-3.5 w-3.5" />
          {testCases.length} {testCases.length === 1 ? "case" : "cases"}
        </Badge>
      </div>

      <QaDocTestCases testCases={testCases} />
    </section>
  );
}
