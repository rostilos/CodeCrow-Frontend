import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, GitBranch } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PROVIDER_NAMES: Record<string, string> = {
  github: "GitHub",
  "bitbucket-cloud": "Bitbucket",
  gitlab: "GitLab",
};

/**
 * Public provider callback result. Repository or organization owners can
 * approve an installation without having a CodeCrow account and still receive
 * a useful completion message instead of being forced through the login guard.
 */
export default function VcsInstallationResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const provider = searchParams.get("provider") || "VCS";
  const providerName = PROVIDER_NAMES[provider] || provider;
  const status = searchParams.get("status") || "installed";
  const workspace = searchParams.get("workspace");
  const connectionId = searchParams.get("connectionId");
  const error = searchParams.get("error");
  const failed = status === "error";
  const hasCodecrowSession = Boolean(localStorage.getItem("codecrow_token"));

  const continueToCodecrow = () => {
    if (hasCodecrowSession && workspace && connectionId) {
      const params = new URLSearchParams({
        connectionId,
        provider,
        connectionType: "APP",
      });
      navigate(
        `/dashboard/${encodeURIComponent(workspace)}/projects/import?${params.toString()}`,
      );
      return;
    }
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            <GitBranch className="h-12 w-12 text-foreground" />
            {failed ? (
              <AlertCircle className="h-6 w-6 text-destructive absolute -bottom-1 -right-1 bg-background rounded-full" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-green-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
            )}
          </div>
          <CardTitle>
            {failed
              ? `${providerName} setup was not completed`
              : `${providerName} setup completed`}
          </CardTitle>
          <CardDescription className="text-base pt-2">
            {failed
              ? "CodeCrow could not finish this authorization. The CodeCrow workspace administrator can retry the connection."
              : `The ${providerName} authorization was accepted. CodeCrow can now finish the workspace connection.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {!failed && (
            <p className="text-sm text-muted-foreground">
              If you approved this request as a repository or organization
              owner, no CodeCrow account is required. You can close this page;
              the workspace administrator can continue setup in CodeCrow.
            </p>
          )}
          {failed && error && (
            <p className="text-sm text-muted-foreground">
              Reference: <code>{error}</code>
            </p>
          )}
          {hasCodecrowSession && workspace && connectionId ? (
            <Button className="w-full" onClick={continueToCodecrow}>
              Continue in CodeCrow
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.close()}
            >
              Close This Page
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
