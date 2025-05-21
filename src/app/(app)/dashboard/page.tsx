
"use client";

import { useState, useEffect, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { DataSection } from '@/components/dashboard/data-section';
import { DollarSign, Users, FileText, Archive, BarChartBig, TrendingUp, AlertCircle, Package, BellRing, AlertTriangle, FileClock, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, STORAGE_KEY_NOTEBOOK } from '@/app/(app)/dashboard/notebook/page';
import { ProductEntry, STORAGE_KEY_PRODUCTS } from '@/app/(app)/dashboard/products/page';
import { SalesRecordEntry, STORAGE_KEY_SALES_RECORD } from '@/app/(app)/dashboard/sales-record/page';
import { CreditEntry, STORAGE_KEY_CREDIT_NOTEBOOK } from '@/app/(app)/dashboard/credit-notebook/page.tsx';
import { CustomerEntry, STORAGE_KEY_CUSTOMERS } from '@/app/(app)/dashboard/customers/page.tsx';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface DisplayTransaction {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
  type: 'income' | 'expense';
}

interface DisplayProduct {
  id: string;
  name: string;
  sales: number | string;
  revenue: string;
  stock: string | number;
}

const kpiConfigurations = [
  { id: "totalRevenue", title: "Receita Total", icon: DollarSign, defaultDescription: "Calculando..." },
  { id: "totalCustomers", title: "Total de Clientes", icon: Users, defaultDescription: "Aguardando dados" },
  { id: "pendingInvoices", title: "Faturas Pendentes", icon: FileText, defaultDescription: "R$ 0,00" },
  { id: "lowStockProducts", title: "Estoque Baixo", icon: Archive, defaultDescription: "Aguardando dados" },
];

const placeholderNotifications: any[] = []; 

export default function DashboardPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allSalesRecords, setAllSalesRecords] = useState<SalesRecordEntry[]>([]);
  const [productCatalog, setProductCatalog] = useState<ProductEntry[]>([]);
  const [allCreditEntries, setAllCreditEntries] = useState<CreditEntry[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerEntry[]>([]);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const storedTransactions = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
        if (storedTransactions) {
          setAllTransactions(JSON.parse(storedTransactions).map((t: any) => ({...t, date: parseISO(t.date)})));
        } else {
          setAllTransactions([]);
        }
      } catch (error) {
        console.error("Error loading transactions from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_NOTEBOOK);
        setAllTransactions([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Caderneta Digital", description: "Os dados da caderneta digital podem estar corrompidos e foram redefinidos."});
      }

      try {
        const storedSales = localStorage.getItem(STORAGE_KEY_SALES_RECORD);
        if (storedSales) {
          setAllSalesRecords(JSON.parse(storedSales));
        } else {
          setAllSalesRecords([]);
        }
      } catch (error) {
        console.error("Error loading sales records from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_SALES_RECORD);
        setAllSalesRecords([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Histórico de Vendas", description: "Os dados do histórico de vendas podem estar corrompidos e foram redefinidos."});
      }

      try {
        const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (storedProducts) {
          setProductCatalog(JSON.parse(storedProducts));
        } else {
          setProductCatalog([]);
        }
      } catch (error) {
        console.error("Error loading product catalog from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_PRODUCTS);
        setProductCatalog([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Catálogo de Produtos", description: "Os dados dos produtos podem estar corrompidos e foram redefinidos."});
      }

      try {
        const storedCreditEntries = localStorage.getItem(STORAGE_KEY_CREDIT_NOTEBOOK);
        if (storedCreditEntries) {
          const parsedEntries: CreditEntry[] = JSON.parse(storedCreditEntries).map((entry: any) => ({
            ...entry,
            saleDate: parseISO(entry.saleDate),
            dueDate: entry.dueDate ? parseISO(entry.dueDate) : undefined,
          }));
          setAllCreditEntries(parsedEntries);
        } else {
          setAllCreditEntries([]);
        }
      } catch (error) {
        console.error("Error loading credit entries from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_CREDIT_NOTEBOOK);
        setAllCreditEntries([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Caderneta de Fiados", description: "Os dados de fiados podem estar corrompidos e foram redefinidos."});
      }

      try {
        const storedCustomers = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
        if (storedCustomers) {
          setAllCustomers(JSON.parse(storedCustomers));
        } else {
          setAllCustomers([]);
        }
      } catch (error) {
        console.error("Error loading customers from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_CUSTOMERS);
        setAllCustomers([]);
        toast({ variant: "destructive", title: "Erro ao Carregar Clientes", description: "Os dados dos clientes podem estar corrompidos e foram redefinidos."});
      }
    }
  }, [isMounted, toast]);

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

  const pendingInvoicesKPI = useMemo(() => {
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
      case 'pendingInvoices':
        return { ...kpiConfig, value: pendingInvoicesKPI.count, description: `${pendingInvoicesKPI.count} pendentes (${pendingInvoicesKPI.amount})` };
      case 'lowStockProducts':
        return { ...kpiConfig, value: lowStockProductsKPI.value, description: lowStockProductsKPI.description };
      default:
        return { ...kpiConfig, value: "N/A", description: "Erro" };
    }
  });


  if (!isMounted) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Central</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio.</p>
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
              <Button variant="link" className="mt-3 px-0 text-sm">Ver todas as notificações</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChartBig className="h-5 w-5 text-primary" /> Visão Geral das Vendas</CardTitle>
              <CardDescription>Comparativo de vendas mensais.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-4">Gráfico de vendas será exibido aqui.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Atividade de Clientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm">Total de clientes</p>
                    <p className="text-sm font-semibold">{totalCustomersKPI.value}</p>
                </div>
                 <Button className="w-full mt-2" variant="outline" asChild><Link href="/dashboard/customers">Gerenciar Clientes</Link></Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
