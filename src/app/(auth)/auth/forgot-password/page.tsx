
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
import { Phone, Send, Loader2, ArrowLeft } from 'lucide-react'; // Alterado Mail para Phone
import { Logo } from '@/components/shared/logo';

const phoneRegex = /^\(?([1-9]{2})\)?[\s-]?9?(\d{4})[\s-]?(\d{4})$/;

const forgotPasswordSchema = z.object({
  phone: z.string().regex(phoneRegex, { message: "Por favor, insira um número de telefone válido." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    const apiUrl = '/api/internal-sms/request-sms-code'; // Usa o proxy para a rota de SMS
    const phoneNumber = data.phone.replace(/[^\d]+/g, ''); // Limpa o número de telefone

    console.log("Tentando solicitar código SMS (via proxy Next.js) em:", apiUrl, " para o telefone:", phoneNumber);
    let rawResponseText = '';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      rawResponseText = await response.text();
      const result = JSON.parse(rawResponseText);

      if (!response.ok) {
        toast({
            title: "Erro ao Solicitar Código SMS",
            description: result.error || `A API retornou um erro: ${response.statusText || response.status}. Verifique os logs do servidor 'email-api' (porta 5001).`,
            variant: "destructive",
            duration: 15000,
          });
        setIsLoading(false);
        return;
      }
      
      toast({
        title: "Solicitação de Código SMS Enviada",
        description: result.message || `Se o número ${data.phone} estiver associado a uma empresa registrada, um código SMS será enviado (simulado).`,
        duration: 10000,
      });
      form.reset();
      // Redireciona para a página de reset com o telefone como parâmetro
      router.push(`/auth/reset-password?phone=${encodeURIComponent(phoneNumber)}`);
    } catch (error: any) {
        let errorMsg = "Falha na Conexão com API de SMS. Verifique os logs do servidor Next.js e 'email-api'.";
        if (error instanceof SyntaxError && rawResponseText) {
            console.error("A resposta de erro da API não era JSON. Resposta bruta:", rawResponseText);
            errorMsg = `A API retornou uma resposta inesperada. Resposta: ${rawResponseText.substring(0,200)}...`;
        } else {
            console.error("Erro de rede ao chamar API de solicitação de SMS (via proxy):", error, "Resposta bruta (se houver):", rawResponseText);
            errorMsg = `Não foi possível conectar à API de SMS através do proxy Next.js. Verifique se o servidor 'email-api' (porta 5001) está online e se o servidor Next.js pode alcançá-lo. Detalhes: ${error.message}.`;
        }
        toast({
            title: "Falha na Conexão",
            description: errorMsg + " Se estiver em ambiente de desenvolvimento remoto, pode ser necessário configurar encaminhamento de porta ou usar uma URL pública para a API de SMS.",
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
        <CardDescription>Insira o número de telefone associado à sua empresa para receber um código SMS de verificação.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Telefone da Empresa</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="(XX) 9XXXX-XXXX" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar Código SMS
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
