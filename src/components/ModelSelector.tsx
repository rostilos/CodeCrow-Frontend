import { useState, useEffect, useCallback, useRef } from "react";
import { Check, ChevronsUpDown, Brain, Loader2, Search, Plus, Keyboard, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { llmModelService, LlmModelDTO } from "@/api_service/ai/llmModelService";
import { AIProviderKey } from "@/api_service/ai/aiConnectionService";

interface ModelSelectorProps {
  /** Currently selected model ID */
  value: string;
  /** Callback when model is selected */
  onValueChange: (value: string) => void;
  /** Provider to filter models by */
  provider: AIProviderKey;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Class name for the trigger button */
  className?: string;
  /** Whether to allow custom model input (fallback mode) */
  allowCustom?: boolean;
}

function formatContextWindow(tokens: number | null): string {
  if (tokens === null || tokens === undefined) return '';
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${Math.round(tokens / 1000)}k`;
  }
  return String(tokens);
}

function formatPrice(inputPrice: string | null, outputPrice: string | null): string | null {
  if (!inputPrice && !outputPrice) return null;
  const input = inputPrice ? parseFloat(inputPrice) : 0;
  const output = outputPrice ? parseFloat(outputPrice) : 0;
  if (input === 0 && output === 0) return null;
  // Show as $X.XX/M format
  return `$${input.toFixed(2)}/$${output.toFixed(2)}`;
}

export function ModelSelector({
  value,
  onValueChange,
  provider,
  placeholder = "Select model...",
  disabled = false,
  className,
  allowCustom = true,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [models, setModels] = useState<LlmModelDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customModel, setCustomModel] = useState("");
  const [hasModelsForProvider, setHasModelsForProvider] = useState<boolean | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Check if models are available for this provider
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await llmModelService.getStatus();
        setHasModelsForProvider(status.providers[provider] || false);
      } catch (error) {
        console.error("Failed to check model status:", error);
        setHasModelsForProvider(false);
      }
    };
    checkStatus();
  }, [provider]);

  // Fetch models based on search and provider
  const fetchModels = useCallback(
    async (query: string, pageNum: number, append: boolean = false) => {
      setIsLoading(true);
      try {
        const response = await llmModelService.searchModels({
          provider,
          search: query || undefined,
          page: pageNum,
          size: 20,
        });

        setModels(prev => append ? [...prev, ...response.models] : response.models);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [provider]
  );

  // Debounced search
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        fetchModels(query, 0, false);
      }, 300);
    },
    [fetchModels]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, debouncedSearch]);

  // Load initial models when popover opens
  useEffect(() => {
    if (open && models.length === 0) {
      fetchModels("", 0, false);
    }
  }, [open, models.length, fetchModels]);

  // Reset models when provider changes
  useEffect(() => {
    setModels([]);
    setPage(0);
    setSearchQuery("");
  }, [provider]);

  const handleSelect = (model: LlmModelDTO | string) => {
    const modelId = typeof model === 'string' ? model : model.modelId;
    onValueChange(modelId);
    setOpen(false);
    setSearchQuery("");
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customModel.trim()) {
      handleSelect(customModel.trim());
      setCustomModel("");
    }
  };

  const loadMore = () => {
    if (page < totalPages - 1 && !isLoading) {
      fetchModels(searchQuery, page + 1, true);
    }
  };

  // Handle scroll to load more
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      loadMore();
    }
  }, [page, totalPages, isLoading, searchQuery]);

  // Get display name for selected value
  const selectedModel = models.find(m => m.modelId === value);
  const displayValue = selectedModel?.displayName || selectedModel?.modelId || value;

  // If no models are available, show custom input mode
  if (hasModelsForProvider === false) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Info className="h-3 w-3" />
          <span>No cached models available. Enter model name manually.</span>
        </div>
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={getPlaceholderForProvider(provider)}
          disabled={disabled}
          className={className}
        />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select model"
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            <Brain className="h-4 w-4 shrink-0 opacity-50" />
            {value ? (
              <span className="truncate">{displayValue}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <CommandList 
            className="max-h-[300px] overflow-y-auto" 
            onScroll={handleScroll}
            ref={listRef as any}
          >
            {showCustomInput ? (
              <div className="p-2 space-y-2">
                <p className="text-xs text-muted-foreground px-2">
                  Enter a custom model name:
                </p>
                <div className="flex gap-2">
                  <Input
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder={getPlaceholderForProvider(provider)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomSubmit();
                      } else if (e.key === "Escape") {
                        setShowCustomInput(false);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={handleCustomSubmit}
                    disabled={!customModel.trim()}
                  >
                    Add
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8"
                  onClick={() => setShowCustomInput(false)}
                >
                  Back to list
                </Button>
              </div>
            ) : (
              <>
                {allowCustom && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => setShowCustomInput(true)}
                      className="cursor-pointer"
                    >
                      <Keyboard className="mr-2 h-4 w-4" />
                      Enter model name manually...
                    </CommandItem>
                  </CommandGroup>
                )}
                
                {allowCustom && models.length > 0 && <CommandSeparator />}

                {!isLoading && models.length === 0 && (
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm">
                      <p>No models found.</p>
                      {searchQuery && (
                        <p className="text-muted-foreground mt-1">
                          Try a different search term
                        </p>
                      )}
                    </div>
                  </CommandEmpty>
                )}
                
                {models.length > 0 && (
                  <CommandGroup>
                    {models.map((model) => (
                      <CommandItem
                        key={model.id}
                        value={model.modelId}
                        onSelect={() => handleSelect(model)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            value === model.modelId ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate font-medium">{model.displayName || model.modelId}</span>
                          <span className="text-xs text-muted-foreground truncate">{model.modelId}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          {formatPrice(model.inputPricePerMillion, model.outputPricePerMillion) && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {formatPrice(model.inputPricePerMillion, model.outputPricePerMillion)}
                            </Badge>
                          )}
                          {model.contextWindow && (
                            <Badge variant="secondary" className="text-xs">
                              {formatContextWindow(model.contextWindow)}
                            </Badge>
                          )}
                          {model.supportsTools && (
                            <Badge variant="outline" className="text-xs">
                              Tools
                            </Badge>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {models.length > 0 && (
                  <div className="py-2 px-3 text-xs text-muted-foreground text-center border-t">
                    Showing {models.length} of {totalElements} models
                    {page < totalPages - 1 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 ml-2"
                        onClick={loadMore}
                        disabled={isLoading}
                      >
                        Load more
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function getPlaceholderForProvider(provider: AIProviderKey): string {
  switch (provider) {
    case 'OPENAI':
      return 'e.g., gpt-4o, gpt-4o-mini';
    case 'ANTHROPIC':
      return 'e.g., claude-sonnet-4-20250514';
    case 'GOOGLE':
      return 'e.g., gemini-2.5-flash';
    case 'OPENROUTER':
      return 'e.g., anthropic/claude-sonnet-4';
    default:
      return 'Enter model name';
  }
}

export default ModelSelector;
