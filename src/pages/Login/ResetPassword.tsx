import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Shield, KeyRound } from "lucide-react";
import { authService } from "@/api_service/auth/authService.ts";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp.tsx";
import { ValidateResetTokenResponse } from "@/api_service/auth/authService.interface.ts";

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  confirmPassword: z.string(),
  twoFactorCode: z.string().optional(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<ValidateResetTokenResponse | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
      twoFactorCode: "",
    },
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setTokenValidation({ valid: false, twoFactorRequired: false });
        return;
      }

      try {
        const result = await authService.validateResetToken({ token });
        setTokenValidation(result);
      } catch (error) {
        setTokenValidation({ valid: false, twoFactorRequired: false });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsSubmitting(true);
    try {
      await authService.resetPassword({
        token,
        newPassword: data.newPassword,
        twoFactorCode: tokenValidation?.twoFactorRequired ? data.twoFactorCode : undefined,
      });

      setIsSuccess(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been changed. You can now log in with your new password.",
      });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Unable to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!tokenValidation?.valid) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Left side - branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-muted/30 items-center justify-center p-12">
          <div className="max-w-md">
            <div className="mb-8">
              <Link to="/">
                <CodeCrowLogo size="lg" />
              </Link>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Link Expired
            </h2>
            <p className="text-muted-foreground text-lg">
              Password reset links are only valid for 1 hour for security reasons.
            </p>
          </div>
        </div>

        {/* Right side - error message */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex">
                <CodeCrowLogo size="md" />
              </Link>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader className="space-y-1 pb-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Invalid or Expired Link</CardTitle>
                <CardDescription className="text-base">
                  This password reset link is no longer valid. This could happen if:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                  <li>The link has expired (valid for 1 hour)</li>
                  <li>The link has already been used</li>
                  <li>The link was copied incorrectly</li>
                </ul>
                
                <div className="pt-4 space-y-3">
                  <Link to="/forgot-password" className="block">
                    <Button className="w-full">
                      Request a new reset link
                    </Button>
                  </Link>
                  
                  <Link to="/login" className="block">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Left side - branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-muted/30 items-center justify-center p-12">
          <div className="max-w-md">
            <div className="mb-8">
              <Link to="/">
                <CodeCrowLogo size="lg" />
              </Link>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Password Changed!
            </h2>
            <p className="text-muted-foreground text-lg">
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
          </div>
        </div>

        {/* Right side - success message */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex">
                <CodeCrowLogo size="md" />
              </Link>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader className="space-y-1 pb-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Password Reset Complete</CardTitle>
                <CardDescription className="text-base">
                  Your password has been successfully changed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  You can now log in to your account with your new password.
                </p>
                
                <div className="pt-4">
                  <Link to="/login" className="block">
                    <Button className="w-full">
                      <KeyRound className="mr-2 h-4 w-4" />
                      Go to login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main reset form
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted/30 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="mb-8">
            <Link to="/">
              <CodeCrowLogo size="lg" />
            </Link>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Create New Password
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose a strong password to protect your account.
          </p>
          {tokenValidation.maskedEmail && (
            <p className="text-muted-foreground mt-4">
              Resetting password for: <span className="font-medium">{tokenValidation.maskedEmail}</span>
            </p>
          )}
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex">
              <CodeCrowLogo size="md" />
            </Link>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
              <CardDescription>
                {tokenValidation.maskedEmail && (
                  <span>Account: {tokenValidation.maskedEmail}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Enter new password"
                            autoComplete="new-password"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 2FA Code Input */}
                  {tokenValidation.twoFactorRequired && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>Two-factor authentication required</span>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="twoFactorCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {tokenValidation.twoFactorType === 'TOTP' 
                                ? 'Authenticator code' 
                                : 'Email verification code'}
                            </FormLabel>
                            <FormControl>
                              <div className="flex justify-center">
                                <InputOTP
                                  maxLength={6}
                                  value={field.value}
                                  onChange={field.onChange}
                                >
                                  <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                  </InputOTPGroup>
                                </InputOTP>
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground text-center">
                              {tokenValidation.twoFactorType === 'TOTP'
                                ? 'Enter the 6-digit code from your authenticator app'
                                : 'Enter the 6-digit code sent to your email'}
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset password
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Your password should be at least 8 characters and include a mix of letters, numbers, and symbols.
          </p>
        </div>
      </div>
    </div>
  );
}
