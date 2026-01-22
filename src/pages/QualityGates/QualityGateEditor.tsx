import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { 
  qualityGateService, 
  QualityGate, 
  QualityGateCondition,
  QualityGateMetric,
  QualityGateComparator,
  IssueSeverity,
  IssueCategory
} from '@/api_service/qualitygate/qualityGateService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QualityGateEditorProps {
  qualityGate: QualityGate | null;
  onClose: (saved: boolean) => void;
}

const METRICS: { value: QualityGateMetric; label: string; description: string }[] = [
  { value: 'ISSUES_BY_SEVERITY', label: 'Issues by Severity', description: 'Count issues filtered by severity level' },
  { value: 'ISSUES_BY_CATEGORY', label: 'Issues by Category', description: 'Count issues filtered by category type' },
  { value: 'NEW_ISSUES', label: 'New Issues', description: 'Total number of new issues found' },
];

const SEVERITIES: { value: IssueSeverity; label: string; color: string; icon: typeof AlertTriangle }[] = [
  { value: 'HIGH', label: 'High', color: 'text-destructive', icon: AlertTriangle },
  { value: 'MEDIUM', label: 'Medium', color: 'text-warning', icon: AlertCircle },
  { value: 'LOW', label: 'Low', color: 'text-muted-foreground', icon: Info },
  { value: 'INFO', label: 'Info', color: 'text-primary/60', icon: Info },
];

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'SECURITY', label: 'Security' },
  { value: 'PERFORMANCE', label: 'Performance' },
  { value: 'CODE_QUALITY', label: 'Code Quality' },
  { value: 'BUG_RISK', label: 'Bug Risk' },
  { value: 'STYLE', label: 'Style' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'BEST_PRACTICES', label: 'Best Practices' },
  { value: 'ERROR_HANDLING', label: 'Error Handling' },
  { value: 'TESTING', label: 'Testing' },
  { value: 'ARCHITECTURE', label: 'Architecture' },
];

const COMPARATORS: { value: QualityGateComparator; label: string; symbol: string }[] = [
  { value: 'GREATER_THAN', label: 'Greater than', symbol: '>' },
  { value: 'GREATER_THAN_OR_EQUAL', label: 'Greater than or equal', symbol: '≥' },
  { value: 'LESS_THAN', label: 'Less than', symbol: '<' },
  { value: 'LESS_THAN_OR_EQUAL', label: 'Less than or equal', symbol: '≤' },
  { value: 'EQUAL', label: 'Equal to', symbol: '=' },
  { value: 'NOT_EQUAL', label: 'Not equal to', symbol: '≠' },
];

interface EditableCondition extends Omit<QualityGateCondition, 'id'> {
  tempId: string;
}

export default function QualityGateEditor({ qualityGate, onClose }: QualityGateEditorProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [name, setName] = useState(qualityGate?.name || '');
  const [description, setDescription] = useState(qualityGate?.description || '');
  const [isDefault, setIsDefault] = useState(qualityGate?.isDefault || false);
  const [active, setActive] = useState(qualityGate?.active ?? true);
  const [conditions, setConditions] = useState<EditableCondition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (qualityGate) {
      setConditions(qualityGate.conditions.map(c => ({
        ...c,
        tempId: crypto.randomUUID(),
      })));
    } else {
      // Add default conditions for new quality gate
      setConditions([
        {
          tempId: crypto.randomUUID(),
          metric: 'ISSUES_BY_SEVERITY',
          severity: 'HIGH',
          comparator: 'GREATER_THAN',
          thresholdValue: 0,
          enabled: true,
        },
        {
          tempId: crypto.randomUUID(),
          metric: 'ISSUES_BY_SEVERITY',
          severity: 'MEDIUM',
          comparator: 'GREATER_THAN',
          thresholdValue: 5,
          enabled: true,
        },
      ]);
    }
  }, [qualityGate]);

  const addCondition = () => {
    setConditions([...conditions, {
      tempId: crypto.randomUUID(),
      metric: 'ISSUES_BY_SEVERITY',
      severity: 'HIGH',
      comparator: 'GREATER_THAN',
      thresholdValue: 0,
      enabled: true,
    }]);
  };

  const removeCondition = (tempId: string) => {
    setConditions(conditions.filter(c => c.tempId !== tempId));
  };

  const updateCondition = (tempId: string, updates: Partial<EditableCondition>) => {
    setConditions(conditions.map(c => 
      c.tempId === tempId ? { ...c, ...updates } : c
    ));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (conditions.length === 0) {
      newErrors.conditions = 'At least one condition is required';
    }
    
    conditions.forEach((c, index) => {
      if (c.thresholdValue < 0) {
        newErrors[`condition_${index}`] = 'Threshold must be non-negative';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!currentWorkspace || !validate()) return;
    
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        isDefault,
        active,
        conditions: conditions.map(c => ({
          metric: c.metric,
          severity: c.metric === 'ISSUES_BY_SEVERITY' ? c.severity : undefined,
          category: c.metric === 'ISSUES_BY_CATEGORY' ? c.category : undefined,
          comparator: c.comparator,
          thresholdValue: c.thresholdValue,
          enabled: c.enabled,
        })),
      };
      
      if (qualityGate?.id) {
        await qualityGateService.updateQualityGate(currentWorkspace.slug, qualityGate.id, payload);
        toast({
          title: 'Success',
          description: 'Quality gate updated successfully',
        });
      } else {
        await qualityGateService.createQualityGate(currentWorkspace.slug, payload);
        toast({
          title: 'Success',
          description: 'Quality gate created successfully',
        });
      }
      
      onClose(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save quality gate',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityIcon = (severity: IssueSeverity) => {
    const config = SEVERITIES.find(s => s.value === severity);
    if (!config) return null;
    const Icon = config.icon;
    return <Icon className={cn('h-4 w-4', config.color)} />;
  };

  const getConditionPreview = (condition: EditableCondition) => {
    const comparator = COMPARATORS.find(c => c.value === condition.comparator);
    let filterLabel = 'issues';
    if (condition.metric === 'ISSUES_BY_SEVERITY' && condition.severity) {
      filterLabel = `${condition.severity} issues`;
    } else if (condition.metric === 'ISSUES_BY_CATEGORY' && condition.category) {
      const cat = CATEGORIES.find(c => c.value === condition.category);
      filterLabel = `${cat?.label || condition.category} issues`;
    }
    return `${filterLabel} ${comparator?.symbol || '>'} ${condition.thresholdValue} → FAIL`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => onClose(false)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {qualityGate ? 'Edit Quality Gate' : 'Create Quality Gate'}
          </h1>
          <p className="text-muted-foreground">
            Define conditions that determine if code analysis passes or fails
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Give your quality gate a name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Standards"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this quality gate..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label>Set as Default</Label>
              <p className="text-sm text-muted-foreground">
                New projects will use this quality gate automatically
              </p>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Inactive gates won't be evaluated
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conditions</CardTitle>
              <CardDescription>
                Define rules that will cause the analysis to fail
              </CardDescription>
            </div>
            <Button onClick={addCondition} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.conditions && (
            <p className="text-sm text-destructive">{errors.conditions}</p>
          )}
          
          {conditions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conditions defined</p>
              <p className="text-sm">Add conditions to define when analysis should fail</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={condition.tempId}
                  className={cn(
                    'border rounded-lg p-4 space-y-4',
                    !condition.enabled && 'opacity-50 bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className="text-sm font-medium">Condition {index + 1}</span>
                      {condition.severity && getSeverityIcon(condition.severity)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`enabled-${condition.tempId}`} className="text-sm">
                          Enabled
                        </Label>
                        <Switch
                          id={`enabled-${condition.tempId}`}
                          checked={condition.enabled}
                          onCheckedChange={(enabled) => updateCondition(condition.tempId, { enabled })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(condition.tempId)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Metric</Label>
                      <Select
                        value={condition.metric}
                        onValueChange={(value: QualityGateMetric) => 
                          updateCondition(condition.tempId, { metric: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {METRICS.map(m => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {condition.metric === 'ISSUES_BY_SEVERITY' && (
                      <div className="space-y-2">
                        <Label>Severity</Label>
                        <Select
                          value={condition.severity || ''}
                          onValueChange={(value: IssueSeverity) => 
                            updateCondition(condition.tempId, { severity: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEVERITIES.map(s => (
                              <SelectItem key={s.value} value={s.value}>
                                <div className="flex items-center gap-2">
                                  <s.icon className={cn('h-4 w-4', s.color)} />
                                  {s.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {condition.metric === 'ISSUES_BY_CATEGORY' && (
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={condition.category || ''}
                          onValueChange={(value: IssueCategory) => 
                            updateCondition(condition.tempId, { category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Operator</Label>
                      <Select
                        value={condition.comparator}
                        onValueChange={(value: QualityGateComparator) => 
                          updateCondition(condition.tempId, { comparator: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPARATORS.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.symbol} {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Threshold</Label>
                      <Input
                        type="number"
                        min={0}
                        value={condition.thresholdValue}
                        onChange={(e) => updateCondition(condition.tempId, { 
                          thresholdValue: parseInt(e.target.value) || 0 
                        })}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
                    <span className="font-medium">Preview:</span> If {getConditionPreview(condition)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" onClick={() => onClose(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : qualityGate ? 'Save Changes' : 'Create Quality Gate'}
        </Button>
      </div>
    </div>
  );
}
