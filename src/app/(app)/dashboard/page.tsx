import { KpiCard } from '@/components/dashboard/kpi-card';
import { DataSection } from '@/components/dashboard/data-section';
import { VirtualAssistant } from '@/components/dashboard/virtual-assistant';
import { DollarSign, Users, FileText, Archive, BarChartBig, TrendingUp, AlertCircle, Package } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const kpis = [
  { title: "Receita Total", value: "R$ 45.231,89", icon: DollarSign, description: "+20.1% do último mês" },
  { title: "Novos Clientes", value: "+230", icon: Users, description: "+180.1% do último mês" },
  { title: "Faturas Pendentes", value: "12", icon: FileText, description: "R$ 12.580,00" },
  { title: "Produtos em Estoque Baixo", value: "5", icon: Archive, description: "Reposição necessária" },
];

const recentTransactions = [
  { id: "TRX001", customer: "Empresa Alpha", date: "2024-07-25", amount: "R$ 1.250,00", status: "Pago" },
  { id: "TRX002", customer: "Soluções Beta", date: "2024-07-24", amount: "R$ 875,50", status: "Pendente" },
  { id: "TRX003", customer: "Consultoria Gama", date: "2024-07-23", amount: "R$ 2.300,00", status: "Pago" },
  { id: "TRX004", customer: "Tech Delta", date: "2024-07-22", amount: "R$ 550,75", status: "Atrasado" },
];

const topProducts = [
    { id: "PROD01", name: "Serviço de Consultoria Premium", sales: 120, revenue: "R$ 24.000,00", stock: "N/A" },
    { id: "PROD02", name: "Software de Gestão Lite", sales: 85, revenue: "R$ 8.500,00", stock: "50 unidades" },
    { id: "PROD03", name: "Pacote de Suporte Técnico", sales: 60, revenue: "R$ 6.000,00", stock: "N/A" },
];


export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Central</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio.</p>
        </div>
        {/* Placeholder for potential actions like "Add new" or "Generate Report" */}
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
            title="Caderneta Digital (Transações Recentes)"
            description="Acompanhe as últimas movimentações financeiras."
            action={<Button variant="outline" size="sm">Ver Todas</Button>}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>{transaction.customer}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>
                      <Badge variant={
                        transaction.status === "Pago" ? "default" :
                        transaction.status === "Pendente" ? "secondary" :
                        "destructive"
                      } className={
                        transaction.status === "Pago" ? "bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30" :
                        transaction.status === "Pendente" ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30" :
                        "bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30"
                      }>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataSection>

          <DataSection
            title="Produtos Mais Vendidos"
            description="Produtos com melhor desempenho em vendas."
            action={<Button variant="outline" size="sm">Ver Todos Produtos</Button>}
          >
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
                {topProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.sales}</TableCell>
                    <TableCell className="text-right">{product.revenue}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataSection>
        </div>

        {/* Sidebar/Aside content area */}
        <div className="lg:col-span-1 space-y-6">
          <VirtualAssistant />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChartBig className="h-5 w-5 text-primary" /> Visão Geral das Vendas</CardTitle>
              <CardDescription>Comparativo de vendas mensais.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Image placeholder removed */}
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
                    <p className="text-sm font-semibold">+15</p>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm">Clientes ativos</p>
                    <p className="text-sm font-semibold">128</p>
                </div>
                <Button className="w-full mt-2" variant="outline">Gerenciar Clientes</Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
