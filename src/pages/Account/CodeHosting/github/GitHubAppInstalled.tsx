import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CheckCircle, Github } from "lucide-react";

/**
 * Public success page shown to org owners after approving a GitHub App installation.
 * This page does NOT require authentication — the org owner may not have a CodeCrow account.
 *
 * The actual connection is completed via the webhook (installation.created event),
 * so this page is purely informational.
 */
export default function GitHubAppInstalled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Github className="h-12 w-12 text-foreground" />
              <CheckCircle className="h-6 w-6 text-green-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
            </div>
          </div>
          <CardTitle className="text-xl">
            GitHub App Installed Successfully
          </CardTitle>
          <CardDescription className="text-base mt-2">
            The CodeCrow GitHub App has been installed on your organization. The
            team member who requested the installation will now have access to
            the organization's repositories in CodeCrow.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            You can safely close this page. No further action is needed from
            you.
          </p>
          <Button
            variant="outline"
            onClick={() => window.close()}
            className="w-full"
          >
            Close This Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
