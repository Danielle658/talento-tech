
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
import { KeyRound, Loader2, CheckCircle, ArrowLeft, ShieldCheck, MessageSquare } from 'lucide-react'; // Adicionado MessageSquare
import { Logo } from '@/components/shared/logo';
import { SIMULATED_CREDENTIALS_STORAGE_KEY } from '@/lib/constants'; 

const resetPasswordSchema = z.object({
  smsCode: z.string().min(4, { message: "Código SMS deve ter pelo menos 4 dígitos." }).max(6, { message: "Código SMS inválido."}), // Exemplo: "000000"
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
  const [phoneNumberFromUrl, setPhoneNumberFromUrl] = useState<string | null>(null);
  const [isPhoneNumberValidForReset, setIsPhoneNumberValidForReset] = useState(false);


  useEffect(() => {
    const phone = searchParams.get('phone');
    if (phone) {
      const cleanedPhone = phone.replace(/[^\d]+/g, '');
      setPhoneNumberFromUrl(cleanedPhone);
      // Verifica se o telefone existe no localStorage (SIMULATED_CREDENTIALS_STORAGE_KEY)
      try {
        const storedCredentialsRaw = localStorage.getItem(SIMULATED_CREDENTIALS_STORAGE_KEY);
        if (storedCredentialsRaw) {
          const allSimulatedCredentials: any[] = JSON.parse(storedCredentialsRaw);
          if (Array.isArray(allSimulatedCredentials)) {
            const credentialExists = allSimulatedCredentials.some(cred => cred && cred.phone && cred.phone.replace(/[^\d]+/g, '') === cleanedPhone);
            if (credentialExists) {
              setIsPhoneNumberValidForReset(true);
            } else {
              toast({ title: "Telefone Não Encontrado", description: "O número de telefone fornecido não foi encontrado em nossos registros.", variant: "destructive", duration: 7000 });
            }
          }
        } else {
             toast({ title: "Erro de Dados Locais", description: "Não foi possível verificar o número de telefone nos dados locais.", variant: "destructive", duration: 7000 });
        }
      } catch (e) {
        toast({ title: "Erro ao Verificar Telefone", description: "Ocorreu um problema ao verificar os dados locais.", variant: "destructive", duration: 7000 });
      }
    } else {
      toast({
        title: "Link Inválido",
        description: "Nenhum número de telefone encontrado na URL para redefinição.",
        variant: "destructive",
        duration: 7000,
      });
    }
  }, [searchParams, toast]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      smsCode: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!isPhoneNumberValidForReset || !phoneNumberFromUrl) {
      toast({ title: "Erro de Validação", description: "Número de telefone inválido ou não fornecido para redefinição.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const verifyApiUrl = '/api/internal-sms/verify-sms-code'; // Usa o proxy para a rota de SMS
    let rawVerifyResponseText = '';

    try {
      const verifyResponse = await fetch(verifyApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumberFromUrl, code: data.smsCode }),
      });

      rawVerifyResponseText = await verifyResponse.text();
      const verifyResult = JSON.parse(rawVerifyResponseText);

      if (!verifyResponse.ok) {
        toast({ title: "Falha na Verificação do Código", description: verifyResult.error || "Código SMS inválido ou expirado. Tente novamente.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Se o código SMS foi verificado, atualiza a senha no localStorage
      const storedCredentialsRaw = localStorage.getItem(SIMULATED_CREDENTIALS_STORAGE_KEY);
      if (storedCredentialsRaw) {
        let allSimulatedCredentials: any[] = JSON.parse(storedCredentialsRaw);
        if (!Array.isArray(allSimulatedCredentials)) {
            allSimulatedCredentials = [allSimulatedCredentials].filter(Boolean);
        }
        const userCredentialIndex = allSimulatedCredentials.findIndex(cred => cred && cred.phone && cred.phone.replace(/[^\d]+/g, '') === phoneNumberFromUrl.replace(/[^\d]+/g, ''));

        if (userCredentialIndex !== -1) {
          allSimulatedCredentials[userCredentialIndex].password = data.password;
          localStorage.setItem(SIMULATED_CREDENTIALS_STORAGE_KEY, JSON.stringify(allSimulatedCredentials));
          toast({
            title: "Senha Redefinida!",
            description: "Sua senha foi alterada com sucesso. Você pode fazer login com sua nova senha.",
          });
          router.push('/auth');
        } else {
          // Isso não deveria acontecer se isPhoneNumberValidForReset for true, mas é uma salvaguarda
          toast({ title: "Erro ao Redefinir", description: "Não foi possível encontrar a conta associada ao telefone para redefinir a senha.", variant: "destructive" });
        }
      } else {
        toast({ title: "Erro Interno", description: "Não foi possível acessar os dados locais para atualizar a senha.", variant: "destructive" });
      }
    } catch (error: any) {
      let errorMsg = "Ocorreu um erro ao tentar redefinir sua senha.";
      if (error instanceof SyntaxError && rawVerifyResponseText) {
          console.error("A resposta de verificação de código não era JSON. Resposta bruta:", rawVerifyResponseText);
          errorMsg = `A API de verificação retornou uma resposta inesperada. Verifique os logs.`;
      } else {
          console.error("Erro ao chamar API de verificação de SMS ou atualizar senha:", error);
      }
      toast({ title: "Erro de Processamento", description: errorMsg, variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle className="text-3xl">Redefinir Senha</CardTitle>
        {!phoneNumberFromUrl || !isPhoneNumberValidForReset ? (
          <CardDescription className="text-destructive pt-2">
             Link inválido ou número de telefone não verificado. Por favor, solicite um novo código.
          </CardDescription>
        ) : (
           <CardDescription className="pt-2">
            Redefinindo senha para o número de telefone: <span className="font-semibold">{phoneNumberFromUrl}</span>.
            Insira o código SMS recebido (para teste, use "000000") e sua nova senha.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isPhoneNumberValidForReset && phoneNumberFromUrl ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="smsCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código SMS</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="Digite o código recebido" {...field} className="pl-10" />
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
                <p>Seu link de redefinição é inválido ou o número de telefone não pôde ser verificado. Por favor, solicite um novo código de verificação.</p>
                <Button asChild className="w-full max-w-xs">
                    <Link href="/auth/forgot-password">
                        Solicitar Novo Código
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
