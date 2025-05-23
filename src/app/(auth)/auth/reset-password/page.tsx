
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
import { KeyRound, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { SIMULATED_CREDENTIALS_STORAGE_KEY } from '@/lib/constants';

const resetPasswordSchema = z.object({
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
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidTokenForDisplay, setIsValidTokenForDisplay] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setIsValidTokenForDisplay(true); // Assume token is valid for display purposes
      // Em um aplicativo real, você faria uma chamada de API aqui para validar o token
    } else {
      setError("Token de redefinição inválido ou ausente. Solicite um novo link de recuperação.");
      setIsValidTokenForDisplay(false);
      toast({
        title: "Token Inválido",
        description: "O link de redefinição de senha é inválido ou expirou.",
        variant: "destructive",
        duration: 7000,
      });
    }
  }, [searchParams, toast]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: "Erro na Redefinição",
        description: "Token de redefinição inválido ou ausente. Não é possível redefinir a senha.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    
    console.log("Tentando redefinir senha com token:", token, "e nova senha:", data.password);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula chamada de API

    try {
      const storedCredentialsRaw = localStorage.getItem(SIMULATED_CREDENTIALS_STORAGE_KEY);
      if (storedCredentialsRaw) {
        const storedCredentials = JSON.parse(storedCredentialsRaw);
        // Em uma aplicação real, o backend validaria o token e encontraria o usuário associado.
        // Aqui, simplesmente atualizamos as credenciais simuladas existentes.
        storedCredentials.password = data.password;
        localStorage.setItem(SIMULATED_CREDENTIALS_STORAGE_KEY, JSON.stringify(storedCredentials));
        console.log("Simulação: Senha atualizada no localStorage para:", storedCredentials.companyName);
        toast({ 
          title: "Senha Redefinida!", 
          description: "Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova senha.",
          duration: 5000,
        });
        form.reset();
        router.push('/auth'); 
      } else {
        console.warn("Nenhuma credencial simulada encontrada no localStorage para atualizar a senha.");
        toast({
            title: "Erro na Redefinição (Simulação)",
            description: "Não foram encontradas credenciais locais para atualizar. Por favor, registre-se primeiro ou solicite um novo link se o e-mail estiver correto.",
            variant: "destructive",
        });
         // Não redireciona aqui, permite ao usuário ver a mensagem de erro.
      }
    } catch (e) {
      console.error("Erro ao tentar atualizar senha simulada no localStorage:", e);
      toast({
        title: "Erro ao Atualizar Senha (Simulação)",
        description: "Não foi possível atualizar a senha armazenada localmente. Esta é uma etapa de simulação.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle className="text-3xl">Definir Nova Senha</CardTitle>
        {error && (
          <CardDescription className="text-destructive flex items-center justify-center gap-2 pt-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </CardDescription>
        )}
        {isValidTokenForDisplay && !error && (
           <CardDescription className="pt-2">
            Você está redefinindo a senha usando um link de recuperação. Por favor, crie uma nova senha abaixo.
          </CardDescription>
        )}
         {!isValidTokenForDisplay && !error && (
          <CardDescription className="pt-2">Verificando link de redefinição...</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isValidTokenForDisplay && !error ? (
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
                        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="password" placeholder="Confirme sua nova senha" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || !token}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Redefinir Senha
              </Button>
            </form>
          </Form>
        ) : (
           !error && <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Verificando token...</p></div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm text-muted-foreground pt-4">
         <Button variant="outline" asChild className="w-full max-w-xs">
            <Link href="/auth">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
