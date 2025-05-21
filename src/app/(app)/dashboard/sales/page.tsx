
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Vendas</CardTitle>
          </div>
          <CardDescription>Acompanhe e registre suas vendas e transações comerciais.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade de Vendas em desenvolvimento. Em breve você poderá visualizar um histórico detalhado de todas as suas vendas, filtrar por período, cliente, produto e status.</p>
          <div className="mt-8 flex justify-center">
            <img 
              src="https://placehold.co/600x400.png" 
              alt="Placeholder para Vendas" 
              className="rounded-lg shadow-md"
              data-ai-hint="sales history analytics" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    