import { useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  FolderKanban,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { QaDocTestCasesSection } from "@/components/QaDocTestCasesSection";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  getPublicSharePreview,
  type PublicTestCasesPreview,
} from "@/api_service/publicShareService";
import { authUtils } from "@/lib/auth";
import { CROSS_LINKS } from "@/lib/domains";

export default function PublicSharePreview() {
  const [token] = useState(() => {
    const fragment = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    return new URLSearchParams(fragment).get("token")?.trim() ?? "";
  });
  const [preview, setPreview] = useState<PublicTestCasesPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [authenticated] = useState(() => authUtils.isAuthenticated());

  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Shared QA test cases · CodeCrow";

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
      .then(setPreview)
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
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
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
            <Button size="sm" asChild>
              <Link to={authenticated ? CROSS_LINKS.dashboard : CROSS_LINKS.login}>
                {authenticated ? "Open CodeCrow" : "Sign in"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClipboardCheck className="h-4 w-4" />
              <span>QA documentation</span>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Public preview
            </Badge>
          </div>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            {loading ? (
              <CardContent className="py-24 text-center text-muted-foreground">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                Loading QA documentation...
              </CardContent>
            ) : error ? (
              <CardContent className="p-6 sm:p-8">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Preview unavailable</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </CardContent>
            ) : preview ? (
              <>
                <CardHeader className="border-b bg-background p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-xl">QA documentation</CardTitle>
                      <CardDescription>
                        Shared, read-only test cases for the project and task below.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="grid gap-3 pt-4 sm:grid-cols-2">
                    <MetadataCard
                      icon={<FolderKanban className="h-4 w-4" />}
                      label="Project"
                      value={preview.projectName || "Project name unavailable"}
                    />
                    <MetadataCard
                      icon={<TicketCheck className="h-4 w-4" />}
                      label="Task"
                      value={preview.taskSummary || "Task summary unavailable"}
                      badge={preview.taskKey}
                    />
                  </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6">
                  <QaDocTestCasesSection testCases={preview.testCases} />
                </CardContent>
              </>
            ) : null}
          </Card>

          <div className="flex items-start gap-2 rounded-lg border border-dashed bg-background/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This share credential grants read-only access to the displayed
              project name, task details, and test cases only. It does not grant
              workspace, project, source-code, or protected API access.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <CodeCrowLogo size="sm" showText={false} />
            <span>© {new Date().getFullYear()} CodeCrow</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={CROSS_LINKS.home} className="transition-colors hover:text-foreground">
              About CodeCrow
            </a>
            <a href={CROSS_LINKS.docs} className="transition-colors hover:text-foreground">
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface MetadataCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  badge?: string | null;
}

function MetadataCard({ icon, label, value, badge }: MetadataCardProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3.5">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {badge && (
          <Badge variant="secondary" className="shrink-0 font-mono font-normal">
            {badge}
          </Badge>
        )}
        <p className="min-w-0 break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
