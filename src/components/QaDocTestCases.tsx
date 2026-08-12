import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

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
  const testCaseKeys = useMemo(
    () => testCases.map((testCase, index) => `${testCase.title}-${index}`),
    [testCases],
  );
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const availableKeys = new Set(testCaseKeys);
    setCompleted(
      (current) =>
        new Set(Array.from(current).filter((key) => availableKeys.has(key))),
    );
  }, [testCaseKeys]);

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
        const testCaseKey = testCaseKeys[index];
        const isCompleted = completed.has(testCaseKey);
        return (
          <AccordionItem
            key={testCaseKey}
            value={`test-case-${index}`}
            className={cn(
              "overflow-hidden rounded-xl border bg-card px-4 transition-colors data-[state=open]:border-primary/40 data-[state=open]:shadow-sm",
              isCompleted && "border-emerald-500/30 bg-emerald-500/[0.03]",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-[60px] shrink-0 items-center">
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={(checked) => {
                    setCompleted((current) => {
                      const next = new Set(current);
                      if (checked === true) {
                        next.add(testCaseKey);
                      } else {
                        next.delete(testCaseKey);
                      }
                      return next;
                    });
                  }}
                  aria-label={`Mark ${testCase.title} as ${isCompleted ? "incomplete" : "complete"}`}
                  className="h-5 w-5 border-muted-foreground/50 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 grow"
                />
              </div>
              <AccordionTrigger className="min-w-0 gap-4 py-4 text-left hover:no-underline">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "font-semibold leading-6 text-foreground",
                          isCompleted && "text-muted-foreground line-through",
                        )}
                      >
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
            </div>
            <AccordionContent className="-mx-4 border-t bg-muted/10 px-4 pb-5 pt-5 sm:px-6">
              <MarkdownRenderer content={testCase.descriptionMarkdown} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
