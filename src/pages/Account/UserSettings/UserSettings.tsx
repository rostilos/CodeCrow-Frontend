import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
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
import { useSearchParams } from "react-router-dom";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(40, "Password must be less than 40 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const TABS = {
  PROFILE: "profile",
  SECURITY: "security",
  ACCOUNT: "account",
} as const;

type TabValue = typeof TABS[keyof typeof TABS];

export default function UserSettings() {
  const { theme, setTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentTab = (searchParams.get("tab") as TabValue) || TABS.PROFILE;
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">User Settings</h1>
      </div>
      
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value={TABS.PROFILE} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value={TABS.SECURITY} className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value={TABS.ACCOUNT} className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab - includes Profile Info and Preferences */}
        <TabsContent value={TABS.PROFILE} className="mt-6">
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
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
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
                
                <Button className="w-full opacity-50 pointer-events-none">Save Preferences</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab - includes Password and 2FA */}
        <TabsContent value={TABS.SECURITY} className="mt-6">
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
                <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <PasswordInput 
                      id="currentPassword" 
                      placeholder="Enter current password"
                      {...register("currentPassword")}
                    />
                    {errors.currentPassword && (
                      <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
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
                      <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <PasswordInput 
                      id="confirmPassword" 
                      placeholder="Confirm new password"
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* 2FA Card */}
            <TwoFactorSettings />
          </div>
        </TabsContent>

        {/* Account Status Tab */}
        <TabsContent value={TABS.ACCOUNT} className="mt-6">
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
                  <Badge className="bg-success text-success-foreground">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Member Since</Label>
                  <span className="text-sm text-muted-foreground">January 2024</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>API Usage</Label>
                  <span className="text-sm text-muted-foreground">87 / 1000 requests</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}