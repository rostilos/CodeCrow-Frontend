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
  Loader2,
  Link as LinkIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { integrationService, BitbucketConnectInstallation } from "@/api_service/integration/integrationService";
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
  
  // Bitbucket Connect App state
  const [connectInstallations, setConnectInstallations] = useState<BitbucketConnectInstallation[]>([]);
  const [connectConfigured, setConnectConfigured] = useState(false);
  const [linkingInstallation, setLinkingInstallation] = useState<number | null>(null);
  const [connectInstallStatus, setConnectInstallStatus] = useState<string | null>(null);
  
  useEffect(() => {
    if (currentWorkspace) {
      loadConnections();
      loadConnectInstallations();
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
  
  const loadConnectInstallations = async () => {
    try {
      // Check if Connect App is configured
      const status = await integrationService.getBitbucketConnectStatus();
      console.log('Connect App status:', status);
      setConnectConfigured(status.configured);
      
      if (status.configured) {
        // Get unlinked installations that can be linked to this workspace
        const unlinked = await integrationService.getUnlinkedConnectInstallations();
        setConnectInstallations(unlinked);
      }
    } catch (error) {
      // Connect App might not be configured, that's OK
      console.log('Connect App not available:', error);
      // Even if the check fails, let's show the button anyway for testing
      setConnectConfigured(true);
    }
  };
  
  const handleLinkInstallation = async (installationId: number) => {
    if (!currentWorkspace) return;
    
    try {
      setLinkingInstallation(installationId);
      await integrationService.linkConnectInstallation(installationId, currentWorkspace.id);
      
      toast({
        title: "Installation linked",
        description: "The Bitbucket workspace has been linked to your CodeCrow workspace",
      });
      
      // Refresh data
      await loadConnections();
      await loadConnectInstallations();
    } catch (error: any) {
      toast({
        title: "Failed to link installation",
        description: error.message || "Could not link the installation",
        variant: "destructive",
      });
    } finally {
      setLinkingInstallation(null);
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
  
  /**
   * Handle 1-click Bitbucket Connect App installation.
   * Opens popup, tracks installation, and auto-links to workspace.
   */
  const handleConnectAppInstall = async () => {
    if (!currentWorkspace) return;
    
    try {
      setConnectInstallStatus('starting');
      
      const result = await integrationService.startBitbucketConnectInstallWithTracking(
        currentWorkspace.id,
        currentWorkspace.slug,
        (status) => setConnectInstallStatus(status)
      );
      
      if (result.status === 'completed') {
        toast({
          title: "Bitbucket Connected!",
          description: `Successfully connected to ${result.workspaceSlug || 'Bitbucket workspace'}`,
        });
        
        // Refresh data
        await loadConnections();
        await loadConnectInstallations();
      }
    } catch (error: any) {
      toast({
        title: "Installation failed",
        description: error.message || "Could not complete the installation",
        variant: "destructive",
      });
    } finally {
      setConnectInstallStatus(null);
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
            connectConfigured={connectConfigured}
            onConnectAppInstall={handleConnectAppInstall}
            connectInstallStatus={connectInstallStatus}
          />
        ))}
      </div>
      
      {/* Bitbucket Connect App installations waiting to be linked */}
      {connectConfigured && connectInstallations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              Bitbucket Workspaces Ready to Link
            </CardTitle>
            <CardDescription>
              These Bitbucket workspaces have installed the CodeCrow app and are waiting to be linked to your CodeCrow workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectInstallations.map(installation => (
                <div 
                  key={installation.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                      B
                    </div>
                    <div>
                      <div className="font-medium">{installation.bitbucketWorkspaceName || installation.bitbucketWorkspaceSlug}</div>
                      <div className="text-sm text-muted-foreground">
                        {installation.bitbucketWorkspaceSlug}
                        {installation.installedByUsername && (
                          <span> • Installed by {installation.installedByUsername}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleLinkInstallation(installation.id)}
                    disabled={linkingInstallation === installation.id}
                  >
                    {linkingInstallation === installation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <LinkIcon className="h-4 w-4 mr-2" />
                    )}
                    Link to Workspace
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
  connectConfigured?: boolean;
  onConnectAppInstall?: () => void;
  connectInstallStatus?: string | null;
}

function ProviderCard({ 
  provider, 
  connections, 
  onInstall, 
  onManage, 
  isInstalling,
  connectConfigured,
  onConnectAppInstall,
  connectInstallStatus
}: ProviderCardProps) {
  const appConnections = connections.filter(c => c.connectionType === 'APP');
  const hasAppConnection = appConnections.length > 0;
  const activeConnection = appConnections.find(c => c.status === 'CONNECTED');
  const isConnectInstalling = connectInstallStatus === 'starting' || connectInstallStatus === 'waiting';
  
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
            
            {/* Add another workspace options */}
            <div className="pt-2 border-t space-y-2">
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
                Add Another (OAuth)
              </Button>
              
              {/* Connect App option for Bitbucket */}
              {provider.id === 'bitbucket-cloud' && connectConfigured && onConnectAppInstall && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={onConnectAppInstall}
                  disabled={isConnectInstalling}
                >
                  {isConnectInstalling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {connectInstallStatus === 'waiting' ? 'Waiting...' : 'Starting...'}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Add via Bitbucket App (Teams)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your {provider.name} workspace to enable code analysis.
            </p>
            
            {/* OAuth flow (user-based) */}
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
              Connect with {provider.name}
            </Button>
            
            {/* Connect App flow (workspace-based) - only for Bitbucket */}
            {provider.id === 'bitbucket-cloud' && connectConfigured && onConnectAppInstall && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  Or install the CodeCrow app for workspace-level access (recommended for teams):
                </p>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={onConnectAppInstall}
                  disabled={isConnectInstalling}
                >
                  {isConnectInstalling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {connectInstallStatus === 'waiting' ? 'Waiting for authorization...' : 'Starting...'}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Install from Bitbucket
                    </>
                  )}
                </Button>
              </div>
            )}
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
