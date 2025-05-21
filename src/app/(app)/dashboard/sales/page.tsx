
"use client";

import { useState, useMemo, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Barcode, Trash2, PlusCircle, MinusCircle, DollarSign, CreditCard, Smartphone, Coins, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

const sampleProducts: Product[] = [
  { id: "prod001", code: "123", name: "Refrigerante Lata", price: 5.50 },
  { id: "prod002", code: "456", name: "Salgadinho Pacote", price: 8.75 },
  { id: "prod003", code: "789", name: "Chocolate Barra", price: 6.25 },
  { id: "prod004", code: "101", name: "Água Mineral 500ml", price: 3.00 },
  { id: "prod005", code: "202", name: "Suco Caixa 1L", price: 7.90 },
];

export default function SalesPage() {
  const { toast } = useToast();
  const [productCodeInput, setProductCodeInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(undefined);

  const handleAddProductToCart = () => {
    if (!productCodeInput.trim()) {
      toast({ title: "Código Inválido", description: "Por favor, insira um código de produto.", variant: "destructive" });
      return;
    }
    const product = sampleProducts.find(p => p.code === productCodeInput.trim());
    if (product) {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        if (existingItem) {
          return prevCart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prevCart, { ...product, quantity: 1 }];
      });
      toast({ title: "Produto Adicionado", description: `${product.name} foi adicionado ao carrinho.`, className: "bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-700" });
      setProductCodeInput("");
    } else {
      toast({ title: "Produto não encontrado", description: `Nenhum produto encontrado com o código ${productCodeInput}.`, variant: "destructive" });
    }
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    const itemRemoved = cart.find(item => item.id === productId);
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    if (itemRemoved) {
        toast({ title: "Produto Removido", description: `${itemRemoved.name} foi removido do carrinho.`, variant: "default"});
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const amountPaid = useMemo(() => {
    const parsedAmount = parseFloat(amountPaidInput.replace(",","."));
    return isNaN(parsedAmount) ? 0 : parsedAmount;
  }, [amountPaidInput]);
  
  const changeDue = useMemo(() => {
    if (amountPaid >= cartTotal) {
      return amountPaid - cartTotal;
    }
    return 0; 
  }, [amountPaid, cartTotal]);

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      toast({ title: "Carrinho Vazio", description: "Adicione produtos ao carrinho antes de finalizar.", variant: "destructive" });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Forma de Pagamento", description: "Selecione uma forma de pagamento.", variant: "destructive" });
      return;
    }
    if (amountPaid < cartTotal) {
      toast({ title: "Valor Insuficiente", description: "O valor pago é menor que o total da compra.", variant: "destructive" });
      return;
    }

    // Here you would typically send data to a backend
    console.log("Venda Finalizada:", {
      cart,
      cartTotal,
      amountPaid,
      changeDue,
      paymentMethod,
    });

    toast({
      title: "Venda Finalizada!",
      description: `Venda de R$ ${cartTotal.toFixed(2)} paga com ${paymentMethod}. Troco: R$ ${changeDue.toFixed(2)}.`,
      className: "bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-700"
    });

    setCart([]);
    setProductCodeInput("");
    setAmountPaidInput("");
    setPaymentMethod(undefined);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl">Ponto de Venda (PDV)</CardTitle>
          </div>
          <CardDescription>Registre vendas rapidamente escaneando produtos e processando pagamentos.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Entrada de Produto e Carrinho */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Barcode className="h-5 w-5"/> Adicionar Produto</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end gap-2">
                <div className="flex-grow">
                  <Label htmlFor="productCode">Código do Produto</Label>
                  <Input
                    id="productCode"
                    placeholder="Digite ou escaneie o código"
                    value={productCodeInput}
                    onChange={(e) => setProductCodeInput(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddProductToCart(); }}
                  />
                </div>
                <Button onClick={handleAddProductToCart} size="lg">Adicionar</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Carrinho de Compras ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                    <p>O carrinho está vazio.</p>
                    <p className="text-sm">Adicione produtos usando o código acima.</p>
                     <img 
                        src="https://placehold.co/400x200.png" 
                        alt="Carrinho Vazio" 
                        className="rounded-lg shadow-sm mt-4 mx-auto"
                        data-ai-hint="empty cart shopping" 
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="w-32 text-center">Qtd.</TableHead>
                          <TableHead className="text-right">Preço Unit.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-12 text-center">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                                <Input 
                                  type="number" 
                                  value={item.quantity} 
                                  onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)} 
                                  className="w-12 h-7 text-center px-1" 
                                  min="1"
                                />
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                                  <PlusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-7 w-7" onClick={() => handleRemoveItem(item.id)}>
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

          {/* Coluna Direita: Resumo e Pagamento */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-20"> {/* Make payment summary sticky */}
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5"/> Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Total da Compra</Label>
                  <p className="text-3xl font-bold text-primary">R$ {cartTotal.toFixed(2)}</p>
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro"><div className="flex items-center gap-2"><Coins className="h-4 w-4"/> Dinheiro</div></SelectItem>
                      <SelectItem value="PIX"><div className="flex items-center gap-2"><Smartphone className="h-4 w-4"/> PIX</div></SelectItem>
                      <SelectItem value="Cartão de Crédito"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4"/> Cartão de Crédito</div></SelectItem>
                      <SelectItem value="Cartão de Débito"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4"/> Cartão de Débito</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amountPaid">Valor Entregue (R$)</Label>
                  <Input
                    id="amountPaid"
                    type="text"
                    placeholder="0,00"
                    value={amountPaidInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        // Allow only numbers and one comma
                        if (/^[0-9]*[,]?[0-9]{0,2}$/.test(value) || value === "") {
                            setAmountPaidInput(value);
                        }
                    }}
                    className={cn(amountPaid < cartTotal && cart.length > 0 && amountPaidInput !== "" && "border-destructive focus-visible:ring-destructive")}
                  />
                  {amountPaid < cartTotal && cart.length > 0 && amountPaidInput !== "" && (
                     <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Valor menor que o total.</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Troco</Label>
                  <p className={cn("text-2xl font-semibold", changeDue > 0 ? "text-green-600" : "text-muted-foreground")}>
                    R$ {changeDue.toFixed(2)}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                    onClick={handleFinalizeSale} 
                    className="w-full text-lg py-6" 
                    size="lg"
                    disabled={cart.length === 0 || !paymentMethod || amountPaid < cartTotal}
                >
                  <CheckCircle className="mr-2 h-5 w-5"/> Finalizar Venda
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
