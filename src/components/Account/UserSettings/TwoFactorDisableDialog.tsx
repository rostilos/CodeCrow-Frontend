import { useState } from "react";
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
import { AlertTriangle, Loader2 } from "lucide-react";
import { twoFactorService } from "@/api_service/auth/twoFactorService.ts";
import { toast } from "sonner";

interface TwoFactorDisableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  twoFactorType: string;
  onDisableComplete: () => void;
}

export function TwoFactorDisableDialog({
  open,
  onOpenChange,
  twoFactorType,
  onDisableComplete,
}: TwoFactorDisableDialogProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDisable = async () => {
    if (!verificationCode) {
      toast.error("Please enter your verification code");
      return;
    }

    setLoading(true);
    try {
      await twoFactorService.disable({ code: verificationCode });
      toast.success("Two-factor authentication disabled");
      onDisableComplete();
      onOpenChange(false);
      setVerificationCode("");
    } catch (error: any) {
      toast.error(error.message || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (twoFactorType !== 'EMAIL') return;
    
    setLoading(true);
    try {
      await twoFactorService.resendEmailCode();
      toast.success("New verification code sent");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            This will make your account less secure. Are you sure you want to continue?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Warning: Disabling 2FA removes an important security layer from your account.
              Anyone with your password will be able to access your account.
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Enter your {twoFactorType === 'TOTP' ? 'authenticator' : 'email'} code or backup code
            </Label>
            <Input
              type="text"
              placeholder="Enter code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^A-Za-z0-9-]/g, '').slice(0, 10))}
              className="text-center text-lg tracking-widest font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              You can use a backup code if you don't have access to your {twoFactorType === 'TOTP' ? 'authenticator app' : 'email'}
            </p>
          </div>

          {twoFactorType === 'EMAIL' && (
            <Button
              variant="link"
              onClick={handleResendCode}
              disabled={loading}
              className="p-0 h-auto"
            >
              Send verification code to email
            </Button>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={loading || !verificationCode}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disabling...
              </>
            ) : (
              'Disable 2FA'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
