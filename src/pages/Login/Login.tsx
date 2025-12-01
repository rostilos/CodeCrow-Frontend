import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2 } from "lucide-react";
import { authService } from "@/api_service/auth/authService.ts";
import { authUtils } from "@/lib/auth";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

const loginSchema = z.object({
  username: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      const intendedDestination = localStorage.getItem('intendedDestination');
      if (intendedDestination) {
        localStorage.removeItem('intendedDestination');
        navigate(intendedDestination);
      } else {
        const savedWorkspaceSlug = localStorage.getItem('currentWorkspaceSlug');
        if (savedWorkspaceSlug) {
          navigate("/dashboard/projects");
        } else {
          navigate("/workspace");
        }
      }
    }
  }, [navigate]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await authService.login(data as { username: string; password: string });

      toast({
        title: "Login successful",
        description: "Welcome to CodeCrow!",
      });

      const intendedDestination = localStorage.getItem('intendedDestination');
      if (intendedDestination) {
        localStorage.removeItem('intendedDestination');
        navigate(intendedDestination);
      } else {
        const savedWorkspaceSlug = localStorage.getItem('currentWorkspaceSlug');
        if (savedWorkspaceSlug) {
          navigate("/dashboard/projects");
        } else {
          navigate("/workspace");
        }
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            AI-Powered Code Review for Modern Teams
          </h2>
          <p className="text-muted-foreground text-lg">
            Get intelligent analysis, security insights, and actionable fixes on every pull request.
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
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your username"
                            type="text"
                            autoComplete="username"
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="Enter your password"
                            autoComplete="current-password"
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
                    Sign In
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}