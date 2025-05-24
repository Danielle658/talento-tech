
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Send, Loader2, FileDown, ArrowLeft } from "lucide-react"; // Added ArrowLeft
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from '@/hooks/use-auth';
import { ACCOUNT_DETAILS_BASE_STORAGE_KEY, getCompanySpecificKey } from '@/lib/constants';
import type { AccountDetailsFormValues } from "@/app/(app)/dashboard/settings/page";


export default function MonthlyReportPage() {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const router = useRouter(); // Initialize useRouter
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetailsFormValues | null>(null);

  const accountDetailsStorageKey = useMemo(() => getCompanySpecificKey(ACCOUNT_DETAILS_BASE_STORAGE_KEY, currentCompany), [currentCompany]);

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
              localStorage.removeItem(accountDetailsStorageKey);
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
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentMonthYear = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
    const companyNameToUse = accountDetails?.companyName || currentCompany || "Sua Empresa";
    const reportMessage = `Olá! Segue o resumo do seu relatório mensal da MoneyWise (${companyNameToUse}) para ${currentMonthYear}. Em breve, este relatório incluirá dados financeiros detalhados da sua empresa.\\n\\nVocê pode gerar uma versão em PDF do relatório exemplo através da opção 'Baixar/Imprimir Relatório (PDF)' no app.`;

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(reportMessage)}`;

    window.open(whatsappUrl, "_blank");

    toast({
      title: "Resumo Enviado!",
      description: `O resumo do relatório de ${currentMonthYear} está sendo preparado para envio via WhatsApp para o número ${whatsappNumber}.`,
    });

    setIsProcessing(false);
  };

  const handleDownloadPdfReport = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentMonthYear = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
    const companyNameToUse = accountDetails?.companyName || currentCompany || "Sua Empresa";

    const reportData = {
        totalRevenue: "R$ 1.234,56",
        totalExpenses: "R$ 789,01",
        netProfit: "R$ 445,55",
        topProduct: "Produto X (15 unidades)",
    };

    const reportHtml = \`
      <html>
        <head>
          <title>Relatório Mensal - \${companyNameToUse} - \${currentMonthYear}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.6; }
            .report-container { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
            .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .report-header h1 { margin: 0 0 5px 0; font-size: 1.8em; }
            .report-header h2 { margin: 0; font-size: 1.2em; color: #555; }
            .report-section { margin-bottom: 20px; }
            .report-section h3 { font-size: 1.3em; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            .report-section p { margin: 5px 0; font-size: 1em; }
            .report-section strong { color: #333; }
            .report-footer { text-align: center; font-size: 0.9em; margin-top: 30px; color: #777; border-top: 1px solid #eee; padding-top: 15px;}
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f9f9f9; }
            @media print {
              body { margin: 0; color: #000; }
              .report-container { border: none; box-shadow: none; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <h1>Relatório Mensal</h1>
              <h2>\${companyNameToUse}</h2>
              <p>Período: \${currentMonthYear}</p>
            </div>

            <div class="report-section">
              <h3>Resumo Financeiro (Exemplo)</h3>
              <p><strong>Receita Total:</strong> \${reportData.totalRevenue}</p>
              <p><strong>Despesas Totais:</strong> \${reportData.totalExpenses}</p>
              <p><strong>Lucro Líquido:</strong> \${reportData.netProfit}</p>
            </div>

            <div class="report-section">
              <h3>Destaques (Exemplo)</h3>
              <p><strong>Produto Mais Vendido:</strong> \${reportData.topProduct}</p>
              <p><strong>Novos Clientes:</strong> 5</p>
            </div>

            <div class="report-footer">
              Gerado por MoneyWise em \${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
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
    \`;

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
            Gere um resumo mensal (exemplo) e envie-o para seu WhatsApp ou baixe uma versão para impressão (PDF). Empresa: {currentCompany || "Nenhuma"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg bg-card shadow space-y-4">
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

          <p className="text-muted-foreground text-sm">
            Atualmente, o "relatório" para download/impressão é um exemplo com dados fictícios. Em futuras atualizações, esta seção permitirá visualizar gráficos de desempenho detalhados, principais KPIs do mês, comparativos com períodos anteriores e muito mais, usando seus dados reais.
          </p>
          <div className="mt-8 flex justify-center">
            <p className="text-muted-foreground text-center py-4">Gráficos de relatório mensal (usando seus dados) serão exibidos aqui em breve.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
