import { ApiService } from '../api';

// ==================== Types ====================

export type SubscriptionTier = 'TRIAL' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'TRIAL_EXPIRED';

export interface PaymentMethodResponse {
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
}

export interface UsageResponse {
    projectsUsed: number;
    projectsLimit: number;
    membersUsed: number;
    membersLimit: number;
    prReviewsUsed: number;
    prReviewsLimit: number;
    ragPipelinesUsed: number;
    ragPipelinesLimit: number;
    billingPeriodStart: string;
}

export interface LimitsResponse {
    maxProjects: number;
    maxMembers: number;
    maxPrReviews: number;
    maxRagPipelines: number;
}

export interface SubscriptionResponse {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    active: boolean;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    usage: UsageResponse;
    limits: LimitsResponse;
    paymentMethod: PaymentMethodResponse | null;
}

export interface CreateCheckoutRequest {
    tier: SubscriptionTier;
    successUrl?: string;
    cancelUrl?: string;
}

export interface CheckoutSessionResponse {
    sessionId: string;
    url: string;
}

export interface PortalSessionResponse {
    url: string;
}

export interface ChangePlanRequest {
    newTier: SubscriptionTier;
    prorate: boolean;
}

export interface LineItemPreview {
    description: string;
    amount: number;
    quantity: number;
}

export interface PlanChangePreviewResponse {
    currentTier: string;
    newTier: string;
    proratedAmount: number;
    currency: string;
    effectiveDate: string;
    lineItems: LineItemPreview[];
}

export interface CancelSubscriptionRequest {
    immediate: boolean;
    reason?: string;
    feedback?: string;
}

export interface CancelSubscriptionResponse {
    status: string;
    cancelAt: string | null;
    cancelAtPeriodEnd: boolean;
}

export interface ReactivateSubscriptionResponse {
    status: string;
    currentPeriodEnd: string | null;
}

export interface InvoiceLineItem {
    description: string;
    amount: number;
    quantity: number;
    periodStart: string | null;
    periodEnd: string | null;
}

export interface InvoiceResponse {
    id: string;
    number: string | null;
    status: string;
    amountDue: number;
    amountPaid: number;
    currency: string;
    created: string;
    periodStart: string | null;
    periodEnd: string | null;
    hostedInvoiceUrl: string | null;
    pdfUrl: string | null;
    lineItems: InvoiceLineItem[];
}

export interface InvoiceListResponse {
    invoices: InvoiceResponse[];
    hasMore: boolean;
    startingAfter: string | null;
}

export interface PlanFeature {
    name: string;
    included: boolean;
}

export interface PlanInfo {
    id: string;
    name: string;
    description: string;
    priceMonthly: number | null;
    priceYearly: number | null;
    currency: string;
    maxProjects: number;
    maxMembers: number;
    maxPrReviews: number;
    maxRagPipelines: number;
    features: string[];
}

export interface PlansResponse {
    plans: PlanInfo[];
}

// ==================== Service ====================

class BillingApiService extends ApiService {
    // ==================== Subscription ====================

    async getSubscription(workspaceSlug: string): Promise<SubscriptionResponse> {
        return this.request<SubscriptionResponse>(
            `/workspaces/${workspaceSlug}/billing/subscription`,
            { method: 'GET' },
            true
        );
    }

    // ==================== Checkout ====================

    async createCheckout(workspaceSlug: string, request: CreateCheckoutRequest): Promise<CheckoutSessionResponse> {
        return this.request<CheckoutSessionResponse>(
            `/workspaces/${workspaceSlug}/billing/checkout`,
            {
                method: 'POST',
                body: JSON.stringify(request),
            },
            true
        );
    }

    // ==================== Portal ====================

    async createPortal(workspaceSlug: string, returnUrl?: string): Promise<PortalSessionResponse> {
        const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
        return this.request<PortalSessionResponse>(
            `/workspaces/${workspaceSlug}/billing/portal${params}`,
            { method: 'POST' },
            true
        );
    }

    // ==================== Plan Changes ====================

    async previewPlanChange(workspaceSlug: string, newTier: SubscriptionTier): Promise<PlanChangePreviewResponse> {
        return this.request<PlanChangePreviewResponse>(
            `/workspaces/${workspaceSlug}/billing/plan/preview`,
            {
                method: 'POST',
                body: JSON.stringify({ newTier, prorate: true }),
            },
            true
        );
    }

    async changePlan(workspaceSlug: string, request: ChangePlanRequest): Promise<SubscriptionResponse> {
        return this.request<SubscriptionResponse>(
            `/workspaces/${workspaceSlug}/billing/plan/change`,
            {
                method: 'POST',
                body: JSON.stringify(request),
            },
            true
        );
    }

    // ==================== Cancellation ====================

    async cancelSubscription(workspaceSlug: string, request: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> {
        return this.request<CancelSubscriptionResponse>(
            `/workspaces/${workspaceSlug}/billing/cancel`,
            {
                method: 'POST',
                body: JSON.stringify(request),
            },
            true
        );
    }

    async reactivateSubscription(workspaceSlug: string): Promise<ReactivateSubscriptionResponse> {
        return this.request<ReactivateSubscriptionResponse>(
            `/workspaces/${workspaceSlug}/billing/reactivate`,
            { method: 'POST' },
            true
        );
    }

    // ==================== Payment Methods ====================

    async listPaymentMethods(workspaceSlug: string): Promise<PaymentMethodResponse[]> {
        return this.request<PaymentMethodResponse[]>(
            `/workspaces/${workspaceSlug}/billing/payment-methods`,
            { method: 'GET' },
            true
        );
    }

    async addPaymentMethod(workspaceSlug: string, paymentMethodId: string, setAsDefault = true): Promise<void> {
        return this.request<void>(
            `/workspaces/${workspaceSlug}/billing/payment-methods?setAsDefault=${setAsDefault}`,
            {
                method: 'POST',
                body: JSON.stringify({ paymentMethodId }),
            },
            true
        );
    }

    async setDefaultPaymentMethod(workspaceSlug: string, paymentMethodId: string): Promise<void> {
        return this.request<void>(
            `/workspaces/${workspaceSlug}/billing/payment-methods/${paymentMethodId}/default`,
            { method: 'PUT' },
            true
        );
    }

    async removePaymentMethod(workspaceSlug: string, paymentMethodId: string): Promise<void> {
        return this.request<void>(
            `/workspaces/${workspaceSlug}/billing/payment-methods/${paymentMethodId}`,
            { method: 'DELETE' },
            true
        );
    }

    // ==================== Invoices ====================

    async listInvoices(workspaceSlug: string, limit = 10, startingAfter?: string): Promise<InvoiceListResponse> {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (startingAfter) params.append('startingAfter', startingAfter);

        return this.request<InvoiceListResponse>(
            `/workspaces/${workspaceSlug}/billing/invoices?${params.toString()}`,
            { method: 'GET' },
            true
        );
    }

    async getInvoice(workspaceSlug: string, invoiceId: string): Promise<InvoiceResponse> {
        return this.request<InvoiceResponse>(
            `/workspaces/${workspaceSlug}/billing/invoices/${invoiceId}`,
            { method: 'GET' },
            true
        );
    }

    // ==================== Plans ====================

    async getPlans(workspaceSlug: string): Promise<PlansResponse> {
        return this.request<PlansResponse>(
            `/workspaces/${workspaceSlug}/billing/plans`,
            { method: 'GET' },
            true
        );
    }

    // ==================== Usage ====================

    async getUsage(workspaceSlug: string): Promise<UsageResponse> {
        return this.request<UsageResponse>(
            `/workspaces/${workspaceSlug}/billing/usage`,
            { method: 'GET' },
            true
        );
    }
}

export const billingApi = new BillingApiService();
