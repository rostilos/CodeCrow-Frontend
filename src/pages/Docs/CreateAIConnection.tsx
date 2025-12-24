import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Info, CheckCircle2 } from "lucide-react";

import { DocNavigation } from "./DocNavigation";

export default function CreateAIConnection() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <Sparkles className="mr-2 h-4 w-4 inline" />
          Step 3
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Create AI Connection</h1>
        <p className="text-xl text-muted-foreground">
          Configure your AI provider to power intelligent code analysis and automated reviews.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What is an AI Connection?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              AI connections enable CodeCrow to use advanced language models for code analysis, security scanning,
              and providing intelligent suggestions. You can configure multiple AI connections and choose which one to use for each project.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Support for OpenAI, Anthropic, and OpenRouter providers</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Choose from various models based on your needs and budget</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Secure API key storage and management</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported AI Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">OpenAI</h4>
                <p className="text-sm text-muted-foreground mb-2">Industry-leading models including GPT-5</p>
                <p className="text-xs text-muted-foreground">Recommended Models: gpt-5-mini, gpt-5</p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Anthropic</h4>
                <p className="text-sm text-muted-foreground mb-2">Advanced Claude models with long context</p>
                <p className="text-xs text-muted-foreground">Recommended Models: claude-4-opus, claude-4-sonnet</p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-2">OpenRouter</h4>
                <p className="text-sm text-muted-foreground mb-2">Access multiple AI models through one API</p>
                <p className="text-xs text-muted-foreground">Models: Various providers available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
            <CardDescription>Create and configure your AI connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">1. Obtain an API Key</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Get an API key from your chosen provider:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>OpenAI</strong>: Visit platform.openai.com and create an API key</li>
                  <li>• <strong>Anthropic</strong>: Go to console.anthropic.com to get your key</li>
                  <li>• <strong>OpenRouter</strong>: Sign up at openrouter.ai for API access</li>
                </ul>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">2. Navigate to AI Settings</h4>
                <p className="text-sm text-muted-foreground">
                  In CodeCrow, go to <strong>Account → AI Connections</strong> and click "Create New Connection".
                </p>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">3. Enter Connection Details</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Provide the following information:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Provider</strong>: Select OPENAI, ANTHROPIC, or OPENROUTER</li>
                  <li>• <strong>Model</strong>: Choose the specific model (e.g., gpt-5-mini, claude-4-sonnet)</li>
                  <li>• <strong>API Key</strong>: Paste your API key from step 1</li>
                </ul>
              </div>

              <div className="border-l-2 border-primary pl-4">
                <h4 className="font-semibold mb-2">4. Test and Save</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Create Connection" to save. CodeCrow will validate your API key and ensure connectivity.
                  You can now use this AI connection for your projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Endpoint</CardTitle>
            <CardDescription>For integration and automation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm space-y-2">
              <div className="text-primary font-semibold">POST /{'{workspaceId}'}/ai/create</div>
              <div className="text-muted-foreground">Request Body:</div>
              <pre className="text-xs overflow-x-auto">
                {`{
  "providerKey": "OPENAI" | "ANTHROPIC" | "OPENROUTER",
  "aiModel": "string",
  "apiKey": "string"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Cost Management:</strong> You are billed directly by the AI provider based on your usage.
            CodeCrow doesn't charge for AI usage - you maintain full control over your AI costs.
            Consider starting with cost-effective models like GPT-5-mini or Google: Gemini 2.5 Flash for testing.
          </AlertDescription>
        </Alert>

        <DocNavigation
          prev={{ title: "Connect VCS", url: "/docs/vcs-connection" }}
          next={{ title: "First Project", url: "/docs/first-project" }}
        />
      </div>
    </div>
  );
}
