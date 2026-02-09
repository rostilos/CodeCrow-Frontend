import { useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Crown,
  Zap,
  Shield,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Clock,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  Star,
  RefreshCcw,
  Ban,
  LayoutGrid,
  Receipt,
} from "lucide-react";
import {
  useSubscription,
  useInvoices,
  usePaymentMethods,
  formatTierName,
  formatLimit,
  isUnlimited,
  formatCurrency,
  formatDate,
  getDaysRemaining,
} from "@/hooks/useSubscription";
import {
  billingApi,
  SubscriptionTier,
  PlanChangePreviewResponse,
} from "@/api_service/billing";
import { cn } from "@/lib/utils";

export default function BillingSettings() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { subscription, loading, error, refetch } =
    useSubscription(workspaceSlug);
  const {
    invoices,
    loading: invoicesLoading,
    loadMore,
  } = useInvoices(workspaceSlug);
  const { methods: paymentMethods, refetch: refetchPaymentMethods } =
    usePaymentMethods(workspaceSlug);

  if (loading) return <BillingSettingsSkeleton />;
  if (error || !subscription)
    return <BillingSettingsError error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Plan & Billing
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your subscription and payments
            </p>
          </div>
        </div>
        <Badge className={getStatusBadgeClass(subscription.status)}>
          {subscription.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Alerts */}
      <BillingAlerts subscription={subscription} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SubscriptionOverview
            subscription={subscription}
            workspaceSlug={workspaceSlug!}
            onSubscriptionChange={refetch}
          />
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <PlansSection
            subscription={subscription}
            workspaceSlug={workspaceSlug!}
            onSubscriptionChange={refetch}
          />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <PaymentMethodsSection
            paymentMethods={paymentMethods}
            workspaceSlug={workspaceSlug!}
            onRefetch={refetchPaymentMethods}
            hasSubscription={!!subscription.paymentMethod}
          />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <InvoicesSection
            invoices={invoices}
            loading={invoicesLoading}
            onLoadMore={loadMore}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== Subscription Overview ====================

interface SubscriptionOverviewProps {
  subscription: ReturnType<typeof useSubscription>["subscription"];
  workspaceSlug: string;
  onSubscriptionChange: () => void;
}

function SubscriptionOverview({
  subscription,
  workspaceSlug,
  onSubscriptionChange,
}: SubscriptionOverviewProps) {
  const [portalLoading, setPortalLoading] = useState(false);

  if (!subscription) return null;

  const { tier, usage, limits, currentPeriodEnd, cancelAtPeriodEnd } =
    subscription;

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { url } = await billingApi.createPortal(workspaceSlug);
      window.location.href = url;
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  const TierIcon = getTierIcon(tier);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Current Plan */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TierIcon className={`h-6 w-6 ${getTierColor(tier)}`} />
              <div>
                <CardTitle>{formatTierName(tier)}</CardTitle>
                <CardDescription>{getTierDescription(tier)}</CardDescription>
              </div>
            </div>
            {cancelAtPeriodEnd && (
              <Badge variant="destructive">Canceling</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Resource Usage</h4>
            <div className="space-y-3">
              <UsageItem
                label="Projects"
                count={usage.projectsUsed}
                limit={limits.maxProjects}
              />
              <UsageItem
                label="Members"
                count={usage.membersUsed}
                limit={limits.maxMembers}
              />
              <UsageItem
                label="PR Reviews"
                count={usage.prReviewsUsed}
                limit={limits.maxPrReviews}
              />
              <div className="flex justify-between text-sm">
                <span>RAG Pipelines (Active)</span>
                <span className="font-medium">{usage.ragPipelinesUsed}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Limits Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LimitCard
              label="Projects"
              value={formatLimit(limits.maxProjects)}
            />
            <LimitCard label="Members" value={formatLimit(limits.maxMembers)} />
            <LimitCard
              label="PR Reviews/mo"
              value={formatLimit(limits.maxPrReviews)}
            />
            <LimitCard
              label="RAG Pipelines"
              value={formatLimit(limits.maxRagPipelines)}
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {tier !== "TRIAL" && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Manage Subscription
              </Button>
            )}
            {cancelAtPeriodEnd && (
              <ReactivateButton
                workspaceSlug={workspaceSlug}
                onSuccess={onSubscriptionChange}
              />
            )}
            {!cancelAtPeriodEnd && tier !== "TRIAL" && (
              <CancelSubscriptionDialog
                workspaceSlug={workspaceSlug}
                onSuccess={onSubscriptionChange}
              />
            )}
          </div>
        </CardContent>
        {currentPeriodEnd && (
          <CardFooter className="text-sm text-muted-foreground">
            {cancelAtPeriodEnd
              ? `Access until ${formatDate(currentPeriodEnd)}`
              : `Next billing date: ${formatDate(currentPeriodEnd)}`}
          </CardFooter>
        )}
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuickStat
            label="Plan"
            value={formatTierName(tier)}
            icon={<TierIcon className="h-4 w-4" />}
          />
          <QuickStat
            label="Status"
            value={subscription.active ? "Active" : subscription.status}
            icon={
              subscription.active ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )
            }
          />
          {tier === "TRIAL" && subscription.trialEndsAt && (
            <QuickStat
              label="Trial ends in"
              value={`${getDaysRemaining(subscription.trialEndsAt)} days`}
              icon={<Clock className="h-4 w-4 text-orange-500" />}
            />
          )}
          <QuickStat
            label="Reviews used"
            value={`${usage.prReviewsUsed}/${formatLimit(limits.maxPrReviews)}`}
            icon={<FileText className="h-4 w-4" />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Plans Section ====================

interface PlansSectionProps {
  subscription: ReturnType<typeof useSubscription>["subscription"];
  workspaceSlug: string;
  onSubscriptionChange: () => void;
}

function PlansSection({
  subscription,
  workspaceSlug,
  onSubscriptionChange,
}: PlansSectionProps) {
  if (!subscription) return null;
  const currentTier = subscription.tier;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Plans</CardTitle>
        <CardDescription>
          Choose the plan that best fits your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PlanCard
            tier="TRIAL"
            name="Trial"
            description="14-day free trial"
            price={null}
            features={[
              "3 projects",
              "5 members",
              "100 PR reviews/mo",
              "Community support",
            ]}
            currentTier={currentTier}
            workspaceSlug={workspaceSlug}
            onSuccess={onSubscriptionChange}
          />
          <PlanCard
            tier="PRO"
            name="Pro"
            description="For small teams"
            price={29}
            features={[
              "10 projects",
              "15 members",
              "500 PR reviews/mo",
              "Email support",
              "Custom rules",
            ]}
            currentTier={currentTier}
            workspaceSlug={workspaceSlug}
            onSuccess={onSubscriptionChange}
            popular
          />
          <PlanCard
            tier="PRO_PLUS"
            name="Pro+"
            description="For growing teams"
            price={79}
            features={[
              "25 projects",
              "50 members",
              "2000 PR reviews/mo",
              "Priority support",
              "RAG pipelines",
              "Advanced analytics",
            ]}
            currentTier={currentTier}
            workspaceSlug={workspaceSlug}
            onSuccess={onSubscriptionChange}
          />
          <PlanCard
            tier="ENTERPRISE"
            name="Enterprise"
            description="Custom solution"
            price={null}
            priceLabel="Contact us"
            features={[
              "Unlimited projects",
              "Unlimited members",
              "Unlimited reviews",
              "Dedicated support",
              "SSO/SAML",
              "Custom integrations",
            ]}
            currentTier={currentTier}
            workspaceSlug={workspaceSlug}
            onSuccess={onSubscriptionChange}
            isEnterprise
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Plan Card ====================

interface PlanCardProps {
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: number | null;
  priceLabel?: string;
  features: string[];
  currentTier: SubscriptionTier;
  workspaceSlug: string;
  onSuccess: () => void;
  popular?: boolean;
  isEnterprise?: boolean;
}

function PlanCard({
  tier,
  name,
  description,
  price,
  priceLabel,
  features,
  currentTier,
  workspaceSlug,
  onSuccess,
  popular,
  isEnterprise,
}: PlanCardProps) {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<PlanChangePreviewResponse | null>(
    null,
  );

  const isCurrent = tier === currentTier;
  const isDowngrade = getTierOrder(tier) < getTierOrder(currentTier);
  const isUpgrade = getTierOrder(tier) > getTierOrder(currentTier);
  const Icon = getTierIcon(tier);

  const handleSelect = async () => {
    if (tier === "TRIAL") return;

    if (isEnterprise) {
      window.location.href =
        "mailto:sales@codecrow.dev?subject=Enterprise%20Plan%20Inquiry";
      return;
    }

    if (currentTier === "TRIAL") {
      // New subscription - go to checkout
      setLoading(true);
      try {
        const successUrl = `${window.location.origin}/dashboard/${workspaceSlug}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${window.location.origin}/dashboard/${workspaceSlug}/billing?canceled=true`;
        const { url } = await billingApi.createCheckout(workspaceSlug, {
          tier,
          successUrl,
          cancelUrl,
        });
        window.location.href = url;
      } catch (err) {
        console.error("Checkout error:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Plan change - show preview
      setLoading(true);
      try {
        const previewData = await billingApi.previewPlanChange(
          workspaceSlug,
          tier,
        );
        setPreview(previewData);
        setPreviewOpen(true);
      } catch (err) {
        console.error("Preview error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmChange = async () => {
    setLoading(true);
    try {
      await billingApi.changePlan(workspaceSlug, {
        newTier: tier,
        prorate: true,
      });
      setPreviewOpen(false);
      onSuccess();
    } catch (err) {
      console.error("Plan change error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`relative border rounded-lg p-5 ${popular ? "border-2 border-primary" : ""} ${isCurrent ? "bg-muted/50" : ""}`}
      >
        {popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary">Most Popular</Badge>
          </div>
        )}
        {isCurrent && (
          <div className="absolute -top-3 right-3">
            <Badge variant="secondary">Current</Badge>
          </div>
        )}

        <div className="text-center mb-4">
          <Icon className={`h-8 w-8 mx-auto mb-2 ${getTierColor(tier)}`} />
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
          <div className="mt-2">
            {price !== null ? (
              <>
                <span className="text-2xl font-bold">${price}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </>
            ) : (
              <span className="text-lg font-medium text-muted-foreground">
                {priceLabel || "Free"}
              </span>
            )}
          </div>
        </div>

        <ul className="space-y-2 mb-4 text-sm">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center space-x-2">
              <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          variant={isCurrent ? "outline" : isUpgrade ? "default" : "outline"}
          className="w-full"
          onClick={handleSelect}
          disabled={isCurrent || tier === "TRIAL" || loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCurrent
            ? "Current Plan"
            : isUpgrade
              ? "Upgrade"
              : isDowngrade
                ? "Downgrade"
                : "Select"}
        </Button>
      </div>

      {/* Plan Change Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Plan Change</DialogTitle>
            <DialogDescription>
              You're changing from {formatTierName(currentTier)} to{" "}
              {formatTierName(tier)}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                {preview.lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.description}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Amount due today</span>
                  <span>
                    {formatCurrency(preview.proratedAmount, preview.currency)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Changes take effect immediately. Prorated charges will be
                applied to your next invoice.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmChange} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== Payment Methods Section ====================

interface PaymentMethodsSectionProps {
  paymentMethods: ReturnType<typeof usePaymentMethods>["methods"];
  workspaceSlug: string;
  onRefetch: () => void;
  hasSubscription: boolean;
}

function PaymentMethodsSection({
  paymentMethods,
  workspaceSlug,
  onRefetch,
  hasSubscription,
}: PaymentMethodsSectionProps) {
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManagePayments = async () => {
    setPortalLoading(true);
    try {
      const { url } = await billingApi.createPortal(workspaceSlug);
      window.location.href = url;
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Manage your payment information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No payment methods on file</p>
            <p className="text-sm">Add a payment method to upgrade your plan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium capitalize">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {method.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={handleManagePayments}
          disabled={portalLoading}
        >
          {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CreditCard className="mr-2 h-4 w-4" />
          Manage Payment Methods in Stripe
        </Button>
      </CardContent>
    </Card>
  );
}

// ==================== Invoices Section ====================

interface InvoicesSectionProps {
  invoices: ReturnType<typeof useInvoices>["invoices"];
  loading: boolean;
  onLoadMore: () => void;
}

function InvoicesSection({
  invoices,
  loading,
  onLoadMore,
}: InvoicesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>View and download your invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !invoices ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : invoices?.invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices?.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {formatCurrency(invoice.amountPaid, invoice.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(invoice.created)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={
                      invoice.status === "paid" ? "default" : "secondary"
                    }
                  >
                    {invoice.status}
                  </Badge>
                  {invoice.hostedInvoiceUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={invoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {invoice.pdfUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {invoices?.hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load More
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Cancel Subscription Dialog ====================

interface CancelSubscriptionDialogProps {
  workspaceSlug: string;
  onSuccess: () => void;
}

function CancelSubscriptionDialog({
  workspaceSlug,
  onSuccess,
}: CancelSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleCancel = async () => {
    setLoading(true);
    try {
      await billingApi.cancelSubscription(workspaceSlug, {
        immediate: false,
        reason,
        feedback,
      });
      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
        >
          <Ban className="mr-2 h-4 w-4" />
          Cancel Subscription
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            Your subscription will remain active until the end of your billing
            period.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Why are you canceling?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="too_expensive" id="too_expensive" />
                <Label htmlFor="too_expensive">Too expensive</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="missing_features"
                  id="missing_features"
                />
                <Label htmlFor="missing_features">
                  Missing features I need
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_using" id="not_using" />
                <Label htmlFor="not_using">Not using it enough</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="switching" id="switching" />
                <Label htmlFor="switching">Switching to another tool</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other reason</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Additional feedback (optional)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Help us improve..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Reactivate Button ====================

interface ReactivateButtonProps {
  workspaceSlug: string;
  onSuccess: () => void;
}

function ReactivateButton({ workspaceSlug, onSuccess }: ReactivateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleReactivate = async () => {
    setLoading(true);
    try {
      await billingApi.reactivateSubscription(workspaceSlug);
      onSuccess();
    } catch (err) {
      console.error("Reactivate error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleReactivate} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <RefreshCcw className="mr-2 h-4 w-4" />
      Reactivate Subscription
    </Button>
  );
}

// ==================== Helper Components ====================

function UsageItem({
  label,
  count,
  limit,
}: {
  label: string;
  count: number;
  limit: number;
}) {
  const isUnlimitedVal = isUnlimited(limit);
  const percent =
    isUnlimitedVal || limit === 0 ? 0 : Math.round((count / limit) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">
          {count} {isUnlimitedVal ? "" : ` / ${formatLimit(limit)}`}
        </span>
      </div>
      {!isUnlimitedVal && limit > 0 && (
        <Progress value={Math.min(percent, 100)} className="h-2" />
      )}
    </div>
  );
}

function BillingAlerts({
  subscription,
}: {
  subscription: ReturnType<typeof useSubscription>["subscription"];
}) {
  if (!subscription) return null;

  const {
    tier,
    status,
    active,
    trialEndsAt,
    cancelAtPeriodEnd,
    currentPeriodEnd,
  } = subscription;

  return (
    <>
      {tier === "TRIAL" &&
        trialEndsAt &&
        getDaysRemaining(trialEndsAt) <= 3 && (
          <Alert variant="warning">
            <Clock className="h-4 w-4" />
            <AlertTitle>Trial Ending Soon</AlertTitle>
            <AlertDescription>
              Your trial ends in {getDaysRemaining(trialEndsAt)} days. Upgrade
              now to keep your access.
            </AlertDescription>
          </Alert>
        )}
      {cancelAtPeriodEnd && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription Canceling</AlertTitle>
          <AlertDescription>
            Your subscription will end on {formatDate(currentPeriodEnd)}.
            Reactivate to keep your access.
          </AlertDescription>
        </Alert>
      )}
      {status === "PAST_DUE" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment Past Due</AlertTitle>
          <AlertDescription>
            We couldn't process your payment. Please update your payment method
            to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}
      {!active && status !== "PAST_DUE" && tier !== "TRIAL" && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Subscription Inactive</AlertTitle>
          <AlertDescription>
            Your subscription is no longer active. Please renew to restore
            access.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

function LimitCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 border rounded-lg">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function BillingSettingsSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function BillingSettingsError({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center space-x-2">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Plan & Billing</h1>
      </div>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || "Failed to load billing information"}
        </AlertDescription>
      </Alert>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}

// ==================== Utility Functions ====================

function getTierIcon(tier: SubscriptionTier) {
  switch (tier) {
    case "TRIAL":
      return Clock;
    case "PRO":
      return Zap;
    case "PRO_PLUS":
      return Crown;
    case "ENTERPRISE":
      return Shield;
    default:
      return Crown;
  }
}

function getTierColor(tier: SubscriptionTier): string {
  switch (tier) {
    case "TRIAL":
      return "text-orange-500";
    case "PRO":
      return "text-blue-500";
    case "PRO_PLUS":
      return "text-purple-500";
    case "ENTERPRISE":
      return "text-green-500";
    default:
      return "text-primary";
  }
}

function getTierDescription(tier: SubscriptionTier): string {
  switch (tier) {
    case "TRIAL":
      return "14-day free trial";
    case "PRO":
      return "For small teams";
    case "PRO_PLUS":
      return "For growing teams";
    case "ENTERPRISE":
      return "Custom enterprise solution";
    default:
      return "";
  }
}

function getTierOrder(tier: SubscriptionTier): number {
  switch (tier) {
    case "TRIAL":
      return 0;
    case "PRO":
      return 1;
    case "PRO_PLUS":
      return 2;
    case "ENTERPRISE":
      return 3;
    default:
      return 0;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "PAST_DUE":
      return "bg-yellow-100 text-yellow-800";
    case "CANCELED":
      return "bg-red-100 text-red-800";
    case "EXPIRED":
      return "bg-gray-100 text-gray-800";
    case "TRIAL_EXPIRED":
      return "bg-orange-100 text-orange-800";
    default:
      return "";
  }
}
