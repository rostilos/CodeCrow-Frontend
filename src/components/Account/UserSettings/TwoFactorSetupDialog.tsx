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
import { Smartphone, Mail, Loader2, Copy, Check } from "lucide-react";
import { twoFactorService } from "@/api_service/auth/twoFactorService.ts";
import { TwoFactorSetupResponse } from "@/api_service/auth/twoFactorService.interface.ts";
import { toast } from "sonner";

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'TOTP' | 'EMAIL';
  onSetupComplete: (backupCodes: string[]) => void;
}

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
  type,
  onSetupComplete,
}: TwoFactorSetupDialogProps) {
  const [step, setStep] = useState<'init' | 'verify'>('init');
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('init');
      setSetupData(null);
      setVerificationCode("");
      initializeSetup();
    }
  }, [open, type]);

  const initializeSetup = async () => {
    setLoading(true);
    try {
      const response = await twoFactorService.initializeSetup({ type });
      setSetupData(response);
      setStep('verify');
      if (type === 'EMAIL') {
        toast.success("Verification code sent to your email");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize 2FA setup");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const response = await twoFactorService.verifyAndEnable({ code: verificationCode });
      toast.success("Two-factor authentication enabled!");
      onSetupComplete(response.backupCodes);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (setupData?.secretKey) {
      await navigator.clipboard.writeText(setupData.secretKey);
      setCopiedSecret(true);
      toast.success("Secret key copied to clipboard");
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleResendCode = async () => {
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
          <DialogTitle className="flex items-center gap-2">
            {type === 'TOTP' ? (
              <Smartphone className="h-5 w-5" />
            ) : (
              <Mail className="h-5 w-5" />
            )}
            Set up {type === 'TOTP' ? 'Authenticator App' : 'Email'} Verification
          </DialogTitle>
          <DialogDescription>
            {type === 'TOTP'
              ? 'Scan the QR code with your authenticator app'
              : 'We sent a verification code to your email'}
          </DialogDescription>
        </DialogHeader>

        {loading && step === 'init' ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {type === 'TOTP' && setupData?.qrCodeUrl && (
              <>
                {/* QR Code */}
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img
                    src={setupData.qrCodeUrl}
                    alt="QR Code for authenticator app"
                    className="w-48 h-48"
                  />
                </div>

                {/* Manual Entry */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Can't scan? Enter this key manually:
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                      {setupData.secretKey}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {type === 'EMAIL' && (
              <div className="text-center py-4">
                <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                  Check your email inbox for the verification code.
                  The code expires in 10 minutes.
                </p>
                <Button
                  variant="link"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="mt-2"
                >
                  Didn't receive the code? Resend
                </Button>
              </div>
            )}

            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label>Enter verification code</Label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                autoFocus
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Enable'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
