
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Contas de Clientes</CardTitle>
          </div>
          <CardDescription>Gerencie as informações e o histórico dos seus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Conteúdo da seção de Contas de Clientes em breve...</p>
          <div className="mt-8 flex justify-center">
            <img 
              src="https://placehold.co/600x400.png" 
              alt="Placeholder para Contas de Clientes" 
              className="rounded-lg shadow-md"
              data-ai-hint="customer management" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
