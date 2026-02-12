import { authUtils } from "@/lib/auth";

/**
 * Check if the current user is a site-level admin (ROLE_ADMIN).
 *
 * This is different from workspace-level "ADMIN" role.
 * Site admins have account type TYPE_ADMIN and get ROLE_ADMIN in JWT.
 * The roles are stored as a comma-separated string in localStorage.
 */
export function useSiteAdmin(): {
  isSiteAdmin: boolean;
} {
  const user = authUtils.getUser();
  const roles = (user?.roles as string) || "";
  const isSiteAdmin = roles
    .split(",")
    .some((r: string) => r.trim() === "ROLE_ADMIN");

  return { isSiteAdmin };
}

/**
 * Standalone (non-hook) version for use outside React components.
 */
export function isSiteAdmin(): boolean {
  const user = authUtils.getUser();
  const roles = (user?.roles as string) || "";
  return roles.split(",").some((r: string) => r.trim() === "ROLE_ADMIN");
}
