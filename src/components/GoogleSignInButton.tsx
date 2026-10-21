import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useGoogleClientId } from "@/hooks/useGoogleClientId";

// Extend Window interface for Google API
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          renderButton: (
            parent: HTMLElement,
            options: GoogleButtonOptions,
          ) => void;
          prompt: (
            callback?: (notification: PromptNotification) => void,
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleInitConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  ux_mode?: "popup" | "redirect";
}

interface GoogleButtonOptions {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  type?: "standard" | "icon";
  shape?: "rectangular" | "pill" | "circle" | "square";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
  logo_alignment?: "left" | "center";
}

interface PromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleSignInButtonProps {
  onSuccess: (response: GoogleCredentialResponse) => void;
  onError?: (error: Error) => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Build-time fallback — if set, used immediately without waiting for
 * the runtime fetch. The runtime value (from the backend) takes priority.
 */
const BUILD_TIME_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Native Google Sign-In Button - renders Google's own button
export function GoogleSignInButton({
  onSuccess,
  onError,
  text = "continue_with",
  isLoading = false,
  disabled = false,
  className = "",
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const runtimeClientId = useGoogleClientId();
  const clientId = runtimeClientId || BUILD_TIME_CLIENT_ID;

  const callbacks = useRef({ onSuccess, onError });
  callbacks.current = { onSuccess, onError };

  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      setIsScriptLoaded(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    const script = existing ?? document.createElement("script");
    const loaded = () => setIsScriptLoaded(true);
    const failed = () => {
      script.remove();
      callbacks.current.onError?.(new Error("Failed to load Google Sign-In script. Please refresh to retry."));
    };
    script.addEventListener("load", loaded);
    script.addEventListener("error", failed);
    if (!existing) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      document.head.appendChild(script);
    }
    return () => {
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
    };
  }, [clientId]);

  useEffect(() => {
    if (!isScriptLoaded || !window.google || !buttonRef.current || !clientId) {
      return;
    }

    // Initialize Google Sign-In
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: response => {
        if (response.credential) callbacks.current.onSuccess(response);
        else callbacks.current.onError?.(new Error("No credential received from Google"));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: "popup",
    });

    // Clear any previous button content
    buttonRef.current.innerHTML = "";

    // Render the Google button
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: text,
      width: 400,
      logo_alignment: "left",
    });
  }, [isScriptLoaded, clientId, text]);

  if (!clientId) {
    return null;
  }

  return (
    <div className={`w-full ${className}`} aria-busy={isLoading}>
      {isLoading && <div role="status" className="flex items-center justify-center gap-2 py-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Signing in with Google…
      </div>}
      <div
        ref={buttonRef}
        className={`w-full flex justify-center [&>div]:w-full ${isLoading ? "hidden" : disabled ? "pointer-events-none opacity-50" : ""}`}
        style={{ minHeight: "44px" }}
      />
    </div>
  );
}
