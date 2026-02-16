import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FEATURES } from "@/config/features";
import { isSiteAdmin } from "@/hooks/useSiteAdmin";
import { adminSettingsService } from "@/api_service/admin/adminSettingsService";

/**
 * Guard component that checks if the instance is fully configured.
 *
 * If the user is a site admin and the setup is not complete,
 * redirect to the setup wizard. Otherwise, render children normally.
 *
 * This is only active when the INSTANCE_ADMIN feature flag is enabled.
 */
export function SetupGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip if feature not enabled or user is not admin
    if (!FEATURES.INSTANCE_ADMIN || !isSiteAdmin()) {
      setChecked(true);
      return;
    }

    adminSettingsService
      .getConfigurationStatus()
      .then((status) => {
        if (!status.setupComplete) {
          navigate("/admin/setup", { replace: true });
        }
      })
      .catch(() => {
        // If the endpoint fails (e.g., network error), don't block the user
      })
      .finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">
            Checking instance configuration...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
