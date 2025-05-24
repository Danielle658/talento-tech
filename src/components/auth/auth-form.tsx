
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { LogIn, Loader2, Building2, KeyRound } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { SIMULATED_CREDENTIALS_STORAGE_KEY, REMEMBERED_CREDENTIALS_KEY } from '@/lib/constants';

const loginSchema = z.object({
  companyName: z.string().min(2, { message: "Nome da empresa é obrigatório." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function AuthForm() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { companyName: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rememberedCredentialsRaw = localStorage.getItem(REMEMBERED_CREDENTIALS_KEY);
      if (rememberedCredentialsRaw) {
        try {
          const rememberedCredentials = JSON.parse(rememberedCredentialsRaw);
          if (rememberedCredentials.companyName) {
            loginForm.setValue("companyName", rememberedCredentials.companyName);
          }
          if (rememberedCredentials.password) {
            loginForm.setValue("password", rememberedCredentials.password);
          }
          loginForm.setValue("rememberMe", true);
        } catch (error) {
          console.error("Erro ao carregar credenciais lembradas:", error);
          localStorage.removeItem(REMEMBERED_CREDENTIALS_KEY); // Limpa se estiver corrompido
        }
      }
    }
  }, [loginForm]);

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    let companyCredential = null;
    let isAuthenticatedUser = false;

    try {
      const storedCredentialsRaw = localStorage.getItem(SIMULATED_CREDENTIALS_STORAGE_KEY);
      if (storedCredentialsRaw) {
        const allSimulatedCredentials: any[] = JSON.parse(storedCredentialsRaw);
        if (Array.isArray(allSimulatedCredentials)) {
          companyCredential = allSimulatedCredentials.find(
            (cred) => cred && cred.companyName === data.companyName
          );
        }
      }
    } catch (error) {
      console.error("Erro ao ler credenciais simuladas do localStorage:", error);
      toast({
        title: "Erro ao Verificar Empresa",
        description: "Não foi possível verificar os dados da empresa. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (companyCredential && companyCredential.password === data.password) {
      isAuthenticatedUser = true;
    }

    if (isAuthenticatedUser) {
      login(data.companyName); // Define a empresa atual no AuthContext
      toast({ title: "Acesso Permitido!", description: `Acessando dados da empresa ${data.companyName}.` });

      if (data.rememberMe) {
        // ATENÇÃO: Salvar senhas no localStorage é um risco de segurança em aplicações reais.
        // Isto é feito aqui apenas para fins de prototipagem da funcionalidade "Lembrar-me".
        localStorage.setItem(REMEMBERED_CREDENTIALS_KEY, JSON.stringify({ companyName: data.companyName, password: data.password }));
      } else {
        localStorage.removeItem(REMEMBERED_CREDENTIALS_KEY);
      }
      router.push('/dashboard');
    } else {
      toast({
        title: "Falha no Acesso",
        description: "Nome da empresa ou senha incorretos. Verifique os dados ou cadastre sua empresa.",
        variant: "destructive",
      });
      loginForm.setValue("password", ""); // Limpa apenas o campo de senha
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle className="text-3xl">Bem-vindo!</CardTitle>
        <CardDescription>Acesse os dados da sua empresa.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6 pt-4">
            <FormField
              control={loginForm.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Digite o nome da sua empresa" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" placeholder="Digite sua senha" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <FormField
                control={loginForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} id="rememberMe-login" />
                    </FormControl>
                    <Label htmlFor="rememberMe-login" className="font-normal">Lembrar-me</Label>
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Acessar Dados
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          Não possui uma empresa registrada?{' '}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">
            Cadastre-se
          </Link>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm text-muted-foreground pt-4">
         {/* Links para "Esqueceu a senha?" e Suporte foram removidos conforme solicitações anteriores */}
      </CardFooter>
    </Card>
  );
}
