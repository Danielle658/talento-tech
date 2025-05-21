import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, LifeBuoy, Mail, Phone } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="container mx-auto min-h-screen py-12 px-4">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl flex items-center gap-2"><LifeBuoy className="h-8 w-8 text-primary"/> Suporte MoneyWise</CardTitle>
            <Button variant="outline" asChild>
              <Link href="/auth">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
          </div>
          <CardDescription>Precisa de ajuda? Estamos aqui para você!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">Perguntas Frequentes (FAQ)</h2>
            <p className="text-muted-foreground">Antes de entrar em contato, verifique nossa seção de <Link href="/faq" className="text-primary hover:underline">Perguntas Frequentes</Link>. Muitas dúvidas comuns já estão respondidas lá.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Entre em Contato</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-6 w-6 text-primary mt-1"/>
                <div>
                  <h3 className="font-medium">E-mail</h3>
                  <p className="text-muted-foreground">Para dúvidas gerais, sugestões ou problemas técnicos.</p>
                  <a href="mailto:suporte@moneywise.example.com" className="text-primary hover:underline">suporte@moneywise.example.com</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-6 w-6 text-primary mt-1"/>
                <div>
                  <h3 className="font-medium">Telefone</h3>
                  <p className="text-muted-foreground">Para suporte urgente (horário comercial: 09:00 - 18:00, Seg-Sex).</p>
                  <p className="font-semibold">+55 (XX) XXXX-XXXX</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Dicas para um Suporte Eficiente</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Tenha em mãos o nome da sua empresa e e-mail de cadastro.</li>
              <li>Descreva o problema detalhadamente, incluindo os passos que levaram ao erro.</li>
              <li>Se possível, envie capturas de tela (screenshots) do problema.</li>
            </ul>
          </section>
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">Nosso objetivo é responder a todas as solicitações em até 24 horas úteis.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
