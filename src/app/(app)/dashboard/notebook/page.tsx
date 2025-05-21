
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function NotebookPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Caderneta Digital</CardTitle>
          </div>
          <CardDescription>Gerencie suas anotações e transações diárias aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Conteúdo da Caderneta Digital em breve...</p>
          <div className="mt-8 flex justify-center">
            <img 
              src="https://placehold.co/600x400.png" 
              alt="Placeholder para Caderneta Digital" 
              className="rounded-lg shadow-md"
              data-ai-hint="digital notebook" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
