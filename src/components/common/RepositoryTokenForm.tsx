import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, ExternalLink, Key } from 'lucide-react';
import { VcsProvider } from '@/api_service/integration/integration.interface';

export interface RepositoryTokenData {
  repositoryPath: string;
  accessToken: string;
  baseUrl?: string;
}

interface RepositoryTokenFormProps {
  provider: VcsProvider;
  onSubmit: (data: RepositoryTokenData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Provider-specific configuration
const providerConfig: Record<VcsProvider, {
  name: string;
  tokenName: string;
  tokenPlaceholder: string;
  tokenScope: string;
  tokenRole?: string; // Role requirement (e.g., "Maintainer" for GitLab)
  pathExample: string;
  docsUrl: string;
  docsTitle: string;
  baseUrlPlaceholder?: string;
  supportsBaseUrl: boolean;
}> = {
  'gitlab': {
    name: 'GitLab',
    tokenName: 'Project Access Token',
    tokenPlaceholder: 'glpat-xxxxxxxxxxxxxxxx',
    tokenScope: 'api, read_repository, write_repository',
    tokenRole: 'Maintainer',
    pathExample: 'namespace/project-name',
    docsUrl: 'https://docs.gitlab.com/ee/user/project/settings/project_access_tokens.html',
    docsTitle: 'Learn more about Project Access Tokens',
    baseUrlPlaceholder: 'https://gitlab.example.com',
    supportsBaseUrl: true,
  },
  'github': {
    name: 'GitHub',
    tokenName: 'Fine-grained Personal Access Token',
    tokenPlaceholder: 'github_pat_xxxxxxxx',
    tokenScope: 'Contents (read), Metadata (read), Webhooks (read and write)',
    pathExample: 'owner/repository',
    docsUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token',
    docsTitle: 'Learn more about Fine-grained Personal Access Tokens',
    baseUrlPlaceholder: 'https://github.example.com',
    supportsBaseUrl: true,
  },
  'bitbucket-cloud': {
    name: 'Bitbucket',
    tokenName: 'Repository Access Token',
    tokenPlaceholder: 'ATBBxxxxxxxx',
    tokenScope: 'Repository (read), Webhooks (read and write)',
    pathExample: 'workspace/repository',
    docsUrl: 'https://support.atlassian.com/bitbucket-cloud/docs/repository-access-tokens/',
    docsTitle: 'Learn more about Repository Access Tokens',
    supportsBaseUrl: false,
  },
  'bitbucket-server': {
    name: 'Bitbucket Data Center',
    tokenName: 'Repository Access Token',
    tokenPlaceholder: 'token-xxxxxxxx',
    tokenScope: 'Repository (read), Webhooks (read and write)',
    pathExample: 'project/repository',
    docsUrl: 'https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html',
    docsTitle: 'Learn more about Personal Access Tokens',
    baseUrlPlaceholder: 'https://bitbucket.example.com',
    supportsBaseUrl: true,
  },
};

/**
 * Generic form for creating a VCS connection using a Repository/Project Access Token.
 * Works with all VCS providers (GitHub, GitLab, Bitbucket).
 */
export function RepositoryTokenForm({ 
  provider,
  onSubmit, 
  onCancel, 
  isLoading = false 
}: RepositoryTokenFormProps) {
  const [repositoryPath, setRepositoryPath] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = providerConfig[provider];
  const showBaseUrl = config.supportsBaseUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!repositoryPath.trim()) {
      setError('Repository path is required');
      return;
    }
    if (!repositoryPath.includes('/')) {
      setError(`Repository path must be in format "${config.pathExample}"`);
      return;
    }
    if (!accessToken.trim()) {
      setError(`${config.tokenName} is required`);
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
          {config.tokenName}
        </CardTitle>
        <CardDescription>
          Connect a single {config.name} repository using a {config.tokenName}
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
                  <strong>{config.tokenName}s</strong> provide access to a single repository only. 
                  This is ideal when you don't have organization/workspace access.
                </p>
                <p className="text-sm">
                  <strong>Required settings:</strong>
                  <br />
                  {config.tokenRole && (
                    <>• Role: <code className="bg-muted px-1 rounded">{config.tokenRole}</code> (required for webhook management)<br /></>
                  )}
                  • Scopes: <code className="bg-muted px-1 rounded">{config.tokenScope}</code>
                </p>
                <a 
                  href={config.docsUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  {config.docsTitle}
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
              placeholder={config.pathExample}
              value={repositoryPath}
              onChange={(e) => setRepositoryPath(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              The full path to your repository (e.g., "{config.pathExample}")
            </p>
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="accessToken">{config.tokenName} *</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder={config.tokenPlaceholder}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              {config.tokenRole ? (
                <>Token must have <strong>{config.tokenRole}</strong> role and <code className="bg-muted px-1 rounded">{config.tokenScope}</code> scopes</>
              ) : (
                <>Token must have <code className="bg-muted px-1 rounded">{config.tokenScope}</code> scopes</>
              )}
            </p>
          </div>

          {/* Advanced Options - only show for providers that support self-hosted */}
          {showBaseUrl && (
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
                    <Label htmlFor="baseUrl">{config.name} URL (for self-hosted)</Label>
                    <Input
                      id="baseUrl"
                      placeholder={config.baseUrlPlaceholder}
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Leave empty for {config.name}{(provider === 'gitlab' || provider === 'github') ? '.com' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
