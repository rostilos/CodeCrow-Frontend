import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
          <HelpCircle className="mr-2 h-4 w-4 inline" />
          Q&A
        </Badge>
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground">
          Find answers to common questions about CodeCrow and its features.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Questions</CardTitle>
            <CardDescription>Common questions about CodeCrow</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is CodeCrow?</AccordionTrigger>
                <AccordionContent>
                  CodeCrow is an automated code review platform that integrates with your Bitbucket Cloud repositories.
                  It uses AI to analyze code changes, identify issues, and provide actionable feedback on pull requests.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Which version control systems are supported?</AccordionTrigger>
                <AccordionContent>
                  Currently, CodeCrow supports Bitbucket Cloud and GitHub. We plan to add support for
                  other VCS platforms like GitLab in future releases.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>How does CodeCrow integrate with my workflow?</AccordionTrigger>
                <AccordionContent>
                  CodeCrow integrates seamlessly through VCS Platform Pipelines/Webhooks. Once configured, it automatically analyzes
                  pull requests when they are created or updated, posting analysis results directly to your pull request comments.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Is my code secure?</AccordionTrigger>
                <AccordionContent>
                  Yes, CodeCrow takes security seriously. We use secure OAuth2 for authentication and encrypt all data both in transit and at rest.
                  While we don't store your full source code for long-term use, we maintain a secure, encrypted index of your repository's
                  structure and metadata (via RAG) to provide fast, context-aware analysis. This data is protected by the same
                  rigorous security standards as all other system data.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup & Configuration</CardTitle>
            <CardDescription>Questions about getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="setup-1">
                <AccordionTrigger>Do I need an AI connection to use CodeCrow?</AccordionTrigger>
                <AccordionContent>
                  Yes, CodeCrow requires an AI connection (currently supporting OpenRouter) to perform code analysis.
                  You'll need to provide your own API key during the AI connection setup process.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="setup-2">
                <AccordionTrigger>Can I use CodeCrow with multiple repositories?</AccordionTrigger>
                <AccordionContent>
                  Yes! You can create multiple projects within a workspace, each linked to different repositories.
                  A single VCS connection can be reused across multiple projects.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="setup-3">
                <AccordionTrigger>What permissions does CodeCrow need?</AccordionTrigger>
                <AccordionContent>
                  CodeCrow requires the following permissions to operate:
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Bitbucket Cloud:</h4>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li><strong>Account (Read)</strong>: To identify the connecting user</li>
                        <li><strong>Repositories (Read)</strong>: To access repository content for analysis</li>
                        <li><strong>Pull Requests (Read)</strong>: To read pull request details</li>
                        <li><strong>Webhooks (Read & Write)</strong>: To automatically set up analysis triggers</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">GitHub:</h4>
                      <ul className="list-disc ml-6 space-y-1 text-sm">
                        <li><strong>repo</strong>: Full control of repositories (includes pull requests and webhooks)</li>
                        <li><strong>read:user</strong>: To identify the connecting user</li>
                        <li><strong>read:org</strong>: To read organization data when applicable</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="setup-4">
                <AccordionTrigger>How do I get a project token?</AccordionTrigger>
                <AccordionContent>
                  After creating a project, navigate to the project settings page. You'll find a "Generate Token" button
                  in the Token Management section. This token is used in your Bitbucket Pipeline configuration to authenticate
                  CodeCrow's analysis requests.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis & Features</CardTitle>
            <CardDescription>Understanding CodeCrow's capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="features-1">
                <AccordionTrigger>What types of issues does CodeCrow detect?</AccordionTrigger>
                <AccordionContent>
                  CodeCrow analyzes code for various issues including:
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Code quality and maintainability concerns</li>
                    <li>Potential bugs and logic errors</li>
                    <li>Security vulnerabilities</li>
                    <li>Performance optimization opportunities</li>
                    <li>Best practice violations</li>
                    <li>Code style and formatting issues</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="features-2">
                <AccordionTrigger>Can I customize the analysis rules?</AccordionTrigger>
                <AccordionContent>
                  Currently, CodeCrow uses a predefined set of analysis rules optimized for most projects.
                  We're working on adding customization options in future releases, allowing you to define
                  custom rules and severity levels.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="features-3">
                <AccordionTrigger>How long does analysis take?</AccordionTrigger>
                <AccordionContent>
                  Analysis time depends on the size of the code changes and the complexity of the project.
                  Typically, most pull requests are analyzed within 1-2 minutes. Large pull requests may take longer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="features-4">
                <AccordionTrigger>Does CodeCrow support multiple programming languages?</AccordionTrigger>
                <AccordionContent>
                  Yes, CodeCrow's AI-powered analysis supports a wide range of programming languages including
                  Java, Python, JavaScript, TypeScript, Go, C++, and many more. The analysis adapts to the language
                  and framework used in your project.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspaces & Billing</CardTitle>
            <CardDescription>Questions about organization and pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="billing-1">
                <AccordionTrigger>What is a workspace?</AccordionTrigger>
                <AccordionContent>
                  A workspace is an organizational unit in CodeCrow that contains your projects, VCS connections,
                  and AI connections. It allows teams to collaborate and share resources. You can create multiple
                  workspaces for different teams or organizations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="billing-2">
                <AccordionTrigger>Can I have multiple users in a workspace?</AccordionTrigger>
                <AccordionContent>
                  Yes, workspaces support multiple users with role-based access control. You can invite team members
                  and assign them different permission levels (Admin, Developer, Viewer) to control what they can access
                  and modify.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="billing-3">
                <AccordionTrigger>How does pricing work?</AccordionTrigger>
                <AccordionContent>
                  CodeCrow offers flexible pricing plans based on the number of analyzed pull requests per month.
                  We also offer a free tier for evaluation. Note that AI provider costs (e.g., OpenRouter API usage)
                  are billed separately by the AI provider.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="billing-4">
                <AccordionTrigger>Can I change workspaces?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can easily switch between workspaces using the workspace switcher in the dashboard.
                  Each workspace maintains its own projects, connections, and settings independently.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="trouble-1">
                <AccordionTrigger>Analysis is not running on my pull requests</AccordionTrigger>
                <AccordionContent>
                  Check the following:
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Verify that your Bitbucket Pipeline is configured correctly with the project token</li>
                    <li>Ensure the project is active and not in a paused state</li>
                    <li>Check that your VCS connection is still valid and authorized</li>
                    <li>Review the pipeline logs in Bitbucket for any error messages</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trouble-2">
                <AccordionTrigger>My VCS connection shows as "disconnected"</AccordionTrigger>
                <AccordionContent>
                  This usually means the OAuth authorization has expired or been revoked. Go to Code Hosting settings,
                  delete the old connection, and create a new one with fresh OAuth credentials from Bitbucket.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trouble-3">
                <AccordionTrigger>The analysis results seem incorrect or incomplete</AccordionTrigger>
                <AccordionContent>
                  If you're seeing unexpected results:
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Check that the correct branch is set as the default branch in project settings</li>
                    <li>Verify that the AI connection has sufficient API credits/quota</li>
                    <li>Review the detailed issue information in the project dashboard</li>
                    <li>Contact support if issues persist</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trouble-4">
                <AccordionTrigger>How do I get support?</AccordionTrigger>
                <AccordionContent>
                  For additional help:
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Check the detailed documentation for step-by-step guides</li>
                    <li>Contact our support team through the help center</li>
                    <li>Report bugs or request features through the feedback form</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
