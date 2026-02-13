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

  /**
   * Upload a GitHub App private key (.pem) file.
   * The backend saves it to the configured key directory and returns the path.
   */
  async uploadPrivateKey(file: File): Promise<{ path: string }> {
    const url = getApiUrl("/admin/settings/upload-key");
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("codecrow_token")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Private key upload is not available in cloud mode.");
      }
      if (response.status === 400) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Invalid file. Only .pem files are accepted.");
      }
      throw new Error(`Upload failed (HTTP ${response.status}).`);
    }

    return response.json();
  }

  /**
   * Fetch public site configuration (available without authentication).
   * Used to determine which features (e.g. Google OAuth) are enabled at runtime.
   */
  async getPublicConfig(): Promise<{ googleClientId?: string }> {
    const url = getApiUrl("/public/site-config");
    const response = await fetch(url);
    if (!response.ok) {
      return {};
    }
    return response.json();
  }
}

export const adminSettingsService = new AdminSettingsService();
