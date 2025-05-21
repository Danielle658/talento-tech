
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookUser } from "lucide-react";

export default function CreditNotebookPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookUser className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Caderneta de Fiados</CardTitle>
          </div>
          <CardDescription>Gerencie os registros de vendas a prazo e fiados.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade da Caderneta de Fiados em desenvolvimento. Em breve você poderá registrar vendas a prazo, controlar saldos devedores de clientes e gerenciar pagamentos.</p>
          <div className="mt-8 flex justify-center">
            <img 
              src="https://placehold.co/600x400.png" 
              alt="Placeholder para Caderneta de Fiados" 
              className="rounded-lg shadow-md"
              data-ai-hint="credit management ledger" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    