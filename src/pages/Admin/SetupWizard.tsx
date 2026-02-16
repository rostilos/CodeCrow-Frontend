import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  GitBranch,
  Database,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Rocket,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { adminSettingsService } from "@/api_service/admin/adminSettingsService";
import type {
  SettingsMap,
  SiteSettingsGroup,
} from "@/api_service/admin/adminSettings.interface";
import { SETTINGS_GROUPS } from "@/config/settingsGroups";
import type { SettingsFieldMeta } from "@/api_service/admin/adminSettings.interface";
import { Switch } from "@/components/ui/switch";

/**
 * Wizard steps correspond to the minimum required setup for a working instance.
 *
 * Step 0: Welcome
 * Step 1: Base URLs
 * Step 2: Embedding provider (required — RAG pipeline needs this)
 * Step 3: VCS provider (at least one — Bitbucket, GitHub, or GitLab)
 * Step 4: Done
 */
interface WizardStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  settingsGroup?: SiteSettingsGroup;
  vcsChoice?: boolean; // step 3 lets user pick which VCS
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "welcome",
    label: "Welcome",
    description: "Let's configure your CodeCrow instance.",
    icon: Rocket,
  },
  {
    id: "base-urls",
    label: "Base URLs",
    description: "Where is your instance accessible?",
    icon: Globe,
    settingsGroup: "BASE_URLS",
  },
  {
    id: "embedding",
    label: "Embedding Provider",
    description: "Configure how code is embedded for AI-powered search.",
    icon: Database,
    settingsGroup: "EMBEDDING",
  },
  {
    id: "vcs",
    label: "Version Control",
    description: "Connect at least one VCS provider.",
    icon: GitBranch,
    vcsChoice: true,
  },
  {
    id: "done",
    label: "All Set!",
    description: "Your instance is ready to use.",
    icon: CheckCircle2,
  },
];

const VCS_OPTIONS: { group: SiteSettingsGroup; label: string }[] = [
  { group: "VCS_BITBUCKET", label: "Bitbucket" },
  { group: "VCS_GITHUB", label: "GitHub" },
  { group: "VCS_GITLAB", label: "GitLab" },
];

export default function SetupWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<SettingsMap>({});
  const [saving, setSaving] = useState(false);
  const [selectedVcs, setSelectedVcs] =
    useState<SiteSettingsGroup>("VCS_GITHUB");

  const step = WIZARD_STEPS[currentStep];

  // Load values when entering a settings step
  useEffect(() => {
    const group = step.settingsGroup || (step.vcsChoice ? selectedVcs : null);
    if (group) {
      adminSettingsService
        .getSettingsGroup(group)
        .then(setValues)
        .catch(() => setValues({}));
    }
  }, [currentStep, selectedVcs]);

  const getGroupMeta = (groupKey: string) =>
    SETTINGS_GROUPS.find((g) => g.key === groupKey);

  const handleSaveAndNext = async () => {
    const group = step.settingsGroup || (step.vcsChoice ? selectedVcs : null);
    if (!group) {
      setCurrentStep((s) => s + 1);
      return;
    }

    setSaving(true);
    try {
      await adminSettingsService.updateSettingsGroup(group, values);
      toast({
        title: "Saved",
        description: `${getGroupMeta(group)?.label ?? group} configured.`,
      });
      setCurrentStep((s) => s + 1);
      setValues({});
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const goToDashboard = () => navigate("/workspace");
  const goToAdmin = () => navigate("/admin/settings");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {WIZARD_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-2 rounded-full transition-all ${
                i <= currentStep ? "bg-primary w-10" : "bg-muted w-6"
              }`}
            />
          ))}
        </div>

        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <step.icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{step.label}</CardTitle>
            <CardDescription className="text-base">
              {step.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step: Welcome */}
            {step.id === "welcome" && (
              <div className="text-center space-y-4 py-4">
                <p className="text-muted-foreground">
                  This wizard will help you configure the essential settings for
                  your CodeCrow instance. You'll set up:
                </p>
                <ul className="space-y-2 text-left max-w-sm mx-auto">
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span>Base URLs for your instance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span>Embedding provider for AI search</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <span>Version control provider</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground pt-2">
                  You can always change these settings later in Site
                  Administration.
                </p>
              </div>
            )}

            {/* Step: Settings form (Base URLs, Embedding) */}
            {step.settingsGroup && (
              <div className="space-y-5">
                {getGroupMeta(step.settingsGroup)?.fields.map((field) => (
                  <WizardField
                    key={field.key}
                    field={field}
                    value={values[field.key] ?? ""}
                    onChange={(val) => handleFieldChange(field.key, val)}
                  />
                ))}
              </div>
            )}

            {/* Step: VCS choice */}
            {step.vcsChoice && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>VCS Provider</Label>
                  <Select
                    value={selectedVcs}
                    onValueChange={(v) => {
                      setSelectedVcs(v as SiteSettingsGroup);
                      setValues({});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VCS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.group} value={opt.group}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-5">
                  {getGroupMeta(selectedVcs)?.fields.map((field) => (
                    <WizardField
                      key={field.key}
                      field={field}
                      value={values[field.key] ?? ""}
                      onChange={(val) => handleFieldChange(field.key, val)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step: Done */}
            {step.id === "done" && (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-muted-foreground">
                  Your CodeCrow instance is configured and ready to go. You can
                  now create workspaces, connect repositories, and start
                  reviewing code.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button variant="outline" onClick={goToAdmin}>
                    Site Administration
                  </Button>
                  <Button onClick={goToDashboard}>
                    <Rocket className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          {/* Navigation buttons */}
          {step.id !== "done" && (
            <div className="flex justify-between p-6 pt-0">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {step.id === "welcome" ? (
                <Button onClick={() => setCurrentStep((s) => s + 1)}>
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSaveAndNext} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save & Continue
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Skip link */}
        {step.id !== "done" && step.id !== "welcome" && (
          <p className="text-center mt-4">
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Skip this step
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field renderer (simplified for wizard)
// ---------------------------------------------------------------------------
function WizardField({
  field,
  value,
  onChange,
}: {
  field: SettingsFieldMeta;
  value: string;
  onChange: (val: string) => void;
}) {
  switch (field.type) {
    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <div>
            <Label>{field.label}</Label>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) => onChange(String(checked))}
          />
        </div>
      );
    case "select":
      return (
        <div className="space-y-2">
          <Label>{field.label}</Label>
          <Select value={value || undefined} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );
    case "password":
      return (
        <div className="space-y-2">
          <Label>{field.label}</Label>
          <Input
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            autoComplete="off"
          />
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );
    default:
      return (
        <div className="space-y-2">
          <Label>{field.label}</Label>
          <Input
            type={field.type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );
  }
}
