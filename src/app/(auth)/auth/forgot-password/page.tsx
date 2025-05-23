
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
// A constante ACCOUNT_DETAILS_BASE_STORAGE_KEY não é mais usada diretamente aqui para verificar e-mail.

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
    // A URL agora usa o proxy do Next.js
    const apiUrl = '/api/internal-email/reset-password';
    console.log("Tentando conectar à API de e-mail (via proxy Next.js) em:", apiUrl, " com e-mail:", data.email);
    let rawResponseText = '';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }), // Garante que o corpo é um JSON
      });

      rawResponseText = await response.text();

      if (!response.ok) {
        try {
          const errorResult = JSON.parse(rawResponseText);
          toast({
            title: "Erro ao Solicitar Redefinição",
            description: errorResult.error || `A API retornou um erro: ${response.statusText || response.status}. Verifique os logs do servidor 'email-api' (porta 5001).`,
            variant: "destructive",
            duration: 10000,
          });
        } catch (jsonParseError) {
          console.error("A resposta de erro da API não era JSON. Resposta bruta:", rawResponseText);
          toast({
            title: "Erro de Comunicação com API de E-mail",
            description: `A API retornou uma resposta inesperada (status ${response.status}). Verifique se o servidor 'email-api' na porta 5001 está rodando e acessível pelo servidor Next.js. A resposta não foi um JSON válido. Se estiver em ambiente de desenvolvimento remoto, pode ser necessário configurar encaminhamento de porta ou usar uma URL pública para a API de e-mail.`,
            variant: "destructive",
            duration: 15000,
          });
        }
        setIsLoading(false);
        return;
      }

      // A API de email é responsável por verificar a existência do e-mail.
      // O frontend apenas informa o usuário sobre a tentativa de envio.
      toast({
        title: "Solicitação Enviada",
        description: `Se o e-mail ${data.email} estiver cadastrado em nosso sistema e o serviço de e-mail estiver configurado corretamente, um link para redefinição de senha será enviado. Verifique sua caixa de entrada e spam.`,
        duration: 10000,
      });
      form.reset();
    } catch (error: any) {
      console.error("Erro de rede ao chamar API de redefinição de senha (via proxy):", error, "Resposta bruta (se houver):", rawResponseText);
      toast({
        title: "Falha na Conexão com API de E-mail",
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
