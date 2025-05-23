
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
import { SIMULATED_CREDENTIALS_STORAGE_KEY, ACCOUNT_DETAILS_BASE_STORAGE_KEY, getCompanySpecificKey } from '@/lib/constants';
import type { AccountDetailsFormValues } from '@/app/(app)/dashboard/settings/page'; // Import for type

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
  const [emailFromToken, setEmailFromToken] = useState<string | null>(null); // To find the company

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // SIMULATE TOKEN VERIFICATION AND EMAIL EXTRACTION
      // In a real app, you'd call a backend to verify the token and get the associated email.
      // For simulation, we'll assume the token is a JWT and try to decode it.
      // This is NOT secure for production, as JWTs can be decoded client-side if not properly handled.
      try {
        // A very basic simulation of extracting email if token was like "email:JWT_PAYLOAD_PART"
        // This is highly simplified and not how real JWT verification works.
        // A real JWT would be decoded using a library and its signature verified with the JWT_SECRET.
        const decodedEmail = "simulated-email-from-token@example.com"; // Placeholder
        // Here we'd normally call an API to verify the token. Since we can't,
        // we'll just assume it's valid for this simulation if it exists.
        // To link it to a company, we need to search for this email in account details.
        
        // Search for company by email (simulation)
        let companyFound: string | null = null;
        // This is a very inefficient way to find a company by email in a real scenario.
        // Ideally, the token itself would directly link to a user/company ID.
        // For this simulation, we can't iterate through all possible company localStorage keys.
        // So, we'll just display a generic message.
        
        // For simulation, we will assume the token is valid IF it exists in the URL.
        // The actual check of which user it belongs to is hard without iterating all possible localStorage keys
        // or having the email/company in the token (which we don't currently do in the backend JWT generation for simplicity).
        
        // For this step, we can't reliably get the email from the token without a backend
        // or making the token itself contain the email (which we are not doing in email-api/utils/generateResetToken.js)
        // The email sent for reset is already known by the user.
        // The critical part is that the token itself is "valid" (exists).

        setIsValidTokenForDisplay(true);
        // setEmailFromToken(decodedEmail); // We can't actually get this without a backend
      } catch (e) {
        setError("Token de redefinição inválido ou corrompido.");
        setIsValidTokenForDisplay(false);
      }
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
    await new Promise(resolve => setTimeout(resolve, 1000));

    // SIMULATION: In a real app, the backend would validate the token and update the password.
    // Here, we try to find the company based on the email the user *thinks* they are resetting for.
    // This is not secure and is only for frontend simulation.
    // A real system would use the token to identify the user/company directly.

    // For this simulation, we'll assume the token is valid and proceed.
    // The actual "who" is being reset is implicitly the user who received the email.
    // We need to find WHICH company's credentials to update.
    // This is tricky without a backend that links token to user/company.
    // For the purpose of this simulation, we'll try to find the *first* company if multiple are registered
    // or ideally, if the token contained an identifier (which it doesn't simply).

    // A simple approach for simulation: update the *first* set of credentials found.
    // This is not robust for multiple accounts.
    try {
        const storedCredentialsRaw = localStorage.getItem(SIMULATED_CREDENTIALS_STORAGE_KEY);
        if (storedCredentialsRaw) {
            let allSimulatedCredentials = JSON.parse(storedCredentialsRaw);
            let credsToUpdate;

            if (Array.isArray(allSimulatedCredentials) && allSimulatedCredentials.length > 0) {
                // If it's an array, update the first one for simplicity in this simulation.
                // A real app would have a way to identify the specific account from the token.
                credsToUpdate = allSimulatedCredentials[0];
            } else if (typeof allSimulatedCredentials === 'object' && allSimulatedCredentials !== null && !Array.isArray(allSimulatedCredentials)) {
                // If it's a single object (old format or only one user)
                credsToUpdate = allSimulatedCredentials;
            }

            if (credsToUpdate) {
                credsToUpdate.password = data.password;
                // Save back: if it was an array, update that specific element.
                if (Array.isArray(allSimulatedCredentials)) {
                    localStorage.setItem(SIMULATED_CREDENTIALS_STORAGE_KEY, JSON.stringify(allSimulatedCredentials));
                } else {
                    localStorage.setItem(SIMULATED_CREDENTIALS_STORAGE_KEY, JSON.stringify(credsToUpdate));
                }
                
                toast({ 
                    title: "Senha Redefinida!", 
                    description: `Sua senha (para a empresa ${credsToUpdate.companyName || 'associada a este link'}) foi alterada com sucesso. Você já pode fazer login com sua nova senha.`,
                    duration: 7000,
                });
                form.reset();
                router.push('/auth'); 
            } else {
                toast({
                    title: "Erro na Redefinição (Simulação)",
                    description: "Não foram encontradas credenciais simuladas para atualizar. Por favor, verifique se você já se registrou.",
                    variant: "destructive",
                });
            }
        } else {
            toast({
                title: "Erro na Redefinição (Simulação)",
                description: "Nenhuma credencial simulada encontrada. Por favor, registre-se primeiro.",
                variant: "destructive",
            });
        }
    } catch (e) {
        console.error("Erro ao tentar atualizar senha simulada no localStorage:", e);
        toast({
            title: "Erro ao Atualizar Senha (Simulação)",
            description: "Não foi possível atualizar a senha armazenada localmente.",
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
            Você está usando um link de recuperação. Por favor, crie uma nova senha abaixo.
          </CardDescription>
        )}
         {!isValidTokenForDisplay && !error && !isLoading && (
          <CardDescription className="pt-2">Verificando link de redefinição...</CardDescription>
        )}
         {isLoading && <div className="pt-2"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>}
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
