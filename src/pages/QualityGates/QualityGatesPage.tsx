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
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full">
        {/* Page Header */}
        <div className="w-full bg-background/40 backdrop-blur-xl border-b border-border/40 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Quality Gates
                  </h1>
                  <p className="text-base text-muted-foreground font-medium mt-1">
                    Define rules to determine if code analysis passes or fails
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button size="lg" onClick={handleCreateNew} className="shadow-md hover:shadow-lg transition-all animate-in fade-in slide-in-from-right-4">
                  <Plus className="mr-2 h-5 w-5" />
                  <span>Create Quality Gate</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-10">
          <div className="space-y-6">

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
                {qualityGates.map((gate, index) => (
                  <Card key={gate.id} className={`group relative flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/10 bg-card/60 backdrop-blur-xl border-border/50 hover:border-primary/40 animate-in fade-in slide-in-from-bottom-8 ${gate.isDefault ? 'border-primary/60' : ''}`} style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}>
                    <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-500 bg-[length:200%_auto] ${gate.isDefault ? 'bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-100 group-hover:animate-pulse' : 'bg-gradient-to-r from-muted to-muted-foreground/30 opacity-50 group-hover:opacity-80 group-hover:from-primary/40 group-hover:to-primary/20'}`} />

                    <CardHeader className="pb-3 pt-5 px-5 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-1 items-center gap-3 min-w-0">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-background/80 shadow-sm ring-1 ring-border flex items-center justify-center group-hover:ring-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                            {getGateIcon(gate)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors truncate">
                              <span className="truncate">{gate.name}</span>
                              {gate.isDefault && (
                                <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-primary/20 text-primary hover:bg-primary/30 border-none transition-colors shrink-0">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  Default
                                </Badge>
                              )}
                              {!gate.active && (
                                <Badge variant="secondary" className="text-[10px] py-0 h-4 shrink-0">Inactive</Badge>
                              )}
                            </CardTitle>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary">
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
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {gate.description && (
                        <CardDescription className="text-xs ml-[3.25rem] mt-[-0.25rem] opacity-80 group-hover:opacity-100 transition-opacity line-clamp-2">
                          {gate.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 pb-5 px-5 flex-1 flex flex-col gap-4 relative z-10 mt-2">
                      <div className="space-y-2 px-3 py-2 rounded-lg bg-background/50 border border-border/60 group-hover:border-primary/20 transition-colors">
                        <p className="font-medium text-foreground text-xs">Conditions:</p>
                        <p className="text-xs text-muted-foreground">{getConditionSummary(gate)}</p>
                      </div>
                      <div className="mt-auto flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="text-xs font-semibold group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
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
        </div>
      </div>
    </div>
  );
}
