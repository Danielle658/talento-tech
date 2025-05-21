
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FilePlus2 } from "lucide-react";

export default function SalesRecordPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FilePlus2 className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Registro de Vendas</CardTitle>
          </div>
          <CardDescription>Registre novas vendas de forma rápida e eficiente.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Conteúdo do Registro de Vendas em breve...</p>
          <div className="mt-8 flex justify-center">
            <img 
              src="https://placehold.co/600x400.png" 
              alt="Placeholder para Registro de Vendas" 
              className="rounded-lg shadow-md"
              data-ai-hint="sales entry"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
