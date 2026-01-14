import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getAllCategories } from '@/config/issueCategories';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface IssueFilters {
  severity: string;
  status: string;
  category: string;
  filePath: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface IssueFilterPanelProps {
  filters: IssueFilters;
  onFiltersChange: (filters: IssueFilters) => void;
  issueCount: number;
  className?: string;
}

export default function IssueFilterPanel({ filters, onFiltersChange, issueCount, className }: IssueFilterPanelProps) {
  const handleFilterChange = (key: keyof IssueFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      severity: 'ALL',
      status: 'open',
      category: 'ALL',
      filePath: '',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const hasActiveFilters = 
    filters.severity !== 'ALL' || 
    filters.status !== 'open' || 
    filters.category !== 'ALL' ||
    filters.filePath !== '' ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined;

  return (
    <div className={cn("bg-card border rounded-lg sticky top-4", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Filters</h3>
            <p className="text-sm text-muted-foreground">
              {issueCount} issue{issueCount !== 1 ? 's' : ''} found
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="max-h-[calc(100vh-200px)]">
        <div className="p-4 space-y-5">
          {/* Severity Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Severity</Label>
            <RadioGroup
              value={filters.severity}
              onValueChange={(value) => handleFilterChange('severity', value)}
              className="space-y-1"
            >
              {[
                { value: 'ALL', label: 'All' },
                { value: 'HIGH', label: 'High' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'LOW', label: 'Low' },
                { value: 'INFO', label: 'Info' },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`severity-${option.value}`} />
                  <Label htmlFor={`severity-${option.value}`} className="font-normal cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <RadioGroup
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
              className="space-y-1"
            >
              {[
                { value: 'ALL', label: 'All' },
                { value: 'open', label: 'Open' },
                { value: 'resolved', label: 'Resolved' },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`status-${option.value}`} />
                  <Label htmlFor={`status-${option.value}`} className="font-normal cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <RadioGroup
              value={filters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
              className="space-y-1"
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

          {/* File Path Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">File Path</Label>
            <Input
              placeholder="Filter by file path..."
              value={filters.filePath}
              onChange={(e) => handleFilterChange('filePath', e.target.value)}
              className="h-9"
            />
          </div>

          <Separator />

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Created Date</Label>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => handleFilterChange('dateFrom', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {filters.dateFrom && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => handleFilterChange('dateFrom', undefined)}
                  >
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => handleFilterChange('dateTo', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {filters.dateTo && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => handleFilterChange('dateTo', undefined)}
                  >
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
