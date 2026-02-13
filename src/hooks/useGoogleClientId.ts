import { useEffect, useState } from "react";
import { adminSettingsService } from "@/api_service/admin/adminSettingsService";

/**
 * Cache the fetched client ID so every component instance doesn't
 * fire its own request.
 */
let cachedClientId: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

function fetchClientId(): Promise<string | null> {
  if (!fetchPromise) {
    fetchPromise = adminSettingsService
      .getPublicConfig()
      .then((config) => {
        cachedClientId = config.googleClientId ?? null;
        return cachedClientId;
      })
      .catch(() => {
        cachedClientId = null;
        return null;
      });
  }
  return fetchPromise;
}

/**
 * Hook that fetches the Google OAuth Client ID from the backend at runtime.
 *
 * This allows the admin to configure Google OAuth via the Site Administration
 * panel without needing to rebuild the frontend with `VITE_GOOGLE_CLIENT_ID`.
 *
 * The result is cached globally — the fetch only happens once per page load.
 */
export function useGoogleClientId(): string | null {
  const [clientId, setClientId] = useState<string | null>(cachedClientId);

  useEffect(() => {
    if (cachedClientId !== null) {
      setClientId(cachedClientId);
      return;
    }

    fetchClientId().then((id) => setClientId(id));
  }, []);

  return clientId;
}
