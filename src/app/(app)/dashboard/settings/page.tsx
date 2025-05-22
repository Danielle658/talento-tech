
"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save, Loader2, Building2, User, Mail, Phone, ScanLine, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ACCOUNT_DETAILS_STORAGE_KEY } from '@/lib/constants'; 

const phoneRegex = /^\(?([1-9]{2})\)?[\s-]?9?(\d{4})[\s-]?(\d{4})$/;
function isValidCPF(cpf: string): boolean {
  if (typeof cpf !== 'string') return false;
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const digits = cpf.split('').map(Number);
  const calcDigit = (sliceEnd: number, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < sliceEnd; i++) { sum += digits[i] * weights[i]; }
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

const accountDetailsSchema = z.object({
  companyName: z.string().min(2, { message: "Nome da empresa é obrigatório." }),
  ownerName: z.string().min(2, { message: "Nome do proprietário é obrigatório." }),
  email: z.string().email({ message: "E-mail inválido." }),
  phone: z.string().regex(phoneRegex, { message: "Número de telefone inválido." }),
  cpf: z.string()
    .min(11, { message: "CPF deve ter 11 dígitos." })
    .max(14, { message: "CPF inválido."})
    .refine(value => isValidCPF(value.replace(/[^\d]+/g, '')), { message: "CPF inválido." }),
  profilePictureDataUri: z.string().optional(),
});

export type AccountDetailsFormValues = z.infer<typeof accountDetailsSchema>;


export default function SettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<AccountDetailsFormValues>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: {
      companyName: "",
      ownerName: "",
      email: "",
      phone: "",
      cpf: "",
      profilePictureDataUri: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
    const storedDetails = localStorage.getItem(ACCOUNT_DETAILS_STORAGE_KEY);
    if (storedDetails) {
      try {
        const parsedDetails = JSON.parse(storedDetails);
        form.reset(parsedDetails);
        if (parsedDetails.profilePictureDataUri) {
          setImagePreview(parsedDetails.profilePictureDataUri);
        }
      } catch (error) {
        console.error("Failed to parse account details from localStorage", error);
        localStorage.removeItem(ACCOUNT_DETAILS_STORAGE_KEY); 
        form.reset({ companyName: "", ownerName: "", email: "", phone: "", cpf: "", profilePictureDataUri: ""});
        toast({
          title: "Erro ao Carregar Dados da Conta",
          description: "Não foi possível carregar os dados da conta salvos. As informações podem ter sido redefinidas.",
          variant: "destructive",
        });
      }
    }
  }, [form, toast]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Arquivo Muito Grande",
          description: "Por favor, selecione uma imagem menor que 2MB.",
          variant: "destructive",
        });
        event.target.value = ""; // Clear the input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue("profilePictureDataUri", dataUri);
        setImagePreview(dataUri);
      };
      reader.onerror = () => {
        toast({
          title: "Erro ao Ler Imagem",
          description: "Não foi possível processar a imagem selecionada.",
          variant: "destructive",
        });
      }
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: AccountDetailsFormValues) => {
    setIsSaving(true);
    try {
      localStorage.setItem(ACCOUNT_DETAILS_STORAGE_KEY, JSON.stringify(data));
      toast({
        title: "Dados Salvos!",
        description: "As informações da sua conta foram atualizadas com sucesso.",
      });
      // Trigger re-render of layout to update avatar
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Failed to save account details to localStorage", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as informações da conta. Verifique o console para mais detalhes. Pode ser um problema de limite de armazenamento do navegador se a imagem for muito grande.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const ownerInitials = form.getValues("ownerName")
    ? form.getValues("ownerName").split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase()
    : "MW";

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Configurações da Conta</CardTitle>
          </div>
          <CardDescription>Gerencie as informações da sua empresa, de contato e foto de perfil.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormItem>
                <FormLabel>Foto de Perfil</FormLabel>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={imagePreview || undefined} alt="Foto de perfil" data-ai-hint="user profile"/>
                    <AvatarFallback>{ownerInitials}</AvatarFallback>
                  </Avatar>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange}
                    className="max-w-xs"
                  />
                </div>
                <FormDescription>
                  Recomendamos uma imagem quadrada (PNG, JPG, WEBP, máx 2MB).
                </FormDescription>
                <FormMessage>{form.formState.errors.profilePictureDataUri?.message}</FormMessage>
              </FormItem>

              <FormField
                control={form.control}
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
                control={form.control}
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail de Contato</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="email" placeholder="seu@email.com" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF do Proprietário</FormLabel>
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
               <p className="text-sm text-muted-foreground">
                Outras configurações da aplicação, como preferências de notificação e temas, estarão disponíveis aqui em breve.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
