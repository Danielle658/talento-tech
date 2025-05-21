import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto min-h-screen py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl">Termos de Privacidade</CardTitle>
            <Button variant="outline" asChild>
              <Link href="/auth">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl dark:prose-invert max-w-none space-y-4">
          <p>Última atualização: 26 de Julho de 2024</p>
          
          <p>Bem-vindo ao MoneyWise. Nós valorizamos sua privacidade e estamos comprometidos em proteger suas informações pessoais. Esta Política de Privacidade descreve como coletamos, usamos, divulgamos e protegemos suas informações quando você usa nossos serviços.</p>

          <h2>1. Informações que Coletamos</h2>
          <p>Podemos coletar as seguintes informações:</p>
          <ul>
            <li><strong>Informações de Identificação Pessoal:</strong> Nome da empresa, nome do proprietário, endereço de e-mail, número de telefone, CPF.</li>
            <li><strong>Informações Financeiras:</strong> Dados de transações, informações de contas, dados de vendas e produtos (conforme inseridos por você).</li>
            <li><strong>Informações de Uso:</strong> Como você interage com nosso aplicativo, recursos utilizados, logs de acesso.</li>
            <li><strong>Informações do Dispositivo:</strong> Tipo de dispositivo, sistema operacional, endereço IP.</li>
          </ul>

          <h2>2. Como Usamos Suas Informações</h2>
          <p>Usamos suas informações para:</p>
          <ul>
            <li>Fornecer, operar e manter nossos serviços.</li>
            <li>Processar suas transações e gerenciar sua conta.</li>
            <li>Melhorar, personalizar e expandir nossos serviços.</li>
            <li>Entender e analisar como você usa nossos serviços.</li>
            <li>Desenvolver novos produtos, serviços, recursos e funcionalidades.</li>
            <li>Comunicar com você, diretamente ou através de um de nossos parceiros, incluindo para atendimento ao cliente, para fornecer atualizações e outras informações relacionadas ao serviço, e para fins de marketing e promocionais (com seu consentimento).</li>
            <li>Prevenir fraudes e garantir a segurança.</li>
          </ul>

          <h2>3. Compartilhamento de Informações</h2>
          <p>Não compartilhamos suas informações pessoais com terceiros, exceto nas seguintes circunstâncias:</p>
          <ul>
            <li>Com seu consentimento explícito.</li>
            <li>Para cumprir obrigações legais.</li>
            <li>Para proteger e defender nossos direitos e propriedades.</li>
            <li>Com provedores de serviços que nos auxiliam na operação de nossos negócios (sob acordos de confidencialidade).</li>
          </ul>

          <h2>4. Segurança de Dados</h2>
          <p>Implementamos medidas de segurança para proteger suas informações. No entanto, nenhum sistema de segurança é impenetrável e não podemos garantir a segurança absoluta de suas informações.</p>

          <h2>5. Seus Direitos</h2>
          <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Você também pode ter outros direitos dependendo da sua jurisdição.</p>

          <h2>6. Cookies e Tecnologias de Rastreamento</h2>
          <p>Usamos cookies e tecnologias similares para rastrear a atividade em nosso serviço e armazenar certas informações. Você pode instruir seu navegador a recusar todos os cookies ou a indicar quando um cookie está sendo enviado.</p>

          <h2>7. Alterações a Esta Política de Privacidade</h2>
          <p>Podemos atualizar nossa Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer alterações publicando a nova Política de Privacidade nesta página.</p>

          <h2>8. Contato</h2>
          <p>Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco em: privacidade@moneywise.example.com.</p>
        </CardContent>
      </Card>
    </div>
  );
}
