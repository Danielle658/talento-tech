
"use client";

import { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { BookUser, PlusCircle, CalendarIcon, CheckCircle, MessageSquare, AlertTriangle, Printer, Share2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid, isToday, isPast, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { AccountDetailsFormValues } from "@/app/(app)/dashboard/settings/page";
import { ACCOUNT_DETAILS_STORAGE_KEY } from '@/lib/constants';


const creditEntrySchema = z.object({
  customerName: z.string().min(2, { message: "Nome do cliente é obrigatório." }),
  amount: z.coerce.number().min(0.01, { message: "O valor deve ser positivo." }),
  saleDate: z.date({ required_error: "Data da venda é obrigatória." }),
  dueDate: z.date().optional(),
  whatsappNumber: z.string().regex(/^(\+?[0-9\s\-()]{8,})$/, { message: "Número de WhatsApp inválido."}).optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type CreditEntryFormValues = z.infer<typeof creditEntrySchema>;

export interface CreditEntry extends CreditEntryFormValues {
  id: string;
  paid: boolean;
  paymentDate?: string; // Store as ISO string for localStorage
}

export const STORAGE_KEY_CREDIT_NOTEBOOK = "moneywise-creditEntries";

export default function CreditNotebookPage() {
  const { toast } = useToast();
  const [creditEntries, setCreditEntries] = useState<CreditEntry[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetailsFormValues | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const storedEntries = localStorage.getItem(STORAGE_KEY_CREDIT_NOTEBOOK);
    if (storedEntries) {
      try {
        const parsedEntries: CreditEntry[] = JSON.parse(storedEntries).map((entry: any) => ({
          ...entry,
          saleDate: parseISO(entry.saleDate),
          dueDate: entry.dueDate ? parseISO(entry.dueDate) : undefined,
        }));
        setCreditEntries(parsedEntries.sort((a,b) => (isValid(b.saleDate) ? b.saleDate.getTime() : 0) - (isValid(a.saleDate) ? a.saleDate.getTime() : 0)));
      } catch (error) {
        console.error("Failed to parse credit entries from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_CREDIT_NOTEBOOK); 
        setCreditEntries([]); // Reset state on error
      }
    } else {
      setCreditEntries([]); // Ensure default empty state
    }

    const storedAccountDetails = localStorage.getItem(ACCOUNT_DETAILS_STORAGE_KEY);
    if (storedAccountDetails) {
        try {
            setAccountDetails(JSON.parse(storedAccountDetails));
        } catch (error) {
            console.error("Failed to parse account details from localStorage for credit notebook", error);
            localStorage.removeItem(ACCOUNT_DETAILS_STORAGE_KEY);
            setAccountDetails(null); // Reset state on error
        }
    }
  }, []);

  useEffect(() => {
    if (isMounted && creditEntries.length > 0) { 
      localStorage.setItem(STORAGE_KEY_CREDIT_NOTEBOOK, JSON.stringify(creditEntries.map(entry => ({
        ...entry,
        saleDate: entry.saleDate.toISOString(), 
        dueDate: entry.dueDate ? entry.dueDate.toISOString() : undefined,
      }))));
    } else if (isMounted && creditEntries.length === 0) {
      localStorage.removeItem(STORAGE_KEY_CREDIT_NOTEBOOK); // Clean up if all entries are removed
    }

    if (isMounted) {
      const today = startOfDay(new Date());
      const dueTodayEntries = creditEntries.filter(entry => 
        !entry.paid && 
        entry.dueDate && 
        isValid(entry.dueDate) && 
        (isToday(entry.dueDate) || isPast(entry.dueDate))
      );

      if (dueTodayEntries.length > 0) {
        // Check if a toast for this specific day has already been shown
        const lastToastDate = localStorage.getItem('moneywise-credit-due-toast-date');
        const todayStr = format(today, 'yyyy-MM-dd');

        if (lastToastDate !== todayStr) {
            toast({
                title: "Lembretes de Fiado",
                description: `Você tem ${dueTodayEntries.length} fiado(s) vencendo hoje ou já vencido(s). Considere enviar lembretes.`,
                duration: 7000,
            });
            localStorage.setItem('moneywise-credit-due-toast-date', todayStr);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditEntries, isMounted]);

  const form = useForm<CreditEntryFormValues>({
    resolver: zodResolver(creditEntrySchema),
    defaultValues: {
      customerName: "",
      amount: 0,
      saleDate: new Date(),
      dueDate: undefined,
      whatsappNumber: "",
      notes: "",
    },
  });

  const onSubmit = (data: CreditEntryFormValues) => {
    const newEntry: CreditEntry = {
      ...data,
      id: `CF${String(Date.now()).slice(-6)}`, 
      paid: false,
    };
    setCreditEntries(prev => [newEntry, ...prev].sort((a,b) => (isValid(b.saleDate) ? b.saleDate.getTime() : 0) - (isValid(a.saleDate) ? a.saleDate.getTime() : 0)));
    toast({
      title: "Fiado Registrado!",
      description: `Nova venda a prazo para ${data.customerName} no valor de R$ ${data.amount.toFixed(2)} registrada.`,
    });
    form.reset({ customerName: "", amount: 0, saleDate: new Date(), dueDate: undefined, whatsappNumber: "", notes: "" });
    setIsAddDialogOpen(false);
  };

  const handleMarkAsPaid = (id: string) => {
    setCreditEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, paid: !entry.paid, paymentDate: !entry.paid ? new Date().toISOString() : undefined } : entry
      )
    );
    const entry = creditEntries.find(e => e.id === id);
    toast({
      title: `Status Alterado!`,
      description: `Fiado de ${entry?.customerName} marcado como ${entry?.paid ? "pendente" : "pago"}.`,
    });
  };

  const handleSendWhatsAppReminder = (entry: CreditEntry) => {
    if (!entry.whatsappNumber) {
      toast({ title: "WhatsApp não informado", description: "Não é possível enviar lembrete pois o número de WhatsApp do cliente não foi cadastrado.", variant: "destructive"});
      return;
    }
    const saleDateFormatted = isValid(entry.saleDate) ? format(entry.saleDate, "dd/MM/yyyy", { locale: ptBR }) : "Data Inválida";
    const dueDateFormatted = entry.dueDate && isValid(entry.dueDate) ? ` O vencimento é/foi em ${format(entry.dueDate, "dd/MM/yyyy", { locale: ptBR })}.` : '';
    const companyNameToUse = accountDetails?.companyName || "seu estabelecimento";
    const message = `Olá ${entry.customerName}, gostaríamos de lembrar sobre o valor de R$${entry.amount.toFixed(2)} pendente com ${companyNameToUse}, referente à sua compra em ${saleDateFormatted}.${dueDateFormatted} Por favor, entre em contato para regularizar. Obrigado!`;
    const whatsappUrl = `https://wa.me/${entry.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast({ title: "Redirecionando para WhatsApp", description: "O lembrete de cobrança está pronto para ser enviado."});
  };

  const handlePrintReceipt = (entry: CreditEntry) => {
    const paymentDate = entry.paymentDate ? parseISO(entry.paymentDate) : new Date();
    const saleDateFormatted = isValid(entry.saleDate) ? format(entry.saleDate, "dd/MM/yyyy", { locale: ptBR }) : "Data Inválida";
    const paymentDateFormatted = isValid(paymentDate) ? format(paymentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Data Inválida";
    const companyNameToUse = accountDetails?.companyName || 'Sua Empresa';

    const receiptWindow = window.open('', '_blank');
    if (receiptWindow) {
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Comprovante de Pagamento</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .container { max-width: 450px; margin: auto; border: 1px solid #ccc; padding: 25px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 1px dashed #eee; padding-bottom: 15px; }
              .header h1 { margin: 0 0 5px 0; font-size: 1.8em; color: #333; }
              .header p { margin: 0; font-size: 1.1em; font-weight: bold; }
              .details p { margin-bottom: 12px; line-height: 1.6; font-size: 1em; }
              .details strong { color: #555; }
              .footer { text-align: center; font-size: 0.9em; margin-top: 30px; color: #777; }
              @media print {
                body { margin: 0; color: #000; }
                .container { border: none; box-shadow: none; max-width: 100%; padding: 0; }
                .header p { font-size: 1.2em; }
                .details p { font-size: 1em; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Comprovante de Pagamento</h1>
                <p>${companyNameToUse}</p>
              </div>
              <div class="details">
                <p><strong>Cliente:</strong> ${entry.customerName}</p>
                <p><strong>Valor Pago:</strong> R$ ${entry.amount.toFixed(2)}</p>
                <p><strong>Data do Pagamento:</strong> ${paymentDateFormatted}</p>
                <p><strong>Referente à Venda de:</strong> ${saleDateFormatted}</p>
                ${entry.notes ? `<p><strong>Observações da Venda:</strong> ${entry.notes}</p>` : ''}
              </div>
              <div class="footer">
                <p>Obrigado pela preferência!</p>
                <p>Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
              </div>
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 250);
            </script>
          </body>
        </html>
      `);
      receiptWindow.document.close();
    } else {
      toast({ title: "Erro ao Abrir Comprovante", description: "Não foi possível abrir a janela para impressão. Verifique as configurações do seu navegador.", variant: "destructive" });
    }
  };

  const handleSendWhatsAppReceipt = (entry: CreditEntry) => {
    if (!entry.whatsappNumber) {
      toast({ title: "WhatsApp não informado", description: "Não é possível enviar comprovante pois o número de WhatsApp do cliente não foi cadastrado.", variant: "destructive"});
      return;
    }
    const paymentDate = entry.paymentDate ? parseISO(entry.paymentDate) : new Date();
    const saleDateFormatted = isValid(entry.saleDate) ? format(entry.saleDate, "dd/MM/yyyy", { locale: ptBR }) : "Data Inválida";
    const paymentDateFormatted = isValid(paymentDate) ? format(paymentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Data Inválida";
    const companyNameToUse = accountDetails?.companyName || 'Sua Empresa';
    
    const message = `🧾 *Comprovante de Pagamento - ${companyNameToUse}*\\n\\nOlá ${entry.customerName},\\nConfirmamos o recebimento de *R$${entry.amount.toFixed(2)}* referente à sua compra de ${saleDateFormatted}.\\n\\nPagamento confirmado em: ${paymentDateFormatted}\\n\\nObrigado!`;
    const whatsappUrl = `https://wa.me/${entry.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
     toast({ title: "Redirecionando para WhatsApp", description: "O comprovante de pagamento está pronto para ser enviado."});
  };

  const totalDue = useMemo(() => {
    if (!isMounted) return 0;
    return creditEntries.filter(entry => !entry.paid).reduce((sum, entry) => sum + entry.amount, 0);
  }, [creditEntries, isMounted]);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookUser className="h-7 w-7 text-primary" />
              <CardTitle className="text-2xl">Caderneta de Fiados</CardTitle>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => form.reset({ customerName: "", amount: 0, saleDate: new Date(), dueDate: undefined, whatsappNumber: "", notes: "" })}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Novo Fiado
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Fiado</DialogTitle>
                  <DialogDescription>Preencha os dados da venda a prazo.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cliente</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Carlos Alberto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="saleDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Data da Venda</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
                                    {field.value && isValid(field.value) ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Data de Vencimento (Opcional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
                                    {field.value && isValid(field.value) ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={ptBR} />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <FormField
                      control={form.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp do Cliente (com DDD, ex: 55119...)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 5511912345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Alguma anotação sobre a venda..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Fiado"}
                        </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Gerencie os registros de vendas a prazo e fiados. Os dados são salvos localmente no seu navegador.</CardDescription>
        </CardHeader>
        <CardContent>
          {creditEntries.length === 0 ? (
            <div className="text-center py-10">
              <BookUser className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Nenhum fiado registrado ainda.</p>
              <p className="text-muted-foreground">Clique em "Adicionar Novo Fiado" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead>Data Venda</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditEntries.map((entry) => {
                    const isOverdue = !entry.paid && entry.dueDate && isValid(entry.dueDate) && isPast(startOfDay(entry.dueDate)) && !isToday(startOfDay(entry.dueDate));
                    const isDueToday = !entry.paid && entry.dueDate && isValid(entry.dueDate) && isToday(startOfDay(entry.dueDate));
                    return (
                    <TableRow 
                        key={entry.id} 
                        className={cn(
                            entry.paid ? "bg-green-500/10" : 
                            (isOverdue || isDueToday) ? "bg-red-500/10 hover:bg-red-500/20" : ""
                        )}
                    >
                      <TableCell className="font-medium">{entry.customerName}</TableCell>
                      <TableCell className="text-right">{entry.amount.toFixed(2)}</TableCell>
                      <TableCell>{isValid(entry.saleDate) ? format(entry.saleDate, "dd/MM/yy", { locale: ptBR }) : "Inválido"}</TableCell>
                      <TableCell>{entry.dueDate && isValid(entry.dueDate) ? format(entry.dueDate, "dd/MM/yy", { locale: ptBR }) : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={entry.paid ? "default" : "destructive"} className={cn(entry.paid ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}>
                          {entry.paid ? "Pago" : "Pendente"}
                        </Badge>
                        {!entry.paid && (isOverdue || isDueToday) && (
                          <Badge variant="destructive" className="ml-2 bg-orange-500 hover:bg-orange-600">
                            {isOverdue ? "Vencido" : "Vence Hoje"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.notes || undefined}>{entry.notes || "-"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center space-x-1 md:space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(entry.id)} title={entry.paid ? "Marcar como Pendente" : "Marcar como Pago"}>
                            {entry.paid ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          {!entry.paid && (
                            <Button variant="outline" size="sm" onClick={() => handleSendWhatsAppReminder(entry)} title="Cobrar via WhatsApp" disabled={!entry.whatsappNumber}>
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          {entry.paid && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handlePrintReceipt(entry)} title="Imprimir Comprovante">
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleSendWhatsAppReceipt(entry)} title="Enviar Comprovante via WhatsApp" disabled={!entry.whatsappNumber}>
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {creditEntries.length > 0 && (
          <CardFooter className="flex flex-col items-end pt-4 border-t">
            <div className="text-lg font-semibold">
              Total Pendente: <span className="text-primary">R$ {totalDue.toFixed(2)}</span>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

    

    