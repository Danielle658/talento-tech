
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
import { Mail, Send, Loader2, ArrowLeft } from 'lucide-react'; // Mudado de Phone para Mail
import { Logo } from '@/components/shared/logo';

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
    // A URL do endpoint da API (via proxy Next.js) para enviar o e-mail de redefinição
    const apiUrl = '/api/internal-email/reset-password'; 
    console.log(`Tentando enviar e-mail de recuperação (via proxy Next.js) para: ${apiUrl} com e-mail: ${data.email}`);
    let rawResponseText = '';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email.toLowerCase() }), // Enviar email em minúsculas
      });

      rawResponseText = await response.text(); // Ler a resposta como texto primeiro

      if (!response.ok) {
        let errorMsg = `A API retornou um erro: ${response.statusText || response.status}.`;
        try {
          const result = JSON.parse(rawResponseText); // Tenta analisar como JSON
          errorMsg = result.error || errorMsg;
        } catch (jsonParseError) {
          // Se não for JSON, é provável que seja HTML (página de erro do proxy ou do backend)
          console.error("A resposta de erro da API não era JSON. Resposta bruta:", rawResponseText);
          errorMsg = `A API retornou uma resposta inesperada (status ${response.status}). Verifique se o servidor 'email-api' na porta 5001 está rodando e acessível pelo servidor Next.js. A resposta não foi um JSON válido. Se estiver em ambiente de desenvolvimento remoto, pode ser necessário configurar encaminhamento de porta ou usar uma URL pública para a API de e-mail.`;
        }
        toast({
          title: "Erro ao Solicitar Recuperação",
          description: errorMsg,
          variant: "destructive",
          duration: 15000,
        });
        setIsLoading(false);
        return;
      }
      
      const result = JSON.parse(rawResponseText); // Analisa a resposta de sucesso como JSON
      toast({
        title: "Solicitação Enviada",
        description: result.message || `Se houver uma conta associada a ${data.email}, um link para redefinição de senha foi enviado. Verifique sua caixa de entrada (e spam).`,
        duration: 10000,
      });
      form.reset();
      // Não redireciona mais, o usuário deve verificar o e-mail
    } catch (error: any) {
      console.error("Erro de rede ao chamar API de recuperação de senha (via proxy):", error, "Resposta bruta (se houver):", rawResponseText);
      toast({
        title: "Falha na Conexão",
        description: `Não foi possível conectar à API de e-mail através do proxy Next.js. Verifique se o servidor 'email-api' (porta 5001) está online e se o servidor Next.js pode alcançá-lo. Detalhes: ${error.message}. Se estiver em ambiente de desenvolvimento remoto, pode ser necessário configurar encaminhamento de porta ou usar uma URL pública para a API de e-mail.`,
        variant: "destructive",
        duration: 15000,
      });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle className="text-3xl">Recuperar Acesso</CardTitle>
        <CardDescription>Insira o e-mail associado à sua empresa para receber as instruções de redefinição de senha.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail da Empresa</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="seuemail@exemplo.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar E-mail de Recuperação
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm text-muted-foreground pt-4">
         <p>Lembrou sua senha?{' '}
          <Link href="/auth" className="font-medium text-primary hover:underline">
            Fazer Login
          </Link>
        </p>
        <Button variant="outline" asChild className="w-full max-w-xs">
            <Link href="/auth">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Acesso
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
