import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/api_service/billing';
import { useWorkspace } from '@/context/WorkspaceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';

export function CloudSubscriptionNotice() {
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceOwner } = usePermissions();
  const location = useLocation();
  const slug = currentWorkspace?.slug;
  const models = useQuery({ queryKey: ['managed-models', slug], queryFn: () => billingApi.models(slug!), enabled: !!slug });
  if (!slug || !models.data || models.data.active || location.pathname.includes('/billing')) return null;
  return <div className="border-b border-primary/20 bg-primary/5 px-4 py-3" role="status">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-semibold">Activate your workspace to start AI reviews</p>
        <p className="text-sm text-muted-foreground">{isWorkspaceOwner() ? 'Choose Starter with your own key, or Pro / Pro+ with CodeCrow models. Add a card at checkout.' : 'Your workspace owner needs to activate a subscription, including when using your own API key.'}</p></div>
      {isWorkspaceOwner() && <Button asChild size="sm"><Link to={`/dashboard/${slug}/billing`}>Set up subscription</Link></Button>}
    </div>
  </div>;
}
