
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Produtos</CardTitle>
          </div>
          <CardDescription>Gerencie seu catálogo de produtos e serviços.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Conteúdo da seção de Produtos em breve...</p>
          <div className="mt-8 flex justify-center">
            <img 
              src="https://placehold.co/600x400.png" 
              alt="Placeholder para Produtos" 
              className="rounded-lg shadow-md"
              data-ai-hint="product catalog" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
