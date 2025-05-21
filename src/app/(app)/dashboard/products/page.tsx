
"use client";

import { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, PlusCircle, Trash2, DollarSign, Package, Tag, Barcode, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const productSchema = z.object({
  name: z.string().min(2, { message: "Nome do produto é obrigatório." }),
  code: z.string().min(1, { message: "Código/Código de Barras é obrigatório." }),
  price: z.coerce.number().min(0.01, { message: "O preço deve ser positivo." }),
  category: z.string().optional(),
  stock: z.string().optional(), // Kept as string to allow "N/A" or numeric values
});

type ProductFormValues = z.infer<typeof productSchema>;

export interface ProductEntry extends ProductFormValues {
  id: string;
}

export const STORAGE_KEY_PRODUCTS = "moneywise-products";

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductEntry[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (storedProducts) {
      try {
        setProducts(JSON.parse(storedProducts));
      } catch (error) {
        console.error("Failed to parse products from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_PRODUCTS);
        setProducts([]); 
        toast({ title: "Erro ao Carregar Produtos", description: "Não foi possível carregar os dados do catálogo de produtos. Os dados podem ter sido redefinidos.", variant: "destructive" });
      }
    } else {
      setProducts([]); 
    }
  }, [toast]);

  useEffect(() => {
    if (isMounted && products.length > 0) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } else if (isMounted && products.length === 0) {
        localStorage.removeItem(STORAGE_KEY_PRODUCTS); 
    }
  }, [products, isMounted]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      code: "",
      price: 0,
      category: "",
      stock: "",
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    const newProduct: ProductEntry = {
      ...data,
      id: `PROD${String(Date.now()).slice(-6)}`,
    };
    setProducts(prev => [newProduct, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    toast({
      title: "Produto Adicionado!",
      description: `${data.name} foi adicionado ao catálogo.`,
    });
    form.reset();
    setIsAddDialogOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    const productName = products.find(p => p.id === id)?.name || "Produto";
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Produto Excluído!",
      description: `${productName} foi removido do catálogo.`,
      variant: "destructive"
    });
  };
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Produtos e Serviços</CardTitle>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => form.reset()}>
                  <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Novo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Produto/Serviço</DialogTitle>
                  <DialogDescription>Preencha os dados do novo item do catálogo.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Produto/Serviço</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="Ex: Consultoria Financeira" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código / Código de Barras</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="Ex: 1234567890123" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço (R$)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria (Opcional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="Ex: Serviço, Software" {...field} className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque/Disponibilidade (Opcional)</FormLabel>
                          <FormControl>
                             <Input placeholder="Ex: 10 unidades, N/A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Produto"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>Gerencie seu catálogo de produtos e serviços. Os dados são salvos localmente.</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Nenhum produto ou serviço cadastrado.</p>
              <p className="text-muted-foreground">Clique em "Adicionar Novo" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código/Barras</TableHead>
                    <TableHead className="text-right">Preço (R$)</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.code}</TableCell>
                      <TableCell className="text-right">{product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell>{product.stock || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
