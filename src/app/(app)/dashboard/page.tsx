
"use client";

import { useState, useEffect, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { DataSection } from '@/components/dashboard/data-section';
import { DollarSign, Users, FileText, Archive, BarChartBig, AlertTriangle, Package, BellRing, FileClock, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, STORAGE_KEY_NOTEBOOK_BASE } from '@/app/(app)/dashboard/notebook/page';
import { ProductEntry, STORAGE_KEY_PRODUCTS_BASE } from '@/app/(app)/dashboard/products/page';
import { SalesRecordEntry, STORAGE_KEY_SALES_RECORD_BASE } from '@/app/(app)/dashboard/sales-record/page';
import { CreditEntry, STORAGE_KEY_CREDIT_NOTEBOOK_BASE } from '@/app/(app)/dashboard/credit-notebook/page.tsx';
import { CustomerEntry, STORAGE_KEY_CUSTOMERS_BASE } from '@/app/(app)/dashboard/customers/page.tsx';
import { format, parseISO, isValid, subDays, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useAuth } from '@/hooks/use-auth';
import { getCompanySpecificKey } from '@/lib/constants';


interface DisplayTransaction {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
  type: 'income' | 'expense';
}

interface DisplayProduct {
  id:string;
  name: string;
  sales: number | string;
  revenue: string;
  stock: string | number;
}

const kpiConfigurations = [
  { id: "totalRevenue", title: "Receita Total", icon: DollarSign, defaultDescription: "Calculando..." },
  { id: "totalCustomers", title: "Total de Clientes", icon: Users, defaultDescription: "Aguardando dados" },
  { id: "pendingInvoices", title: "Fiados Pendentes", icon: FileText, defaultDescription: "R$ 0,00" }, // Changed from Faturas
  { id: "lowStockProducts", title: "Estoque Baixo", icon: Archive, defaultDescription: "Aguardando dados" },
];

const placeholderNotifications: any[] = [];

const salesChartConfig = {
  Vendas: {
    label: "Vendas (R$)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // States for raw data
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allSalesRecords, setAllSalesRecords] = useState<SalesRecordEntry[]>([]);
  const [productCatalog, setProductCatalog] = useState<ProductEntry[]>([]);
  const [allCreditEntries, setAllCreditEntries] = useState<CreditEntry[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerEntry[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && currentCompany) {
      const companyNotebookKey = getCompanySpecificKey(STORAGE_KEY_NOTEBOOK_BASE, currentCompany);
      const companySalesKey = getCompanySpecificKey(STORAGE_KEY_SALES_RECORD_BASE, currentCompany);
      const companyProductsKey = getCompanySpecificKey(STORAGE_KEY_PRODUCTS_BASE, currentCompany);
      const companyCreditKey = getCompanySpecificKey(STORAGE_KEY_CREDIT_NOTEBOOK_BASE, currentCompany);
      const companyCustomersKey = getCompanySpecificKey(STORAGE_KEY_CUSTOMERS_BASE, currentCompany);

      try {
        if (companyNotebookKey) {
          const storedTransactions = localStorage.getItem(companyNotebookKey);
          setAllTransactions(storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, date: parseISO(t.date)})) : []);
        }
      } catch (error) {
        console.error("Error loading transactions from localStorage for", currentCompany, error);
        if (companyNotebookKey) localStorage.removeItem(companyNotebookKey);
        setAllTransactions([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Caderneta Digital", description: "Os dados da caderneta digital podem estar corrompidos e foram redefinidos."});
      }

      try {
        if (companySalesKey) {
          const storedSales = localStorage.getItem(companySalesKey);
          setAllSalesRecords(storedSales ? JSON.parse(storedSales) : []);
        }
      } catch (error) {
        console.error("Error loading sales records from localStorage for", currentCompany, error);
        if (companySalesKey) localStorage.removeItem(companySalesKey);
        setAllSalesRecords([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Histórico de Vendas", description: "Os dados do histórico de vendas podem estar corrompidos e foram redefinidos."});
      }

      try {
        if (companyProductsKey) {
          const storedProducts = localStorage.getItem(companyProductsKey);
          setProductCatalog(storedProducts ? JSON.parse(storedProducts) : []);
        }
      } catch (error) {
        console.error("Error loading product catalog from localStorage for", currentCompany, error);
        if (companyProductsKey) localStorage.removeItem(companyProductsKey);
        setProductCatalog([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Catálogo de Produtos", description: "Os dados dos produtos podem estar corrompidos e foram redefinidos."});
      }

      try {
        if (companyCreditKey) {
          const storedCreditEntries = localStorage.getItem(companyCreditKey);
          setAllCreditEntries(storedCreditEntries ? JSON.parse(storedCreditEntries).map((entry: any) => ({
              ...entry,
              saleDate: parseISO(entry.saleDate),
              dueDate: entry.dueDate ? parseISO(entry.dueDate) : undefined,
            })) : []);
        }
      } catch (error) {
        console.error("Error loading credit entries from localStorage for", currentCompany, error);
        if (companyCreditKey) localStorage.removeItem(companyCreditKey);
        setAllCreditEntries([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Caderneta de Fiados", description: "Os dados de fiados podem estar corrompidos e foram redefinidos."});
      }

      try {
        if (companyCustomersKey) {
          const storedCustomers = localStorage.getItem(companyCustomersKey);
          setAllCustomers(storedCustomers ? JSON.parse(storedCustomers) : []);
        }
      } catch (error) {
        console.error("Error loading customers from localStorage for", currentCompany, error);
        if (companyCustomersKey) localStorage.removeItem(companyCustomersKey);
        setAllCustomers([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Clientes", description: "Os dados dos clientes podem estar corrompidos e foram redefinidos."});
      }
    } else if (isMounted && !currentCompany) {
      // Clear data if no company is logged in (e.g., after logout)
      setAllTransactions([]);
      setAllSalesRecords([]);
      setProductCatalog([]);
      setAllCreditEntries([]);
      setAllCustomers([]);
    }
  }, [isMounted, currentCompany, toast]);

  const recentTransactionsData = useMemo((): DisplayTransaction[] => {
    if (!isMounted || !allTransactions) return [];
    return allTransactions
      .sort((a, b) => (isValid(b.date) ? b.date.getTime() : 0) - (isValid(a.date) ? a.date.getTime() : 0))
      .slice(0, 4)
      .map(t => ({
        id: t.id,
        customer: t.description.substring(0, 30) + (t.description.length > 30 ? '...' : ''),
        date: isValid(t.date) ? format(t.date, "dd/MM/yyyy", { locale: ptBR }) : "Data Inválida",
        amount: `R$ ${t.amount.toFixed(2)}`,
        status: t.type === 'income' ? 'Receita' : 'Despesa',
        type: t.type
      }));
  }, [isMounted, allTransactions]);

  const topSellingProductsData = useMemo((): DisplayProduct[] => {
    if (!isMounted || !allSalesRecords || !productCatalog) return [];

    if (allSalesRecords.length > 0) {
      const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number; stock: string }>();

      allSalesRecords.forEach(sale => {
        sale.items.forEach(item => {
          const existing = productSalesMap.get(item.productId);
          const productDetails = productCatalog.find(p => p.id === item.productId);
          const stockInfo = productDetails?.stock || "N/A";

          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += item.quantity * item.unitPrice;
          } else {
            productSalesMap.set(item.productId, {
              name: item.name,
              quantity: item.quantity,
              revenue: item.quantity * item.unitPrice,
              stock: stockInfo
            });
          }
        });
      });

      return Array.from(productSalesMap.entries())
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 3)
        .map(([id, data]) => ({
          id,
          name: data.name,
          sales: data.quantity,
          revenue: `R$ ${data.revenue.toFixed(2)}`,
          stock: data.stock,
        }));
    } else if (productCatalog.length > 0) {
      return productCatalog.slice(0,3).map(p => ({
         id: p.id,
         name: p.name,
         sales: "N/A",
         revenue: `R$ ${p.price.toFixed(2)} (Preço)`,
         stock: p.stock || "N/A"
       }));
    }
    return [];
  }, [isMounted, allSalesRecords, productCatalog]);

  const totalRevenueKPI = useMemo(() => {
    if (!isMounted || !allTransactions) return { value: "R$ 0,00", description: "Calculando..." };
    const income = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    return { value: `R$ ${income.toFixed(2)}`, description: allTransactions.length > 0 ? `Baseado em ${allTransactions.filter(t=>t.type === 'income').length} receitas` : "Nenhuma receita registrada" };
  }, [isMounted, allTransactions]);

  const totalCustomersKPI = useMemo(() => {
    if (!isMounted || !allCustomers) return { value: "0", description: "Aguardando dados" };
    return { value: `${allCustomers.length}`, description: "Total de clientes cadastrados" };
  }, [isMounted, allCustomers]);

  const pendingInvoicesKPI = useMemo(() => { // Renamed from pendingInvoicesKPI
    if (!isMounted || !allCreditEntries) return { count: "0", amount: "R$ 0,00" };
    const pending = allCreditEntries.filter(entry => !entry.paid && isValid(entry.saleDate));
    const totalDue = pending.reduce((sum, entry) => sum + entry.amount, 0);
    return { count: `${pending.length}`, amount: `R$ ${totalDue.toFixed(2)}` };
  }, [isMounted, allCreditEntries]);

  const lowStockThreshold = 5;
  const lowStockProductsKPI = useMemo(() => {
    if (!isMounted || !productCatalog) return { value: "0", description: "Aguardando dados do catálogo" };
    const lowStockCount = productCatalog.filter(p => {
      const stockNumber = parseInt(p.stock || "0", 10);
      return !isNaN(stockNumber) && stockNumber <= lowStockThreshold && stockNumber > 0;
    }).length;
    return { value: `${lowStockCount}`, description: `Produtos com ${lowStockThreshold} ou menos unidades` };
  }, [isMounted, productCatalog]);

  const dynamicKpis = kpiConfigurations.map(kpiConfig => {
    switch (kpiConfig.id) {
      case 'totalRevenue':
        return { ...kpiConfig, value: totalRevenueKPI.value, description: totalRevenueKPI.description };
      case 'totalCustomers':
        return { ...kpiConfig, value: totalCustomersKPI.value, description: totalCustomersKPI.description };
      case 'pendingInvoices': // Updated ID
        return { ...kpiConfig, value: pendingInvoicesKPI.count, description: `${pendingInvoicesKPI.count} pendentes (${pendingInvoicesKPI.amount})` };
      case 'lowStockProducts':
        return { ...kpiConfig, value: lowStockProductsKPI.value, description: lowStockProductsKPI.description };
      default:
        return { ...kpiConfig, value: "N/A", description: "Erro" };
    }
  });

  const dailySalesChartData = useMemo(() => {
    if (!isMounted || !allSalesRecords) return [];

    const today = startOfDay(new Date());
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const currentDate = subDays(today, i);
      const salesForDay = allSalesRecords.filter(sale => {
        const saleDate = parseISO(sale.date);
        return isValid(saleDate) && isSameDay(saleDate, currentDate);
      }).reduce((sum, sale) => sum + sale.totalAmount, 0);

      data.push({
        date: format(currentDate, "dd/MM", { locale: ptBR }),
        Vendas: salesForDay,
      });
    }
    return data;
  }, [isMounted, allSalesRecords]);


  if (!isMounted || (isMounted && !currentCompany && isLoading)) { // Show loader if not mounted OR if mounted but no company yet (still loading auth context)
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isMounted && !currentCompany && !isLoading) { // If mounted, no company, and auth loading is finished
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center text-center">
        <p className="text-muted-foreground">Por favor, faça login para ver os dados da sua empresa.</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Central</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio: {currentCompany || "Empresa não identificada"}.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dynamicKpis.map((kpi) => (
          <KpiCard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} description={kpi.description} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DataSection
            title="Caderneta Digital (Últimas Transações)"
            description="Acompanhe as últimas movimentações financeiras."
            action={<Button variant="outline" size="sm" asChild><Link href="/dashboard/notebook">Ver Todas</Link></Button>}
          >
            {recentTransactionsData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactionsData.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.customer}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell className={cn("text-right font-semibold", transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                        {transaction.type === 'expense' && '-'}{transaction.amount}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={transaction.type === "income" ? "default" : "destructive"}
                          className={cn(
                            transaction.type === "income" ? "bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30" :
                            "bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30"
                          )}
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">Nenhuma transação recente encontrada.</p>
            )}
          </DataSection>

          <DataSection
            title="Produtos Mais Vendidos"
            description="Produtos com melhor desempenho em vendas."
            action={<Button variant="outline" size="sm" asChild><Link href="/dashboard/products">Ver Catálogo</Link></Button>}
          >
             {topSellingProductsData.length > 0 ? (
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Vendas (Unid.)</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead>Estoque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSellingProductsData.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.sales}</TableCell>
                      <TableCell className="text-right">{product.revenue}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             ) : (
                <p className="text-muted-foreground text-center py-4">Dados de vendas de produtos ainda não disponíveis. Registre vendas no PDV.</p>
             )}
          </DataSection>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" /> Notificações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {placeholderNotifications.length > 0 ? (
                <ul className="space-y-4">
                  {placeholderNotifications.map((notif) => (
                    <li key={notif.id} className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-full flex items-center justify-center", notif.iconBg)}>
                        <notif.icon className={cn("h-4 w-4", notif.iconColor)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma notificação nova.</p>
              )}
              {/* <Button variant="link" className="mt-3 px-0 text-sm">Ver todas as notificações</Button> */}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChartBig className="h-5 w-5 text-primary" /> Visão Geral das Vendas</CardTitle>
              <CardDescription>Vendas diárias nos últimos 7 dias.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {dailySalesChartData.some(d => d.Vendas > 0) ? ( // Check if there's any sales data to display
                <ChartContainer config={salesChartConfig} className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySalesChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8}
                        fontSize={12}
                      />
                      <YAxis 
                        tickFormatter={(value) => `R$${Number.isInteger(value/1000) ? value/1000 : (value/1000).toFixed(1)}k`}
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8}
                        width={45} // Adjusted width
                        fontSize={12}
                      />
                      <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent 
                                  formatter={(value, name) => (
                                    <div className="flex flex-col">
                                      <span className="text-xs text-muted-foreground">{name}</span>
                                      <span className="font-bold">R$ {Number(value).toFixed(2)}</span>
                                    </div>
                                  )}
                                  indicator="dot" 
                                />}
                      />
                      <Bar dataKey="Vendas" fill="var(--color-Vendas)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhuma venda registrada nos últimos 7 dias.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
