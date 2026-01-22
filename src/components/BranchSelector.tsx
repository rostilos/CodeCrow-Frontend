import { useState, useEffect, useCallback, useRef } from "react";
import { Check, ChevronsUpDown, GitBranch, Loader2, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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

interface BranchSelectorProps {
  /** Currently selected branch */
  value: string;
  /** Callback when branch is selected */
  onValueChange: (value: string) => void;
  /** Function to fetch branches with optional search query */
  onSearch: (query: string) => Promise<string[]>;
  /** Initial/default branches to show (e.g., main, master, develop) */
  defaultBranches?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Whether to allow custom branch input */
  allowCustom?: boolean;
  /** Class name for the trigger button */
  className?: string;
  /** Label for accessibility */
  label?: string;
}

export function BranchSelector({
  value,
  onValueChange,
  onSearch,
  defaultBranches = [],
  placeholder = "Select branch...",
  disabled = false,
  allowCustom = true,
  className,
  label = "Branch",
}: BranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [branches, setBranches] = useState<string[]>(defaultBranches);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customBranch, setCustomBranch] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        if (query.length >= 2) {
          setIsLoading(true);
          setHasSearched(true);
          try {
            const results = await onSearch(query);
            // Merge with default branches, removing duplicates
            const merged = [...new Set([...defaultBranches, ...results])];
            // Sort: exact matches first, then starts with, then contains
            merged.sort((a, b) => {
              const aLower = a.toLowerCase();
              const bLower = b.toLowerCase();
              const qLower = query.toLowerCase();
              
              // Exact match first
              if (aLower === qLower) return -1;
              if (bLower === qLower) return 1;
              
              // Starts with query
              const aStarts = aLower.startsWith(qLower);
              const bStarts = bLower.startsWith(qLower);
              if (aStarts && !bStarts) return -1;
              if (!aStarts && bStarts) return 1;
              
              // Alphabetical
              return aLower.localeCompare(bLower);
            });
            setBranches(merged);
          } catch (error) {
            console.error("Failed to search branches:", error);
          } finally {
            setIsLoading(false);
          }
        } else if (query.length === 0) {
          setBranches(defaultBranches);
          setHasSearched(false);
        }
      }, 300);
    },
    [onSearch, defaultBranches]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, debouncedSearch]);

  // Load initial branches when popover opens
  useEffect(() => {
    if (open && branches.length === 0 && !hasSearched) {
      setIsLoading(true);
      onSearch("")
        .then((results) => {
          const merged = [...new Set([...defaultBranches, ...results.slice(0, 50)])];
          setBranches(merged);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [open, branches.length, hasSearched, onSearch, defaultBranches]);

  const handleSelect = (branch: string) => {
    onValueChange(branch);
    setOpen(false);
    setSearchQuery("");
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customBranch.trim()) {
      handleSelect(customBranch.trim());
      setCustomBranch("");
    }
  };

  // Filter branches based on search query (for client-side filtering of loaded branches)
  const filteredBranches = searchQuery.length >= 2
    ? branches
    : branches.filter((branch) =>
        branch.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Determine displayed branches - show up to 100 for performance
  const displayedBranches = filteredBranches.slice(0, 100);
  const hasMore = filteredBranches.length > 100;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            <GitBranch className="h-4 w-4 shrink-0 opacity-50" />
            {value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search branches... (type 2+ chars)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto overscroll-contain">
            {showCustomInput ? (
              <div className="p-2 space-y-2">
                <p className="text-xs text-muted-foreground px-2">
                  Enter a custom branch name:
                </p>
                <div className="flex gap-2">
                  <Input
                    value={customBranch}
                    onChange={(e) => setCustomBranch(e.target.value)}
                    placeholder="branch-name"
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
                    disabled={!customBranch.trim()}
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
                {!isLoading && displayedBranches.length === 0 && (
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm">
                      <p>No branches found.</p>
                      {searchQuery.length > 0 && searchQuery.length < 2 && (
                        <p className="text-muted-foreground mt-1">
                          Type at least 2 characters to search
                        </p>
                      )}
                    </div>
                  </CommandEmpty>
                )}
                
                {displayedBranches.length > 0 && (
                  <CommandGroup>
                    {displayedBranches.map((branch) => (
                      <CommandItem
                        key={branch}
                        value={branch}
                        onSelect={() => handleSelect(branch)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === branch ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <GitBranch className="mr-2 h-4 w-4 opacity-50" />
                        <span className="truncate">{branch}</span>
                        {defaultBranches.includes(branch) && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            default
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {hasMore && (
                  <div className="py-2 px-3 text-xs text-muted-foreground text-center border-t">
                    Showing {displayedBranches.length} of {filteredBranches.length} branches.
                    Type to search for more.
                  </div>
                )}

                {allowCustom && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setShowCustomInput(true)}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Enter custom branch name...
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default BranchSelector;
