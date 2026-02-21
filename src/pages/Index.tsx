import { authUtils } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { CROSS_LINKS } from "@/lib/domains";
import { ROUTES } from "@/lib/routes";

/**
 * Root route handler for codecrow.cloud.
 *
 * Redirects:
 *   – authenticated users → workspace selection
 *   – unauthenticated users → codecrow.app landing page
 */
const Index = () => {
  if (authUtils.isAuthenticated()) {
    const savedWorkspaceSlug = localStorage.getItem("currentWorkspaceSlug");
    if (savedWorkspaceSlug) {
      return <Navigate to={ROUTES.PROJECTS(savedWorkspaceSlug)} replace />;
    }
    return <Navigate to="/workspace" replace />;
  }

  window.location.href = CROSS_LINKS.home;
  return null;
};

export default Index;
