import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, PlanInfo, ProjectUsage } from '@/api_service/billing';
import { CreditCard, ArrowRight, Check } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency, formatDate, formatTierName } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const location = useLocation();
  const pricing = location.pathname.endsWith('/pricing');
  const methods = useQuery({ queryKey: ['billing-methods', slug], queryFn: () => billingApi.listPaymentMethods(slug) });
  const confirmed = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ plan?: PlanInfo; date: string | null } | null>(null);

  async function act(action: () => Promise<unknown>, success?: string) {
    setBusy(true); setError(null); setNotice(null);
    try {
      await action();
      await Promise.all([subscription.refetch(), methods.refetch(), client.invalidateQueries({ queryKey: ['managed-models', slug] })]);
      if (success) setNotice(success);
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (new URLSearchParams(location.search).has('checkout') && !confirmed.current) {
      confirmed.current = true;
      void act(() => billingApi.sync(slug), 'Payment status refreshed. Your current subscription status is shown below.');
    }
  }, [slug, location.search]);

  const sub = subscription.data;
  if (!sub) return <div className="p-6 space-y-3">
    <p role="status">{subscription.isPending ? 'Loading billing…' : message(subscription.error)}</p>
    {subscription.isError && <Button onClick={() => subscription.refetch()}>Retry</Button>}
  </div>;
  const trial = sub.active && sub.trialEndsAt !== null;
  const billingUrl = `${window.location.origin}/dashboard/${slug}/billing`;
  const card = methods.data?.find(method => method.isDefault) ?? methods.data?.[0];

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

  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Workspace billing</p><h1 className="text-3xl font-bold tracking-tight">{pricing ? "Find the right plan for your team" : "Plan & billing"}</h1>
        <p className="text-muted-foreground">Clear pricing. One monthly invoice for your workspace.</p></div>
      <Button variant="outline" disabled={busy} onClick={() => act(() => billingApi.sync(slug), 'Payment status refreshed.')}>
        {busy ? 'Working…' : 'Refresh payment status'}
      </Button>
    </div>
    {new URLSearchParams(window.location.search).has('checkout') && <Alert><AlertDescription>
      Checking your payment status. Returning from checkout alone does not confirm activation. If your plan is still inactive, refresh payment status in a moment.
    </AlertDescription></Alert>}
    {error && <Alert variant="destructive"><AlertDescription role="alert">{error}</AlertDescription></Alert>}
    {notice && <p role="status">{notice}</p>}
    {sub.paymentSyncError && <Alert><AlertDescription>{sub.paymentSyncError}</AlertDescription></Alert>}

    <nav aria-label="Billing pages" className="flex gap-2 border-b pb-3">
      <Button asChild variant={pricing ? 'ghost' : 'secondary'}><Link aria-current={!pricing ? 'page' : undefined} to={`/dashboard/${slug}/billing`}>Overview & invoices</Link></Button>
      <Button asChild variant={pricing ? 'secondary' : 'ghost'}><Link aria-current={pricing ? 'page' : undefined} to={`/dashboard/${slug}/billing/pricing`}>Plans & pricing</Link></Button>
    </nav>
    {!pricing && <>
    <Card className="overflow-hidden border-primary/20 shadow-sm">
      <CardHeader className="bg-primary/5 border-b p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div>
          <CardDescription className="mb-2">Your subscription</CardDescription>
          <CardTitle className="text-2xl">{sub.active ? `${formatTierName(sub.tier)}${trial ? ' · Free trial' : ''}` : sub.status === 'PAST_DUE' ? 'Payment needs attention' : 'Activate your workspace'}</CardTitle>
        </div><Badge variant={sub.active ? 'default' : 'outline'}>{sub.active ? 'Active' : 'Reviews paused'}</Badge></div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{sub.active
          ? trial ? `Your trial ends ${formatDate(sub.trialEndsAt)}. Only the approved trial model is available. Monthly usage billing starts after the trial.` : `Billing period: ${formatDate(sub.currentPeriodStart)} – ${formatDate(sub.currentPeriodEnd)}.`
          : sub.status === 'PAST_DUE' ? 'Update your payment method and settle the outstanding invoice to restore AI reviews.' : 'An active subscription is required for AI reviews, including when you bring your own API key. Choose a plan, add a card at checkout, then select your AI source.'}</p>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-6">
        {!sub.active && sub.status !== 'PAST_DUE' && <ol className="grid gap-4 sm:grid-cols-3">{['Choose your plan', 'Add a card at secure checkout', 'Choose platform models or your own key'].map((step, i) => <li key={step} className="flex gap-3 text-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{i + 1}</span><span>{step}</span></li>)}</ol>}
        {sub.pendingTier && <p className="text-sm">Next plan: {formatTierName(sub.pendingTier)}, starting {formatDate(sub.currentPeriodEnd)}.</p>}
        {sub.cancelAtPeriodEnd && <p className="text-sm">Cancellation scheduled. Access ends {formatDate(sub.currentPeriodEnd)}.</p>}
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link to={`/dashboard/${slug}/${sub.active ? 'ai' : sub.status === 'PAST_DUE' ? 'billing#payment' : 'billing/pricing'}`}>{sub.active ? 'Set up AI connections' : sub.status === 'PAST_DUE' ? 'Resolve payment' : 'Choose a plan'}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          {sub.active && <Button asChild variant="outline"><Link to={`/dashboard/${slug}/billing/pricing`}>Compare plans</Link></Button>}
          {sub.active && (sub.cancelAtPeriodEnd ? <Button disabled={busy} variant="outline" onClick={() => act(() => billingApi.reactivateSubscription(slug), 'Cancellation removed.')}>Keep subscription</Button> : <Button disabled={busy} variant="ghost" onClick={() => setConfirmation({ date: sub.currentPeriodEnd })}>Cancel subscription</Button>)}
        </div>
      </CardContent>
    </Card>
    <Card id="payment"><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Payment method</CardTitle><CardDescription>Card details are handled securely by our payment provider.</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm">{methods.isPending ? 'Loading payment method…' : methods.isError ? 'Payment method could not be loaded.' : card ? `${card.brand.toUpperCase()} •••• ${card.last4} · Expires ${card.expMonth}/${card.expYear}` : 'No saved card. Add a payment method to activate or maintain your subscription.'}</p>
      {methods.isError && <Button variant="outline" onClick={() => methods.refetch()}>Retry</Button>}
      {(sub.active || sub.status === 'PAST_DUE') && <Button variant="outline" disabled={busy} onClick={() => act(async () => { const portal = await billingApi.createPortal(slug, billingUrl); window.location.assign(portal.url); })}>{card ? 'Manage payment method' : 'Add payment method'}</Button>}
    </CardContent></Card>
    </>}

    {pricing && <>
    <p className="max-w-3xl text-muted-foreground">Pay for developers who are active in each project, not everyone in your workspace. All prices are in USD. Choose a plan below; you will add a card at checkout before reviews are enabled.</p>
    {plans.isPending && <p role="status">Loading plans…</p>}
    <div className="grid gap-4 md:grid-cols-3">
      {plans.data?.plans.map(plan => <Card key={plan.id} className={`relative flex flex-col overflow-hidden shadow-sm ${plan.id === "PRO" ? "border-primary ring-1 ring-primary" : ""}`}><CardHeader className="space-y-3"><div className="flex items-center justify-between"><CardTitle>{plan.name}</CardTitle>{plan.id === "PRO" && <Badge>14-day trial</Badge>}</div>
        <CardDescription>{plan.description}</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col gap-5">
        <p className="text-4xl font-semibold tracking-tight">{formatCurrency(plan.priceMonthly)}<span className="mt-2 block text-xs font-normal tracking-normal text-muted-foreground">per active developer · per project · per month</span></p>
        <ul className="space-y-3 text-sm">{plan.features.map(feature => <li className="flex gap-2" key={feature}><Check className="h-4 w-4 shrink-0 text-primary" />{feature}</li>)}</ul>
        {plan.managedModels && <p className="text-sm">{formatCurrency(plan.overageCents)} per managed PR above 60 per developer and project. Any project-specific rate is shown in your billing usage breakdown.</p>}
        {plan.id === 'PRO' && <p className="text-sm">First Pro subscription: 14 days free on the approved DeepSeek trial model. A credit card is required. Paid monthly usage begins when the trial ends.</p>}
        <Button className="mt-auto w-full" disabled={busy || (sub.active && sub.tier === plan.id && !sub.pendingTier)} onClick={() => choosePlan(plan)}>
          {sub.active && sub.tier === plan.id && !sub.pendingTier ? 'Current plan' : sub.active ? `Schedule ${plan.name}` : plan.id === "PRO" ? "Choose Pro · add a card" : `Choose ${plan.name} · add a card`}
        </Button>
      </CardContent></Card>)}
    </div>
    {plans.isError && <p role="alert">Plans could not be loaded. <Button variant="link" onClick={() => plans.refetch()}>Retry</Button></p>}

    <PricingDetails plans={plans.data?.plans ?? []} />
    </>}
    {!pricing && <>
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

    <InvoiceHistory slug={slug} />

    </>}

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

function InvoiceHistory({ slug }: { slug: string }) {
  const delivery = useQuery({ queryKey: ['invoice-delivery', slug], queryFn: () => billingApi.invoiceDelivery(slug), refetchInterval: 30000 });
  const [cursor, setCursor] = useState<string | undefined>();
  const invoices = useQuery({ queryKey: ['billing-invoices', slug, cursor],
    queryFn: () => billingApi.listInvoices(slug, 10, cursor) });
  return <Card><CardHeader><CardTitle>Invoices and discounts</CardTitle><CardDescription>
    Original charges, applied offers and final totals. Enter a promotion code at checkout; contact billing support to apply an offer to an existing subscription.
  </CardDescription></CardHeader><CardContent className="space-y-4">
    {delivery.data && !delivery.data.enabled && <Alert variant="destructive"><AlertDescription>Invoice emails are paused because email delivery is disabled. Contact your CodeCrow administrator. You can still open and download invoices below.</AlertDescription></Alert>}
    {delivery.isError && <p role="status" className="text-sm text-muted-foreground">Email delivery status is unavailable. <Button variant="link" onClick={() => delivery.refetch()}>Retry</Button></p>}
    {invoices.isPending && <p role="status">Loading invoices…</p>}
    {invoices.isError && <p role="alert">{message(invoices.error)} <Button variant="link" onClick={() => invoices.refetch()}>Retry</Button></p>}
    {invoices.data && <>
      <Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Status</TableHead>
        <TableHead>Original subtotal</TableHead><TableHead>Discount</TableHead><TableHead>Total</TableHead><TableHead>Amount due</TableHead><TableHead>Email delivery</TableHead>
      </TableRow></TableHeader><TableBody>{invoices.data.invoices.map(invoice => <TableRow key={invoice.id}>
        <TableCell>{invoice.hostedInvoiceUrl
          ? <a className="underline" href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">{invoice.number ?? formatDate(invoice.created)}</a>
          : invoice.number ?? formatDate(invoice.created)}</TableCell>
        <TableCell>{invoice.status}</TableCell>
        <TableCell>{formatCurrency(invoice.subtotal, invoice.currency)}</TableCell>
        <TableCell>−{formatCurrency(invoice.discountAmount, invoice.currency)}</TableCell>
        <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
        <TableCell>{formatCurrency(invoice.amountDue, invoice.currency)}</TableCell>
        <TableCell className="text-xs">{delivery.isError ? 'Status unavailable' : !delivery.data ? 'Loading…' : ({ SENT: 'Accepted by mail server', PENDING: delivery.data.enabled ? 'Queued for delivery' : 'Paused — email disabled', ATTEMPTED: 'Delivery unconfirmed — contact support', NEEDS_REVIEW: 'Delivery needs support review' }[delivery.data.deliveries.find(item => item.invoiceId === invoice.id)?.state ?? ''] ?? (invoice.status === 'draft' ? 'After invoice finalization' : 'No recent delivery record'))}</TableCell>
      </TableRow>)}</TableBody></Table>
      {invoices.data.invoices.length === 0 && <p>No invoices yet. Current usage is shown above at its original price; offers are applied when invoiced.</p>}
      <p className="text-sm text-muted-foreground">Totals include applicable taxes. Credits and previous balances may affect the amount due. Finalized invoices are queued for the current workspace owner within five minutes. “Accepted by mail server” does not confirm inbox delivery; check spam or contact support if it is missing.</p>
      <div className="flex gap-3">
        {cursor && <Button variant="outline" onClick={() => setCursor(undefined)}>Latest invoices</Button>}
        {invoices.data.hasMore && invoices.data.startingAfter && <Button variant="outline" onClick={() => setCursor(invoices.data!.startingAfter!)}>Older invoices</Button>}
      </div>
    </>}
  </CardContent></Card>;
}

function PricingDetails({ plans }: { plans: PlanInfo[] }) {
  return <div className="space-y-6">
    <Card><CardHeader><CardTitle>How your monthly bill is calculated</CardTitle><CardDescription>Workspace members are free to invite. Billing follows reviewed PR authors within each project.</CardDescription></CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">{[
        ['1. Count active developers', 'An author becomes an active seat on their fourth distinct reviewed PR in a project during the billing period. The first three do not activate a seat. Re-reviewing the same PR does not count twice.'],
        ['2. Add each project', 'The same author working in two projects can be two seats. Each seat is billed at your plan’s monthly rate. All plans include unlimited projects and workspace members.'],
        ['3. Apply usage and offers', 'Pro and Pro+ include 60 platform-model PRs per developer per project each month. Further platform PRs incur the displayed overage rate. BYOK has no model-usage commission; your provider bills its usage separately.'],
      ].map(([title, text]) => <div key={title}><h3 className="font-semibold mb-2">{title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Worked examples</CardTitle><CardDescription>One active developer in one project, outside the free trial. Examples exclude taxes and discounts.</CardDescription></CardHeader><CardContent>
      <div className="grid gap-4 md:grid-cols-3">{plans.map(plan => <div key={plan.id} className="rounded-xl border bg-muted/20 p-5 space-y-3">
        <h3 className="font-semibold">{plan.name}</h3>
        <p className="text-2xl font-semibold">{formatCurrency(plan.priceMonthly + (plan.managedModels ? plan.overageCents : 0))}<span className="block text-xs font-normal text-muted-foreground mt-1">estimated monthly total</span></p>
        <p className="text-sm text-muted-foreground">{formatCurrency(plan.priceMonthly)} seat{plan.managedModels ? ` + ${formatCurrency(plan.overageCents)} for one additional platform PR` : '; no CodeCrow PR overage'}.</p>
        <p className="text-sm">{plan.managedModels ? `${plan.includedManagedPrs + 1} platform PRs: ${plan.includedManagedPrs} included + 1 extra.` : '61 PRs with your own key. Provider usage is billed separately.'}</p>
      </div>)}</div><p className="mt-4 text-sm text-muted-foreground">A project-specific overage rate, if configured, replaces the plan’s standard rate. Your Billing overview shows that rate and the reason.</p>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Before you subscribe</CardTitle></CardHeader><CardContent className="grid gap-6 sm:grid-cols-2 text-sm leading-relaxed">
      <div><h3 className="font-semibold mb-2">Trial and card</h3><p className="text-muted-foreground">Your first Pro subscription includes 14 days free on the approved DeepSeek trial model. A card is required. Monthly usage billing begins after the trial; cancel before it ends if you do not want to continue. Starter and Pro+ do not include this trial.</p></div>
      <div><h3 className="font-semibold mb-2">Features and AI sources</h3><p className="text-muted-foreground">Starter uses your own API keys and excludes QA documentation. Pro and Pro+ support both platform models and your own keys, and include QA documentation. Custom rules and incremental branch status are available on every plan.</p></div>
      <div><h3 className="font-semibold mb-2">Offers, taxes and invoices</h3><p className="text-muted-foreground">Enter a promotion code at checkout. Percentage offers, including 100% coverage, reduce the invoice total while original charges stay visible. Offers can run for 6 or 12 months; trial time can overlap that period. Taxes, credits and balances are finalized on your monthly invoice, sent to the workspace owner when email delivery is available.</p></div>
      <div><h3 className="font-semibold mb-2">Changing or canceling</h3><p className="text-muted-foreground">Plan changes take effect at the next monthly boundary without changing current-period charges. Cancellation keeps access until the period ends. Usage already incurred remains payable. Moving to Starter requires your projects to use your own API keys.</p></div>
    </CardContent></Card>
  </div>;
}
