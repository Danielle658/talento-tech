
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilePlus2, History, Search, Download, Trash2, Loader2, ListFilter, Eye, User } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SoldItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesRecordEntry {
  id: string;
  items: SoldItem[];
  totalAmount: number;
  paymentMethod: string;
  date: string; // ISO string
  amountPaid?: number; // For cash transactions
  changeGiven?: number; // For cash transactions
  customerId?: string;
  customerName?: string;
}

const STORAGE_KEY_SALES_RECORD = "moneywise-salesHistory";

export default function SalesRecordPage() {
  const [salesHistory, setSalesHistory] = useState<SalesRecordEntry[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [selectedSale, setSelectedSale] = useState<SalesRecordEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const storedSales = localStorage.getItem(STORAGE_KEY_SALES_RECORD);
    if (storedSales) {
      try {
        setSalesHistory(JSON.parse(storedSales).sort((a: SalesRecordEntry, b: SalesRecordEntry) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
      } catch (error) {
        console.error("Failed to parse sales history from localStorage", error);
        localStorage.removeItem(STORAGE_KEY_SALES_RECORD); // Clear corrupted data
      }
    }
  }, []);

  const filteredSales = useMemo(() => {
    if (!isMounted) return [];
    return salesHistory
      .filter(sale => {
        const saleDate = parseISO(sale.date);
        const matchesSearch = searchTerm === "" || 
          sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesPayment = filterPaymentMethod === "all" || sale.paymentMethod === filterPaymentMethod;
        
        const matchesDate = !filterDate || 
          (isValid(saleDate) && format(saleDate, "yyyy-MM-dd") === format(filterDate, "yyyy-MM-dd"));

        return matchesSearch && matchesPayment && matchesDate;
      })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [salesHistory, searchTerm, filterPaymentMethod, filterDate, isMounted]);

  const handleViewDetails = (sale: SalesRecordEntry) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };
  
  const handleDeleteSale = (saleId: string) => {
     // Confirm deletion
    if (!window.confirm("Tem certeza que deseja excluir este registro de venda? Esta ação não pode ser desfeita.")) {
      return;
    }
    const updatedSalesHistory = salesHistory.filter(sale => sale.id !== saleId);
    setSalesHistory(updatedSalesHistory);
    localStorage.setItem(STORAGE_KEY_SALES_RECORD, JSON.stringify(updatedSalesHistory));
    toast({
      title: "Registro Excluído",
      description: `O registro de venda ${saleId} foi excluído.`,
      variant: "default",
    });
  };

  const handleExportData = () => {
    if (filteredSales.length === 0) {
      toast({ title: "Nenhum dado para exportar", description: "Não há registros de vendas correspondentes aos filtros atuais.", variant: "default"});
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["ID da Venda", "Data", "Cliente", "Itens Vendidos", "Qtd Total Itens", "Valor Total (R$)", "Método Pagamento", "Valor Pago (R$)", "Troco (R$)"]
          .map(header => `"${header}"`).join(",") + "\n"
      + filteredSales.map(sale => {
          const itemsString = sale.items.map(item => `${item.quantity}x ${item.name} (R$${item.unitPrice.toFixed(2)})`).join("; ");
          const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
          return [
            sale.id,
            isValid(parseISO(sale.date)) ? format(parseISO(sale.date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Data Inválida",
            sale.customerName || "Cliente Avulso",
            itemsString,
            totalQuantity,
            sale.totalAmount.toFixed(2),
            sale.paymentMethod,
            sale.amountPaid?.toFixed(2) || sale.totalAmount.toFixed(2),
            sale.changeGiven?.toFixed(2) || "0.00"
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historico_vendas_moneywise_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Dados Exportados", description: "O histórico de vendas foi exportado como CSV.", });
  };

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Histórico de Vendas</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleExportData} variant="outline" disabled={filteredSales.length === 0}>
                    <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
            </div>
          </div>
          <CardDescription>Visualize todas as vendas registradas. Os dados são salvos localmente no seu navegador.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 border rounded-lg bg-card shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="searchTerm" className="text-sm font-medium block mb-1">Pesquisar</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="searchTerm"
                            placeholder="ID, produto, cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="filterPaymentMethod" className="text-sm font-medium block mb-1">Forma de Pagamento</label>
                    <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                        <SelectTrigger id="filterPaymentMethod">
                        <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="filterDate" className="text-sm font-medium block mb-1">Data Específica</label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="filterDate"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !filterDate && "text-muted-foreground")}
                        >
                            <ListFilter className="mr-2 h-4 w-4" />
                            {filterDate ? format(filterDate, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={filterDate}
                            onSelect={setFilterDate}
                            initialFocus
                            locale={ptBR}
                        />
                        {filterDate && <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setFilterDate(undefined)}>Limpar Data</Button>}
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="text-center py-10">
              <History className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">Nenhum registro de venda encontrado.</p>
              <p className="text-muted-foreground">Tente ajustar os filtros ou registre novas vendas no PDV.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Venda</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor Total (R$)</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell>{isValid(parseISO(sale.date)) ? format(parseISO(sale.date), "dd/MM/yy HH:mm", { locale: ptBR }) : "Inválida"}</TableCell>
                      <TableCell>{sale.customerName || "Cliente Avulso"}</TableCell>
                      <TableCell className="text-right font-semibold">R$ {sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                            sale.paymentMethod === "Dinheiro" ? "secondary" : 
                            sale.paymentMethod === "PIX" ? "default" : 
                            "outline"
                        }
                        className={cn(
                            sale.paymentMethod === "PIX" && "bg-green-600 hover:bg-green-700 text-white",
                            sale.paymentMethod === "Cartão de Crédito" && "bg-blue-500 hover:bg-blue-600 text-white",
                            sale.paymentMethod === "Cartão de Débito" && "bg-sky-500 hover:bg-sky-600 text-white"
                        )}
                        >{sale.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(sale)} title="Ver Detalhes">
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSale(sale.id)} title="Excluir Registro">
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

      {selectedSale && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Detalhes da Venda: {selectedSale.id}</DialogTitle>
                    <DialogDescription>
                        Data: {isValid(parseISO(selectedSale.date)) ? format(parseISO(selectedSale.date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Inválida"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                    {selectedSale.customerName && (
                        <p><strong>Cliente:</strong> {selectedSale.customerName}</p>
                    )}
                    <h4 className="font-semibold">Itens Vendidos:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        {selectedSale.items.map(item => (
                            <li key={item.productId}>
                                {item.quantity}x {item.name} (R$ {item.unitPrice.toFixed(2)} cada) - Subtotal: R$ {(item.quantity * item.unitPrice).toFixed(2)}
                            </li>
                        ))}
                    </ul>
                    <hr/>
                    <p><strong>Método de Pagamento:</strong> {selectedSale.paymentMethod}</p>
                    <p><strong>Valor Total da Venda:</strong> <span className="font-bold text-primary">R$ {selectedSale.totalAmount.toFixed(2)}</span></p>
                    {selectedSale.paymentMethod === "Dinheiro" && (
                        <>
                        <p><strong>Valor Entregue:</strong> R$ {(selectedSale.amountPaid ?? selectedSale.totalAmount).toFixed(2)}</p>
                        <p><strong>Troco:</strong> R$ {(selectedSale.changeGiven ?? 0).toFixed(2)}</p>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Fechar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
