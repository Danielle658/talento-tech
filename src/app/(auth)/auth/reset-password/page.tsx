
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
// import { zodResolver } from "@hookform/resolvers/zod"; // Não mais necessário
// import { useForm } from "react-hook-form"; // Não mais necessário
// import * as z from "zod"; // Não mais necessário
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input"; // Não mais necessário
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Não mais necessário
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2, CheckCircle, AlertTriangle, ArrowLeft, LogIn } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
// SIMULATED_CREDENTIALS_STORAGE_KEY e ACCOUNT_DETAILS_BASE_STORAGE_KEY não são mais usados para atualizar senha aqui.

// O schema de redefinição de senha não é mais necessário, pois não há campos de senha.
// const resetPasswordSchema = z.object({
//   password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
//   confirmPassword: z.string(),
// }).refine(data => data.password === data.confirmPassword, {
//   message: "As senhas não coincidem.",
//   path: ["confirmPassword"],
// });

// type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true); // Inicia como true para verificar o token
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidTokenForDisplay, setIsValidTokenForDisplay] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // SIMULAÇÃO: Em um app real, você chamaria um backend para validar o token.
      // Aqui, vamos assumir que o token é válido se existir na URL.
      // A API de e-mail (`email-api`) é responsável por gerar um token que teoricamente seria verificável.
      setIsValidTokenForDisplay(true);
      setIsLoading(false);
      toast({
        title: "Link de Verificação Válido",
        description: "Você usou um link de verificação. Pode prosseguir para acessar sua conta.",
        duration: 7000,
      });
    } else {
      setError("Link de verificação inválido ou ausente. Se necessário, solicite um novo link.");
      setIsValidTokenForDisplay(false);
      setIsLoading(false);
      toast({
        title: "Link Inválido",
        description: "O link de verificação de acesso é inválido ou expirou.",
        variant: "destructive",
        duration: 7000,
      });
    }
  }, [searchParams, toast]);

  // O formulário e a lógica onSubmit para definir nova senha são removidos.
  // const form = useForm<ResetPasswordFormValues>({ // ... });
  // const onSubmit = async (data: ResetPasswordFormValues) => { // ... };

  if (isLoading) {
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
        <CardTitle className="text-3xl">Verificação de Acesso</CardTitle>
        {error && (
          <CardDescription className="text-destructive flex items-center justify-center gap-2 pt-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </CardDescription>
        )}
        {isValidTokenForDisplay && !error && (
           <CardDescription className="pt-2 text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" /> Link de verificação processado com sucesso.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {isValidTokenForDisplay && !error && (
            <p>Você pode agora tentar acessar os dados da sua empresa.</p>
        )}
        {!isValidTokenForDisplay && error && (
            <p>Por favor, solicite um novo link se encontrar problemas para acessar sua conta.</p>
        )}
         <Button asChild className="w-full max-w-xs">
            <Link href="/auth">
                <LogIn className="mr-2 h-4 w-4" /> Acessar Dados da Empresa
            </Link>
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm text-muted-foreground pt-4 border-t">
         <p>Problemas? <Link href="/support" className="text-primary hover:underline">Contate o Suporte</Link>.</p>
      </CardFooter>
    </Card>
  );
}
