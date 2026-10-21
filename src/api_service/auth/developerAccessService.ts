import { ApiService } from "@/api_service/api";

export interface DeveloperToken {
  id: number; name: string; scopes: string[]; createdAt: string; expiresAt: string;
}
class DeveloperAccessService extends ApiService {
  list(workspace: string): Promise<DeveloperToken[]> {
    return this.request(`/${workspace}/developer-tokens`, {}, true);
  }
  create(workspace: string, name: string, write: boolean, days: number): Promise<{ token: string; details: DeveloperToken }> {
    return this.request(`/${workspace}/developer-tokens`, { method: "POST", body: JSON.stringify({ name, write, days }) }, true);
  }
  revoke(workspace: string, id: number): Promise<void> {
    return this.request(`/${workspace}/developer-tokens/${id}`, { method: "DELETE" }, true);
  }
  approve(userCode: string, workspaceSlug: string, approve: boolean, write: boolean, days: number): Promise<void> {
    return this.request("/auth/ide/approve", { method: "POST", body: JSON.stringify({ userCode, workspaceSlug, approve, write, days }) }, true);
  }
}
export const developerAccessService = new DeveloperAccessService();
