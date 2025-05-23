
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
import { LogIn, Loader2, Building2 } from 'lucide-react'; // Removido KeyRound
import { Logo } from '@/components/shared/logo';
import { SIMULATED_CREDENTIALS_STORAGE_KEY, REMEMBERED_COMPANY_NAME_KEY } from '@/lib/constants';

const loginSchema = z.object({
  companyName: z.string().min(2, { message: "Nome da empresa é obrigatório." }),
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
    defaultValues: { companyName: "", rememberMe: false },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rememberedCompanyName = localStorage.getItem(REMEMBERED_COMPANY_NAME_KEY);
      if (rememberedCompanyName) {
        loginForm.setValue("companyName", rememberedCompanyName);
        loginForm.setValue("rememberMe", true);
      }
    }
  }, [loginForm]);

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); 

    let companyIsRegistered = false;
    try {
      const storedCredentialsRaw = localStorage.getItem(SIMULATED_CREDENTIALS_STORAGE_KEY);
      if (storedCredentialsRaw) {
        const allSimulatedCredentials = JSON.parse(storedCredentialsRaw);
        // Verifica se é um array ou um objeto único (para compatibilidade com versões anteriores)
        if (Array.isArray(allSimulatedCredentials)) {
            companyIsRegistered = allSimulatedCredentials.some(cred => cred.companyName === data.companyName && cred.status === "registered");
        } else if (typeof allSimulatedCredentials === 'object' && allSimulatedCredentials !== null) {
            // Lógica para objeto único (se aplicável no seu histórico de desenvolvimento)
            companyIsRegistered = allSimulatedCredentials.companyName === data.companyName && allSimulatedCredentials.status === "registered";
        }
      }
    } catch (error) {
      console.error("Erro ao ler credenciais simuladas do localStorage:", error);
      toast({
        title: "Erro ao Verificar Empresa",
        description: "Não foi possível verificar os dados da empresa. Tente novamente.",
        variant: "destructive",
      });
    }

    if (companyIsRegistered) {
      login(data.companyName); 
      toast({ title: "Acesso Permitido!", description: `Acessando dados da empresa ${data.companyName}.` });

      if (data.rememberMe) {
        localStorage.setItem(REMEMBERED_COMPANY_NAME_KEY, data.companyName);
      } else {
        localStorage.removeItem(REMEMBERED_COMPANY_NAME_KEY);
      }
      router.push('/dashboard');
    } else {
      toast({
        title: "Falha no Acesso",
        description: "Empresa não encontrada ou não registrada. Verifique o nome ou cadastre sua empresa.",
        variant: "destructive",
      });
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
            <div className="flex items-center justify-between">
              <FormField
                control={loginForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} id="rememberMe-login" />
                    </FormControl>
                    <FormLabel htmlFor="rememberMe-login" className="font-normal">Lembrar nome da empresa</FormLabel>
                  </FormItem>
                )}
              />
              <Link href="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Problemas com acesso?
              </Link>
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
      <CardFooter className="flex justify-center text-center text-sm text-muted-foreground pt-4">
        <p>Precisa de ajuda? <Link href="/support" className="text-primary hover:underline">Contate o Suporte</Link>.</p>
      </CardFooter>
    </Card>
  );
}
