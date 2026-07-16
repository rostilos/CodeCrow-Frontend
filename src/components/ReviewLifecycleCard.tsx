import { useEffect, useState } from "react";

import { analysisService } from "@/api_service/analysis/analysisService";
import type { ReviewLifecycleV1Response } from "@/api_service/analysis/analysisService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReviewLifecycleCardProps {
  workspaceSlug: string;
  projectNamespace: string;
  prNumber: number;
}

type LifecycleLoadState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "loaded"; lifecycle: ReviewLifecycleV1Response };

const COVERAGE_FIELDS: Array<
  [
    label: string,
    key: keyof ReviewLifecycleV1Response["analysis"]["coverage"],
  ]
> = [
  ["Total", "total"],
  ["Analyzed", "analyzed"],
  ["Pending", "pending"],
  ["Owner pending", "ownerPending"],
  ["Incomplete", "incomplete"],
  ["Unsupported", "unsupported"],
  ["Failed", "failed"],
  ["Policy excluded", "policyExcluded"],
  ["Deleted recorded", "deletedRecorded"],
];

function displayCode(value: string): string {
  return value.replace(/_/g, " ");
}

export default function ReviewLifecycleCard({
  workspaceSlug,
  projectNamespace,
  prNumber,
}: ReviewLifecycleCardProps) {
  const [loadState, setLoadState] = useState<LifecycleLoadState>({
    status: "loading",
  });

  useEffect(() => {
    let acceptsResponse = true;
    setLoadState({ status: "loading" });

    void analysisService
      .getReviewLifecycle(workspaceSlug, projectNamespace, prNumber)
      .then((lifecycle) => {
        if (acceptsResponse) {
          setLoadState(
            lifecycle
              ? { status: "loaded", lifecycle }
              : { status: "unavailable" },
          );
        }
      })
      .catch(() => {
        if (acceptsResponse) {
          setLoadState({ status: "unavailable" });
        }
      });

    return () => {
      acceptsResponse = false;
    };
  }, [workspaceSlug, projectNamespace, prNumber]);

  return (
    <Card aria-label="Review lifecycle">
      <CardHeader>
        <CardTitle className="text-lg">Review lifecycle</CardTitle>
        <CardDescription>
          Durable analysis and delivery facts for the selected pull request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadState.status === "loading" && (
          <p className="text-sm text-muted-foreground">
            Loading lifecycle information…
          </p>
        )}

        {loadState.status === "unavailable" && (
          <Alert variant="destructive">
            <AlertTitle>Lifecycle information unavailable.</AlertTitle>
            <AlertDescription>
              Analysis and delivery status could not be confirmed.
            </AlertDescription>
          </Alert>
        )}

        {loadState.status === "loaded" && (
          <div className="space-y-5">
            <section aria-labelledby="review-lifecycle-analysis">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="review-lifecycle-analysis"
                  className="text-sm font-semibold"
                >
                  Analysis
                </h3>
                <Badge variant="outline">
                  {displayCode(loadState.lifecycle.analysis.state)}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {COVERAGE_FIELDS.map(([label, key]) => (
                  <span key={key} className="rounded-md bg-muted/40 px-2 py-1">
                    {label}: {loadState.lifecycle.analysis.coverage[key]}
                  </span>
                ))}
              </div>
            </section>

            <section aria-labelledby="review-lifecycle-delivery">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="review-lifecycle-delivery"
                  className="text-sm font-semibold"
                >
                  Delivery
                </h3>
                <Badge variant="outline">
                  {displayCode(loadState.lifecycle.delivery.state)}
                </Badge>
                <span className="text-sm">
                  Attempts: {loadState.lifecycle.delivery.attempts}
                </span>
              </div>
              {loadState.lifecycle.delivery.failureCode && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Failure: {loadState.lifecycle.delivery.failureCode}
                </p>
              )}
            </section>

            <section aria-labelledby="review-lifecycle-verification">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="review-lifecycle-verification"
                  className="text-sm font-semibold"
                >
                  Verification
                </h3>
                <Badge variant="outline">
                  {loadState.lifecycle.verification.available
                    ? "AVAILABLE"
                    : "UNAVAILABLE"}
                </Badge>
              </div>
              {loadState.lifecycle.verification.available && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  <span className="rounded-md bg-muted/40 px-2 py-1">
                    Total: {loadState.lifecycle.verification.total}
                  </span>
                  <span className="rounded-md bg-muted/40 px-2 py-1">
                    Supported: {loadState.lifecycle.verification.supported}
                  </span>
                  <span className="rounded-md bg-muted/40 px-2 py-1">
                    Refuted: {loadState.lifecycle.verification.refuted}
                  </span>
                  <span className="rounded-md bg-muted/40 px-2 py-1">
                    Insufficient evidence: {
                      loadState.lifecycle.verification.insufficientEvidence
                    }
                  </span>
                  <span className="rounded-md bg-muted/40 px-2 py-1">
                    Tool failed: {loadState.lifecycle.verification.toolFailed}
                  </span>
                  <span className="rounded-md bg-muted/40 px-2 py-1">
                    Intake rejected: {
                      loadState.lifecycle.verification.intakeRejected
                    }
                  </span>
                  <span className="rounded-md bg-muted/40 px-2 py-1">
                    Unresolved: {loadState.lifecycle.verification.unresolved}
                  </span>
                  <span className="rounded-md bg-muted/40 px-2 py-1">
                    Producer rejected: {
                      loadState.lifecycle.verification.producerRejected
                    }
                  </span>
                </div>
              )}
            </section>

            {loadState.lifecycle.gaps.length > 0 && (
              <section aria-labelledby="review-lifecycle-gaps">
                <h3 id="review-lifecycle-gaps" className="text-sm font-semibold">
                  Known gaps
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {loadState.lifecycle.gaps.map((gap, index) => (
                    <li key={`${gap.component}:${gap.code}:${index}`}>
                      {gap.component}: {gap.code}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {loadState.lifecycle.previousIssues.length > 0 && (
              <section aria-labelledby="review-lifecycle-previous-issues">
                <h3
                  id="review-lifecycle-previous-issues"
                  className="text-sm font-semibold"
                >
                  Previous issues
                </h3>
                <ul className="mt-2 space-y-2">
                  {loadState.lifecycle.previousIssues.map((issue, index) => (
                    <li
                      key={index}
                      className="rounded-md border bg-muted/20 p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {displayCode(issue.state)}
                        </Badge>
                        {issue.currentPath && (
                          <span className="break-all text-muted-foreground">
                            {issue.currentPath}
                            {issue.currentStartLine != null
                              ? `:${issue.currentStartLine}`
                              : ""}
                          </span>
                        )}
                      </div>
                      {issue.reasonCode && (
                        <p className="mt-2 text-muted-foreground">
                          {issue.reasonCode}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
