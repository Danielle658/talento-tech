
"use client";

import { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, PlusCircle, CalendarIcon, ArrowUpCircle, ArrowDownCircle, BarChart2, DollarSign, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfMonth, subMonths, endOfMonth, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const transactionSchema = z.object({
  description: z.string().min(2, { message: "Descrição é obrigatória." }),
  amount: z.coerce.number().min(0.01, { message: "O valor deve ser positivo." }),
  type: z.enum(["income", "expense"], { required_error: "Tipo de transação é obrigatório." }),
  date: z.date({ required_error: "Data é obrigatória." }),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export interface Transaction extends TransactionFormValues {
  id: string;
}

export const STORAGE_KEY_NOTEBOOK = "moneywise-transactions";

const chartConfig = {
  income: {
    label: "Receitas",
    color: "hsl(var(--chart-2))",
  },
  expense: {
    label: "Despesas",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;


export default function NotebookPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedTransactions = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
    if (storedTransactions) {
      try {
        const parsedTransactions: Transaction[] = JSON.parse(storedTransactions).map((t: any) => ({
          ...t,
          date: parseISO(t.date),
        }));
        setTransactions(parsedTransactions.sort((a,b) => b.date.getTime() - a.date.getTime()));
      } catch (error) {
        console.error("Failed to parse transactions from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_NOTEBOOK);
        setTransactions([]); 
        toast({ title: "Erro ao Carregar Transações", description: "Não foi possível carregar os dados da caderneta digital. Os dados podem ter sido redefinidos.", variant: "destructive" });
      }
    } else {
      setTransactions([]); 
    }
  }, [toast]);

  useEffect(() => {
    if (isMounted && transactions.length > 0) { 
      localStorage.setItem(STORAGE_KEY_NOTEBOOK, JSON.stringify(
        transactions.map(t => ({...t, date: t.date.toISOString() })) 
      ));
    } else if (isMounted && transactions.length === 0) {
      localStorage.removeItem(STORAGE_KEY_NOTEBOOK); 
    }
  }, [transactions, isMounted]);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: undefined,
      date: new Date(),
    },
  });

  const onSubmitTransaction = (data: TransactionFormValues) => {
    const newTransaction: Transaction = {
      ...data,
      id: `T${String(Date.now()).slice(-6)}`,
    };
    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
    toast({
      title: "Transação Registrada!",
      description: `${data.type === "income" ? "Receita" : "Despesa"} de ${data.description} no valor de R$ ${data.amount.toFixed(2)} registrada.`,
    });
    form.reset({ date: new Date(), amount: 0, description: "", type: undefined });
    setIsAddTransactionDialogOpen(false);
  };

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    if (!isMounted) return { totalIncome: 0, totalExpense: 0, balance: 0 };
    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [transactions, isMounted]);

  const monthlyChartData = useMemo(() => {
    if (!isMounted) return [];
    const data: { month: string; income: number; expense: number }[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) { 
      const targetMonthDate = subMonths(today, i);
      const monthKey = format(targetMonthDate, "MMM/yy", { locale: ptBR });
      const monthStart = startOfMonth(targetMonthDate);
      const monthEnd = endOfMonth(targetMonthDate);

      const monthIncome = transactions
        .filter(t => t.type === "income" && isValid(t.date) && t.date >= monthStart && t.date <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpense = transactions
        .filter(t => t.type === "expense" && isValid(t.date) && t.date >= monthStart && t.date <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({ month: monthKey, income: monthIncome, expense: monthExpense });
    }
    return data;
  }, [transactions, isMounted]);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-7 w-7 text-primary" />
              <CardTitle className="text-2xl">Caderneta Digital</CardTitle>
            </div>
            <Dialog open={isAddTransactionDialogOpen} onOpenChange={setIsAddTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => form.reset({ date: new Date(), amount: 0, description: "", type: undefined })}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Transação</DialogTitle>
                  <DialogDescription>Registre uma nova receita ou despesa.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitTransaction)} className="space-y-4 py-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Venda de Produto X" {...field} />
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
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="income">
                                  <span className="flex items-center"><ArrowUpCircle className="mr-2 h-4 w-4 text-green-500" /> Receita</span>
                                </SelectItem>
                                <SelectItem value="expense">
                                  <span className="flex items-center"><ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" /> Despesa</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data</FormLabel>
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
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Transação"}
                        </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Gerencie suas receitas, despesas e acompanhe o fluxo de caixa. Os dados são salvos localmente no seu navegador.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ {totalIncome.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">R$ {totalExpense.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", balance >= 0 ? "text-primary" : "text-destructive")}>
                  R$ {balance.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                <CardTitle>Desempenho Mensal</CardTitle>
              </div>
              <CardDescription>Receitas vs. Despesas nos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0,3)}
                    />
                    <YAxis 
                      tickFormatter={(value) => `R$${value/1000}k`} 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8} 
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} name="Receitas" />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>Lista de todas as receitas e despesas registradas.</CardDescription>
            </CardHeader>
            <CardContent>
            {transactions.length === 0 ? (
                <div className="text-center py-10">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium">Nenhuma transação registrada ainda.</p>
                    <p className="text-muted-foreground">Clique em "Adicionar Transação" para começar.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor (R$)</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                        <TableCell>{isValid(transaction.date) ? format(transaction.date, "dd/MM/yyyy", { locale: ptBR }) : "Inválida"}</TableCell>
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", 
                                transaction.type === "income" ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300"
                            )}>
                            {transaction.type === "income" ? "Receita" : "Despesa"}
                            </span>
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold",
                            transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                            {transaction.type === "expense" && "-"}R$ {transaction.amount.toFixed(2)}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>;
}
