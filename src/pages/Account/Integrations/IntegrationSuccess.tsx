import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Search,
  Loader2,
  GitBranch,
  ArrowRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/WorkspaceContext";
import { integrationService } from "@/api_service/integration/integrationService";
import { 
  VcsConnection, 
  VcsProvider, 
  VcsRepository,
  VcsRepositoryList 
} from "@/api_service/integration/integration.interface";

/**
 * Post-installation success page.
 * Shows repository selection for onboarding after app installation.
 */
export default function IntegrationSuccess() {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId');
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [connection, setConnection] = useState<VcsConnection | null>(null);
  const [repositories, setRepositories] = useState<VcsRepository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  useEffect(() => {
    if (currentWorkspace && connectionId && provider) {
      loadConnection();
      loadRepositories();
    }
  }, [currentWorkspace, connectionId, provider]);
  
  const loadConnection = async () => {
    if (!currentWorkspace || !connectionId || !provider) return;
    
    try {
      const conn = await integrationService.getConnection(
        currentWorkspace.slug, 
        provider as VcsProvider, 
        parseInt(connectionId)
      );
      setConnection(conn);
    } catch (error: any) {
      toast({
        title: "Failed to load connection",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const loadRepositories = async (pageNum = 1, append = false) => {
    if (!currentWorkspace || !connectionId || !provider) return;
    
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const result: VcsRepositoryList = await integrationService.listRepositories(
        currentWorkspace.slug,
        provider as VcsProvider,
        parseInt(connectionId),
        pageNum,
        searchQuery || undefined
      );
      
      if (append) {
        setRepositories(prev => [...prev, ...result.items]);
      } else {
        setRepositories(result.items);
      }
      
      setPage(pageNum);
      setHasMore(result.hasNext);
    } catch (error: any) {
      toast({
        title: "Failed to load repositories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  const handleSearch = () => {
    setPage(1);
    loadRepositories(1, false);
  };
  
  const handleLoadMore = () => {
    loadRepositories(page + 1, true);
  };
  
  const toggleRepo = (repoId: string) => {
    setSelectedRepos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(repoId)) {
        newSet.delete(repoId);
      } else {
        newSet.add(repoId);
      }
      return newSet;
    });
  };
  
  const selectAll = () => {
    const allIds = repositories
      .filter(r => !r.isOnboarded)
      .map(r => r.id);
    setSelectedRepos(new Set(allIds));
  };
  
  const deselectAll = () => {
    setSelectedRepos(new Set());
  };
  
  const handleOnboard = async () => {
    if (!currentWorkspace || !connectionId || !provider) return;
    if (selectedRepos.size === 0) return;
    
    try {
      setIsOnboarding(true);
      
      const reposToOnboard = repositories.filter(r => selectedRepos.has(r.id));
      const requests = reposToOnboard.map(repo => ({
        externalRepoId: repo.slug, // Use slug for Bitbucket API compatibility
        request: {
          vcsConnectionId: parseInt(connectionId),
          projectName: repo.name,
          projectNamespace: repo.slug,
          setupWebhooks: true,
        },
      }));
      
      const results = await integrationService.onboardRepositories(
        currentWorkspace.slug,
        provider as VcsProvider,
        requests
      );
      
      toast({
        title: "Repositories connected",
        description: `Successfully connected ${results.length} repositories`,
      });
      
      // Refresh list to show updated status
      loadRepositories(1, false);
      setSelectedRepos(new Set());
      
    } catch (error: any) {
      toast({
        title: "Failed to connect repositories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsOnboarding(false);
    }
  };
  
  const handleFinish = () => {
    navigate('/dashboard/hosting');
  };
  
  if (isLoading && !connection) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Success header */}
      <Card className="border-success/50 bg-success/5">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="p-3 bg-success/20 rounded-full">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connection Successful!</h2>
            <p className="text-muted-foreground">
              {connection?.connectionName || 'Your VCS connection'} is now connected.
              Select repositories to start analyzing.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Repository selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Select Repositories
          </CardTitle>
          <CardDescription>
            Choose which repositories you want to connect to CodeCrow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Selection controls */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-2">
              <Button variant="link" size="sm" onClick={selectAll} className="p-0 h-auto">
                Select all
              </Button>
              <span className="text-muted-foreground">|</span>
              <Button variant="link" size="sm" onClick={deselectAll} className="p-0 h-auto">
                Deselect all
              </Button>
            </div>
            <span className="text-muted-foreground">
              {selectedRepos.size} selected
            </span>
          </div>
          
          {/* Repository list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading repositories...</span>
            </div>
          ) : repositories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No repositories found
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg transition-colors
                    ${repo.isOnboarded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}
                    ${selectedRepos.has(repo.id) ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => !repo.isOnboarded && toggleRepo(repo.id)}
                >
                  <Checkbox
                    checked={selectedRepos.has(repo.id) || repo.isOnboarded}
                    disabled={repo.isOnboarded}
                    onCheckedChange={() => !repo.isOnboarded && toggleRepo(repo.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{repo.name}</span>
                      {repo.isPrivate && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Private</span>
                      )}
                      {repo.isOnboarded && (
                        <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded">
                          Already connected
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {repo.fullName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Load more */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleFinish}>
          Skip for Now
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={handleOnboard}
            disabled={selectedRepos.size === 0 || isOnboarding}
          >
            {isOnboarding ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Connect {selectedRepos.size > 0 ? `${selectedRepos.size} ` : ''}Repositories
          </Button>
          {selectedRepos.size === 0 && (
            <Button onClick={handleFinish}>
              Finish
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
