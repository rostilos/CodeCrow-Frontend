import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import { githubService } from "@/api_service/codeHosting/github/githubService.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";

export default function SelectRepoPage() {
  const { connectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const routes = useWorkspaceRoutes();

  const [repos, setRepos] = useState<any[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  
  const debouncedQuery = useDebounce(query, 300);

  // keep projectName and provider that were passed from NewProject
  const passedProjectName = (location.state as any)?.projectName || "";
  const provider = (location.state as any)?.provider || "BITBUCKET_CLOUD";

  useEffect(() => {
    if (!connectionId) return;
    loadRepos(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  useEffect(() => {
    if (!connectionId) return;
    searchRepos(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const loadRepos = async (pageToLoad: number, searchQuery?: string) => {
    if (!connectionId) return;
    try {
      if (pageToLoad === 0) {
        if (searchQuery !== undefined) {
          setSearching(true);
        } else {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }
      
      // Use appropriate service based on provider
      let res;
      if (provider === 'GITHUB') {
        res = await githubService.getRepositories(
          currentWorkspace!.slug, 
          Number(connectionId), 
          pageToLoad + 1, // API uses 1-based pagination
          searchQuery
        );
      } else {
        res = await bitbucketCloudService.getRepositories(
          currentWorkspace!.slug, 
          Number(connectionId), 
          pageToLoad + 1, // API uses 1-based pagination
          searchQuery
        );
      }
      
      // res is { items, hasNext } as implemented in service
      const items = Array.isArray(res) ? res : (res.items || []);
      const next = Array.isArray(res) ? false : !!res.hasNext;
      
      // Normalize items - ensure slug is set for GitHub repos
      const normalizedItems = items.map((r: any) => ({
        ...r,
        slug: r.slug || r.name,
        id: r.id || r.uuid || r.name
      }));
      
      if (pageToLoad === 0) {
        setRepos(normalizedItems);
      } else {
        setRepos(prev => [...prev, ...normalizedItems]);
      }
      setHasNext(next);
      setPage(pageToLoad);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load repositories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setSearching(false);
    }
  };

  const searchRepos = async (searchQuery: string) => {
    if (!connectionId) return;
    // Reset pagination when searching
    setPage(0);
    setHasNext(false);
    await loadRepos(0, searchQuery);
  };

  const handleLoadMore = () => {
    if (!hasNext) return;
    loadRepos(page + 1, debouncedQuery);
  };

  const handleSelect = (repo: any) => {
    // return to NewProject page with the selected repo, connectionId, and provider in location.state
    navigate(routes.projectNew(), { 
      state: { 
        selectedRepo: repo, 
        connectionId: Number(connectionId),
        provider: provider
      } 
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(routes.projectNew())}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Select Repository</h1>
            <p className="text-muted-foreground">
              {passedProjectName ? `For project: "${passedProjectName}"` : "Choose repository to bind"}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>Browse repositories for connection #{connectionId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Search</Label>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search repositories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {searching && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Search className="h-4 w-4 mr-1 animate-spin" />
                  Searching...
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading repositories...</div>
          ) : repos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {debouncedQuery ? "No repositories found matching your search" : "No repositories found"}
            </div>
          ) : (
            <div className="space-y-2">
              {repos.map((r: any) => (
                <div key={r.id || r.slug || r.full_name} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{r.full_name || r.name || r.slug}</div>
                    <div className="text-sm text-muted-foreground">{r.description || r.slug || ""}</div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleSelect(r)}>Select</Button>
                  </div>
                </div>
              ))}

              {hasNext && (
                <>
                  <Separator />
                  <div className="flex justify-center">
                    <Button onClick={handleLoadMore} disabled={loadingMore}>
                      {loadingMore ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
