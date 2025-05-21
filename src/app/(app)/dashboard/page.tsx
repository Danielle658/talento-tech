
"use client";

import { useState, useEffect, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { DataSection } from '@/components/dashboard/data-section';
import { DollarSign, Users, FileText, Archive, BarChartBig, TrendingUp, AlertCircle, Package, BellRing, AlertTriangle, FileClock, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link'; // Added import for Link
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, STORAGE_KEY_NOTEBOOK } from '@/app/(app)/dashboard/notebook/page';
import { ProductEntry, STORAGE_KEY_PRODUCTS } from '@/app/(app)/dashboard/products/page';
import { SalesRecordEntry, STORAGE_KEY_SALES_RECORD } from '@/app/(app)/dashboard/sales-record/page';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';


const kpis = [
  { title: "Receita Total", value: "R$ 45.231,89", icon: DollarSign, description: "+20.1% do último mês" },
  { title: "Novos Clientes", value: "+230", icon: Users, description: "+180.1% do último mês" },
  { title: "Faturas Pendentes", value: "12", icon: FileText, description: "R$ 12.580,00" },
  { title: "Produtos em Estoque Baixo", value: "5", icon: Archive, description: "Reposição necessária" },
];

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


const placeholderNotifications = [
  { id: 'notif1', icon: DollarSign, iconBg: 'bg-green-100 dark:bg-green-700/30', iconColor: 'text-green-600 dark:text-green-400', title: 'Nova venda de R$ 150,00 registrada.', time: '2 minutos atrás' },
  { id: 'notif2', icon: AlertTriangle, iconBg: 'bg-yellow-100 dark:bg-yellow-700/30', iconColor: 'text-yellow-600 dark:text-yellow-400', title: 'Produto "Cabo USB-C" com estoque baixo (2 unidades).', time: '1 hora atrás' },
  { id: 'notif3', icon: FileClock, iconBg: 'bg-red-100 dark:bg-red-700/30', iconColor: 'text-red-600 dark:text-red-400', title: 'Fatura #F2300 para "Empresa Sol" vence amanhã.', time: '1 dia atrás' },
];


export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allSalesRecords, setAllSalesRecords] = useState<SalesRecordEntry[]>([]);
  const [productCatalog, setProductCatalog] = useState<ProductEntry[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const storedTransactions = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
        if (storedTransactions) {
          setAllTransactions(JSON.parse(storedTransactions).map((t: any) => ({...t, date: parseISO(t.date)})));
        }
      } catch (error) {
        console.error("Error loading transactions from localStorage", error);
      }

      try {
        const storedSales = localStorage.getItem(STORAGE_KEY_SALES_RECORD);
        if (storedSales) {
          setAllSalesRecords(JSON.parse(storedSales));
        }
      } catch (error) {
        console.error("Error loading sales records from localStorage", error);
      }

      try {
        const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        if (storedProducts) {
          setProductCatalog(JSON.parse(storedProducts));
        }
      } catch (error) {
        console.error("Error loading product catalog from localStorage", error);
      }
    }
  }, [isMounted]);

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
      // Fallback if no sales, show some products from catalog
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

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
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

        {/* Sidebar/Aside content area */}
        <div className="lg:col-span-1 space-y-6">
          {/* Notifications Card */}
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
                    <p className="text-sm">Novos clientes este mês</p>
                    <p className="text-sm font-semibold">+15</p> {/* Placeholder */}
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm">Clientes ativos</p>
                    <p className="text-sm font-semibold">128</p> {/* Placeholder */}
                </div>
                 <Button className="w-full mt-2" variant="outline" asChild><Link href="/dashboard/customers">Gerenciar Clientes</Link></Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}


    

    

    