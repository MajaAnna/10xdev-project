import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormViewModel = z.infer<typeof LoginSchema>;

export default function LoginForm() {
  const form = useForm<LoginFormViewModel>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  async function onSubmit(data: LoginFormViewModel) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Logged in successfully!");
        // Reload the page so the server-side middleware can pick up the new session cookie
        // and redirect the user to the appropriate page (e.g., /cards).
        window.location.reload();
      } else {
        const errorData = await response.json();
        form.setError("root", {
          type: "manual",
          message: errorData.error || "An unexpected error occurred. Please try again.",
        });
      }
    } catch (error) {
      console.error("Login form submission error:", error);
      form.setError("root", {
        type: "manual",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  }

  return (
    <Card className="w-[380px]" data-testid="login-form">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Log in to your account to access your flashcards.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="test@example.com"
                      {...field}
                      disabled={isSubmitting}
                      data-testid="login-email-input"
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
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isSubmitting}
                      data-testid="login-password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <FormMessage data-testid="login-error-message">{form.formState.errors.root.message}</FormMessage>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="login-submit-button">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full">
          Don&apos;t have an account?{" "}
          <a
            href="/auth/register"
            className="text-blue-600 hover:underline"
            aria-disabled={isSubmitting}
            data-testid="login-register-link"
          >
            Register
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
