import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useWorkspaceRoutes } from '@/hooks/useWorkspaceRoutes';
import { getApiUrl } from '@/config/api';

interface ConnectLinkResponse {
  success: boolean;
  connectionId?: number;
  workspaceSlug?: string;
  error?: string;
}

const BitbucketConnectHandshake: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { workspaces, currentWorkspace } = useWorkspace();
  const routes = useWorkspaceRoutes();
  
  const clientKey = searchParams.get('clientKey');
  const bitbucketWorkspace = searchParams.get('workspace');
  
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkResult, setLinkResult] = useState<{ success: boolean; message?: string; connectionId?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientKey) {
      setError('Missing client key. Please reinstall the app from Bitbucket.');
    }
    if (currentWorkspace) {
      setSelectedWorkspaceId(currentWorkspace.id.toString());
    }
  }, [clientKey, currentWorkspace]);

  const handleLink = async () => {
    if (!clientKey || !selectedWorkspaceId) {
      setError('Please select a workspace');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      const token = localStorage.getItem('codecrow_token');
      const response = await fetch(
        getApiUrl(`/bitbucket/connect/configure/link?clientKey=${encodeURIComponent(clientKey)}&workspaceId=${selectedWorkspaceId}`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data: ConnectLinkResponse = await response.json();

      if (data.success) {
        setLinkResult({
          success: true,
          connectionId: data.connectionId,
          message: `Successfully linked to CodeCrow!`
        });
        
        // Redirect to hosting settings after a short delay
        setTimeout(() => {
          navigate(routes.hostingSettings(), { 
            state: { 
              message: `Bitbucket workspace "${bitbucketWorkspace}" has been linked!`,
              connectionId: data.connectionId 
            }
          });
        }, 2000);
      } else {
        setError(data.error || 'Failed to link workspace');
      }
    } catch (err: any) {
      console.error('Error linking:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setIsLinking(false);
    }
  };

  if (!clientKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Invalid Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Missing required parameters. Please install the CodeCrow app from Bitbucket.
            </p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => window.location.href = 'https://bitbucket.org/site/marketplace'}
            >
              Go to Bitbucket Marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (linkResult?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Successfully Connected!
            </CardTitle>
            <CardDescription>
              Your Bitbucket workspace has been linked to CodeCrow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Setup Complete</AlertTitle>
              <AlertDescription className="text-green-700">
                CodeCrow will now automatically review pull requests in your connected repositories.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Complete Setup</CardTitle>
          <CardDescription>
            Link your Bitbucket workspace to a CodeCrow workspace to enable AI code reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {bitbucketWorkspace && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Bitbucket Workspace</p>
              <p className="font-medium">{bitbucketWorkspace}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Select CodeCrow Workspace</label>
            <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a workspace..." />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id.toString()}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This connection will be available in the selected workspace.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleLink} 
            disabled={isLinking || !selectedWorkspaceId}
            className="w-full"
          >
            {isLinking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            After linking, you can configure repositories and enable automatic code reviews.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BitbucketConnectHandshake;
