
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Send, Loader2, FileDown, ArrowLeft, DollarSign, Users, Package, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isValid as isValidDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from '@/hooks/use-auth';
import {
  ACCOUNT_DETAILS_BASE_STORAGE_KEY,
  STORAGE_KEY_NOTEBOOK_BASE,
  STORAGE_KEY_CUSTOMERS_BASE,
  STORAGE_KEY_CREDIT_NOTEBOOK_BASE,
  STORAGE_KEY_PRODUCTS_BASE,
  getCompanySpecificKey
} from '@/lib/constants';
import type { AccountDetailsFormValues } from "@/app/(app)/dashboard/settings/page";
import type { Transaction } from "@/app/(app)/dashboard/notebook/page";
import type { CustomerEntry } from "@/app/(app)/dashboard/customers/page";
import type { CreditEntry } from "@/app/(app)/dashboard/credit-notebook/page";
import type { ProductEntry } from "@/app/(app)/dashboard/products/page";

interface ReportData {
  currentMonthYear: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalCustomers: number;
  totalDueFiados: number;
  totalStockValue: number;
  totalProductsInStock: number;
}

const initialReportData: ReportData = {
  currentMonthYear: format(new Date(), "MMMM 'de' yyyy", { locale: ptBR }),
  totalIncome: 0,
  totalExpenses: 0,
  netProfit: 0,
  totalCustomers: 0,
  totalDueFiados: 0,
  totalStockValue: 0,
  totalProductsInStock: 0,
};

export default function MonthlyReportPage() {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const router = useRouter();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetailsFormValues | null>(null);
  const [reportData, setReportData] = useState<ReportData>(initialReportData);

  const accountDetailsStorageKey = useMemo(() => getCompanySpecificKey(ACCOUNT_DETAILS_BASE_STORAGE_KEY, currentCompany), [currentCompany]);
  const notebookStorageKey = useMemo(() => getCompanySpecificKey(STORAGE_KEY_NOTEBOOK_BASE, currentCompany), [currentCompany]);
  const customersStorageKey = useMemo(() => getCompanySpecificKey(STORAGE_KEY_CUSTOMERS_BASE, currentCompany), [currentCompany]);
  const creditNotebookStorageKey = useMemo(() => getCompanySpecificKey(STORAGE_KEY_CREDIT_NOTEBOOK_BASE, currentCompany), [currentCompany]);
  const productsStorageKey = useMemo(() => getCompanySpecificKey(STORAGE_KEY_PRODUCTS_BASE, currentCompany), [currentCompany]);

  useEffect(() => {
    setIsMounted(true);
    if (accountDetailsStorageKey) {
      const storedAccountDetails = localStorage.getItem(accountDetailsStorageKey);
      if (storedAccountDetails) {
          try {
              const parsedDetails: AccountDetailsFormValues = JSON.parse(storedAccountDetails);
              setAccountDetails(parsedDetails);
              if (parsedDetails.phone) {
                  setWhatsappNumber(parsedDetails.phone.replace(/\D/g, ''));
              }
          } catch (error) {
              console.error("Failed to parse account details from localStorage for monthly report for", currentCompany, error);
              if (accountDetailsStorageKey) localStorage.removeItem(accountDetailsStorageKey);
              setAccountDetails(null);
              toast({ title: "Erro ao Carregar Detalhes da Conta", description: "Não foi possível carregar os detalhes da sua conta. Os dados podem ter sido redefinidos.", variant: "destructive", toastId: 'monthlyReportAccountLoadError'});
          }
      } else {
        setAccountDetails(null);
        setWhatsappNumber("");
      }
    } else if (currentCompany === null && isMounted) {
      setAccountDetails(null);
      setWhatsappNumber("");
    }
  }, [toast, accountDetailsStorageKey, currentCompany, isMounted]);

  const generateReportData = useCallback(() => {
    if (!currentCompany || !isMounted) return initialReportData;
    setIsGeneratingReport(true);

    let calculatedData = { ...initialReportData };
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    calculatedData.currentMonthYear = format(today, "MMMM 'de' yyyy", { locale: ptBR });

    // Calculate Income and Expenses for the current month
    if (notebookStorageKey) {
      const storedTransactions = localStorage.getItem(notebookStorageKey);
      if (storedTransactions) {
        try {
          const transactions: Transaction[] = JSON.parse(storedTransactions).map((t: any) => ({ ...t, date: parseISO(t.date) }));
          transactions.forEach(t => {
            if (isValidDate(t.date) && isWithinInterval(t.date, { start: currentMonthStart, end: currentMonthEnd })) {
              if (t.type === 'income') calculatedData.totalIncome += t.amount;
              if (t.type === 'expense') calculatedData.totalExpenses += t.amount;
            }
          });
          calculatedData.netProfit = calculatedData.totalIncome - calculatedData.totalExpenses;
        } catch (e) { console.error("Error processing transactions for report:", e); }
      }
    }

    // Calculate Total Customers
    if (customersStorageKey) {
      const storedCustomers = localStorage.getItem(customersStorageKey);
      if (storedCustomers) {
        try {
          const customers: CustomerEntry[] = JSON.parse(storedCustomers);
          calculatedData.totalCustomers = customers.length;
        } catch (e) { console.error("Error processing customers for report:", e); }
      }
    }

    // Calculate Total Due Fiados
    if (creditNotebookStorageKey) {
      const storedCreditEntries = localStorage.getItem(creditNotebookStorageKey);
      if (storedCreditEntries) {
        try {
          const creditEntries: CreditEntry[] = JSON.parse(storedCreditEntries).map((entry: any) => ({
            ...entry,
            saleDate: parseISO(entry.saleDate),
            dueDate: entry.dueDate ? parseISO(entry.dueDate) : undefined,
          }));
          calculatedData.totalDueFiados = creditEntries.filter(e => !e.paid).reduce((sum, e) => sum + e.amount, 0);
        } catch (e) { console.error("Error processing credit entries for report:", e); }
      }
    }

    // Calculate Total Stock Value and Quantity
    if (productsStorageKey) {
      const storedProducts = localStorage.getItem(productsStorageKey);
      if (storedProducts) {
        try {
          const products: ProductEntry[] = JSON.parse(storedProducts);
          products.forEach(p => {
            const stockQuantity = parseInt(p.stock || "0", 10);
            if (!isNaN(stockQuantity) && stockQuantity > 0) {
              calculatedData.totalStockValue += stockQuantity * p.price;
              calculatedData.totalProductsInStock += stockQuantity;
            }
          });
        } catch (e) { console.error("Error processing products for report:", e); }
      }
    }
    setReportData(calculatedData);
    setIsGeneratingReport(false);
    return calculatedData;
  }, [currentCompany, isMounted, notebookStorageKey, customersStorageKey, creditNotebookStorageKey, productsStorageKey]);

  useEffect(() => {
    if(isMounted && currentCompany) {
        generateReportData();
    } else if (isMounted && !currentCompany) {
        setReportData(initialReportData); // Reset if no company
    }
  }, [isMounted, currentCompany, generateReportData]);


  const handleSendWhatsAppSummary = async () => {
    if (!whatsappNumber.trim()) {
      toast({
        title: "Número de WhatsApp Necessário",
        description: "Por favor, insira um número de WhatsApp para enviar o resumo do relatório.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const currentData = reportData; // Use already calculated data
    await new Promise(resolve => setTimeout(resolve, 300)); // Short delay for UX

    const companyNameToUse = accountDetails?.companyName || currentCompany || "Sua Empresa";
    const reportMessage = `📊 *Resumo Mensal - ${companyNameToUse} (${currentData.currentMonthYear})* 📊\n\n` +
                          `✅ *Receitas:* R$ ${currentData.totalIncome.toFixed(2)}\n` +
                          `❌ *Despesas:* R$ ${currentData.totalExpenses.toFixed(2)}\n` +
                          `💰 *Lucro Líquido:* R$ ${currentData.netProfit.toFixed(2)}\n\n` +
                          `👥 *Total de Clientes:* ${currentData.totalCustomers}\n` +
                          `🧾 *Total Pendente (Fiados):* R$ ${currentData.totalDueFiados.toFixed(2)}\n` +
                          `📦 *Valor em Estoque:* R$ ${currentData.totalStockValue.toFixed(2)} (${currentData.totalProductsInStock} unidades)\n\n` +
                          `Este é um resumo. Para um relatório detalhado, use a opção 'Baixar/Imprimir Relatório (PDF)' no app MoneyWise.`;

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(reportMessage)}`;
    window.open(whatsappUrl, "_blank");

    toast({
      title: "Resumo Pronto para Envio!",
      description: `O resumo do relatório de ${currentData.currentMonthYear} está sendo preparado para envio via WhatsApp.`,
    });

    setIsProcessing(false);
  };

  const handleDownloadPdfReport = async () => {
    setIsProcessing(true);
    const currentData = reportData; // Use already calculated data
    await new Promise(resolve => setTimeout(resolve, 300)); // Short delay for UX

    const companyNameToUse = accountDetails?.companyName || currentCompany || "Sua Empresa";

    const reportHtml = `
      <html>
        <head>
          <title>Relatório Mensal - ${companyNameToUse} - ${currentData.currentMonthYear}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.6; font-size: 12pt; }
            .report-container { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
            .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .report-header h1 { margin: 0 0 5px 0; font-size: 1.8em; }
            .report-header h2 { margin: 0; font-size: 1.2em; color: #555; }
            .report-section { margin-bottom: 20px; }
            .report-section h3 { font-size: 1.3em; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            .report-section p { margin: 8px 0; font-size: 1em; }
            .report-section strong { color: #333; min-width: 200px; display: inline-block;}
            .report-footer { text-align: center; font-size: 0.9em; margin-top: 30px; color: #777; border-top: 1px solid #eee; padding-top: 15px;}
            .summary-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .summary-table th { background-color: #f2f2f2; font-weight: bold; }
            .summary-table td:nth-child(2) { text-align: right; font-weight: bold; }
            .profit { color: ${currentData.netProfit >= 0 ? 'green' : 'red'}; }
            @media print {
              body { margin: 0; color: #000; font-size: 10pt; }
              .report-container { border: none; box-shadow: none; max-width: 100%; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <h1>Relatório Gerencial Mensal</h1>
              <h2>${companyNameToUse}</h2>
              <p>Período: ${currentData.currentMonthYear}</p>
            </div>

            <div class="report-section">
              <h3>Resumo Financeiro do Mês</h3>
              <table class="summary-table">
                <tr><th>Receitas Totais</th><td>R$ ${currentData.totalIncome.toFixed(2)}</td></tr>
                <tr><th>Despesas Totais</th><td>R$ ${currentData.totalExpenses.toFixed(2)}</td></tr>
                <tr><th>Lucro Líquido</th><td class="profit">R$ ${currentData.netProfit.toFixed(2)}</td></tr>
              </table>
            </div>

            <div class="report-section">
              <h3>Indicadores Chave</h3>
               <table class="summary-table">
                <tr><th>Total de Clientes Cadastrados</th><td>${currentData.totalCustomers}</td></tr>
                <tr><th>Total Pendente em Fiados</th><td>R$ ${currentData.totalDueFiados.toFixed(2)}</td></tr>
                <tr><th>Valor Total em Estoque</th><td>R$ ${currentData.totalStockValue.toFixed(2)}</td></tr>
                <tr><th>Unidades Totais em Estoque</th><td>${currentData.totalProductsInStock}</td></tr>
              </table>
            </div>
            
            <div class="report-section">
              <h3>Observações</h3>
              <p>Este relatório é gerado com base nos dados inseridos no sistema MoneyWise até a presente data.</p>
              <p>Valores de fiado e estoque refletem o estado atual.</p>
            </div>

            <div class="report-footer">
              Gerado por MoneyWise em ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 250);
          </script>
        </body>
      </html>
    `;

    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
       toast({
        title: "Relatório Pronto para Download/Impressão",
        description: "Seu relatório mensal está sendo aberto. Use a opção 'Salvar como PDF' na caixa de diálogo de impressão.",
      });
    } else {
      toast({ title: "Erro ao Abrir Relatório", description: "Não foi possível abrir a janela para o relatório. Verifique as configurações do seu navegador.", variant: "destructive" });
    }
    setIsProcessing(false);
  };


  if (!isMounted || (isMounted && !currentCompany && !accountDetailsStorageKey)) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (isMounted && !currentCompany) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Nenhuma empresa selecionada.</p>
        <p className="text-muted-foreground">Por favor, faça login para acessar os Relatórios Mensais.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Relatório Mensal</CardTitle>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </div>
          <CardDescription>
            Visão geral do desempenho da sua empresa ({currentCompany || "Nenhuma"}) para o mês de {reportData.currentMonthYear}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {isGeneratingReport ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Gerando dados do relatório...</p></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">R$ {reportData.totalIncome.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">R$ {reportData.totalExpenses.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lucro Líquido do Mês</CardTitle>
                    <DollarSign className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      R$ {reportData.netProfit.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                 <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                    <Users className="h-5 w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{reportData.totalCustomers}</div>
                  </CardContent>
                </Card>
                 <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pendente (Fiados)</CardTitle>
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">R$ {reportData.totalDueFiados.toFixed(2)}</div>
                  </CardContent>
                </Card>
                 <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
                    <Package className="h-5 w-5 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">R$ {reportData.totalStockValue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{reportData.totalProductsInStock} unidades totais</p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 border rounded-lg bg-card shadow-inner space-y-4">
                <div>
                  <label htmlFor="whatsappNumberReport" className="text-sm font-medium block mb-1">
                    WhatsApp para Envio do Resumo (com DDD)
                  </label>
                  <Input
                    id="whatsappNumberReport"
                    placeholder="Ex: 5511912345678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este número é pré-preenchido com o telefone das configurações da sua conta ({currentCompany}), se disponível.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleSendWhatsAppSummary} disabled={isProcessing || !whatsappNumber.trim()} className="w-full sm:w-auto">
                    {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    {isProcessing ? "Processando..." : "Enviar Resumo via WhatsApp"}
                    </Button>
                    <Button onClick={handleDownloadPdfReport} disabled={isProcessing} variant="outline" className="w-full sm:w-auto">
                    {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="mr-2 h-4 w-4" />
                    )}
                    {isProcessing ? "Gerando..." : "Baixar/Imprimir Relatório (PDF)"}
                    </Button>
                </div>
              </div>
            </>
          )}
           <CardFooter className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
                Este relatório é gerado com base nos dados inseridos no sistema até o momento. As receitas e despesas são referentes ao mês corrente ({reportData.currentMonthYear}). Os totais de clientes, fiados e estoque refletem o estado atual.
            </p>
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
}
