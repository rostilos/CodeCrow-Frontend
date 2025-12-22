import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { 
  CheckCircle, 
  ArrowRight, 
  Settings, 
  GitBranch,
  BookOpen,
  Database,
  Webhook,
  Copy,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { projectService, ProjectDTO, InstallationMethod } from "@/api_service/project/projectService";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function ProjectSetupSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { namespace } = useParams<{ namespace: string }>();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  
  const [project, setProject] = useState<ProjectDTO | null>(
    (location.state as any)?.project || null
  );
  const [loading, setLoading] = useState(!project);
  
  // Get configuration from location state
  const webhooksConfigured = (location.state as any)?.webhooksConfigured as boolean | undefined;
  // Support both new installationMethod and legacy webhooksConfigured
  const installationMethod = ((location.state as any)?.installationMethod as InstallationMethod | null) 
    ?? (webhooksConfigured === true ? 'WEBHOOK' : webhooksConfigured === false ? 'PIPELINE' : null);
  const prAnalysisEnabled = (location.state as any)?.prAnalysisEnabled ?? true;
  const branchAnalysisEnabled = (location.state as any)?.branchAnalysisEnabled ?? true;
  const prTargetPatterns = (location.state as any)?.prTargetPatterns as string[] || [];
  const branchPushPatterns = (location.state as any)?.branchPushPatterns as string[] || [];
  
  useEffect(() => {
    if (!project && namespace && currentWorkspace) {
      loadProject();
    }
  }, [namespace, currentWorkspace, project]);
  
  const loadProject = async () => {
    if (!currentWorkspace || !namespace) return;
    
    setLoading(true);
    try {
      const proj = await projectService.getProjectByNamespace(currentWorkspace.slug, namespace);
      setProject(proj);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };
  
  const showPipelineSetup = installationMethod === 'PIPELINE' || installationMethod === 'GITHUB_ACTION';
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Project Created Successfully!</h1>
        <p className="text-muted-foreground">
          {project?.name} is now ready for code analysis
        </p>
      </div>
      
      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Project Name</div>
              <div className="font-medium">{project?.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Project ID</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">{project?.id}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(String(project?.id), "Project ID")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {project?.projectVcsWorkspace && (
              <div>
                <div className="text-sm text-muted-foreground">Repository</div>
                <div className="font-medium">{project?.projectVcsWorkspace}/{project?.projectRepoSlug}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Installation Method</div>
              <Badge variant="secondary">
                {installationMethod === 'WEBHOOK' ? 'Webhook (Automatic)' : 
                 installationMethod === 'PIPELINE' ? 'Bitbucket Pipelines' :
                 installationMethod === 'GITHUB_ACTION' ? 'GitHub Actions' : 'Not configured'}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {prAnalysisEnabled && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                PR Analysis Enabled
              </Badge>
            )}
            {branchAnalysisEnabled && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Branch Analysis Enabled
              </Badge>
            )}
          </div>
          
          {/* Branch Patterns Info */}
          {(prTargetPatterns.length > 0 || branchPushPatterns.length > 0) && (
            <div className="pt-4 border-t space-y-2">
              <div className="text-sm font-medium">Configured Branch Patterns</div>
              {prTargetPatterns.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">PR Target Branches:</span>{' '}
                  <code className="text-xs bg-muted px-1 rounded">{prTargetPatterns.join(', ')}</code>
                </div>
              )}
              {branchPushPatterns.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Branch Push Patterns:</span>{' '}
                  <code className="text-xs bg-muted px-1 rounded">{branchPushPatterns.join(', ')}</code>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* RAG Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            RAG Context (AI Knowledge Base)
          </CardTitle>
          <CardDescription>
            Enhance AI analysis with your codebase context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              <strong>RAG (Retrieval-Augmented Generation)</strong> allows CodeCrow to understand your entire codebase 
              and provide more accurate, context-aware code analysis and suggestions.
            </AlertDescription>
          </Alert>
          
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="font-medium">Benefits of RAG Indexing:</div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Better understanding of your project structure and patterns</li>
              <li>More relevant code suggestions based on your existing code</li>
              <li>Improved detection of inconsistencies with your codebase standards</li>
              <li>Context-aware security vulnerability detection</li>
            </ul>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate(`/dashboard/projects/${namespace}/settings?tab=rag`)}
          >
            <Database className="h-4 w-4 mr-2" />
            Configure RAG Indexing
          </Button>
        </CardContent>
      </Card>
      
      {/* Pipeline/Actions Setup (only for non-webhook installations) */}
      {showPipelineSetup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              {installationMethod === 'PIPELINE' ? 'Pipeline Setup Required' : 'GitHub Actions Setup Required'}
            </CardTitle>
            <CardDescription>
              Configure your CI/CD to trigger CodeCrow analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Since you chose {installationMethod === 'PIPELINE' ? 'Bitbucket Pipelines' : 'GitHub Actions'}, 
                you need to add configuration to your repository to trigger CodeCrow analysis.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => navigate(`/dashboard/projects/${namespace}/setup`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Setup Instructions
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Webhook Success (for webhook installations) */}
      {installationMethod === 'WEBHOOK' && (
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Webhook className="h-5 w-5" />
              Automatic Webhook Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">
              Your project is configured to use webhooks. CodeCrow will automatically analyze your code when:
            </div>
            <ul className="mt-2 list-disc list-inside text-sm space-y-1">
              {prAnalysisEnabled && <li>Pull requests are created or updated</li>}
              {branchAnalysisEnabled && <li>Code is pushed to branches</li>}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              No additional setup is required - webhooks are automatically configured through your GitHub App or Bitbucket connection.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Next Steps */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/dashboard/projects/${namespace}/settings`)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Project Settings
        </Button>
        <Button 
          onClick={() => navigate(`/dashboard/projects/${namespace}`)}
        >
          Go to Project Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
