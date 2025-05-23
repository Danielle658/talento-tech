
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2, CheckCircle, AlertTriangle, ArrowLeft, LogIn, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { SIMULATED_CREDENTIALS_STORAGE_KEY } from '@/lib/constants'; // Para atualizar a senha localmente
import jwt from 'jsonwebtoken'; // Para decodificar o token (apenas para simulação)


const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface DecodedToken {
  email?: string;
  iat?: number;
  exp?: number;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // Inicia como false, será true durante o submit
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      try {
        // SIMULAÇÃO: Decodificar o token para obter o e-mail.
        // Em um app real, o token seria enviado ao backend para validação e obtenção do e-mail.
        // Aqui, apenas decodificamos o token para fins de demonstração.
        // A "validade" real do token seria verificada pelo backend.
        const decoded = jwt.decode(tokenFromUrl) as DecodedToken | null;

        if (decoded && decoded.email) {
          setUserEmail(decoded.email);
          setTokenStatus('valid');
        } else {
          setTokenStatus('invalid');
          toast({
            title: "Link Inválido ou Expirado",
            description: "O token no link é inválido ou não contém o e-mail esperado.",
            variant: "destructive",
            duration: 7000,
          });
        }
      } catch (error) {
        console.error("Erro ao decodificar token:", error);
        setTokenStatus('invalid');
        toast({
          title: "Link Inválido",
          description: "Ocorreu um erro ao processar o link de redefinição.",
          variant: "destructive",
          duration: 7000,
        });
      }
    } else {
      setTokenStatus('invalid');
      toast({
        title: "Link Inválido",
        description: "Nenhum token de redefinição encontrado na URL.",
        variant: "destructive",
        duration: 7000,
      });
    }
  }, [searchParams, toast]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (tokenStatus !== 'valid' || !userEmail) {
      toast({ title: "Erro", description: "Não é possível redefinir a senha. Token inválido ou e-mail não identificado.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular chamada de API

    try {
      const storedCredentialsRaw = localStorage.getItem(SIMULATED_CREDENTIALS_STORAGE_KEY);
      let allSimulatedCredentials: any[] = [];
      if (storedCredentialsRaw) {
        allSimulatedCredentials = JSON.parse(storedCredentialsRaw);
        if (!Array.isArray(allSimulatedCredentials)) {
            allSimulatedCredentials = [allSimulatedCredentials].filter(Boolean);
        }
      }

      const userCredentialIndex = allSimulatedCredentials.findIndex(cred => cred && cred.email && cred.email.toLowerCase() === userEmail.toLowerCase());

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
          title: "Erro ao Redefinir",
          description: "Não foi possível encontrar a conta associada para redefinir a senha. Tente solicitar um novo link.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar senha no localStorage:", error);
      toast({
        title: "Erro Interno",
        description: "Ocorreu um erro ao tentar atualizar sua senha. Tente novamente.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  if (tokenStatus === 'loading') {
    return (
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
                <Logo className="justify-center mb-4" />
                <CardTitle className="text-3xl">Verificando Link</CardTitle>
                <div className="pt-4 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground">Aguarde enquanto validamos seu link de acesso...</p>
            </CardContent>
             <CardFooter className="flex flex-col items-center space-y-2 text-sm text-muted-foreground pt-4">
                <Button variant="outline" asChild className="w-full max-w-xs">
                    <Link href="/auth">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Acesso
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle className="text-3xl">Redefinir Senha</CardTitle>
        {tokenStatus === 'invalid' && (
          <CardDescription className="text-destructive flex items-center justify-center gap-2 pt-2">
            <AlertTriangle className="h-4 w-4" /> Link de redefinição inválido ou expirado.
          </CardDescription>
        )}
        {tokenStatus === 'valid' && userEmail && (
           <CardDescription className="pt-2">
            Olá! Por favor, defina uma nova senha para a conta associada a <span className="font-semibold">{userEmail}</span>.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {tokenStatus === 'valid' ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
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
                <p>Por favor, solicite um novo link de redefinição se o atual for inválido.</p>
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
