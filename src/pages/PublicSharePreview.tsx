import { useEffect, useMemo, useState } from "react";
import { BookOpen, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { QaDocPanel, type QaDocTab } from "@/components/QaDocPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  getPublicSharePreview,
  type PublicQaDocPreview,
} from "@/api_service/publicShareService";
import type { QaDocDocumentResponse } from "@/api_service/analysis/analysisService";
import { CROSS_LINKS } from "@/lib/domains";

function readSharedQaTab(fragment: string): QaDocTab {
  const requestedTab = new URLSearchParams(fragment).get("tab");
  return requestedTab === "overview" ||
    requestedTab === "test-cases" ||
    requestedTab === "environment"
    ? requestedTab
    : "test-cases";
}

export default function PublicSharePreview() {
  const [fragment] = useState(() => {
    return window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
  });
  const [token] = useState(() => {
    return new URLSearchParams(fragment).get("token")?.trim() ?? "";
  });
  const [initialTab] = useState<QaDocTab>(() => readSharedQaTab(fragment));
  const [preview, setPreview] = useState<PublicQaDocPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Shared QA documentation · CodeCrow";

    const referrerMeta = document.createElement("meta");
    referrerMeta.name = "referrer";
    referrerMeta.content = "no-referrer";
    document.head.appendChild(referrerMeta);

    const robotsMeta = document.createElement("meta");
    robotsMeta.name = "robots";
    robotsMeta.content = "noindex, nofollow, noarchive";
    document.head.appendChild(robotsMeta);

    return () => {
      document.title = originalTitle;
      referrerMeta.remove();
      robotsMeta.remove();
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setError("This public preview link is incomplete.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getPublicSharePreview(token, controller.signal)
      .then((result) => {
        if (
          result.authorizedPath &&
          result.authorizedPath.startsWith("/dashboard/")
        ) {
          const separator = result.authorizedPath.includes("?") ? "&" : "?";
          window.location.replace(
            `${result.authorizedPath}${separator}qaTab=${initialTab}`,
          );
          return;
        }
        setPreview(result.content);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "This public preview is unavailable.",
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [initialTab, token]);

  const qaDoc = useMemo<QaDocDocumentResponse | null>(() => {
    if (!preview) {
      return null;
    }
    return {
      available: true,
      prNumber: 0,
      taskId: preview.taskKey,
      markdownContent: null,
      overviewMarkdown: preview.overviewMarkdown,
      testCases: preview.testCases,
      environmentMarkdown: preview.environmentMarkdown,
      generatedAt: null,
    };
  }, [preview]);

  const rememberShareDestination = () => {
    sessionStorage.setItem(
      "intendedDestination",
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
          <a href={CROSS_LINKS.home} aria-label="CodeCrow home">
            <CodeCrowLogo size="sm" />
          </a>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <a href={CROSS_LINKS.docs}>
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </a>
            </Button>
            <ThemeToggle />
            <Button size="sm" asChild onClick={rememberShareDestination}>
              <Link to={CROSS_LINKS.login}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto p-4 lg:p-6">
          <QaDocPanel
            projectName={preview?.projectName}
            taskSummary={preview?.taskSummary}
            prNumber={null}
            qaDoc={qaDoc}
            loading={loading}
            error={error}
            initialTab={initialTab}
          />
        </div>
      </main>

      <footer className="border-t bg-background">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-2">
            <CodeCrowLogo size="sm" showText={false} />
            <span>© {new Date().getFullYear()} CodeCrow</span>
          </div>
          <span>Shared QA documentation · Read-only access</span>
        </div>
      </footer>
    </div>
  );
}
