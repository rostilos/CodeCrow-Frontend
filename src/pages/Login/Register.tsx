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
import { Loader2, Shield, Zap, GitBranch } from "lucide-react";
import {authService} from "@/api_service/auth/authService.ts";
import { authUtils } from "@/lib/auth";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { GoogleSignInButtonCustom, GoogleCredentialResponse } from "@/components/GoogleSignInButton";

const registerSchema = z.object({
  username: z.string().min(2, "Userame must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      // Check if there's a saved workspace
      const savedWorkspaceSlug = localStorage.getItem('currentWorkspaceSlug');
      if (savedWorkspaceSlug) {
        navigate("/dashboard/projects");
      } else {
        navigate("/workspace");
      }
    }
  }, [navigate]);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      company: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const result = await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        company: data.company,
      });
      
      // Store JWT token if provided on registration
      if (result.accessToken) {
        localStorage.setItem('codecrow_token', result.accessToken);
        localStorage.setItem('codecrow_user', JSON.stringify(result.user || {}));
      }

      toast({
        title: "Registration successful",
        description: "Welcome to CodeCrow!",
      });

      // After registration, redirect to workspace selection
      navigate("/workspace");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: GoogleCredentialResponse) => {
    setIsGoogleLoading(true);
    try {
      const result = await authService.googleAuth({ credential: response.credential });

      // Store JWT token
      if (result.accessToken) {
        localStorage.setItem('codecrow_token', result.accessToken);
        localStorage.setItem('codecrow_user', JSON.stringify(result.user || {}));
      }

      toast({
        title: "Sign up successful",
        description: "Welcome to CodeCrow!",
      });

      // After registration, redirect to workspace selection
      navigate("/workspace");
    } catch (error: any) {
      toast({
        title: "Google sign up failed",
        description: error.message || "Unable to sign up with Google",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: Error) => {
    toast({
      title: "Google sign up failed",
      description: error.message || "Unable to sign up with Google",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-12 flex-col justify-between">
        <div>
          <Link to="/">
            <CodeCrowLogo size="lg" />
          </Link>
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Start Your Journey
            </h1>
            <p className="text-lg text-muted-foreground">
              Join the alpha and start getting AI-powered insights on your codebase today.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm">Secure authentication & data protection</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm">Get started in minutes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm">Connect your repositories instantly</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
        </p>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex">
              <CodeCrowLogo size="md" />
            </Link>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                Get started with CodeCrow today
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="johndoe"
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            type="email"
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
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your company name"
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
                            placeholder="••••••••"
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
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            autoComplete="new-password"
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
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </Form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign-Up */}
              <GoogleSignInButtonCustom
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                isLoading={isGoogleLoading}
                disabled={isLoading}
              >
                Sign up with Google
              </GoogleSignInButtonCustom>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
              
              <p className="mt-6 text-center text-xs text-muted-foreground">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}