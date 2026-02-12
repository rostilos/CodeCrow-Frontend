import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopNavigation } from "@/components/TopNavigation";
import {
  Globe,
  GitBranch,
  Brain,
  Database,
  Mail,
  Chrome,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  Download,
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSiteAdmin } from "@/hooks/useSiteAdmin";
import { adminSettingsService } from "@/api_service/admin/adminSettingsService";
import type {
  ConfigurationStatus,
  SettingsMap,
  SiteSettingsGroup,
} from "@/api_service/admin/adminSettings.interface";
import { SETTINGS_GROUPS } from "@/config/settingsGroups";
import type {
  SettingsGroupMeta,
  SettingsFieldMeta,
} from "@/api_service/admin/adminSettings.interface";

/** Map icon name strings to Lucide components */
const ICON_MAP: Record<string, React.ElementType> = {
  Globe,
  GitBranch,
  Github: GitBranch,
  Gitlab: GitBranch,
  Brain,
  Database,
  Mail,
  Chrome,
  Settings,
  Shield,
};

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSiteAdmin } = useSiteAdmin();
  const { toast } = useToast();

  const [status, setStatus] = useState<ConfigurationStatus | null>(null);
  const [activeGroup, setActiveGroup] = useState<SiteSettingsGroup>(
    (searchParams.get("tab") as SiteSettingsGroup) || "BASE_URLS",
  );
  const [values, setValues] = useState<SettingsMap>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groupLoading, setGroupLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Permission guard
  useEffect(() => {
    if (!isSiteAdmin) {
      toast({
        title: "Access Denied",
        description: "You need Site Admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/workspace");
    }
  }, [isSiteAdmin]);

  // Fetch configuration status
  useEffect(() => {
    adminSettingsService
      .getConfigurationStatus()
      .then(setStatus)
      .catch((err) => {
        console.error("Failed to fetch configuration status:", err);
        toast({
          title: "Error",
          description: "Failed to load configuration status.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch group settings when tab changes
  useEffect(() => {
    setGroupLoading(true);
    adminSettingsService
      .getSettingsGroup(activeGroup)
      .then(setValues)
      .catch((err) => {
        console.error(`Failed to fetch settings for ${activeGroup}:`, err);
        setValues({});
      })
      .finally(() => setGroupLoading(false));
  }, [activeGroup]);

  const handleTabChange = (group: SiteSettingsGroup) => {
    setActiveGroup(group);
    setSearchParams({ tab: group });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await adminSettingsService.updateSettingsGroup(
        activeGroup,
        values,
      );
      setValues(updated);

      // Refresh status
      const newStatus = await adminSettingsService.getConfigurationStatus();
      setStatus(newStatus);

      toast({
        title: "Settings saved",
        description: `${getGroupMeta(activeGroup)?.label ?? activeGroup} settings updated successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Save failed",
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

  const handleDownloadKey = async () => {
    setDownloading(true);
    try {
      const blob = await adminSettingsService.downloadPrivateKey();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "github-app-private-key.pem";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Download started",
        description: "Private key file downloaded successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err.message || "Failed to download private key.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getGroupMeta = (key: string): SettingsGroupMeta | undefined =>
    SETTINGS_GROUPS.find((g) => g.key === key);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groupMeta = getGroupMeta(activeGroup);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNavigation />
      <div className="container p-6 max-w-6xl flex-1">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Site Administration
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure VCS credentials, AI providers, email, and other
            instance-wide settings.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar navigation */}
          <nav className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-20 space-y-1 bg-card rounded-lg border p-2">
              {SETTINGS_GROUPS.map((group) => {
                const Icon = ICON_MAP[group.icon] || Settings;
                const configured = status?.groups?.[group.key] ?? false;
                const isActive = activeGroup === group.key;

                return (
                  <button
                    key={group.key}
                    onClick={() => handleTabChange(group.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{group.label}</span>
                    {configured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {groupMeta && (
                    <>
                      {(() => {
                        const Icon = ICON_MAP[groupMeta.icon] || Settings;
                        return <Icon className="h-5 w-5" />;
                      })()}
                      {groupMeta.label}
                    </>
                  )}
                </CardTitle>
                <CardDescription>{groupMeta?.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {groupLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupMeta?.fields.map((field) => (
                      <div key={field.key}>
                        <SettingsField
                          field={field}
                          value={values[field.key] ?? ""}
                          onChange={(val) => handleFieldChange(field.key, val)}
                        />
                        {field.key === "private-key-path" &&
                          activeGroup === "VCS_GITHUB" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={handleDownloadKey}
                              disabled={
                                downloading ||
                                !values["private-key-path"] ||
                                values["private-key-path"].includes("••••")
                              }
                            >
                              {downloading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              Download Key File
                            </Button>
                          )}
                      </div>
                    ))}

                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Settings
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field renderer
// ---------------------------------------------------------------------------

function SettingsField({
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
          <div className="space-y-0.5">
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
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
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

    case "number":
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="text"
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
