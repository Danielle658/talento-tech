
"use client";

import { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, PlusCircle, Edit3, Trash2, Building, Mail, Phone, MapPin, StickyNote, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const customerSchema = z.object({
  name: z.string().min(2, { message: "Nome do cliente é obrigatório." }),
  email: z.string().email({ message: "E-mail inválido." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export interface CustomerEntry extends CustomerFormValues {
  id: string;
}

export const STORAGE_KEY_CUSTOMERS = "moneywise-customers";

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerEntry[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerEntry | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedCustomers = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (storedCustomers) {
      try {
        setCustomers(JSON.parse(storedCustomers));
      } catch (error) {
        console.error("Failed to parse customers from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_CUSTOMERS);
        setCustomers([]); 
        toast({ title: "Erro ao Carregar Clientes", description: "Não foi possível carregar os dados dos clientes. Os dados podem ter sido redefinidos.", variant: "destructive" });
      }
    } else {
        setCustomers([]); 
    }
  }, [toast]);

  useEffect(() => {
    if (isMounted && customers.length > 0) {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } else if (isMounted && customers.length === 0) {
      localStorage.removeItem(STORAGE_KEY_CUSTOMERS); 
    }
  }, [customers, isMounted]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (editingCustomer) {
      form.reset(editingCustomer);
    } else {
      form.reset({ name: "", email: "", phone: "", address: "", notes: "" });
    }
  }, [editingCustomer, form, isFormDialogOpen]);

  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...editingCustomer, ...data } : c).sort((a,b) => a.name.localeCompare(b.name)));
      toast({ title: "Cliente Atualizado!", description: `${data.name} foi atualizado com sucesso.` });
    } else {
      const newCustomer: CustomerEntry = {
        ...data,
        id: `CUST${String(Date.now()).slice(-6)}`,
      };
      setCustomers(prev => [newCustomer, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
      toast({ title: "Cliente Adicionado!", description: `${data.name} foi adicionado.` });
    }
    closeFormDialog();
  };

  const handleAddNewCustomer = () => {
    setEditingCustomer(null);
    setIsFormDialogOpen(true);
  };

  const handleEditCustomer = (customer: CustomerEntry) => {
    setEditingCustomer(customer);
    setIsFormDialogOpen(true);
  };

  const handleDeleteCustomer = (id: string) => {
    const customerToDelete = customers.find(c => c.id === id);
    if (!customerToDelete) return;

    if (!window.confirm(`Tem certeza que deseja excluir o cliente "${customerToDelete.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setCustomers(prev => prev.filter(c => c.id !== id));
    toast({ title: "Cliente Excluído!", description: `${customerToDelete.name} foi removido.`, variant: "destructive" });
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setEditingCustomer(null);
  };

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Contas de Clientes</CardTitle>
            </div>
            <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
                if (!isOpen) closeFormDialog();
                else setIsFormDialogOpen(true);
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNewCustomer}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingCustomer ? "Editar Cliente" : "Adicionar Novo Cliente"}</DialogTitle>
                  <DialogDescription>
                    {editingCustomer ? "Atualize os dados do cliente." : "Preencha os dados do novo cliente."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cliente / Empresa</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="Ex: Empresa Alpha" {...field} className="pl-10" />
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
                          <FormLabel>E-mail (Opcional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input type="email" placeholder="contato@cliente.com" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone (Opcional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="(XX) XXXXX-XXXX" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço (Opcional)</FormLabel>
                          <FormControl>
                             <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="Rua Exemplo, 123, Cidade - UF" {...field} className="pl-10" />
                            </div>
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
                          <FormLabel>Observações (Opcional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                               <StickyNote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                               <Textarea placeholder="Anotações sobre o cliente..." {...field} className="pl-10 min-h-[60px]" />
                            </div>
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
                        {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingCustomer ? "Salvar Alterações" : "Adicionar Cliente")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Gerencie as informações e o histórico dos seus clientes. Os dados são salvos localmente.</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
             <div className="text-center py-10">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">Nenhum cliente cadastrado ainda.</p>
                <p className="text-muted-foreground">Clique em "Adicionar Novo Cliente" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {customers.map((customer) => (
                        <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email || "-"}</TableCell>
                        <TableCell>{customer.phone || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate" title={customer.address || undefined}>{customer.address || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate" title={customer.notes || undefined}>{customer.notes || "-"}</TableCell>
                        <TableCell className="text-center space-x-1">
                            <Button variant="outline" size="sm" onClick={() => handleEditCustomer(customer)} title="Editar Cliente">
                                <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteCustomer(customer.id)} title="Excluir Cliente">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
