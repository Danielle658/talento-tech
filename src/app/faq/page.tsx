import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "Como faço para registrar minha empresa?",
    answer: "Na página de login, clique na aba 'Registro'. Preencha todos os campos solicitados, incluindo nome da empresa, nome do proprietário, e-mail, telefone, CPF e senha. Não se esqueça de aceitar os termos de privacidade antes de clicar em 'Registrar'."
  },
  {
    question: "Esqueci minha senha. Como posso recuperá-la?",
    answer: "Atualmente, a funcionalidade de recuperação de senha está em desenvolvimento. Por favor, entre em contato com o suporte para assistência."
  },
  {
    question: "Onde posso ver minhas vendas e transações?",
    answer: "No Painel Central, você encontrará seções dedicadas à 'Caderneta Digital' para transações recentes e 'Vendas' para um resumo das suas atividades de venda."
  },
  {
    question: "O Assistente Virtual pode me ajudar com quais tarefas?",
    answer: "O Assistente Virtual pode interpretar comandos de voz e texto para ajudar na navegação dentro do aplicativo, como 'mostrar painel', 'criar nova fatura' (funcionalidade futura), ou 'buscar cliente X'."
  },
  {
    question: "Meus dados estão seguros no MoneyWise?",
    answer: "Sim, levamos a segurança dos seus dados a sério. Utilizamos diversas medidas para proteger suas informações. Para mais detalhes, consulte nossa Política de Privacidade."
  },
  {
    question: "Posso acessar o MoneyWise em dispositivos móveis?",
    answer: "Sim, o MoneyWise é responsivo e pode ser acessado em desktops, tablets e smartphones."
  }
];

export default function FaqPage() {
  return (
    <div className="container mx-auto min-h-screen py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl flex items-center gap-2"><HelpCircle className="h-8 w-8 text-primary"/> Perguntas Frequentes (FAQ)</CardTitle>
            <Button variant="outline" asChild>
              <Link href="/support">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Suporte
              </Link>
            </Button>
          </div>
          <CardDescription>Encontre respostas rápidas para as dúvidas mais comuns sobre o MoneyWise.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
