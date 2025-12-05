import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { authService } from "@/api_service/auth/authService.ts";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { toast } = useToast();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email: data.email });
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (error: any) {
      // Still show success message for security (don't reveal if email exists)
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
              Check Your Email
            </h2>
            <p className="text-muted-foreground text-lg">
              We've sent password reset instructions to your email if an account exists.
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
                <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                <CardDescription className="text-base">
                  We've sent a password reset link to
                </CardDescription>
                <p className="font-medium text-foreground">{submittedEmail}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  If an account exists with this email, you'll receive instructions to reset your password. 
                  The link will expire in 1 hour.
                </p>
                
                <div className="pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsSubmitted(false);
                      form.reset();
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Try a different email
                  </Button>
                  
                  <Link to="/login" className="block">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            Forgot your password?
          </h2>
          <p className="text-muted-foreground text-lg">
            No worries! Enter your email and we'll send you a reset link.
          </p>
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
              <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email"
                            type="email"
                            autoComplete="email"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send reset link
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
        </div>
      </div>
    </div>
  );
}
