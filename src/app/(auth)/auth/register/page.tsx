
"use client";

import { useState } from 'react';
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
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Building2, KeyRound, User, Phone, ScanLine, Mail, ShieldCheck, UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { ACCOUNT_DETAILS_STORAGE_KEY, SIMULATED_CREDENTIALS_STORAGE_KEY } from '@/lib/constants';

// Helper function for CPF validation
function isValidCPF(cpf: string): boolean {
  if (typeof cpf !== 'string') return false;
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

  const digits = cpf.split('').map(Number);

  const calcDigit = (sliceEnd: number, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < sliceEnd; i++) {
      sum += digits[i] * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const dv1Weights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = calcDigit(9, dv1Weights);
  if (digits[9] !== dv1) return false;

  const dv2Weights = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv2 = calcDigit(10, dv2Weights);
  if (digits[10] !== dv2) return false;

  return true;
}

const phoneRegex = /^\(?([1-9]{2})\)?[\s-]?9?(\d{4})[\s-]?(\d{4})$/; // Adjusted for Brazilian mobile numbers

const registerSchema = z.object({
  companyName: z.string().min(2, { message: "Nome da empresa é obrigatório." }),
  ownerName: z.string().min(2, { message: "Nome do proprietário é obrigatório." }),
  email: z.string().email({ message: "E-mail inválido." }),
  phone: z.string().regex(phoneRegex, { message: "Número de telefone inválido. Use formato (XX) 9XXXX-XXXX ou similar." }),
  cpf: z.string()
    .min(11, { message: "CPF deve ter 11 dígitos." })
    .max(14, { message: "CPF inválido."}) // Allow for masked input like 000.000.000-00
    .refine(value => isValidCPF(value.replace(/[^\d]+/g, '')), { message: "CPF inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string(),
  privacyTerms: z.boolean().refine(val => val === true, { message: "Você deve aceitar os termos de privacidade." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      ownerName: "",
      email: "",
      phone: "",
      cpf: "",
      password: "",
      confirmPassword: "",
      privacyTerms: false,
    },
  });

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const accountDetailsToStore = {
      companyName: data.companyName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf.replace(/[^\d]+/g, ''), // Store cleaned CPF
      profilePictureDataUri: "", // Initialize as empty
    };

    const simulatedCredentials = {
      companyName: data.companyName,
      password: data.password, // Storing password for simulation - NOT FOR PRODUCTION
    };

    try {
      localStorage.setItem(ACCOUNT_DETAILS_STORAGE_KEY, JSON.stringify(accountDetailsToStore));
      localStorage.setItem(SIMULATED_CREDENTIALS_STORAGE_KEY, JSON.stringify(simulatedCredentials));
      toast({ title: "Registro bem-sucedido!", description: "Você pode fazer login agora. Seus dados foram salvos." });
    } catch (error) {
      console.error("Failed to save account details or credentials to localStorage", error);
      toast({ title: "Registro bem-sucedido (parcial)!", description: "Você pode fazer login, mas houve um erro ao salvar os detalhes da conta localmente.", variant: "destructive" });
    }
    
    registerForm.reset();
    setIsLoading(false);
    router.push('/auth'); // Redirect to login page
  };

  return (
    <Card className="w-full max-w-lg shadow-2xl">
      <CardHeader className="text-center">
        <Logo className="justify-center mb-4" />
        <CardTitle className="text-3xl">Crie sua Conta</CardTitle>
        <CardDescription>Preencha os campos abaixo para se registrar no MoneyWise.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...registerForm}>
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={registerForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Sua Empresa LTDA" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Proprietário</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="João Silva" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={registerForm.control}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={registerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
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
              <FormField
                control={registerForm.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <ScanLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="000.000.000-00" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" placeholder="Crie uma senha forte" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" placeholder="Confirme sua senha" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="privacyTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="privacyTerms-register" />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="privacyTerms-register" className="font-normal">
                      Eu concordo com os <Link href="/privacy" target="_blank" className="text-primary hover:underline">termos de privacidade</Link>.
                    </Label>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Registrar
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm text-muted-foreground pt-4">
        <p>
          Já possui uma conta?{' '}
          <Link href="/auth" className="font-medium text-primary hover:underline">
            Faça login
          </Link>
        </p>
        <Button variant="outline" asChild className="w-full max-w-xs">
            <Link href="/auth">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
