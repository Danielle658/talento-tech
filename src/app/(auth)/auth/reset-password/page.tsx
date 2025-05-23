
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2, CheckCircle, ArrowLeft, ShieldCheck, Mail } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { SIMULATED_CREDENTIALS_STORAGE_KEY } from '@/lib/constants';

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(6, { message: "A nova senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isTokenPresent, setIsTokenPresent] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const emailFromUrl = searchParams.get('email'); // E-mail também vem na URL pela email-api

    if (tokenFromUrl && emailFromUrl) {
      setResetToken(tokenFromUrl);
      setIsTokenPresent(true);
      form.setValue('email', emailFromUrl); // Pré-preenche o e-mail do link
    } else {
      setIsTokenPresent(false);
      toast({
        title: "Link de Redefinição Inválido",
        description: "O token de redefinição de senha ou e-mail não foi encontrado na URL. Por favor, solicite um novo link.",
        variant: "destructive",
        duration: 7000,
      });
    }
  }, [searchParams, toast, form]);

  const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (data) => {
    if (!isTokenPresent || !resetToken) {
      toast({ title: "Token Inválido", description: "Não é possível redefinir a senha com um link inválido ou expirado.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // Chamar a API Route do Next.js para validar o token
      const response = await fetch("/api/reset-password", { // Chama a API Route local
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetToken,
          email: data.email.toLowerCase(), // Email do formulário
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Se a API Next.js validou o token, atualize a senha no localStorage
        const storedCredentialsRaw = localStorage.getItem(SIMULATED_CREDENTIALS_STORAGE_KEY);
        let allSimulatedCredentials: any[] = [];
        if (storedCredentialsRaw) {
            try {
                allSimulatedCredentials = JSON.parse(storedCredentialsRaw);
                if (!Array.isArray(allSimulatedCredentials)) {
                    allSimulatedCredentials = [allSimulatedCredentials].filter(Boolean);
                }
            } catch (e) {
                console.error("Erro ao analisar credenciais simuladas do localStorage:", e);
                allSimulatedCredentials = [];
            }
        }
        
        const userCredentialIndex = allSimulatedCredentials.findIndex(
          cred => cred && cred.email && cred.email.toLowerCase() === data.email.toLowerCase()
        );

        if (userCredentialIndex !== -1) {
          allSimulatedCredentials[userCredentialIndex].password = data.password;
          localStorage.setItem(SIMULATED_CREDENTIALS_STORAGE_KEY, JSON.stringify(allSimulatedCredentials));
          toast({
            title: "Senha Redefinida!",
            description: "Sua senha foi alterada com sucesso. Você pode fazer login com sua nova senha.",
          });
          router.push('/auth');
        } else {
          toast({ 
            title: "E-mail Não Encontrado", 
            description: "Não foi possível encontrar uma conta associada a este e-mail para redefinir a senha. Verifique o e-mail digitado.", 
            variant: "destructive",
            duration: 7000,
          });
        }
      } else {
        toast({
          title: "Erro ao Redefinir Senha",
          description: result.message || "Ocorreu um erro ao tentar redefinir sua senha.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao tentar redefinir senha:", error);
      toast({ 
        title: "Falha na Conexão", 
        description: "Ocorreu um erro de conexão ao tentar redefinir sua senha. Verifique sua internet e tente novamente.", 
        variant: "destructive" 
      });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle className="text-3xl">Redefinir Senha</CardTitle>
        {!isTokenPresent ? (
          <CardDescription className="text-destructive pt-2">
             Link de redefinição inválido ou expirado. Por favor, solicite um novo link.
          </CardDescription>
        ) : (
           <CardDescription className="pt-2">
            Seu link de redefinição é válido. Por favor, confirme seu e-mail e defina sua nova senha abaixo.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isTokenPresent ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          {/* O e-mail é pré-preenchido e pode ser desabilitado se preferir */}
                          <Input type="email" placeholder="Confirme o e-mail da sua conta" {...field} className="pl-10" disabled />
                        </div>
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
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="password" placeholder="Digite sua nova senha" {...field} className="pl-10" />
                        </div>
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
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="password" placeholder="Confirme sua nova senha" {...field} className="pl-10" />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Redefinir Senha
                </Button>
            </form>
            </Form>
        ) : (
            <div className="text-center space-y-4">
                <p>Seu link de redefinição é inválido ou expirado.</p>
                <Button asChild className="w-full max-w-xs">
                    <Link href="/auth/forgot-password">
                        Solicitar Novo Link
                    </Link>
                </Button>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm text-muted-foreground pt-4 border-t">
         <Button variant="outline" asChild className="w-full max-w-xs">
            <Link href="/auth">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
            </Link>
        </Button>
         <p>Problemas? <Link href="/support" className="text-primary hover:underline">Contate o Suporte</Link>.</p>
      </CardFooter>
    </Card>
  );
}
