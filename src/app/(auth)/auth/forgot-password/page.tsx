
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
import type { AccountDetailsFormValues as StoredAccountDetails } from '@/app/(app)/dashboard/settings/page'; 

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
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    let emailFound = false;
    try {
      const storedDetailsRaw = localStorage.getItem(ACCOUNT_DETAILS_STORAGE_KEY);
      if (storedDetailsRaw) {
        const storedDetails: StoredAccountDetails = JSON.parse(storedDetailsRaw);
        if (storedDetails.email === data.email) {
          emailFound = true;
        }
      }
    } catch (error) {
      console.error("Error reading account details from localStorage:", error);
    }

    if (emailFound) {
      toast({ 
        title: "Verifique seu E-mail (Simulado)", 
        description: `Simulação: Se uma conta existir para ${data.email}, um e-mail com instruções para redefinir sua senha teria sido enviado. Por favor, verifique sua caixa de entrada (simulado).`,
        duration: 7000,
      });
    } else {
      toast({
        title: "E-mail Não Encontrado",
        description: `Não foi possível encontrar uma conta com o e-mail ${data.email}. Verifique o endereço digitado.`,
        variant: "destructive",
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
