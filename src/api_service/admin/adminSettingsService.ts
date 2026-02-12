import { ApiService } from "../api";
import type {
  ConfigurationStatus,
  SettingsMap,
  SiteSettingsGroup,
} from "./adminSettings.interface";

/**
 * API service for Site Admin Settings.
 *
 * Endpoints:
 *   GET  /admin/settings/status       → ConfigurationStatus
 *   GET  /admin/settings/{group}      → SettingsMap (masked secrets)
 *   PUT  /admin/settings/{group}      → SettingsMap (updated, masked)
 */
class AdminSettingsService extends ApiService {
  /**
   * Fetch the overall configuration status — which groups are configured,
   * and whether the minimum required setup is complete.
   */
  async getConfigurationStatus(): Promise<ConfigurationStatus> {
    return this.request<ConfigurationStatus>(
      "/admin/settings/status",
      {},
      true,
    );
  }

  /**
   * Fetch settings for a specific group. Secret values are masked
   * (e.g., "sk-o••••••c3d4").
   */
  async getSettingsGroup(group: SiteSettingsGroup): Promise<SettingsMap> {
    return this.request<SettingsMap>(`/admin/settings/${group}`, {}, true);
  }

  /**
   * Update settings for a specific group. Only changed values need to be sent.
   * If a masked value (containing "••••") is sent, the backend skips that key.
   * Returns the updated (masked) settings map.
   */
  async updateSettingsGroup(
    group: SiteSettingsGroup,
    values: SettingsMap,
  ): Promise<SettingsMap> {
    return this.request<SettingsMap>(
      `/admin/settings/${group}`,
      {
        method: "PUT",
        body: JSON.stringify(values),
      },
      true,
    );
  }
}

export const adminSettingsService = new AdminSettingsService();
