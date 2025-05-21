
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function MonthlyReportPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Relatório Mensal</CardTitle>
          </div>
          <CardDescription>Visualize o desempenho de suas vendas e finanças mensalmente.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade de Relatório Mensal em desenvolvimento. Em breve você poderá visualizar gráficos de desempenho, principais KPIs do mês, comparativos com períodos anteriores e muito mais.</p>
          <div className="mt-8 flex justify-center">
            <img 
              src="https://placehold.co/600x400.png" 
              alt="Placeholder para Relatório Mensal" 
              className="rounded-lg shadow-md"
              data-ai-hint="financial report chart"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    