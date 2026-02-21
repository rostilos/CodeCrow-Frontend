import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { User, Shield, Globe, Settings, Palette } from "lucide-react";
import ProfileInformation from "@/components/Account/UserSettings/ProfileInformation.tsx";
import TwoFactorSettings from "@/components/Account/UserSettings/TwoFactorSettings.tsx";
import { useTheme } from "@/components/ThemeProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { passwordService } from "@/api_service/user/passwordService";
import { toast } from "sonner";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(40, "Password must be less than 40 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const navItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "account", label: "Account", icon: Globe },
];

export default function UserSettings() {
  const { theme, setTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get("tab") || "profile";

  const handleNavClick = (tabId: string) => {
    navigate(`?tab=${tabId}`);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    try {
      await passwordService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success("Password updated successfully");
      reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfileInformation />

            {/* Preferences Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Preferences</span>
                </CardTitle>
                <CardDescription>
                  Customize your CodeCrow experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Use dark theme interface
                      </p>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) =>
                        setTheme(checked ? "dark" : "light")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between opacity-50 pointer-events-none">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between opacity-50 pointer-events-none">
                    <div className="space-y-0.5">
                      <Label>Auto-save Settings</Label>
                      <p className="text-sm text-muted-foreground">
                        Save changes automatically
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 opacity-50 pointer-events-none">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" placeholder="UTC-8 (Pacific Time)" />
                </div>

                <Button className="w-full opacity-50 pointer-events-none">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case "security":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Password</span>
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit(onPasswordSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <PasswordInput
                      id="currentPassword"
                      placeholder="Enter current password"
                      {...register("currentPassword")}
                    />
                    {errors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <PasswordInput
                      id="newPassword"
                      placeholder="Enter new password"
                      {...register("newPassword")}
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-destructive">
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <PasswordInput
                      id="confirmPassword"
                      placeholder="Confirm new password"
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* 2FA Card */}
            <TwoFactorSettings />
          </div>
        );
      case "account":
        return (
          <Card className="opacity-50 pointer-events-none max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Account Status</span>
              </CardTitle>
              <CardDescription>
                Your account information and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Account Type</Label>
                  <Badge variant="secondary">Pro</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <Badge className="bg-success text-success-foreground">
                    Active
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Member Since</Label>
                  <span className="text-sm text-muted-foreground">
                    January 2024
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <Label>API Usage</Label>
                  <span className="text-sm text-muted-foreground">
                    87 / 1000 requests
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  Export Account Data
                </Button>

                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };
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
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    User Settings
                  </h1>
                  <p className="text-base text-muted-foreground font-medium mt-1">
                    Manage your profile, security, and account preferences
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side Navigation */}
            <nav className="lg:w-64 shrink-0">
              <div className="lg:sticky lg:top-6 space-y-1 bg-card rounded-lg border p-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 min-w-0">{renderContent()}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
