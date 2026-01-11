import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { qualityGateService, QualityGate } from '@/api_service/qualitygate/qualityGateService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Edit2, 
  Trash2, 
  Star,
  MoreVertical,
  Copy,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import QualityGateEditor from './QualityGateEditor';

export default function QualityGatesPage() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingGate, setEditingGate] = useState<QualityGate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gateToDelete, setGateToDelete] = useState<QualityGate | null>(null);

  useEffect(() => {
    if (currentWorkspace) {
      loadQualityGates();
    }
  }, [currentWorkspace]);

  const loadQualityGates = async () => {
    if (!currentWorkspace) return;
    
    setIsLoading(true);
    try {
      const gates = await qualityGateService.getQualityGates(currentWorkspace.slug);
      setQualityGates(gates);
    } catch (error) {
      console.error('Failed to load quality gates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quality gates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingGate(null);
    setShowEditor(true);
  };

  const handleEdit = (gate: QualityGate) => {
    setEditingGate(gate);
    setShowEditor(true);
  };

  const handleDuplicate = async (gate: QualityGate) => {
    if (!currentWorkspace) return;
    
    try {
      await qualityGateService.createQualityGate(currentWorkspace.slug, {
        name: `${gate.name} (Copy)`,
        description: gate.description,
        conditions: gate.conditions.map(c => ({
          metric: c.metric,
          severity: c.severity,
          comparator: c.comparator,
          thresholdValue: c.thresholdValue,
          enabled: c.enabled,
        })),
      });
      toast({
        title: 'Success',
        description: 'Quality gate duplicated successfully',
      });
      loadQualityGates();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate quality gate',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (gate: QualityGate) => {
    if (!currentWorkspace || !gate.id) return;
    
    try {
      await qualityGateService.setDefaultQualityGate(currentWorkspace.slug, gate.id);
      toast({
        title: 'Success',
        description: `"${gate.name}" is now the default quality gate`,
      });
      loadQualityGates();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set default quality gate',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (gate: QualityGate) => {
    setGateToDelete(gate);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentWorkspace || !gateToDelete?.id) return;
    
    try {
      await qualityGateService.deleteQualityGate(currentWorkspace.slug, gateToDelete.id);
      toast({
        title: 'Success',
        description: 'Quality gate deleted successfully',
      });
      loadQualityGates();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete quality gate',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setGateToDelete(null);
    }
  };

  const handleEditorClose = (saved: boolean) => {
    setShowEditor(false);
    setEditingGate(null);
    if (saved) {
      loadQualityGates();
    }
  };

  const getConditionSummary = (gate: QualityGate) => {
    const enabledConditions = gate.conditions.filter(c => c.enabled);
    if (enabledConditions.length === 0) return 'No conditions configured';
    
    const summaries = enabledConditions.map(c => {
      const severityLabel = c.severity ? `${c.severity} issues` : 'issues';
      const comparatorSymbol = getComparatorSymbol(c.comparator);
      return `${severityLabel} ${comparatorSymbol} ${c.thresholdValue}`;
    });
    
    return summaries.slice(0, 3).join(', ') + (summaries.length > 3 ? ` (+${summaries.length - 3} more)` : '');
  };

  const getComparatorSymbol = (comparator: string) => {
    switch (comparator) {
      case 'GREATER_THAN': return '>';
      case 'GREATER_THAN_OR_EQUAL': return '≥';
      case 'LESS_THAN': return '<';
      case 'LESS_THAN_OR_EQUAL': return '≤';
      case 'EQUAL': return '=';
      case 'NOT_EQUAL': return '≠';
      default: return comparator;
    }
  };

  const getGateIcon = (gate: QualityGate) => {
    const hasHighCondition = gate.conditions.some(c => c.severity === 'HIGH' && c.enabled);
    const hasMediumCondition = gate.conditions.some(c => c.severity === 'MEDIUM' && c.enabled);
    
    if (hasHighCondition && hasMediumCondition) {
      return <ShieldCheck className="h-8 w-8 text-primary" />;
    } else if (hasHighCondition) {
      return <ShieldAlert className="h-8 w-8 text-warning" />;
    }
    return <Shield className="h-8 w-8 text-muted-foreground" />;
  };

  if (showEditor) {
    return (
      <QualityGateEditor
        qualityGate={editingGate}
        onClose={handleEditorClose}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality Gates</h1>
          <p className="text-muted-foreground mt-1">
            Define rules to determine if code analysis passes or fails
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quality Gate
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : qualityGates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Quality Gates</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Quality gates help you enforce code quality standards by defining rules 
              that determine if an analysis passes or fails.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Quality Gate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {qualityGates.map(gate => (
            <Card key={gate.id} className={gate.isDefault ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getGateIcon(gate)}
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {gate.name}
                        {gate.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        )}
                      </CardTitle>
                      {!gate.active && (
                        <Badge variant="secondary" className="mt-1">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(gate)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(gate)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {!gate.isDefault && (
                        <DropdownMenuItem onClick={() => handleSetDefault(gate)}>
                          <Check className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(gate)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {gate.description && (
                  <CardDescription className="mt-2">{gate.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Conditions:</p>
                  <p>{getConditionSummary(gate)}</p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="secondary">
                    {gate.conditions.filter(c => c.enabled).length} rule{gate.conditions.filter(c => c.enabled).length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quality Gate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{gateToDelete?.name}"? 
              Projects using this quality gate will no longer have a gate assigned.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
