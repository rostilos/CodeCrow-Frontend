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
import { Code, Loader2 } from "lucide-react";
import { authService } from "@/api_service/auth/authService.ts";
import { authUtils } from "@/lib/auth";

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
      // Check for intended destination first, then saved workspace
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

      // Check for intended destination first, then saved workspace, then default to workspace selection
      const intendedDestination = localStorage.getItem('intendedDestination');
      if (intendedDestination) {
        localStorage.removeItem('intendedDestination'); // Clear after use
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-primary hover:text-primary/80">
            <Code className="h-8 w-8" />
            <span>CodeCrow</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your CodeCrow account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="WildHorse"
                          type="text"
                          autoComplete="username"
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
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  variant="gradient"
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
      </div>
    </div>
  );
}