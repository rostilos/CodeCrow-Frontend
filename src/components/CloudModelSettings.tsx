import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, CheckCircle2, KeyRound } from 'lucide-react';
import { billingApi, ModelSelection } from '@/api_service/billing';
import { usePermissions } from '@/hooks/usePermissions';
import { formatTierName } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CloudModelSettings({ slug, projectId }: { slug: string; projectId?: number }) {
  const { isWorkspaceOwner } = usePermissions();
  const owner = isWorkspaceOwner();
  const client = useQueryClient();
  const models = useQuery({ queryKey: ['managed-models', slug], queryFn: () => billingApi.models(slug) });
  const project = useQuery({ queryKey: ['project-model', slug, projectId],
    queryFn: () => billingApi.projectModel(slug, projectId!), enabled: projectId !== undefined });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const data = models.data;
  const selection = projectId === undefined ? data?.selection : project.data;
  async function save(value?: ModelSelection) {
    setBusy(true); setError(null); setSaved(false);
    try {
      if (value) await billingApi.selectModel(slug, value, projectId);
      else await billingApi.inheritModel(slug, projectId!);
      await Promise.all([client.invalidateQueries({ queryKey: ['managed-models', slug] }),
        client.invalidateQueries({ queryKey: ['project-model', slug] })]);
      setSaved(true);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save AI selection. Please retry.'); }
    finally { setBusy(false); }
  }
  const eligible = data?.active && data.tier !== 'STARTER';
  const selectedLabel = data?.models.find(model => model.id === selection?.modelId)?.label;
  return <Card className="border-primary/20 shadow-sm">
    <CardHeader className="border-b bg-primary/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" />{projectId === undefined ? 'Choose how CodeCrow powers your reviews' : 'AI source for this project'}</CardTitle>
        {data && <Badge variant="outline">{data.active ? `${formatTierName(data.tier)}${data.trial ? ' trial' : ''}` : 'Subscription required'}</Badge>}
      </div>
      <CardDescription>{projectId === undefined ? 'Set the workspace default here. Each project can inherit it or choose a different source in its AI settings.' : 'Platform models take priority over a saved API-key connection. Choose your own key below to use that connection instead.'}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5 pt-6">
      {models.isPending && <p role="status">Loading your plan and available models…</p>}
      {(models.isError || project.isError) && <p role="alert">AI settings could not be loaded. <Button variant="link" onClick={() => { models.refetch(); if (projectId !== undefined) project.refetch(); }}>Retry</Button></p>}
      {data && <>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`rounded-xl border p-5 space-y-3 ${selection?.managed ? 'border-primary bg-primary/5' : 'bg-background'}`}>
            <h3 className="flex items-center gap-2 font-semibold"><Brain className="h-4 w-4" />CodeCrow platform models</h3>
            <p className="text-sm text-muted-foreground">No API key needed. Pro includes standard models; Pro+ includes premium models. Both include 60 platform PRs per active developer per project each month.</p>
            {data.trial && <p className="text-sm">During your 14-day Pro trial, only the approved trial model is available.</p>}
            {!eligible ? <div className="space-y-3"><p className="text-sm font-medium">{data.active ? 'Upgrade from Starter to Pro or Pro+ to use platform models.' : 'Choose a subscription and add a card to activate reviews.'}</p>
              {owner ? <Button asChild><Link to={`/dashboard/${slug}/billing/pricing`}>{data.active ? 'Compare upgrade options' : 'Choose a plan'}</Link></Button> : <p className="text-sm">Ask your workspace owner to manage the subscription.</p>}
            </div> : data.models.length === 0 ? <p role="status" className="text-sm">No platform models are currently available for your plan. Contact support, or use your own key.</p> :
              <div className="space-y-2"><label id={`platform-label-${projectId ?? 'workspace'}`} className="text-sm font-medium">Platform model</label>
                <Select value={selection?.managed && selectedLabel ? selection.modelId! : ''} disabled={!owner || busy || !selection}
                  onValueChange={modelId => save({ managed: true, modelId })}>
                  <SelectTrigger aria-labelledby={`platform-label-${projectId ?? 'workspace'}`}><SelectValue placeholder="Select a platform model" /></SelectTrigger>
                  <SelectContent>{data.models.map(model => <SelectItem key={model.id} value={model.id}>{model.label}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Selecting a model saves it for {projectId === undefined ? 'projects using the workspace default' : 'this project'}. No API-key connection needs to be created.</p>
              </div>}
          </div>
          <div className={`rounded-xl border p-5 space-y-3 ${selection && !selection.managed ? 'border-primary bg-primary/5' : 'bg-background'}`}>
            <h3 className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" />Your own API key</h3>
            <p className="text-sm text-muted-foreground">Available on Starter, Pro and Pro+. Your provider bills model usage directly; CodeCrow adds no model-usage commission. The workspace subscription still applies.</p>
            <p className="text-sm">Create a key connection {projectId === undefined ? 'below' : 'in AI Connections'}, then bind it in each project's AI settings.</p>
            <Button variant="outline" disabled={!owner || busy || !selection || !selection.managed} onClick={() => save({ managed: false, modelId: null })}>
              {selection && !selection.managed ? 'Using your own key' : 'Use my own API key'}
            </Button>
          </div>
        </div>
        {selection?.managed && <p className="flex items-center gap-2 text-sm" role="status"><CheckCircle2 className="h-4 w-4 text-primary" />Platform selection: {selectedLabel ?? 'Previous model unavailable — select another model'}</p>}
        {projectId !== undefined && <Button variant="outline" disabled={!owner || busy} onClick={() => save()}>Use workspace default</Button>}
        {!owner && <p className="text-sm text-muted-foreground">Only the workspace owner can change the AI source or platform model.</p>}
      </>}
      {busy && <p role="status">Saving selection…</p>}
      {saved && <p role="status" className="text-sm text-primary">AI selection saved.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </CardContent>
  </Card>;
}
