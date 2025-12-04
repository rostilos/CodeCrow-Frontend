import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Shield, Smartphone, Mail, Key, AlertTriangle, CheckCircle2, Copy, RefreshCw } from "lucide-react";
import { twoFactorService } from "@/api_service/auth/twoFactorService.ts";
import { TwoFactorStatusResponse } from "@/api_service/auth/twoFactorService.interface.ts";
import { toast } from "sonner";
import { TwoFactorSetupDialog } from "./TwoFactorSetupDialog";
import { TwoFactorDisableDialog } from "./TwoFactorDisableDialog";
import { BackupCodesDialog } from "./BackupCodesDialog";

export default function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupType, setSetupType] = useState<'TOTP' | 'EMAIL'>('TOTP');
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [backupCodesDialogOpen, setBackupCodesDialogOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await twoFactorService.getStatus();
      setStatus(response);
    } catch (error: any) {
      toast.error("Failed to load 2FA status");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupClick = (type: 'TOTP' | 'EMAIL') => {
    setSetupType(type);
    setSetupDialogOpen(true);
  };

  const handleSetupComplete = (codes: string[]) => {
    setBackupCodes(codes);
    setBackupCodesDialogOpen(true);
    fetchStatus();
  };

  const handleDisableComplete = () => {
    fetchStatus();
  };

  const handleRegenerateBackupCodes = async (code: string) => {
    try {
      const response = await twoFactorService.regenerateBackupCodes({ code });
      setBackupCodes(response.backupCodes);
      setBackupCodesDialogOpen(true);
      toast.success("Backup codes regenerated successfully");
      fetchStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate backup codes");
      throw error;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Two-Factor Authentication</span>
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {status?.enabled ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">2FA is enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Using {status.type === 'TOTP' ? 'Google Authenticator' : 'Email verification'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">2FA is not enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Your account is less secure without 2FA
                    </p>
                  </div>
                </>
              )}
            </div>
            <Badge variant={status?.enabled ? "default" : "secondary"}>
              {status?.enabled ? "Active" : "Inactive"}
            </Badge>
          </div>

          {status?.enabled ? (
            /* Enabled State */
            <div className="space-y-4">
              {/* Current Method */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {status.type === 'TOTP' ? (
                    <Smartphone className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {status.type === 'TOTP' ? 'Authenticator App' : 'Email'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {status.type === 'TOTP'
                    ? 'Using Google Authenticator or similar app to generate codes'
                    : 'Verification codes are sent to your email address'}
                </p>
              </div>

              {/* Backup Codes Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span className="font-medium">Backup Codes</span>
                  </div>
                  <Badge variant={status.remainingBackupCodes > 3 ? "outline" : "destructive"}>
                    {status.remainingBackupCodes} remaining
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Backup codes can be used if you lose access to your authentication method
                </p>
                {status.remainingBackupCodes <= 3 && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Consider regenerating your backup codes
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <TwoFactorDisableDialog
                  open={disableDialogOpen}
                  onOpenChange={setDisableDialogOpen}
                  twoFactorType={status.type || 'TOTP'}
                  onDisableComplete={handleDisableComplete}
                />
                <Button
                  variant="outline"
                  onClick={() => setDisableDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Disable 2FA
                </Button>
                <RegenerateBackupCodesButton
                  twoFactorType={status.type || 'TOTP'}
                  onRegenerate={handleRegenerateBackupCodes}
                />
              </div>
            </div>
          ) : (
            /* Disabled State - Setup Options */
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose your preferred authentication method:
              </p>

              {/* TOTP Option */}
              <div
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleSetupClick('TOTP')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Authenticator App</p>
                      <p className="text-sm text-muted-foreground">
                        Use Google Authenticator, Authy, or similar app
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Recommended</Badge>
                </div>
              </div>

              {/* Email Option */}
              <div
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleSetupClick('EMAIL')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      Receive verification codes via email
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TwoFactorSetupDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        type={setupType}
        onSetupComplete={handleSetupComplete}
      />
      <BackupCodesDialog
        open={backupCodesDialogOpen}
        onOpenChange={setBackupCodesDialogOpen}
        backupCodes={backupCodes}
      />
    </>
  );
}

// Regenerate Backup Codes Button Component
function RegenerateBackupCodesButton({
  twoFactorType,
  onRegenerate,
}: {
  twoFactorType: string;
  onRegenerate: (code: string) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    if (!code) {
      toast.error("Please enter your verification code");
      return;
    }
    
    setLoading(true);
    try {
      await onRegenerate(code);
      setDialogOpen(false);
      setCode("");
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Regenerate Backup Codes
      </Button>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Regenerate Backup Codes</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your {twoFactorType === 'TOTP' ? 'authenticator' : 'email'} code to generate new backup codes.
              This will invalidate your existing backup codes.
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 border rounded-md mb-4 text-center text-lg tracking-widest"
              maxLength={6}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRegenerate} disabled={loading || code.length !== 6}>
                {loading ? "Regenerating..." : "Regenerate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
