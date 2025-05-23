
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
import { KeyRound, Loader2, CheckCircle, ArrowLeft, ShieldCheck, Mail } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { SIMULATED_CREDENTIALS_STORAGE_KEY } from '@/lib/constants';

const resetPasswordSchema = z.object({
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
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
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      // Simulação de validade do token apenas pela sua presença.
      setIsTokenValid(true);
    } else {
      setIsTokenValid(false);
      toast({
        title: "Link de Redefinição Inválido",
        description: "O token de redefinição de senha não foi encontrado na URL ou é inválido. Por favor, solicite um novo link.",
        variant: "destructive",
        duration: 7000,
      });
    }
  }, [searchParams, toast]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!isTokenValid) {
      toast({ title: "Token Inválido", description: "Não é possível redefinir a senha com um link inválido ou expirado.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    // Simulação de atualização de senha no localStorage
    try {
      const storedCredentialsRaw = localStorage.getItem(SIMULATED_CREDENTIALS_STORAGE_KEY);
      if (storedCredentialsRaw) {
        let allSimulatedCredentials: any[] = JSON.parse(storedCredentialsRaw);
        if (!Array.isArray(allSimulatedCredentials)) {
            allSimulatedCredentials = [allSimulatedCredentials].filter(Boolean);
        }
        
        // Encontra a credencial pelo e-mail fornecido no formulário (case-insensitive)
        const userCredentialIndex = allSimulatedCredentials.findIndex(
          cred => cred && cred.email && cred.email.toLowerCase() === data.email.toLowerCase()
        );

        if (userCredentialIndex !== -1) {
          // Se o e-mail for encontrado, atualiza a senha
          allSimulatedCredentials[userCredentialIndex].password = data.password;
          localStorage.setItem(SIMULATED_CREDENTIALS_STORAGE_KEY, JSON.stringify(allSimulatedCredentials));
          toast({
            title: "Senha Redefinida!",
            description: "Sua senha foi alterada com sucesso. Você pode fazer login com sua nova senha.",
          });
          router.push('/auth');
        } else {
          // Se o e-mail não for encontrado nas credenciais armazenadas
          toast({ 
            title: "E-mail Não Encontrado", 
            description: "Não foi possível encontrar uma conta associada a este e-mail para redefinir a senha. Verifique o e-mail digitado ou solicite um novo link de redefinição se suspeitar que o link é para outro e-mail.", 
            variant: "destructive",
            duration: 7000,
          });
        }
      } else {
        // Se não houver nenhuma credencial armazenada
        toast({ 
            title: "Nenhuma Conta Registrada", 
            description: "Não há contas registradas no sistema para redefinir a senha. Por favor, registre uma conta primeiro.", 
            variant: "destructive",
            duration: 7000,
        });
      }
    } catch (error: any) {
      console.error("Erro ao tentar redefinir senha (simulado):", error);
      toast({ title: "Erro de Processamento", description: "Ocorreu um erro ao tentar redefinir sua senha.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle className="text-3xl">Redefinir Senha</CardTitle>
        {!isTokenValid ? (
          <CardDescription className="text-destructive pt-2">
             Link de redefinição inválido ou expirado. Por favor, solicite um novo link.
          </CardDescription>
        ) : (
           <CardDescription className="pt-2">
            Um link de redefinição foi usado. Por favor, confirme seu e-mail e defina sua nova senha abaixo.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isTokenValid ? (
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
                          <Input type="email" placeholder="Confirme o e-mail da sua conta" {...field} className="pl-10" />
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

