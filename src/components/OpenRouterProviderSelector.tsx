import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { llmModelService } from "@/api_service/ai/llmModelService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  model: string;
  value?: string | null;
  onChange: (value: string) => void;
}

export function OpenRouterProviderSelector({ model, value, onChange }: Props) {
  const id = useId();
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["openrouter-providers", model],
    queryFn: () => llmModelService.getOpenRouterProviders(model),
    enabled: !!model,
    staleTime: 60_000,
    retry: false,
  });
  const selected: string[] = value ? JSON.parse(value).extra_body?.provider?.order || [] : [];
  const available = data?.providers || [];
  const remaining = available.filter((provider) => !selected.includes(provider.slug));
  const update = (order: string[]) => onChange(order.length
    ? JSON.stringify({ extra_body: { provider: { order, allow_fallbacks: false } } })
    : "");
  const move = (index: number, offset: number) => {
    const order = [...selected];
    [order[index], order[index + offset]] = [order[index + offset], order[index]];
    update(order);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>OpenRouter providers</Label>
      <p className="text-xs text-muted-foreground">
        Leave empty for automatic routing. Select one to lock to that provider, or several to try in order.
        Only selected providers will be used.
      </p>
      <ol className="space-y-1">
        {selected.map((slug, index) => {
          const provider = available.find((item) => item.slug === slug);
          return (
            <li key={slug} className="flex items-center gap-2 rounded border px-2 py-1 text-sm">
              <span className="flex-1">{index + 1}. {provider ? `${provider.name} (${slug})` : slug}
                {data?.syncedAt && !provider && <span className="text-muted-foreground"> (no longer listed; selection retained)</span>}
              </span>
              <Button type="button" variant="ghost" size="icon" aria-label={`Move ${slug} up`}
                disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label={`Move ${slug} down`}
                disabled={index === selected.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${slug}`}
                onClick={() => update(selected.filter((item) => item !== slug))}><X className="h-4 w-4" /></Button>
            </li>
          );
        })}
      </ol>
      <Select value="" onValueChange={(slug) => update([...selected, slug])}
        disabled={!model || isFetching || remaining.length === 0}>
        <SelectTrigger id={id}><SelectValue placeholder={isFetching ? "Loading providers..." : "Add a provider..."} /></SelectTrigger>
        <SelectContent>
          {remaining.map((provider) => <SelectItem key={provider.slug} value={provider.slug}>
            {provider.name} ({provider.slug})
          </SelectItem>)}
        </SelectContent>
      </Select>
      {!model && <p className="text-xs text-muted-foreground">Select a model first.</p>}
      {model && !isFetching && (isError || !data?.syncedAt) && (
        <p className="text-xs text-muted-foreground" role="status">
          Provider catalogue unavailable for this model. Automatic routing and saved selections still work.
          <Button type="button" variant="link" size="sm" onClick={() => refetch()}>Reload</Button>
        </p>
      )}
      {data?.syncedAt && <p className="text-xs text-muted-foreground">
        {available.length === 0 ? "No providers currently listed. " : ""}
        Catalogue updated {new Date(data.syncedAt).toLocaleString()}. Refreshed daily; live availability can change.
      </p>}
    </div>
  );
}
