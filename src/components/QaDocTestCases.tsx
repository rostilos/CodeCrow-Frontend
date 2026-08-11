import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export interface QaDocTestCase {
  title: string;
  priority?: string | null;
  functionalArea?: string | null;
  descriptionMarkdown: string;
}

interface QaDocTestCasesProps {
  testCases: QaDocTestCase[];
  emptyMessage?: string;
}

const priorityStyles: Record<string, string> = {
  HIGH: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  MEDIUM:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  LOW: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

export function QaDocTestCases({
  testCases,
  emptyMessage = "No test cases are available for this QA document.",
}: QaDocTestCasesProps) {
  if (testCases.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
        <ClipboardCheck className="mx-auto mb-3 h-10 w-10 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-3">
      {testCases.map((testCase, index) => {
        const priority = testCase.priority?.toUpperCase();
        return (
          <AccordionItem
            key={`${testCase.title}-${index}`}
            value={`test-case-${index}`}
            className="overflow-hidden rounded-xl border bg-card px-4 transition-colors data-[state=open]:border-primary/40 data-[state=open]:shadow-sm"
          >
            <AccordionTrigger className="gap-4 py-4 text-left hover:no-underline">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold leading-6 text-foreground">
                      {testCase.title}
                    </span>
                    {priority && (
                      <Badge
                        variant="outline"
                        className={priorityStyles[priority] ?? ""}
                      >
                        {priority}
                      </Badge>
                    )}
                  </div>
                  {testCase.functionalArea && (
                    <p className="text-xs font-normal text-muted-foreground">
                      {testCase.functionalArea}
                    </p>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="-mx-4 border-t bg-muted/10 px-4 pb-5 pt-5 sm:px-6">
              <MarkdownRenderer content={testCase.descriptionMarkdown} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
