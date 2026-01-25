import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const registerSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    if (redirectTo) {
      const timer = setTimeout(() => {
        window.location.href = redirectTo;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [redirectTo]);

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresConfirmation) {
          toast.success("Registration successful! Please check your email to confirm your account.");
          // Redirect to login page after a short delay to show the message
          setRedirectTo("/auth/login");
        } else {
          toast.success("Account created successfully!");
          // Reload the page so the server-side middleware can pick up the new session cookie
          // and redirect the user to the appropriate page (e.g., /cards).
          window.location.reload();
        }
      } else {
        form.setError("root", {
          type: "manual",
          message: data.error || "An unexpected error occurred. Please try again.",
        });
      }
    } catch {
      form.setError("root", {
        type: "manual",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <Card className="w-[380px]" data-testid="register-form">
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Enter your email and password to create a new account. You will receive a confirmation email to verify your
          account.
        </CardDescription>
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
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                      disabled={isSubmitting}
                      data-testid="register-email-input"
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
                      data-testid="register-password-input"
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
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isSubmitting}
                      data-testid="register-confirm-password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <FormMessage data-testid="register-error-message">{form.formState.errors.root.message}</FormMessage>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="register-submit-button">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="text-blue-600 hover:underline"
            aria-disabled={isSubmitting}
            data-testid="register-login-link"
          >
            Log in
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm;
