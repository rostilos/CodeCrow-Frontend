import { ApiService } from "../api";
import { getApiUrl } from "@/config/api";
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

  /**
   * Download the GitHub App private key (.pem) file.
   * Only available on self-hosted instances. Returns 403 on cloud.
   */
  async downloadPrivateKey(): Promise<Blob> {
    const url = getApiUrl("/admin/settings/download-key");
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("codecrow_token")}`,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Private key download is not available in cloud mode.");
      }
      if (response.status === 404) {
        throw new Error(
          "No private key path is configured. Save the GitHub settings first.",
        );
      }
      if (response.status === 400) {
        throw new Error(
          "Private key path validation failed. Check the configured path.",
        );
      }
      throw new Error(`Download failed (HTTP ${response.status}).`);
    }

    return response.blob();
  }
}

export const adminSettingsService = new AdminSettingsService();
