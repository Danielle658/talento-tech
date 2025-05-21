
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const sampleProducts = [
  { id: "PROD001", name: "Consultoria Financeira Básica", category: "Serviço", price: "R$ 250,00", stock: "N/A" },
  { id: "PROD002", name: "Software de Gestão Lite", category: "Software", price: "R$ 99,90", stock: "50 licenças" },
  { id: "PROD003", name: "Pacote de Horas Suporte Premium", category: "Serviço", price: "R$ 500,00", stock: "10 pacotes" },
  { id: "PROD004", name: "Ebook Finanças para Pequenos Negócios", category: "Digital", price: "R$ 49,90", stock: "Ilimitado" },
];


export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Produtos e Serviços</CardTitle>
            </div>
            <Button>Adicionar Novo Produto/Serviço</Button>
          </div>
          <CardDescription>Gerencie seu catálogo de produtos e serviços.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Funcionalidade de Produtos e Serviços em desenvolvimento. Em breve você poderá adicionar, editar, categorizar e controlar o estoque dos seus produtos e serviços.</p>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead>Estoque/Disponibilidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">{product.price}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                </TableRow>
              ))}
              {sampleProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum produto ou serviço cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
           {sampleProducts.length === 0 && (
             <div className="mt-8 flex justify-center">
                <img 
                src="https://placehold.co/600x400.png" 
                alt="Placeholder para Produtos" 
                className="rounded-lg shadow-md"
                data-ai-hint="product catalog empty" 
                />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    