
"use client";

import { useState, useMemo, ChangeEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShoppingCart, Barcode, Trash2, PlusCircle, MinusCircle, DollarSign, CreditCard, Smartphone, Coins, AlertTriangle, CheckCircle, Camera, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/app/(app)/dashboard/notebook/page"; 
import { STORAGE_KEY_NOTEBOOK } from "@/app/(app)/dashboard/notebook/page";
import type { SalesRecordEntry } from "@/app/(app)/dashboard/sales-record/page"; 
import { STORAGE_KEY_SALES_RECORD } from "@/app/(app)/dashboard/sales-record/page";
import type { ProductEntry } from "@/app/(app)/dashboard/products/page";
import { STORAGE_KEY_PRODUCTS } from "@/app/(app)/dashboard/products/page";
import type { CustomerEntry } from "@/app/(app)/dashboard/customers/page";
import { STORAGE_KEY_CUSTOMERS } from "@/app/(app)/dashboard/customers/page";


interface PDVProduct {
  id: string;
  code: string;
  name: string;
  price: number;
}

interface CartItem extends PDVProduct {
  quantity: number;
}

export default function SalesPage() {
  const { toast } = useToast();
  const [productCodeInput, setProductCodeInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(undefined);
  const [isCameraScanDialogOpen, setIsCameraScanDialogOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraScannedCode, setCameraScannedCode] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ProductEntry[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<CustomerEntry[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);


  useEffect(() => {
    setIsMounted(true);
    const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (storedProducts) {
      try {
        setAvailableProducts(JSON.parse(storedProducts));
      } catch (error) {
        console.error("Failed to parse products from localStorage for PDV", error);
        localStorage.removeItem(STORAGE_KEY_PRODUCTS);
        setAvailableProducts([]); 
        toast({ title: "Erro ao Carregar Produtos", description: "Não foi possível carregar os produtos para o PDV. Os dados podem ter sido redefinidos.", variant: "destructive" });
      }
    } else {
        setAvailableProducts([]); 
    }

    const storedCustomers = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (storedCustomers) {
      try {
        setAvailableCustomers(JSON.parse(storedCustomers));
      } catch (error) {
        console.error("Failed to parse customers from localStorage for PDV", error);
        localStorage.removeItem(STORAGE_KEY_CUSTOMERS);
        setAvailableCustomers([]); 
        toast({ title: "Erro ao Carregar Clientes", description: "Não foi possível carregar os clientes para o PDV. Os dados podem ter sido redefinidos.", variant: "destructive" });
      }
    } else {
        setAvailableCustomers([]); 
    }
  }, [toast]);


  const addProductToCartByCode = (code: string) => {
    if (!code.trim()) {
      toast({ title: "Código Inválido", description: "Por favor, insira um código de produto.", variant: "destructive" });
      return false;
    }
    
    const product = availableProducts.find(p => p.code === code.trim());
    if (product) {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        if (existingItem) {
          return prevCart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        const productForCart: PDVProduct = { id: product.id, code: product.code, name: product.name, price: product.price };
        return [...prevCart, { ...productForCart, quantity: 1 }];
      });
      toast({ title: "Produto Adicionado", description: `${product.name} foi adicionado ao carrinho.`, className: "bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-700" });
      return true;
    } else {
      toast({ title: "Produto não encontrado", description: `Nenhum produto encontrado com o código ${code}. Verifique o catálogo.`, variant: "destructive" });
      return false;
    }
  };

  const handleAddProductFromInput = () => {
    if (addProductToCartByCode(productCodeInput)) {
      setProductCodeInput("");
    }
  };
  
  const handleAddProductFromCameraDialog = () => {
    if (addProductToCartByCode(cameraScannedCode)) {
      setCameraScannedCode("");
      setIsCameraScanDialogOpen(false); 
    }
  };

  useEffect(() => {
    if (isCameraScanDialogOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Acesso à Câmera Negado',
            description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador para usar esta funcionalidade.',
          });
        }
      };
      getCameraPermission();

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isCameraScanDialogOpen, toast]);


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
    if (paymentMethod === "Dinheiro" && amountPaid >= cartTotal && cart.length > 0) {
      return amountPaid - cartTotal;
    }
    return 0; 
  }, [amountPaid, cartTotal, cart.length, paymentMethod]);

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      toast({ title: "Carrinho Vazio", description: "Adicione produtos ao carrinho antes de finalizar.", variant: "destructive" });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Forma de Pagamento", description: "Selecione uma forma de pagamento.", variant: "destructive" });
      return;
    }
    if (paymentMethod === "Dinheiro" && amountPaid < cartTotal) {
      toast({ title: "Valor Insuficiente", description: "O valor pago é menor que o total da compra.", variant: "destructive" });
      return;
    }

    const saleDate = new Date();
    const selectedCustomer = availableCustomers.find(c => c.id === selectedCustomerId);
    const customerNameForRecord = selectedCustomer ? selectedCustomer.name : "Cliente Avulso";

    const incomeTransactionDescription = `Venda PDV ${customerNameForRecord ? `(${customerNameForRecord})` : ''} - ${cart.map(item => `${item.quantity}x ${item.name}`).join(', ')}`;

    const incomeTransaction: Transaction = {
      id: `T-SALE-${Date.now().toString().slice(-6)}`,
      description: incomeTransactionDescription,
      amount: cartTotal,
      type: "income",
      date: saleDate,
    };
    
    try {
        const existingNotebookTransactionsRaw = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
        const existingNotebookTransactions: Transaction[] = existingNotebookTransactionsRaw ? JSON.parse(existingNotebookTransactionsRaw).map((t: any) => ({...t, date: new Date(t.date)})) : [];
        localStorage.setItem(STORAGE_KEY_NOTEBOOK, JSON.stringify([...existingNotebookTransactions, {...incomeTransaction, date: incomeTransaction.date.toISOString()}]));
    } catch (e) {
        console.error("Error updating notebook transactions in localStorage", e);
        toast({title: "Erro ao salvar na Caderneta Digital", description: "Não foi possível atualizar a caderneta digital. Os dados podem ter sido redefinidos.", variant: "destructive"})
    }

    const salesRecordEntry: SalesRecordEntry = {
      id: `SR-${Date.now().toString().slice(-6)}`,
      items: cart.map(item => ({ productId: item.id, name: item.name, quantity: item.quantity, unitPrice: item.price })),
      totalAmount: cartTotal,
      paymentMethod: paymentMethod,
      date: saleDate.toISOString(),
      amountPaid: paymentMethod === "Dinheiro" ? amountPaid : cartTotal,
      changeGiven: paymentMethod === "Dinheiro" ? changeDue : 0,
      customerId: selectedCustomerId === 'default_consumer' ? undefined : selectedCustomerId,
      customerName: customerNameForRecord,
    };

    try {
        const existingSalesRecordsRaw = localStorage.getItem(STORAGE_KEY_SALES_RECORD);
        const existingSalesRecords: SalesRecordEntry[] = existingSalesRecordsRaw ? JSON.parse(existingSalesRecordsRaw) : [];
        localStorage.setItem(STORAGE_KEY_SALES_RECORD, JSON.stringify([...existingSalesRecords, salesRecordEntry]));
    } catch (e) {
        console.error("Error updating sales records in localStorage", e);
        toast({title: "Erro ao salvar no Histórico de Vendas", description: "Não foi possível atualizar o histórico de vendas. Os dados podem ter sido redefinidos.", variant: "destructive"})
    }

    toast({
      title: "Venda Finalizada!",
      description: `Venda de R$ ${cartTotal.toFixed(2)} para ${customerNameForRecord} paga com ${paymentMethod}. ${paymentMethod === "Dinheiro" ? `Troco: R$ ${changeDue.toFixed(2)}.` : ''}`,
      className: "bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-700"
    });

    setCart([]);
    setProductCodeInput("");
    setAmountPaidInput("");
    setPaymentMethod(undefined);
    setSelectedCustomerId(undefined);
  };

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            <CardTitle className="text-2xl">Ponto de Venda (PDV)</CardTitle>
          </div>
          <CardDescription>Registre vendas rapidamente. Os dados são salvos localmente.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5"/> Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger id="customerSelect">
                        <SelectValue placeholder="Selecione um cliente (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="default_consumer">Cliente Avulso</SelectItem>
                        {availableCustomers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    {selectedCustomerId && selectedCustomerId !== 'default_consumer' && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Cliente selecionado: {availableCustomers.find(c=>c.id === selectedCustomerId)?.name}
                        </p>
                    )}
                     {(!selectedCustomerId || selectedCustomerId === 'default_consumer') && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Nenhum cliente específico selecionado (venda para Cliente Avulso).
                        </p>
                    )}
                </CardContent>
            </Card>

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
                    onKeyPress={(e) => { if (e.key === 'Enter') handleAddProductFromInput(); }}
                  />
                </div>
                <Button onClick={handleAddProductFromInput} className="px-4">Adicionar</Button>
                <Dialog open={isCameraScanDialogOpen} onOpenChange={setIsCameraScanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="Escanear com Câmera">
                      <Camera className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Escanear Código de Barras com a Câmera</DialogTitle>
                      <DialogDescription>
                        Aponte a câmera para o código de barras do produto. Se a leitura não ocorrer automaticamente, digite o código no campo abaixo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                         <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        </div>
                        {hasCameraPermission === false && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Acesso à Câmera Negado</AlertTitle>
                                <AlertDescription>
                                Habilite a permissão da câmera para escanear.
                                </AlertDescription>
                            </Alert>
                        )}
                         <Input
                            placeholder="Digite o código do produto aqui..."
                            value={cameraScannedCode}
                            onChange={(e) => setCameraScannedCode(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleAddProductFromCameraDialog();}}
                            disabled={hasCameraPermission === null || hasCameraPermission === false}
                        />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button type="button" onClick={handleAddProductFromCameraDialog} disabled={!cameraScannedCode.trim() || hasCameraPermission === null || hasCameraPermission === false}>Adicionar Produto</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

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

          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-20">
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
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={cart.length === 0}>
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
                        if (/^[0-9]*[,]?[0-9]{0,2}$/.test(value) || value === "") {
                            setAmountPaidInput(value);
                        }
                    }}
                    className={cn(paymentMethod === "Dinheiro" && amountPaid < cartTotal && cart.length > 0 && amountPaidInput !== "" && "border-destructive focus-visible:ring-destructive")}
                    disabled={cart.length === 0 || !paymentMethod || paymentMethod !== "Dinheiro"}
                  />
                  {paymentMethod === "Dinheiro" && amountPaid < cartTotal && cart.length > 0 && amountPaidInput !== "" && (
                     <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Valor menor que o total.</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Troco</Label>
                  <p className={cn("text-2xl font-semibold", changeDue > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                    R$ {paymentMethod === "Dinheiro" ? changeDue.toFixed(2) : "0.00"}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                    onClick={handleFinalizeSale} 
                    className="w-full text-lg py-6" 
                    size="lg"
                    disabled={cart.length === 0 || !paymentMethod || (paymentMethod === "Dinheiro" && amountPaidInput !== "" && amountPaid < cartTotal)}
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
