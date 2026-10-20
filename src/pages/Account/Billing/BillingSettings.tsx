import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, ManagedModel, ModelSelection, PlanInfo, ProjectUsage } from '@/api_service/billing';
import { projectService } from '@/api_service/project/projectService';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency, formatDate, formatTierName } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function message(error: unknown): string {
  return error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unable to complete the request. Please retry.';
}

export default function BillingSettings() {
  const { workspaceSlug } = useParams();
  const { loading, isWorkspaceOwner } = usePermissions();
  if (loading || !workspaceSlug) return <p className="p-6" role="status">Loading billing…</p>;
  if (!isWorkspaceOwner()) return <p className="p-6">Only the workspace owner can view and manage billing.</p>;
  return <BillingPanel key={workspaceSlug} slug={workspaceSlug} />;
}

function BillingPanel({ slug }: { slug: string }) {
  const client = useQueryClient();
  const subscription = useQuery({ queryKey: ['billing', slug], queryFn: () => billingApi.getSubscription(slug) });
  const plans = useQuery({ queryKey: ['billing-plans', slug], queryFn: () => billingApi.getPlans(slug) });
  const models = useQuery({ queryKey: ['managed-models', slug], queryFn: () => billingApi.models(slug) });
  const projects = useQuery({ queryKey: ['billing-projects', slug], queryFn: () => projectService.listProjects(slug) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ plan?: PlanInfo; date: string | null } | null>(null);

  async function act(action: () => Promise<unknown>, success?: string) {
    setBusy(true); setError(null); setNotice(null);
    try {
      await action();
      await Promise.all([subscription.refetch(), models.refetch(), client.invalidateQueries({ queryKey: ['project-model', slug] })]);
      if (success) setNotice(success);
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }

  const sub = subscription.data;
  if (!sub) return <div className="p-6 space-y-3">
    <p role="status">{subscription.isPending ? 'Loading billing…' : message(subscription.error)}</p>
    {subscription.isError && <Button onClick={() => subscription.refetch()}>Retry</Button>}
  </div>;
  const trial = sub.active && sub.trialEndsAt !== null;
  const billingUrl = window.location.origin + window.location.pathname;

  async function choosePlan(plan: PlanInfo) {
    if (sub.active || sub.status === 'PAST_DUE') {
      await act(async () => {
        const preview = await billingApi.previewPlanChange(slug, plan.id);
        setConfirmation({ plan, date: preview.effectiveDate });
      });
    } else {
      await act(async () => {
        const checkout = await billingApi.createCheckout(slug, {
          tier: plan.id, successUrl: billingUrl + '?checkout=complete', cancelUrl: billingUrl,
        });
        window.location.assign(checkout.url);
      });
    }
  }

  return <div className="container mx-auto p-6 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Plan & billing</h1>
        <p className="text-muted-foreground">Monthly billing for active developers within each project.</p></div>
      <Button variant="outline" disabled={busy} onClick={() => act(() => billingApi.sync(slug), 'Payment status refreshed.')}>
        {busy ? 'Working…' : 'Refresh payment status'}
      </Button>
    </div>
    {new URLSearchParams(window.location.search).has('checkout') && <Alert><AlertDescription>
      Checkout returned successfully. Refresh payment status to confirm activation; payment confirmation can take a moment.
    </AlertDescription></Alert>}
    {error && <Alert variant="destructive"><AlertDescription role="alert">{error}</AlertDescription></Alert>}
    {notice && <p role="status">{notice}</p>}
    {sub.paymentSyncError && <Alert><AlertDescription>{sub.paymentSyncError}</AlertDescription></Alert>}

    <Card><CardHeader><CardTitle className="flex items-center gap-3">{formatTierName(sub.tier)}
      <Badge variant={sub.active ? 'default' : 'secondary'}>{trial ? 'Free trial' : sub.status.replace(/_/g, ' ')}</Badge>
    </CardTitle><CardDescription>
      {trial ? `Trial ends ${formatDate(sub.trialEndsAt)}. Only trial models are available until then.`
        : sub.currentPeriodEnd ? `Current period: ${formatDate(sub.currentPeriodStart)} – ${formatDate(sub.currentPeriodEnd)}`
        : 'Choose a plan to activate this workspace.'}
    </CardDescription></CardHeader><CardContent className="space-y-3">
      <p>A developer becomes an active seat on their fourth distinct reviewed PR in a project during the billing period.
        The same author can be a seat in several projects. Workspace membership does not determine billing.</p>
      <p className="text-sm text-muted-foreground">Re-reviewing a PR does not add another billable PR. BYOK has no model-usage commission.
        All plans include unlimited projects and members. Taxes, if applicable, appear on your invoice.</p>
      {sub.pendingTier && <p>Next period: {formatTierName(sub.pendingTier)}, starting {formatDate(sub.currentPeriodEnd)}.</p>}
      {sub.cancelAtPeriodEnd && <p>Your subscription ends on {formatDate(sub.currentPeriodEnd)}.</p>}
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} variant="outline" onClick={() => act(async () => {
          const portal = await billingApi.createPortal(slug, billingUrl); window.location.assign(portal.url);
        })}>Payment methods & invoices</Button>
        {sub.active && (sub.cancelAtPeriodEnd
          ? <Button disabled={busy} onClick={() => act(() => billingApi.reactivateSubscription(slug), 'Cancellation removed.')}>Keep subscription</Button>
          : <Button disabled={busy} variant="outline" onClick={() => setConfirmation({ date: sub.currentPeriodEnd })}>Cancel at period end</Button>)}
      </div>
    </CardContent></Card>

    <div className="grid gap-4 md:grid-cols-3">
      {plans.data?.plans.map(plan => <Card key={plan.id}><CardHeader><CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription></CardHeader><CardContent className="space-y-4">
        <p className="text-2xl font-semibold">{formatCurrency(plan.priceMonthly)}<span className="text-sm font-normal"> / active developer / project / month</span></p>
        <ul className="list-disc pl-5 space-y-1 text-sm">{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
        {plan.managedModels && <p className="text-sm">{formatCurrency(plan.overageCents)} per managed PR above 60 per developer and project. Project-specific rates are shown below.</p>}
        {plan.id === 'PRO' && <p className="text-sm">First 14 days free on the approved DeepSeek trial model. A credit card is required. Paid monthly usage begins when the trial ends.</p>}
        <Button className="w-full" disabled={busy || (sub.active && sub.tier === plan.id && !sub.pendingTier)} onClick={() => choosePlan(plan)}>
          {sub.active && sub.tier === plan.id && !sub.pendingTier ? 'Current plan' : sub.active ? `Schedule ${plan.name}` : `Start ${plan.name}`}
        </Button>
      </CardContent></Card>)}
    </div>
    {plans.isError && <p role="alert">Plans could not be loaded. <Button variant="link" onClick={() => plans.refetch()}>Retry</Button></p>}

    <Card><CardHeader><CardTitle>Usage this period</CardTitle><CardDescription>
      {formatDate(sub.usage.periodStart)} – {formatDate(sub.usage.periodEnd)}. Charges are estimates until invoiced.
    </CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-wrap gap-8">
        <p><strong>{sub.usage.activeSeats}</strong> active project seats</p>
        <p><strong>{sub.usage.distinctPrs}</strong> distinct PRs</p>
        <p><strong>{sub.usage.overagePrs}</strong> managed PRs above allowance</p>
        <p><strong>{formatCurrency(sub.usage.subtotalCents)}</strong> estimated subtotal</p>
      </div>
      {sub.usage.diagnostics.map(text => <Alert key={text}><AlertDescription>{text}</AlertDescription></Alert>)}
      {sub.usage.unresolvedPrs > 0 && <p>{sub.usage.unresolvedPrs} PRs await reconciliation.</p>}
      {sub.usage.projects.length === 0 && <p className="text-muted-foreground">No reviewed PRs have been counted in this period.</p>}
      {sub.usage.projects.map(project => <ProjectUsageTable key={project.projectId} project={project} trial={trial} />)}
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Models</CardTitle><CardDescription>
      Choose a workspace default. Projects can use their own selection. BYOK uses the AI connection configured on each project.
    </CardDescription></CardHeader><CardContent className="space-y-5">
      {models.data && <ModelPicker label="Workspace default" selection={models.data.selection} models={models.data.models}
        disabled={busy} managedAllowed={models.data.active && sub.managedModels}
        onChange={selection => act(() => billingApi.selectModel(slug, selection), 'Workspace model updated.')} />}
      {models.isError && <p role="alert">{message(models.error)} <Button variant="link" onClick={() => models.refetch()}>Retry</Button></p>}
      {models.data && projects.data?.map(project => <ProjectModel key={project.id}
        slug={slug} id={Number(project.id)} name={project.name} models={models.data.models} allowed={models.data.active && sub.managedModels} />)}
      {projects.isError && <p role="alert">Projects could not be loaded. <Button variant="link" onClick={() => projects.refetch()}>Retry</Button></p>}
      {!sub.managedModels && <p className="text-sm text-muted-foreground">Starter uses your own keys. Managed models and QA documentation are available on Pro and Pro+.</p>}
    </CardContent></Card>

    <Dialog open={confirmation !== null} onOpenChange={open => { if (!open && !busy) setConfirmation(null); }}>
      <DialogContent><DialogHeader><DialogTitle>{confirmation?.plan ? 'Change monthly plan' : 'Cancel subscription'}</DialogTitle>
        <DialogDescription>{confirmation?.plan
          ? `${confirmation.plan.name} starts on ${formatDate(confirmation.date)} at ${formatCurrency(confirmation.plan.priceMonthly)} per active developer per project. Current-period charges are unchanged.`
          : `Your subscription ends on ${formatDate(confirmation?.date ?? null)}. Usage already incurred remains payable.`}</DialogDescription>
      </DialogHeader>
        {confirmation?.plan?.id === 'STARTER' && <p>Before the change, configure BYOK connections for projects using managed models. QA documentation will become unavailable.</p>}
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>Go back</Button>
          <Button disabled={busy} onClick={() => act(async () => {
            if (confirmation?.plan) await billingApi.changePlan(slug, { newTier: confirmation.plan.id, prorate: false });
            else await billingApi.cancelSubscription(slug, { immediate: false });
            setConfirmation(null);
          }, 'Subscription updated.')}>Confirm</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function ProjectUsageTable({ project, trial }: { project: ProjectUsage; trial: boolean }) {
  return <div className="space-y-2 border-t pt-4">
    <h3 className="font-semibold">{project.projectName} · {formatCurrency(project.subtotalCents)}</h3>
    <p className="text-sm text-muted-foreground">Managed overage: {trial ? 'free during trial' : `${formatCurrency(project.overageCents)} per PR above 60 per developer`}.
      {project.pricingReason && ` Project pricing: ${project.pricingReason}`}</p>
    <Table><TableHeader><TableRow><TableHead>PR author</TableHead><TableHead>Distinct PRs</TableHead><TableHead>Seat</TableHead>
      <TableHead>Managed PRs</TableHead><TableHead>Remaining</TableHead><TableHead>Overage PRs</TableHead><TableHead>Subtotal</TableHead>
    </TableRow></TableHeader><TableBody>{project.authors.map(author => <TableRow key={author.authorId ?? 'unknown'}>
      <TableCell>{author.authorName || author.authorId || 'Author pending'}</TableCell><TableCell>{author.distinctPrs}</TableCell>
      <TableCell>{author.authorId === null ? 'Pending' : author.active ? 'Active' : `${author.distinctPrs}/4 PRs`}</TableCell>
      <TableCell>{author.managedPrs}</TableCell><TableCell>{author.authorId === null ? '—' : author.includedPrsRemaining}</TableCell>
      <TableCell>{author.authorId === null ? '—' : author.overagePrs}</TableCell><TableCell>{formatCurrency(author.subtotalCents)}</TableCell>
    </TableRow>)}</TableBody></Table>
  </div>;
}

function ModelPicker({ label, selection, models, disabled, managedAllowed, onChange }: {
  label: string; selection: ModelSelection; models: ManagedModel[]; disabled: boolean; managedAllowed: boolean;
  onChange: (selection: ModelSelection) => Promise<unknown>;
}) {
  const value = selection.managed ? `managed:${selection.modelId ?? 'unavailable'}` : 'byok';
  return <div className="space-y-2"><p className="text-sm font-medium">{label}</p>
    <Select value={value} disabled={disabled} onValueChange={value => onChange({ managed: value !== 'byok', modelId: value === 'byok' ? null : value.slice('managed:'.length) })}>
      <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="byok">Bring your own key</SelectItem>
        {selection.managed && !models.some(model => `managed:${model.id}` === value) && <SelectItem disabled value={value}>Previous selection unavailable — choose a model</SelectItem>}
        {models.map(model => <SelectItem key={model.id} value={`managed:${model.id}`} disabled={!managedAllowed}>{model.label}</SelectItem>)}
      </SelectContent></Select>
  </div>;
}

function ProjectModel({ slug, id, name, models, allowed }: { slug: string; id: number; name: string; models: ManagedModel[]; allowed: boolean }) {
  const selection = useQuery({ queryKey: ['project-model', slug, id], queryFn: () => billingApi.projectModel(slug, id) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(value?: ModelSelection) {
    setBusy(true); setError(null);
    try { if (value) await billingApi.selectModel(slug, value, id); else await billingApi.inheritModel(slug, id); await selection.refetch(); }
    catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }
  return <div className="border-t pt-3 space-y-2">
    {selection.data && <ModelPicker label={name} selection={selection.data} models={models} disabled={busy} managedAllowed={allowed} onChange={save} />}
    <Button size="sm" variant="outline" disabled={busy} onClick={() => save()}>Use workspace default for {name}</Button>
    {(error || selection.isError) && <p role="alert">{error || message(selection.error)}</p>}
  </div>;
}
