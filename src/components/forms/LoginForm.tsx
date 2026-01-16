import React, { useState, useEffect } from "react";
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
  email: z.string().email("Proszę podać poprawny adres e-mail."),
  password: z.string().min(1, "Hasło jest wymagane."),
});

type LoginFormViewModel = z.infer<typeof LoginSchema>;

export default function LoginForm() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

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
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock authentication
      if (data.email === "test@example.com" && data.password === "password") {
        toast.success("Zalogowano pomyślnie!");
        setRedirectTo("/generate"); // Set state to trigger navigation via useEffect
      } else {
        form.setError("root", {
          type: "manual",
          message: "Nieprawidłowy e-mail lub hasło.",
        });
      }
    } catch (error) {
      console.error("Login form submission error:", error);
      form.setError("root", {
        type: "manual",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
      });
    }
  }

  useEffect(() => {
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  }, [redirectTo]);

  return (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>Zaloguj się na swoje konto, aby uzyskać dostęp do fiszek.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="test@example.com" {...field} disabled={isSubmitting} />
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
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && <FormMessage>{form.formState.errors.root.message}</FormMessage>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zaloguj się
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full">
          Nie masz konta?{" "}
          <a href="/register" className="text-blue-600 hover:underline" aria-disabled={isSubmitting}>
            Zarejestruj się
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
