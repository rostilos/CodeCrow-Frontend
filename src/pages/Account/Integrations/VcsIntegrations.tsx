import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Settings, 
  Plus,
  ExternalLink,
  Loader2 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { integrationService } from "@/api_service/integration/integrationService";
import { 
  VcsConnection, 
  VcsProvider, 
  VcsSetupStatus,
  PROVIDERS,
  ProviderInfo 
} from "@/api_service/integration/integration.interface";

/**
 * VCS Integrations settings page.
 * Shows cards for each VCS provider with connection status and actions.
 */
export default function VcsIntegrations() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [connections, setConnections] = useState<VcsConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [installingProvider, setInstallingProvider] = useState<VcsProvider | null>(null);
  
  useEffect(() => {
    if (currentWorkspace) {
      loadConnections();
    }
  }, [currentWorkspace]);
  
  const loadConnections = async () => {
    if (!currentWorkspace) return;
    
    try {
      setIsLoading(true);
      const allConnections = await integrationService.getAllConnections(currentWorkspace.slug);
      setConnections(allConnections);
    } catch (error: any) {
      toast({
        title: "Failed to load integrations",
        description: error.message || "Could not retrieve VCS connections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInstallApp = async (provider: VcsProvider) => {
    if (!currentWorkspace) return;
    
    try {
      setInstallingProvider(provider);
      await integrationService.startAppInstall(currentWorkspace.slug, provider);
    } catch (error: any) {
      toast({
        title: "Failed to start installation",
        description: error.message || "Could not start app installation",
        variant: "destructive",
      });
      setInstallingProvider(null);
    }
  };
  
  const getConnectionsForProvider = (provider: VcsProvider): VcsConnection[] => {
    return connections.filter(c => c.provider === provider);
  };
  
  const getStatusIcon = (status: VcsSetupStatus) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5 text-warning" />;
    }
  };
  
  const getStatusBadge = (status: VcsSetupStatus) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge className="bg-success text-success-foreground">Connected</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      case 'DISABLED':
        return <Badge variant="secondary">Disabled</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading integrations...</span>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">VCS Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect your version control systems to enable code analysis
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {PROVIDERS.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            connections={getConnectionsForProvider(provider.id)}
            onInstall={() => handleInstallApp(provider.id)}
            onManage={(connectionId) => navigate(`/dashboard/integrations/${provider.id}/${connectionId}`)}
            isInstalling={installingProvider === provider.id}
          />
        ))}
      </div>
      
      {/* Legacy connections section */}
      {connections.some(c => c.connectionType === 'OAUTH_MANUAL') && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Legacy Connections</CardTitle>
            <CardDescription>
              Manual OAuth connections from the previous integration method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections
                .filter(c => c.connectionType === 'OAUTH_MANUAL')
                .map(connection => (
                  <div 
                    key={connection.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(connection.status)}
                      <div>
                        <div className="font-medium">{connection.connectionName}</div>
                        <div className="text-sm text-muted-foreground">
                          {connection.repoCount} repositories
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(connection.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dashboard/hosting/configure/${connection.id}`)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ProviderCardProps {
  provider: ProviderInfo;
  connections: VcsConnection[];
  onInstall: () => void;
  onManage: (connectionId: number) => void;
  isInstalling: boolean;
}

function ProviderCard({ provider, connections, onInstall, onManage, isInstalling }: ProviderCardProps) {
  const appConnections = connections.filter(c => c.connectionType === 'APP');
  const hasAppConnection = appConnections.length > 0;
  const activeConnection = appConnections.find(c => c.status === 'CONNECTED');
  
  return (
    <Card className={!provider.isSupported ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProviderIcon provider={provider.id} className="h-8 w-8" />
            <div>
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              <CardDescription>{provider.description}</CardDescription>
            </div>
          </div>
          {!provider.isSupported && (
            <Badge variant="outline">Coming Soon</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!provider.isSupported ? (
          <p className="text-sm text-muted-foreground">
            Support for {provider.name} is coming soon.
          </p>
        ) : hasAppConnection ? (
          <div className="space-y-3">
            {appConnections.map(connection => (
              <div 
                key={connection.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <div className="font-medium">{connection.connectionName}</div>
                    <div className="text-sm text-muted-foreground">
                      {connection.externalWorkspaceSlug || 'Connected'} • {connection.repoCount} repos
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onManage(connection.id)}
                >
                  Manage
                </Button>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onInstall}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Another Workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Install the CodeCrow App to connect repositories from {provider.name}.
            </p>
            <Button 
              className="w-full"
              onClick={onInstall}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Install {provider.name} App
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ProviderIconProps {
  provider: VcsProvider;
  className?: string;
}

function ProviderIcon({ provider, className }: ProviderIconProps) {
  // For now, use simple colored circles. In production, use actual provider logos.
  const colors: Record<VcsProvider, string> = {
    'bitbucket-cloud': 'bg-blue-500',
    'bitbucket-server': 'bg-blue-600',
    'github': 'bg-gray-800',
    'gitlab': 'bg-orange-500',
  };
  
  return (
    <div className={`${className} ${colors[provider]} rounded-lg flex items-center justify-center text-white font-bold`}>
      {provider.charAt(0).toUpperCase()}
    </div>
  );
}
