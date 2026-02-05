import { useState, useEffect, useCallback } from 'react';
import { billingApi, SubscriptionResponse, InvoiceListResponse, PaymentMethodResponse } from '@/api_service/billing';

// ==================== Subscription Hook ====================

interface UseSubscriptionResult {
    subscription: SubscriptionResponse | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useSubscription(workspaceSlug: string | undefined): UseSubscriptionResult {
    const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = useCallback(async () => {
        if (!workspaceSlug) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await billingApi.getSubscription(workspaceSlug);
            setSubscription(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [workspaceSlug]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    return { subscription, loading, error, refetch: fetchSubscription };
}

// ==================== Invoices Hook ====================

interface UseInvoicesResult {
    invoices: InvoiceListResponse | null;
    loading: boolean;
    error: string | null;
    loadMore: () => Promise<void>;
    refetch: () => Promise<void>;
}

export function useInvoices(workspaceSlug: string | undefined): UseInvoicesResult {
    const [invoices, setInvoices] = useState<InvoiceListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvoices = useCallback(async (startingAfter?: string) => {
        if (!workspaceSlug) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await billingApi.listInvoices(workspaceSlug, 10, startingAfter);
            if (startingAfter && invoices) {
                setInvoices({
                    ...data,
                    invoices: [...invoices.invoices, ...data.invoices],
                });
            } else {
                setInvoices(data);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [workspaceSlug, invoices]);

    useEffect(() => {
        fetchInvoices();
    }, [workspaceSlug]);

    const loadMore = useCallback(async () => {
        if (invoices?.hasMore && invoices.startingAfter) {
            await fetchInvoices(invoices.startingAfter);
        }
    }, [invoices, fetchInvoices]);

    return { invoices, loading, error, loadMore, refetch: () => fetchInvoices() };
}

// ==================== Payment Methods Hook ====================

interface UsePaymentMethodsResult {
    methods: PaymentMethodResponse[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function usePaymentMethods(workspaceSlug: string | undefined): UsePaymentMethodsResult {
    const [methods, setMethods] = useState<PaymentMethodResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMethods = useCallback(async () => {
        if (!workspaceSlug) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await billingApi.listPaymentMethods(workspaceSlug);
            setMethods(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment methods';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [workspaceSlug]);

    useEffect(() => {
        fetchMethods();
    }, [fetchMethods]);

    return { methods, loading, error, refetch: fetchMethods };
}

// ==================== Utility Functions ====================

export function formatTierName(tier: SubscriptionResponse['tier']): string {
    switch (tier) {
        case 'TRIAL': return 'Free Trial';
        case 'PRO': return 'Pro';
        case 'PRO_PLUS': return 'Pro+';
        case 'ENTERPRISE': return 'Enterprise';
        default: return tier;
    }
}

export function isUnlimited(value: number): boolean {
    return value === -1;
}

export function formatLimit(value: number): string {
    return isUnlimited(value) ? '∞' : value.toLocaleString();
}

export function formatCurrency(amount: number, currency = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount / 100);
}

export function formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function getDaysRemaining(dateString: string | null): number {
    if (!dateString) return 0;
    const now = new Date();
    const end = new Date(dateString);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getCardBrandIcon(brand: string): string {
    const brands: Record<string, string> = {
        visa: '💳',
        mastercard: '💳',
        amex: '💳',
        discover: '💳',
        diners: '💳',
        jcb: '💳',
        unionpay: '💳',
    };
    return brands[brand.toLowerCase()] || '💳';
}
