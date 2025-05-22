
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { ACCOUNT_DETAILS_STORAGE_KEY } from '@/lib/constants';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    
    const apiUrl = 'http://localhost:5000/api/email/reset-password';
    console.log("Tentando conectar à API de e-mail em:", apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (response.ok) {
        const storedDetailsRaw = localStorage.getItem(ACCOUNT_DETAILS_STORAGE_KEY);
        let emailExists = false;
        if (storedDetailsRaw) {
          try {
            const storedDetails = JSON.parse(storedDetailsRaw);
            if (storedDetails.email && storedDetails.email.toLowerCase() === data.email.toLowerCase()) {
              emailExists = true;
            }
          } catch (e) {
            console.error("Erro ao ler detalhes da conta do localStorage:", e);
          }
        }

        if (emailExists) {
          toast({ 
            title: "Verifique seu E-mail", 
            description: result.message || `(Simulação) Se uma conta com o e-mail ${data.email} existir e o serviço de e-mail estiver configurado e rodando corretamente no backend, um link de redefinição de senha foi enviado.`,
            duration: 7000,
          });
        } else {
           toast({ 
            title: "E-mail Não Encontrado", 
            description: `Não foi possível encontrar uma conta com o e-mail ${data.email}. Verifique o endereço digitado.`,
            variant: "destructive",
            duration: 7000,
          });
        }
      } else {
        toast({
          title: "Erro ao Solicitar Redefinição",
          description: result.error || "Não foi possível processar sua solicitação. Verifique se o servidor de backend (email-api) está rodando e configurado corretamente na porta 5000. Tente novamente mais tarde.",
          variant: "destructive",
          duration: 7000,
        });
      }
    } catch (error: any) {
      console.error("Erro detalhado na chamada da API de redefinição de senha:", error);
      toast({
        title: "Falha ao Conectar com a API de E-mail",
        description: `Não foi possível conectar à API em ${apiUrl}. Verifique se: 1. O servidor na pasta 'email-api' foi iniciado (com 'npm start' no terminal daquela pasta e está mostrando "Server running on port 5000"). 2. Se você está usando um ambiente de desenvolvimento remoto (como Cloud Workstations), 'localhost:5000' pode não estar acessível pelo seu navegador; você pode precisar configurar o encaminhamento de porta ou usar a URL pública da API, se disponível. 3. Não há erros no console do servidor 'email-api'. 4. A porta 5000 não está bloqueada por um firewall.`,
        variant: "destructive",
        duration: 15000, 
      });
    }
    
    setIsLoading(false);
    form.reset();
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle className="text-3xl">Redefinir Senha</CardTitle>
        <CardDescription>Insira seu e-mail para receber o link de redefinição.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="seu@email.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar Link de Redefinição
            </Button>
          </form>
        </Form>
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
