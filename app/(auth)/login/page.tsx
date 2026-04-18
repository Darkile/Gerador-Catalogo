"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres."),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginSchema) {
    setErrorMessage(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/upload");
    router.refresh();
  }

  return (
    <div className="catalog-shell flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md border-neutral-300">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Operação Interna</p>
          <CardTitle className="text-2xl">Acesso ao Gerador</CardTitle>
          <CardDescription>Entrar com usuário Supabase autorizado para editar e gerar catálogos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-red-700">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="text-xs text-red-700">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Spinner className="mr-2" /> : null}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
