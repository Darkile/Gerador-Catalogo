"use client";

import { useState } from "react";
import Link from "next/link";
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
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

const registerSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type RegisterSchema = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".gsap-stagger", {
      y: 30,
      opacity: 0,
      duration: 1.2,
      stagger: 0.1,
      ease: "power3.out",
    });
  }, { scope: containerRef });

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterSchema) {
    setErrorMessage(null);
    setSuccessMessage(null);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Cadastro realizado! Verifique seu e-mail para confirmar sua conta.");
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Lado Esquerdo - Imagem Institucional */}
      <div className="relative block w-full h-[45vh] lg:h-screen lg:w-1/2 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0">
          <img 
            className="gsap-stagger h-full w-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-[2000ms] lg:hover:scale-105"
            src="/gregory_editorial_login.png" 
            alt="Gregory Editorial" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white lg:from-transparent via-transparent to-transparent lg:bg-black/5" />
          <div className="absolute top-8 left-8 lg:top-12 lg:left-12 z-10">
            <h1 className="text-3xl lg:text-5xl tracking-[0.2em] font-serif text-[#8A0303] drop-shadow-md lg:text-white">GREGORY</h1>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div ref={containerRef} className="catalog-shell flex w-full lg:w-1/2 flex-col items-center justify-center -mt-12 lg:mt-0 px-6 pb-12 lg:p-24 z-20">
        <Card className="gsap-stagger w-full max-w-md border-transparent bg-white/80 backdrop-blur-xl lg:bg-transparent shadow-2xl lg:shadow-none p-2 rounded-2xl lg:rounded-none">
          <CardHeader className="gsap-stagger px-4 lg:px-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Operação Interna</p>
          <CardTitle className="text-2xl lg:text-4xl font-serif">Criar Conta</CardTitle>
          <CardDescription className="text-sm">Cadastre-se para começar a criar catálogos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-4 lg:px-6">
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-red-700">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-red-700">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword ? (
                <p className="text-xs text-red-700">{form.formState.errors.confirmPassword.message}</p>
              ) : null}
            </div>

            {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

            <Button type="submit" className="gsap-stagger w-full" disabled={form.formState.isSubmitting || !!successMessage}>
              {form.formState.isSubmitting ? <Spinner className="mr-2" /> : null}
              Cadastrar
            </Button>
          </form>

          <p className="gsap-stagger text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-medium text-foreground underline hover:text-accent transition-colors">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
