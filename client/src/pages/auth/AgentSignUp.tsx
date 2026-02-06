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

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function AgentSignUp() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: "agent" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign up failed");
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
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
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">Agent Sign Up</h1>
          <p className="text-muted-foreground">Create your event management account</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="/auth/agent/signin" className="text-primary hover:underline font-medium">
                  Sign In
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
