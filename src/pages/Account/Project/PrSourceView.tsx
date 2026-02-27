import AnalysisSourceView from "./AnalysisSourceView";

/**
 * PR-level source code viewer.
 * Wraps AnalysisSourceView in "pr" mode — reads :prNumber from the URL
 * and fetches accumulated file snapshots for the entire pull request
 * (across all analysis iterations).
 */
export default function PrSourceView() {
  return <AnalysisSourceView mode="pr" />;
}
