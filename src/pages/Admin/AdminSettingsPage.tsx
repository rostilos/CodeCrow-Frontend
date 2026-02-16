import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Globe,
  GitBranch,
  Brain,
  Mail,
  Chrome,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  Download,
  Upload,
  LogOut,
  ArrowLeft,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authUtils } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
  const [activeGroup, setActiveGroup] = useState<string>(
    searchParams.get("tab") || "BASE_URLS",
  );
  const [values, setValues] = useState<SettingsMap>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groupLoading, setGroupLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!activeGroup) return;
    setGroupLoading(true);
    adminSettingsService
      .getSettingsGroup(activeGroup as SiteSettingsGroup)
      .then(setValues)
      .catch((err) => {
        console.error(`Failed to fetch settings for ${activeGroup}:`, err);
        setValues({});
      })
      .finally(() => setGroupLoading(false));
  }, [activeGroup]);

  const handleTabChange = (group: string) => {
    setActiveGroup(group);
    setSearchParams({ tab: group });
  };

  const handleSave = async () => {
    if (!activeGroup) return;
    setSaving(true);
    try {
      const updated = await adminSettingsService.updateSettingsGroup(
        activeGroup as SiteSettingsGroup,
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

  const handleUploadKey = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pem")) {
      toast({
        title: "Invalid file",
        description: "Only .pem files are allowed.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const result = await adminSettingsService.uploadPrivateKey(file);
      handleFieldChange("private-key-path", result.path);
      toast({
        title: "Key uploaded",
        description:
          "Private key file uploaded successfully. Remember to save settings.",
      });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload private key.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  const user = authUtils.getUser();

  const handleLogout = () => {
    authUtils.logout();
    navigate("/");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of CodeCrow.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin header — self-contained, no workspace context needed */}
      <header className="sticky top-0 z-50 h-14 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 lg:px-6 h-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/workspace")}
              className="flex items-center hover:opacity-80 transition-opacity gap-2"
            >
              <CodeCrowLogo size="sm" />
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Shield className="h-4 w-4" />
              Site Administration
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-muted-foreground"
              onClick={() => navigate("/workspace")}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to App
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={user?.avatarUrl}
                      alt={user?.username}
                      referrerPolicy="no-referrer"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {user?.username
                        ? user.username.substring(0, 2).toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-sm font-medium">
                    {user?.username
                      ? user.username.charAt(0).toUpperCase() +
                        user.username.slice(1)
                      : "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {user?.username
                      ? user.username.charAt(0).toUpperCase() +
                        user.username.slice(1)
                      : "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container px-4 lg:px-6 py-6 flex-1 max-w-6xl">
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
          {/* Left Side Navigation */}
          <nav className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-20 space-y-1 bg-card rounded-lg border p-2">
              {SETTINGS_GROUPS.map((group) => {
                const Icon = ICON_MAP[group.icon] || Settings;
                const configured = status?.groups?.[group.key] ?? false;
                const isActive = activeGroup === group.key;

                return (
                  <button
                    key={group.key}
                    onClick={() => handleTabChange(group.key)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{group.label}</span>
                    {configured ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {groupLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeGroup ? (
              (() => {
                const group = getGroupMeta(activeGroup);
                if (!group) return null;
                return (
                  <div className="space-y-6">
                    {/* Group header */}
                    <div>
                      <h2 className="text-xl font-semibold">{group.label}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.description}
                      </p>
                    </div>

                    {group.instructions && (
                      <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">
                            {group.instructions}
                          </p>
                        </div>
                      </div>
                    )}

                    {group.fields.map((field) => (
                      <div key={field.key}>
                        <SettingsField
                          field={field}
                          value={values[field.key] ?? ""}
                          onChange={(val) => handleFieldChange(field.key, val)}
                        />
                        {field.key === "private-key-path" &&
                          group.key === "VCS_GITHUB" && (
                            <div className="flex items-center gap-2 mt-2">
                              {/* Hidden file input */}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pem"
                                className="hidden"
                                onChange={handleUploadKey}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                              >
                                {uploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                                )}
                                Upload Key File
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadKey}
                                disabled={
                                  downloading || !values["private-key-path"]
                                }
                              >
                                {downloading ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Download className="h-4 w-4 mr-2" />
                                )}
                                Download Key File
                              </Button>
                            </div>
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
                );
              })()
            ) : null}
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
