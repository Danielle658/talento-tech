
"use client";

import { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { BookUser, PlusCircle, CalendarIcon, CheckCircle, MessageSquare, AlertTriangle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const creditEntrySchema = z.object({
  customerName: z.string().min(2, { message: "Nome do cliente é obrigatório." }),
  amount: z.coerce.number().min(0.01, { message: "O valor deve ser positivo." }),
  saleDate: z.date({ required_error: "Data da venda é obrigatória." }),
  dueDate: z.date().optional(),
  whatsappNumber: z.string().regex(/^(\+?[0-9\s\-()]{8,})$/, { message: "Número de WhatsApp inválido."}).optional().or(z.literal('')),
  notes: z.string().optional(),
});

type CreditEntryFormValues = z.infer<typeof creditEntrySchema>;

interface CreditEntry extends CreditEntryFormValues {
  id: string;
  paid: boolean;
}

const sampleCreditEntries: CreditEntry[] = [
  { id: "CF001", customerName: "Maria Silva", amount: 150.75, saleDate: new Date("2024-07-10"), dueDate: new Date("2024-08-10"), whatsappNumber: "5511999998888", notes: "Pagamento prometido para o dia 10.", paid: false },
  { id: "CF002", customerName: "João Santos", amount: 85.00, saleDate: new Date("2024-06-20"), dueDate: new Date("2024-07-20"), whatsappNumber: "5521988887777", notes: "Já passou do vencimento.", paid: false },
  { id: "CF003", customerName: "Ana Pereira", amount: 230.50, saleDate: new Date("2024-07-01"), paid: true },
];


export default function CreditNotebookPage() {
  const { toast } = useToast();
  const [creditEntries, setCreditEntries] = useState<CreditEntry[]>(sampleCreditEntries);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
      id: `CF${String(creditEntries.length + 1).padStart(3, '0')}`,
      paid: false,
    };
    setCreditEntries(prev => [newEntry, ...prev]);
    toast({
      title: "Fiado Registrado!",
      description: `Nova venda a prazo para ${data.customerName} no valor de R$ ${data.amount.toFixed(2)} registrada.`,
    });
    form.reset();
    setIsAddDialogOpen(false);
  };

  const handleMarkAsPaid = (id: string) => {
    setCreditEntries(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, paid: !entry.paid } : entry
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
    const message = `Olá ${entry.customerName}, gostaríamos de lembrar sobre o valor de R$${entry.amount.toFixed(2)} pendente referente à sua compra em ${format(entry.saleDate, "dd/MM/yyyy", { locale: ptBR })}.${entry.dueDate ? ` O vencimento é/foi em ${format(entry.dueDate, "dd/MM/yyyy", { locale: ptBR })}.` : ''} Por favor, entre em contato para regularizar. Obrigado!`;
    const whatsappUrl = `https://wa.me/${entry.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const totalDue = useMemo(() => {
    return creditEntries.filter(entry => !entry.paid).reduce((sum, entry) => sum + entry.amount, 0);
  }, [creditEntries]);

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
                <Button onClick={() => form.reset()}>
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
                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
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
                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
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
                            {form.formState.isSubmitting ? "Salvando..." : "Salvar Fiado"}
                        </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Gerencie os registros de vendas a prazo e fiados.</CardDescription>
        </CardHeader>
        <CardContent>
          {creditEntries.length === 0 ? (
            <div className="text-center py-10">
              <BookUser className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Nenhum fiado registrado ainda.</p>
              <p className="text-muted-foreground">Clique em "Adicionar Novo Fiado" para começar.</p>
              <img 
                src="https://placehold.co/600x300.png" 
                alt="Placeholder Caderneta de Fiados Vazia" 
                className="rounded-lg shadow-md mt-6 mx-auto"
                data-ai-hint="empty state finance" 
              />
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
                  {creditEntries.map((entry) => (
                    <TableRow key={entry.id} className={cn(entry.paid ? "bg-green-500/10" : new Date(entry.dueDate || 0) < new Date() && !entry.paid ? "bg-red-500/10" : "")}>
                      <TableCell className="font-medium">{entry.customerName}</TableCell>
                      <TableCell className="text-right">{entry.amount.toFixed(2)}</TableCell>
                      <TableCell>{format(entry.saleDate, "dd/MM/yy", { locale: ptBR })}</TableCell>
                      <TableCell>{entry.dueDate ? format(entry.dueDate, "dd/MM/yy", { locale: ptBR }) : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={entry.paid ? "default" : "destructive"} className={cn(entry.paid ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}>
                          {entry.paid ? "Pago" : "Pendente"}
                        </Badge>
                        {!entry.paid && entry.dueDate && new Date(entry.dueDate) < new Date() && (
                          <Badge variant="destructive" className="ml-2 bg-orange-500 hover:bg-orange-600">Vencido</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.notes}>{entry.notes || "-"}</TableCell>
                      <TableCell className="text-center space-x-1 md:space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(entry.id)} title={entry.paid ? "Marcar como Pendente" : "Marcar como Pago"}>
                          {entry.paid ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        {!entry.paid && (
                        <Button variant="outline" size="sm" onClick={() => handleSendWhatsAppReminder(entry)} title="Cobrar via WhatsApp" disabled={!entry.whatsappNumber}>
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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

    