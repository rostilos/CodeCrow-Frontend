import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Smartphone, Mail, Loader2, Key } from "lucide-react";
import { twoFactorService } from "@/api_service/auth/twoFactorService.ts";
import { TwoFactorRequiredResponse } from "@/api_service/auth/twoFactorService.interface.ts";
import { toast } from "sonner";

interface TwoFactorLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  twoFactorData: TwoFactorRequiredResponse | null;
  onSuccess: (token: string, user: any) => void;
  onCancel: () => void;
}

export function TwoFactorLoginDialog({
  open,
  onOpenChange,
  twoFactorData,
  onSuccess,
  onCancel,
}: TwoFactorLoginDialogProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  useEffect(() => {
    if (open) {
      setVerificationCode("");
      setUseBackupCode(false);
    }
  }, [open]);

  const handleVerify = async () => {
    if (!verificationCode || !twoFactorData) {
      toast.error("Please enter your verification code");
      return;
    }

    setLoading(true);
    try {
      const response = await twoFactorService.verifyLogin({
        tempToken: twoFactorData.tempToken,
        code: verificationCode,
      });
      
      // Construct user object from flat response
      const user = {
        id: response.id,
        email: response.email,
        username: response.username,
        avatarUrl: response.avatarUrl,
      };
      
      onSuccess(response.accessToken, user);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!twoFactorData || twoFactorData.twoFactorType !== 'EMAIL') return;

    setLoading(true);
    try {
      await twoFactorService.resendLoginCode(twoFactorData.tempToken);
      toast.success("New verification code sent to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
    setVerificationCode("");
  };

  const isTotp = twoFactorData?.twoFactorType === 'TOTP';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleCancel();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isTotp ? (
              <Smartphone className="h-5 w-5 text-primary" />
            ) : (
              <Mail className="h-5 w-5 text-primary" />
            )}
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {useBackupCode
              ? 'Enter one of your backup codes'
              : isTotp
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Enter the verification code sent to your email'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center py-4">
            {useBackupCode ? (
              <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Key className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            ) : isTotp ? (
              <div className="p-4 rounded-full bg-primary/10">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
            ) : (
              <div className="p-4 rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>

          {/* Code Input */}
          <div className="space-y-2">
            <Label>{useBackupCode ? 'Backup Code' : 'Verification Code'}</Label>
            <Input
              type="text"
              placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
              value={verificationCode}
              onChange={(e) => {
                if (useBackupCode) {
                  setVerificationCode(e.target.value.toUpperCase().slice(0, 10));
                } else {
                  setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                }
              }}
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={useBackupCode ? 10 : 6}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && verificationCode) {
                  handleVerify();
                }
              }}
            />
          </div>

          {/* Toggle between code types */}
          <div className="flex flex-col items-center gap-2 text-sm">
            {!isTotp && !useBackupCode && (
              <Button
                variant="link"
                onClick={handleResendCode}
                disabled={loading}
                className="h-auto p-0"
              >
                Didn't receive the code? Resend
              </Button>
            )}
            <Button
              variant="link"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setVerificationCode("");
              }}
              className="h-auto p-0 text-muted-foreground"
            >
              {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading || !verificationCode}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TwoFactorLoginDialog;
