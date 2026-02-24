import AnalysisSourceView from "./AnalysisSourceView";

/**
 * Branch-level source code viewer.
 *
 * Renders the unified AnalysisSourceView in "branch" mode which:
 * - Shows branch-level source code (aggregated across all analyses)
 * - Loads file tree structure first, then individual file content on demand
 * - Includes a branch/PR selector to switch between sources that have snapshots
 */
export default function BranchSourceView() {
  return <AnalysisSourceView mode="branch" />;
}

