
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const sampleCustomers = [
  { id: "CLI001", name: "Empresa Alpha", email: "contato@alpha.com", phone: "(11) 99999-0001", lastPurchase: "2024-07-15" },
  { id: "CLI002", name: "Soluções Beta", email: "suporte@beta.io", phone: "(21) 98888-0002", lastPurchase: "2024-07-20" },
  { id: "CLI003", name: "Consultoria Gama", email: "atendimento@gama.com.br", phone: "(31) 97777-0003", lastPurchase: "2024-06-30" },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Contas de Clientes</CardTitle>
            </div>
            <Button>Adicionar Novo Cliente</Button>
          </div>
          <CardDescription>Gerencie as informações e o histórico dos seus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Funcionalidade de Contas de Clientes em desenvolvimento. Em breve você poderá adicionar, editar e visualizar o histórico completo de seus clientes.</p>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Última Compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.lastPurchase}</TableCell>
                </TableRow>
              ))}
               {sampleCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum cliente cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {sampleCustomers.length === 0 && (
             <div className="mt-8 flex justify-center">
                <img 
                src="https://placehold.co/600x400.png" 
                alt="Placeholder para Contas de Clientes" 
                className="rounded-lg shadow-md"
                data-ai-hint="customer management empty" 
                />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    