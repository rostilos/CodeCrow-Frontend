import type {
  AnalysisLimitsConfig,
  AnalysisScopeConfig,
  UpdateAnalysisSettingsRequest,
} from "@/api_service/project/projectService";

interface AnalysisConfigurationWriter {
  updateAnalysisLimits(
    workspaceSlug: string,
    namespace: string,
    limits: AnalysisLimitsConfig,
  ): Promise<unknown>;
  updateAnalysisScope(
    workspaceSlug: string,
    namespace: string,
    scope: AnalysisScopeConfig,
  ): Promise<unknown>;
  updateAnalysisSettings(
    workspaceSlug: string,
    namespace: string,
    settings: UpdateAnalysisSettingsRequest,
  ): Promise<unknown>;
}

/**
 * Persist the whole-config updates without allowing a stale limits/scope write
 * to overwrite the selected review approach. The settings write runs last and
 * therefore preserves both preceding updates from the latest database state.
 */
export async function persistAnalysisConfiguration(
  writer: AnalysisConfigurationWriter,
  workspaceSlug: string,
  namespace: string,
  settings: UpdateAnalysisSettingsRequest,
  limits: AnalysisLimitsConfig,
  scope: AnalysisScopeConfig,
): Promise<void> {
  await writer.updateAnalysisLimits(workspaceSlug, namespace, limits);
  await writer.updateAnalysisScope(workspaceSlug, namespace, scope);
  await writer.updateAnalysisSettings(workspaceSlug, namespace, settings);
}
