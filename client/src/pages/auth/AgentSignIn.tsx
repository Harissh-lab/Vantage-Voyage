import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useQueryClient } from "@tanstack/react-query";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function AgentSignIn() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, role: "agent" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign in failed");
      }

      const user = await response.json();
      
      // Update user data in cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">Agent Sign In</h1>
          <p className="text-muted-foreground">Access your event management dashboard</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="agent@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-red-500 text-center">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a href="/auth/agent/signup" className="text-primary hover:underline font-medium">
                  Sign Up
                </a>
              </div>
            </form>
          </Form>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to Home
          </a>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
