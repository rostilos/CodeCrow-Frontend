import { ApiService } from "@/api_service/api";
import {
  TaskManagementConnectionRequest,
  TaskManagementConnectionResponse,
  TaskManagementProviderInfo,
  QaAutoDocConfigRequest,
} from "./taskManagement.interface";

/**
 * Service for Task Management integrations (Jira Cloud, etc.).
 * Base path: /api/workspaces/{workspaceSlug}/task-management
 */
class TaskManagementService extends ApiService {
  // ─── Connections ────────────────────────────────────────────

  /**
   * List all task management connections for a workspace.
   */
  async listConnections(
    workspaceSlug: string,
  ): Promise<TaskManagementConnectionResponse[]> {
    return this.request<TaskManagementConnectionResponse[]>(
      `/${workspaceSlug}/task-management/connections`,
      { method: "GET" },
    );
  }

  /**
   * Get a single connection by ID.
   */
  async getConnection(
    workspaceSlug: string,
    connectionId: number,
  ): Promise<TaskManagementConnectionResponse> {
    return this.request<TaskManagementConnectionResponse>(
      `/${workspaceSlug}/task-management/connections/${connectionId}`,
      { method: "GET" },
    );
  }

  /**
   * Create a new task management connection.
   */
  async createConnection(
    workspaceSlug: string,
    data: TaskManagementConnectionRequest,
  ): Promise<TaskManagementConnectionResponse> {
    return this.request<TaskManagementConnectionResponse>(
      `/${workspaceSlug}/task-management/connections`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  /**
   * Update an existing task management connection.
   */
  async updateConnection(
    workspaceSlug: string,
    connectionId: number,
    data: TaskManagementConnectionRequest,
  ): Promise<TaskManagementConnectionResponse> {
    return this.request<TaskManagementConnectionResponse>(
      `/${workspaceSlug}/task-management/connections/${connectionId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  }

  /**
   * Delete a task management connection.
   */
  async deleteConnection(
    workspaceSlug: string,
    connectionId: number,
  ): Promise<void> {
    return this.request<void>(
      `/${workspaceSlug}/task-management/connections/${connectionId}`,
      { method: "DELETE" },
    );
  }

  /**
   * Validate (test) a connection.
   */
  async validateConnection(
    workspaceSlug: string,
    connectionId: number,
  ): Promise<TaskManagementConnectionResponse> {
    return this.request<TaskManagementConnectionResponse>(
      `/${workspaceSlug}/task-management/connections/${connectionId}/validate`,
      { method: "POST" },
    );
  }

  // ─── QA Auto-Documentation Config ──────────────────────────

  /**
   * Update QA auto-documentation configuration for a project.
   */
  async updateQaAutoDocConfig(
    workspaceSlug: string,
    projectId: number,
    config: QaAutoDocConfigRequest,
  ): Promise<void> {
    return this.request<void>(
      `/${workspaceSlug}/task-management/projects/${projectId}/qa-auto-doc`,
      {
        method: "PUT",
        body: JSON.stringify(config),
      },
    );
  }

  // ─── Providers ─────────────────────────────────────────────

  /**
   * Get the list of available task management providers.
   */
  async getProviders(
    workspaceSlug: string,
  ): Promise<TaskManagementProviderInfo[]> {
    return this.request<TaskManagementProviderInfo[]>(
      `/${workspaceSlug}/task-management/providers`,
      { method: "GET" },
    );
  }
}

export const taskManagementService = new TaskManagementService();
