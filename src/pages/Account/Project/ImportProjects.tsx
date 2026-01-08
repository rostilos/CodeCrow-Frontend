import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GitBranch, Plus, RefreshCw } from "lucide-react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { integrationService } from "@/api_service/integration/integrationService";
import { VcsConnection, VcsProvider } from "@/api_service/integration/integration.interface";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";

// Bitbucket logo SVG component
function BitbucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
    </svg>
  );
}

// GitLab logo SVG component
function GitLabIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51a.42.42 0 01.82 0l2.44 7.51h8.06l2.44-7.51a.42.42 0 01.82 0l2.44 7.51 1.22 3.78a.84.84 0 01-.3.94z"/>
    </svg>
  );
}

// Provider display info
const PROVIDER_INFO: Record<VcsProvider, { name: string; color: string }> = {
  'bitbucket-cloud': { name: 'Bitbucket Cloud', color: 'text-blue-500' },
  'bitbucket-server': { name: 'Bitbucket Server', color: 'text-blue-600' },
  'github': { name: 'GitHub', color: 'text-gray-900 dark:text-gray-100' },
  'gitlab': { name: 'GitLab', color: 'text-orange-500' },
};

function getProviderIcon(provider: VcsProvider, className: string = "h-6 w-6") {
  const color = PROVIDER_INFO[provider]?.color || '';
  switch (provider) {
    case 'bitbucket-cloud':
    case 'bitbucket-server':
      return <BitbucketIcon className={`${className} ${color}`} />;
    case 'github':
      return <Github className={`${className} ${color}`} />;
    case 'gitlab':
      return <GitLabIcon className={`${className} ${color}`} />;
    default:
      return <GitBranch className={className} />;
  }
}

export default function ImportProjects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const routes = useWorkspaceRoutes();

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<VcsConnection[]>([]);

  useEffect(() => {
    if (currentWorkspace) {
      loadConnections();
    }
  }, [currentWorkspace]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const data = await integrationService.getAllConnections(currentWorkspace!.slug);
      setConnections(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load connections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConnection = (connection: VcsConnection) => {
    navigate(routes.projectImport({ 
      connectionId: connection.id, 
      provider: connection.provider, 
      connectionType: connection.connectionType 
    }));
  };

  // Group connections by provider
  const connectionsByProvider = connections.reduce((acc, conn) => {
    if (!acc[conn.provider]) {
      acc[conn.provider] = [];
    }
    acc[conn.provider].push(conn);
    return acc;
  }, {} as Record<VcsProvider, VcsConnection[]>);

  if (loading) {
    return (
      <div className="min-h-full">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="px-4 lg:px-6 container py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(routes.projects())}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Import Project</h1>
                <p className="text-sm text-muted-foreground">Select a connection to import from</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 lg:px-6 container py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-muted/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="px-4 lg:px-6 container py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(routes.projects())}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Import Project</h1>
                <p className="text-sm text-muted-foreground">
                  Select a VCS connection to import repositories from
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadConnections}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6 container py-6">
        {connections.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No VCS Connections</h3>
              <p className="text-muted-foreground mb-4">
                You need to connect a VCS provider before importing projects.
              </p>
              <Button onClick={() => navigate(routes.hostingSettings())}>
                <Plus className="mr-2 h-4 w-4" />
                Add VCS Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(connectionsByProvider).map(([provider, providerConnections]) => (
              <div key={provider}>
                <div className="flex items-center gap-3 mb-4">
                  {getProviderIcon(provider as VcsProvider, "h-6 w-6")}
                  <h2 className="text-lg font-semibold">
                    {PROVIDER_INFO[provider as VcsProvider]?.name || provider}
                  </h2>
                  <Badge variant="secondary">{providerConnections.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providerConnections.map((connection) => (
                    <Card 
                      key={connection.id} 
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                      onClick={() => handleSelectConnection(connection)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getProviderIcon(connection.provider, "h-8 w-8")}
                            <div>
                              <CardTitle className="text-base">{connection.connectionName}</CardTitle>
                              <CardDescription className="text-xs">
                                {connection.connectionType === 'APP' || connection.connectionType === 'CONNECT_APP' 
                                  ? 'App Installation' 
                                  : 'OAuth Connection'}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Available repositories</span>
                          <Badge variant="outline">{connection.repoCount}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Add new connection card */}
            <div className="border-t pt-6">
              <Card 
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all border-dashed"
                onClick={() => navigate(routes.hostingSettings())}
              >
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium">Add New Connection</p>
                    <p className="text-sm text-muted-foreground">
                      Connect another VCS provider
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
