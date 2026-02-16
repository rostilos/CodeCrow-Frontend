import { useEffect, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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

  const handleGoogleCallback = useCallback(
    (response: GoogleCredentialResponse) => {
      if (response.credential) {
        onSuccess(response);
      } else {
        onError?.(new Error("No credential received from Google"));
      }
    },
    [onSuccess, onError],
  );

  useEffect(() => {
    if (!clientId) return;

    // Check if script is already loaded
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript && window.google) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      onError?.(new Error("Failed to load Google Sign-In script"));
    };
    document.head.appendChild(script);
  }, [clientId, onError]);

  useEffect(() => {
    if (!isScriptLoaded || !window.google || !buttonRef.current || !clientId) {
      return;
    }

    // Initialize Google Sign-In
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
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
  }, [isScriptLoaded, clientId, handleGoogleCallback, text]);

  if (!clientId) {
    return null;
  }

  if (isLoading) {
    return (
      <Button variant="outline" className={`w-full h-11 ${className}`} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Signing in with Google...
      </Button>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={buttonRef}
        className={`w-full flex justify-center [&>div]:w-full ${disabled ? "pointer-events-none opacity-50" : ""}`}
        style={{ minHeight: "44px" }}
      />
    </div>
  );
}

// Custom styled Google Sign-In Button - uses our styling but triggers Google auth
export function GoogleSignInButtonCustom({
  onSuccess,
  onError,
  isLoading = false,
  disabled = false,
  className = "",
  children,
}: GoogleSignInButtonProps & { children?: React.ReactNode }) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const hiddenButtonRef = useRef<HTMLDivElement>(null);
  const runtimeClientId = useGoogleClientId();
  const clientId = runtimeClientId || BUILD_TIME_CLIENT_ID;

  const handleGoogleCallback = useCallback(
    (response: GoogleCredentialResponse) => {
      if (response.credential) {
        onSuccess(response);
      } else {
        onError?.(new Error("No credential received from Google"));
      }
    },
    [onSuccess, onError],
  );

  useEffect(() => {
    if (!clientId) return;

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript && window.google) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      onError?.(new Error("Failed to load Google Sign-In script"));
    };
    document.head.appendChild(script);
  }, [clientId, onError]);

  useEffect(() => {
    if (
      !isScriptLoaded ||
      !window.google ||
      !hiddenButtonRef.current ||
      !clientId
    ) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: "popup",
    });

    // Render a hidden Google button that we'll programmatically click
    hiddenButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(hiddenButtonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
    });

    setIsInitialized(true);
  }, [isScriptLoaded, clientId, handleGoogleCallback]);

  const handleClick = () => {
    if (!isInitialized || !hiddenButtonRef.current) {
      onError?.(new Error("Google Sign-In is not ready. Please try again."));
      return;
    }

    // Find and click the actual Google button inside the hidden container
    const googleButton = hiddenButtonRef.current.querySelector(
      'div[role="button"]',
    ) as HTMLElement;
    if (googleButton) {
      googleButton.click();
    } else {
      onError?.(
        new Error(
          "Google Sign-In button not found. Please refresh and try again.",
        ),
      );
    }
  };

  if (!clientId) {
    return null;
  }

  return (
    <>
      {/* Hidden Google button container */}
      <div
        ref={hiddenButtonRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />

      {/* Custom styled button */}
      <Button
        type="button"
        variant="outline"
        className={`w-full h-11 ${className}`}
        onClick={handleClick}
        disabled={isLoading || disabled || !isInitialized}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        {children || "Continue with Google"}
      </Button>
    </>
  );
}
