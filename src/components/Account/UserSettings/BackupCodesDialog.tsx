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
import { Key, Copy, Check, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface BackupCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupCodes: string[];
}

export function BackupCodesDialog({
  open,
  onOpenChange,
  backupCodes,
}: BackupCodesDialogProps) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleCopyAll = async () => {
    const codesText = backupCodes.join('\n');
    await navigator.clipboard.writeText(codesText);
    setCopied(true);
    toast.success("Backup codes copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const codesText = [
      "CodeCrow Backup Codes",
      "=====================",
      "",
      "Keep these codes in a safe place. Each code can only be used once.",
      "",
      ...backupCodes.map((code, i) => `${i + 1}. ${code}`),
      "",
      `Generated: ${new Date().toISOString()}`,
    ].join('\n');

    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codecrow-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded");
  };

  const handleClose = () => {
    if (!acknowledged) {
      toast.warning("Please acknowledge that you've saved your backup codes");
      return;
    }
    onOpenChange(false);
    setAcknowledged(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !acknowledged) {
        toast.warning("Please save your backup codes before closing");
        return;
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Save Your Backup Codes
          </DialogTitle>
          <DialogDescription>
            These codes can be used to access your account if you lose your device
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Important</p>
                <p className="mt-1">
                  Each code can only be used once. Store them securely, like in a password manager.
                  You won't be able to see these codes again.
                </p>
              </div>
            </div>
          </div>

          {/* Backup Codes Grid */}
          <div className="grid grid-cols-2 gap-2 p-4 bg-muted/50 rounded-lg">
            {backupCodes.map((code, index) => (
              <code
                key={index}
                className="p-2 bg-background rounded text-center font-mono text-sm border"
              >
                {code}
              </code>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopyAll}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          {/* Acknowledgment */}
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              I have saved these backup codes in a secure location
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} disabled={!acknowledged}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
