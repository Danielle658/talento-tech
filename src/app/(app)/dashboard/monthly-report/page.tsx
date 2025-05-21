
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MonthlyReportPage() {
  const { toast } = useToast();
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateAndSendReport = async () => {
    if (!whatsappNumber.trim()) {
      toast({
        title: "Número de WhatsApp Necessário",
        description: "Por favor, insira um número de WhatsApp para enviar o relatório.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const currentMonthYear = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });
    const reportMessage = `Olá! Segue o resumo do seu relatório mensal da MoneyWise para ${currentMonthYear}. Em breve, este relatório incluirá dados financeiros detalhados da sua empresa.`;
    
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(reportMessage)}`;

    window.open(whatsappUrl, "_blank");

    toast({
      title: "Relatório Enviado!",
      description: `O relatório de ${currentMonthYear} está sendo preparado para envio via WhatsApp.`,
    });

    setIsProcessing(false);
    setWhatsappNumber(""); // Clear input after sending
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Relatório Mensal</CardTitle>
          </div>
          <CardDescription>
            Gere um resumo mensal e envie-o para seu WhatsApp. Funcionalidades avançadas de relatório em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg bg-card shadow space-y-4">
            <div>
              <label htmlFor="whatsappNumberReport" className="text-sm font-medium block mb-1">
                Seu WhatsApp para Envio do Relatório (com DDD)
              </label>
              <Input
                id="whatsappNumberReport"
                placeholder="Ex: 5511912345678"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <Button onClick={handleGenerateAndSendReport} disabled={isProcessing} className="w-full sm:w-auto">
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isProcessing ? "Processando..." : "Gerar e Enviar Relatório para WhatsApp"}
            </Button>
          </div>
          
          <p className="text-muted-foreground text-sm">
            Atualmente, o "relatório" enviado é uma mensagem de texto resumida. Em futuras atualizações, esta seção permitirá visualizar gráficos de desempenho detalhados, principais KPIs do mês, comparativos com períodos anteriores e muito mais.
          </p>
          <div className="mt-8 flex justify-center">
            <img 
              src="https://placehold.co/600x400.png" 
              alt="Placeholder para Gráficos de Relatório Mensal" 
              className="rounded-lg shadow-md"
              data-ai-hint="financial report chart"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
