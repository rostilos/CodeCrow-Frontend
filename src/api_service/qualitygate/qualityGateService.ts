import { ApiService } from '../api';

export type IssueSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type IssueCategory = 'SECURITY' | 'PERFORMANCE' | 'CODE_QUALITY' | 'BUG_RISK' | 'STYLE' | 'DOCUMENTATION' | 'BEST_PRACTICES' | 'ERROR_HANDLING' | 'TESTING' | 'ARCHITECTURE';
export type QualityGateMetric = 'ISSUES_BY_SEVERITY' | 'NEW_ISSUES' | 'ISSUES_BY_CATEGORY';
export type QualityGateComparator = 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'EQUAL' | 'NOT_EQUAL';
export type AnalysisResult = 'PASSED' | 'FAILED' | 'SKIPPED';

export interface QualityGateCondition {
  id?: number;
  metric: QualityGateMetric;
  severity?: IssueSeverity;
  category?: IssueCategory;
  comparator: QualityGateComparator;
  thresholdValue: number;
  enabled: boolean;
}

export interface QualityGate {
  id?: number;
  name: string;
  description?: string;
  isDefault: boolean;
  active: boolean;
  conditions: QualityGateCondition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QualityGateConditionResult {
  metric: QualityGateMetric;
  severity?: IssueSeverity;
  category?: IssueCategory;
  comparator: string;
  threshold: number;
  actualValue: number;
  passed: boolean;
}

export interface QualityGateEvaluationResult {
  result: AnalysisResult;
  qualityGateName?: string;
  conditionResults: QualityGateConditionResult[];
}

export interface CreateQualityGateRequest {
  name: string;
  description?: string;
  isDefault?: boolean;
  conditions: Omit<QualityGateCondition, 'id'>[];
}

export interface UpdateQualityGateRequest {
  name?: string;
  description?: string;
  isDefault?: boolean;
  active?: boolean;
  conditions?: Omit<QualityGateCondition, 'id'>[];
}

class QualityGateService extends ApiService {
  /**
   * Get all quality gates for a workspace
   */
  async getQualityGates(workspaceSlug: string): Promise<QualityGate[]> {
    return this.request<QualityGate[]>(`/${workspaceSlug}/quality-gates`, {}, true);
  }

  /**
   * Get a specific quality gate by ID
   */
  async getQualityGate(workspaceSlug: string, gateId: number): Promise<QualityGate> {
    return this.request<QualityGate>(`/${workspaceSlug}/quality-gates/${gateId}`, {}, true);
  }

  /**
   * Get the default quality gate for a workspace
   */
  async getDefaultQualityGate(workspaceSlug: string): Promise<QualityGate | null> {
    try {
      return await this.request<QualityGate>(`/${workspaceSlug}/quality-gates/default`, {}, true);
    } catch {
      return null;
    }
  }

  /**
   * Create a new quality gate
   */
  async createQualityGate(workspaceSlug: string, request: CreateQualityGateRequest): Promise<QualityGate> {
    return this.request<QualityGate>(`/${workspaceSlug}/quality-gates`, {
      method: 'POST',
      body: JSON.stringify(request),
    }, true);
  }

  /**
   * Update an existing quality gate
   */
  async updateQualityGate(workspaceSlug: string, gateId: number, request: UpdateQualityGateRequest): Promise<QualityGate> {
    return this.request<QualityGate>(`/${workspaceSlug}/quality-gates/${gateId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, true);
  }

  /**
   * Delete a quality gate
   */
  async deleteQualityGate(workspaceSlug: string, gateId: number): Promise<void> {
    await this.request(`/${workspaceSlug}/quality-gates/${gateId}`, {
      method: 'DELETE',
    }, true);
  }

  /**
   * Set a quality gate as default
   */
  async setDefaultQualityGate(workspaceSlug: string, gateId: number): Promise<QualityGate> {
    return this.request<QualityGate>(`/${workspaceSlug}/quality-gates/${gateId}/set-default`, {
      method: 'POST',
    }, true);
  }

  /**
   * Assign a quality gate to a project
   */
  async assignQualityGateToProject(workspaceSlug: string, projectNamespace: string, gateId: number | null): Promise<void> {
    await this.request(`/${workspaceSlug}/projects/${projectNamespace}/quality-gate`, {
      method: 'PUT',
      body: JSON.stringify({ qualityGateId: gateId }),
    }, true);
  }

  /**
   * Get the quality gate assigned to a project
   */
  async getProjectQualityGate(workspaceSlug: string, projectNamespace: string): Promise<QualityGate | null> {
    try {
      return await this.request<QualityGate>(`/${workspaceSlug}/projects/${projectNamespace}/quality-gate`, {}, true);
    } catch {
      return null;
    }
  }
}

export const qualityGateService = new QualityGateService();
