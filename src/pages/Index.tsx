import { authUtils } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { CROSS_LINKS } from "@/lib/domains";

/**
 * Root route handler for codecrow.cloud.
 *
 * Redirects:
 *   – authenticated users → workspace selection
 *   – unauthenticated users → codecrow.app landing page
 */
const Index = () => {
  if (authUtils.isAuthenticated()) {
    return <Navigate to="/workspace" replace />;
  }

  window.location.href = CROSS_LINKS.home;
  return null;
};

export default Index;
