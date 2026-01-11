import { useState, useEffect } from 'react';
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getAllCategories, getCategoryInfo } from '@/config/issueCategories';

export interface IssueFilters {
  severity: string;
  status: string;
  category: string;
  filePath: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface IssueFilterSidebarProps {
  filters: IssueFilters;
  onFiltersChange: (filters: IssueFilters) => void;
  issueCount: number;
}

export default function IssueFilterSidebar({ filters, onFiltersChange, issueCount }: IssueFilterSidebarProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<IssueFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: IssueFilters = {
      severity: 'ALL',
      status: 'open', // Default to showing only open issues
      category: 'ALL',
      filePath: '',
      dateFrom: undefined,
      dateTo: undefined,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = 
    localFilters.severity !== 'ALL' || 
    localFilters.status !== 'open' || 
    localFilters.category !== 'ALL' ||
    localFilters.filePath !== '' ||
    localFilters.dateFrom !== undefined ||
    localFilters.dateTo !== undefined;

  const activeFilterCount = [
    localFilters.severity !== 'ALL',
    localFilters.status !== 'open',
    localFilters.category !== 'ALL',
    localFilters.filePath !== '',
    localFilters.dateFrom !== undefined,
    localFilters.dateTo !== undefined,
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[550px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Issues</SheetTitle>
          <SheetDescription>
            Showing {issueCount} issue{issueCount !== 1 ? 's' : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Severity Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Severity</Label>
            <RadioGroup
              value={localFilters.severity}
              onValueChange={(value) => setLocalFilters({ ...localFilters, severity: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ALL" id="severity-all" />
                <Label htmlFor="severity-all" className="font-normal cursor-pointer">
                  All Severities
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="HIGH" id="severity-high" />
                <Label htmlFor="severity-high" className="font-normal cursor-pointer">
                  High
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MEDIUM" id="severity-medium" />
                <Label htmlFor="severity-medium" className="font-normal cursor-pointer">
                  Medium
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="LOW" id="severity-low" />
                <Label htmlFor="severity-low" className="font-normal cursor-pointer">
                  Low
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INFO" id="severity-info" />
                <Label htmlFor="severity-info" className="font-normal cursor-pointer">
                  Info
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Status</Label>
            <RadioGroup
              value={localFilters.status}
              onValueChange={(value) => setLocalFilters({ ...localFilters, status: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ALL" id="status-all" />
                <Label htmlFor="status-all" className="font-normal cursor-pointer">
                  All Statuses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="open" id="status-open" />
                <Label htmlFor="status-open" className="font-normal cursor-pointer">
                  Open
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resolved" id="status-resolved" />
                <Label htmlFor="status-resolved" className="font-normal cursor-pointer">
                  Resolved
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Category Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Category</Label>
            <RadioGroup
              value={localFilters.category}
              onValueChange={(value) => setLocalFilters({ ...localFilters, category: value })}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ALL" id="category-all" />
                <Label htmlFor="category-all" className="font-normal cursor-pointer text-sm">
                  All Categories
                </Label>
              </div>
              {getAllCategories().map((cat) => (
                <div key={cat.key} className="flex items-center space-x-2">
                  <RadioGroupItem value={cat.key} id={`category-${cat.key}`} />
                  <Label 
                    htmlFor={`category-${cat.key}`} 
                    className={cn("font-normal cursor-pointer text-sm", cat.color)}
                  >
                    {cat.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Created Date</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-sm font-normal">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-from"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateFrom ? format(localFilters.dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateFrom}
                      onSelect={(date) => setLocalFilters({ ...localFilters, dateFrom: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to" className="text-sm font-normal">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-to"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !localFilters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateTo ? format(localFilters.dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateTo}
                      onSelect={(date) => setLocalFilters({ ...localFilters, dateTo: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {(localFilters.dateFrom || localFilters.dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalFilters({ ...localFilters, dateFrom: undefined, dateTo: undefined })}
                className="w-full"
              >
                <X className="h-3 w-3 mr-1" />
                Clear dates
              </Button>
            )}
          </div>

          <Separator />

          {/* File Path Filter */}
          <div className="space-y-3">
            <Label htmlFor="file-path" className="text-base font-semibold">File Path</Label>
            <Input
              id="file-path"
              placeholder="Search by file path..."
              value={localFilters.filePath}
              onChange={(e) => setLocalFilters({ ...localFilters, filePath: e.target.value })}
            />
            {localFilters.filePath && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalFilters({ ...localFilters, filePath: '' })}
                className="w-full"
              >
                <X className="h-3 w-3 mr-1" />
                Clear file path
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className="flex-1"
          >
            Clear All
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
