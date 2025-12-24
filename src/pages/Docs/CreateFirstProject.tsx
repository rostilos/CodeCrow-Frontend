import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FolderGit2, Info, CheckCircle2, GitBranch, Settings, Cpu, Filter, Download } from "lucide-react";

import { DocNavigation } from "./DocNavigation";

export default function CreateFirstProject() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl font-sans">
      <div className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <FolderGit2 className="mr-2 h-4 w-4 inline" />
          Step 4
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Create Your First Project</h1>
        <p className="text-xl text-muted-foreground">
          CodeCrow projects organize your code reviews and connect your repositories to AI engines.
        </p>
      </div>

      <div className="space-y-8">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>The 5-Step Creation Flow</CardTitle>
            <CardDescription>Follow the setup wizard to integrate your repository.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t bg-background">
              {/* Step 1 */}
              <div className="p-6 flex gap-6 items-start">
                <div className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 shadow-lg">1</div>
                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    Repository Selection
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Choose your Connected VCS provider and select the specific repository you want to analyze.
                    You can import <strong>Private</strong> or <strong>Public</strong> repositories that your
                    connection has access to.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-6 flex gap-6 items-start">
                <div className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 shadow-lg">2</div>
                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Project Details
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Assign a unique <strong>Namespace</strong> to your project. This persistent identifier is used
                    in API endpoints and dashboard URLs. You can also provide a display name and description.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-6 flex gap-6 items-start">
                <div className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 shadow-lg">3</div>
                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    AI Engine Binding
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Select which AI connection will power the reviews. You can choose from your existing
                    workspace connections or create a new one (OpenAI, Claude, etc.) specifically for this project.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-6 flex gap-6 items-start">
                <div className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 shadow-lg">4</div>
                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Analysis Configuration
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Configure your <strong>Analysis Scope</strong>. Define which branches should trigger automatic
                    reviews and set up <strong>Exclude Patterns</strong> to ignore noisy files like documentation
                    or generated assets.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-6 flex gap-6 items-start">
                <div className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 shadow-lg">5</div>
                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    Installation Method
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Choose how CodeCrow receives events from your VCS.
                    <strong>Webhooks</strong> are recommended for simple zero-config setup.
                    <strong>Pipelines</strong> are best for integrating with your existing CI/CD runners.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Post-Creation Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Once your project is created, you can navigate to <strong>Project Settings</strong> to configure
              your <strong>Analysis Scope</strong> and <strong>RAG Indexing</strong>. To build an understanding
              of your codebase, you will need to trigger an initial scan manually from the RAG settings tab.
            </p>
            <p>
              If you chose the <strong>Pipeline</strong> method, you will also need to generate a
              <strong>Project Token</strong> in the final step to authenticate your external runners.
            </p>
          </CardContent>
        </Card>

        <DocNavigation
          prev={{ title: "AI Connection", url: "/docs/ai-connection" }}
          next={{ title: "Setup RAG (Optional)", url: "/docs/setup-rag" }}
        />
      </div>
    </div>
  );
}
