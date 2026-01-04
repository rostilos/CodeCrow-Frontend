import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, ExternalLink, Key } from 'lucide-react';
import { GitLabRepositoryTokenRequest } from '@/api_service/codeHosting/gitlab/gitlabService.interface';

interface GitLabRepositoryTokenFormProps {
  onSubmit: (data: GitLabRepositoryTokenRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Form for creating a GitLab connection using a Project Access Token.
 * Used when users want to connect a single repository without group/org access.
 */
export function GitLabRepositoryTokenForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: GitLabRepositoryTokenFormProps) {
  const [repositoryPath, setRepositoryPath] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!repositoryPath.trim()) {
      setError('Repository path is required');
      return;
    }
    if (!repositoryPath.includes('/')) {
      setError('Repository path must be in format "namespace/project-name"');
      return;
    }
    if (!accessToken.trim()) {
      setError('Project Access Token is required');
      return;
    }

    try {
      await onSubmit({
        repositoryPath: repositoryPath.trim(),
        accessToken: accessToken.trim(),
        baseUrl: baseUrl.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create connection');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Project Access Token
        </CardTitle>
        <CardDescription>
          Connect a single GitLab repository using a Project Access Token
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Project Access Tokens</strong> provide access to a single repository only. 
                  This is ideal when you don't have group/organization access.
                </p>
                <p className="text-sm">
                  Create one in GitLab: <strong>Settings → Access Tokens</strong>
                </p>
                <p className="text-sm">
                  <strong>Required settings:</strong>
                  <br />
                  • Role: <code className="bg-muted px-1 rounded">Maintainer</code> (required for webhook management)
                  <br />
                  • Scopes: <code className="bg-muted px-1 rounded">api</code>, <code className="bg-muted px-1 rounded">read_repository</code>, <code className="bg-muted px-1 rounded">write_repository</code>
                </p>
                <a 
                  href="https://docs.gitlab.com/ee/user/project/settings/project_access_tokens.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  Learn more about Project Access Tokens
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </AlertDescription>
          </Alert>

          {/* Repository Path */}
          <div className="space-y-2">
            <Label htmlFor="repositoryPath">Repository Path *</Label>
            <Input
              id="repositoryPath"
              placeholder="namespace/project-name"
              value={repositoryPath}
              onChange={(e) => setRepositoryPath(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              The full path to your repository (e.g., "rostilos/codecrow-sample")
            </p>
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="accessToken">Project Access Token *</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="glpat-xxxxxxxxxxxxxxxx"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Token must have <strong>Maintainer</strong> role and <code className="bg-muted px-1 rounded">api</code> scope
            </p>
          </div>

          {/* Advanced Options */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▼' : '▶'} Advanced Options
            </Button>
            
            {showAdvanced && (
              <div className="mt-4 pl-4 border-l-2 border-muted space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">GitLab URL (for self-hosted)</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://gitlab.example.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty for GitLab.com
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Connection & Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
