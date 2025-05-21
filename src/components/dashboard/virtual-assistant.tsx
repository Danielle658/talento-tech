
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Mic, Send, Loader2, Volume2, MicOff } from 'lucide-react';
import { interpretTextCommands } from '@/ai/flows/interpret-text-commands';
import { interpretVoiceCommand } from '@/ai/flows/interpret-voice-commands';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

import type { Transaction } from '@/app/(app)/dashboard/notebook/page';
import { STORAGE_KEY_NOTEBOOK } from '@/app/(app)/dashboard/notebook/page';
import type { ProductEntry } from '@/app/(app)/dashboard/products/page';
import { STORAGE_KEY_PRODUCTS } from '@/app/(app)/dashboard/products/page';
import type { CreditEntry } from '@/app/(app)/dashboard/credit-notebook/page';
import { STORAGE_KEY_CREDIT_NOTEBOOK } from '@/app/(app)/dashboard/credit-notebook/page';
import type { CustomerEntry } from '@/app/(app)/dashboard/customers/page';
import { STORAGE_KEY_CUSTOMERS } from '@/app/(app)/dashboard/customers/page';


interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  timestamp: Date;
}

interface BrowserSupport {
  speechRecognition: boolean;
  speechSynthesis: boolean;
}

const LOW_STOCK_THRESHOLD = 5;

export function VirtualAssistant() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportedFeatures, setSupportedFeatures] = useState<BrowserSupport>({
    speechRecognition: false,
    speechSynthesis: false,
  });
  const [userInputForVoice, setUserInputForVoice] = useState("");


  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasSpeechRecognition = !!SpeechRecognitionAPI;
    const hasSpeechSynthesis = 'speechSynthesis' in window;

    setSupportedFeatures({
      speechRecognition: hasSpeechRecognition,
      speechSynthesis: hasSpeechSynthesis,
    });

    if (hasSpeechRecognition) {
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';

      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setUserInputForVoice(finalTranscript || interimTranscript); 
        if (finalTranscript) {
          processSpokenCommand(finalTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error", event);
        let errorMessage = "Ocorreu um erro no reconhecimento de voz.";
        if (event.error === 'no-speech') {
          errorMessage = "Nenhuma fala detectada. Tente novamente.";
        } else if (event.error === 'audio-capture') {
          errorMessage = "Erro ao capturar áudio. Verifique seu microfone.";
        } else if (event.error === 'not-allowed') {
          errorMessage = "Permissão para usar o microfone negada.";
        }
        toast({ title: "Erro de Voz", description: errorMessage, variant: "destructive" });
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      setRecognition(recognitionInstance);
    }
  }, [toast]); 

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewportElement = scrollAreaRef.current.querySelector('div[style*="overflow: scroll"]');
      if (viewportElement) {
        viewportElement.scrollTop = viewportElement.scrollHeight;
      }
    }
  }, [chatMessages]);

  const speak = (textToSpeak: string) => {
    if (!supportedFeatures.speechSynthesis || !textToSpeak || isSpeaking) return;

    speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'pt-BR';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      toast({ title: "Erro na Fala", description: "Não foi possível reproduzir a resposta.", variant: "destructive" });
    };
    speechSynthesis.speak(utterance);
  };

  const addMessage = (sender: ChatMessage['sender'], text?: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender, text, timestamp: new Date() }]);
  };

  const executeActionAndSpeak = (action: string, parameters: any): string => {
    let navigationPath: string | null = null;
    let messageForChat: string = "Ação não reconhecida.";
    const customerNameParam = parameters?.customerName || parameters?.nomeCliente || "";
    const productNameParam = parameters?.productName || parameters?.nomeProduto || "";
    const transactionType = parameters?.type || "";
    const transactionDesc = parameters?.description || "";
    const transactionAmount = parameters?.amount || "";
    const whatsappNumberParam = parameters?.whatsappNumber || "";


    switch (action?.toLowerCase()) {
      case 'navigatetodashboard':
        navigationPath = '/dashboard';
        messageForChat = "Ok, abrindo o painel central.";
        break;
      case 'navigatetocustomers':
        navigationPath = '/dashboard/customers';
        messageForChat = "Certo, indo para as contas de clientes.";
        break;
      case 'navigatetosales': 
        navigationPath = '/dashboard/sales';
        messageForChat = "Entendido. Abrindo o Ponto de Venda.";
        break;
      case 'navigatetoproducts':
        navigationPath = '/dashboard/products';
        messageForChat = "Ok, abrindo o catálogo de produtos.";
        break;
      case 'navigatetocreditnotebook':
        navigationPath = '/dashboard/credit-notebook';
        messageForChat = "Certo, indo para a caderneta de fiados.";
        break;
      case 'navigatetosalesrecord':
        navigationPath = '/dashboard/sales-record';
        messageForChat = "Entendido. Abrindo o histórico de vendas.";
        break;
      case 'navigatetomonthlyreport':
        navigationPath = '/dashboard/monthly-report';
        messageForChat = "Ok, abrindo a página de relatório mensal.";
        break;
      case 'navigatetosettings':
        navigationPath = '/dashboard/settings';
        messageForChat = "Certo, indo para as configurações.";
        break;
      case 'navigatetotebook':
         navigationPath = '/dashboard/notebook';
         messageForChat = "Ok, abrindo a caderneta digital.";
         break;

      case 'querytotalrevenue':
        try {
          const storedTransactions = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
          const transactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions).map((t: any) => ({...t, date: new Date(t.date)})) : [];
          const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          messageForChat = `Sua receita total registrada na caderneta digital é de R$ ${totalIncome.toFixed(2)}.`;
        } catch (e) {
          console.error("Error parsing transactions for queryTotalRevenue:", e);
          messageForChat = "Desculpe, não consegui calcular a receita total. Verifique os dados na Caderneta Digital ou se há erros de carregamento.";
          toast({variant: 'destructive', title: 'Erro de Dados', description: 'Falha ao ler dados da caderneta para calcular receita.'})
        }
        break;
      case 'querytotalcustomers':
        try {
          const storedCustomers = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
          const customers: CustomerEntry[] = storedCustomers ? JSON.parse(storedCustomers) : [];
          messageForChat = `Você tem ${customers.length} clientes cadastrados.`;
        } catch (e) {
          console.error("Error parsing customers for queryTotalCustomers:", e);
          messageForChat = "Desculpe, não consegui contar os clientes. Verifique os dados em Contas de Clientes ou se há erros de carregamento.";
          toast({variant: 'destructive', title: 'Erro de Dados', description: 'Falha ao ler dados de clientes.'})
        }
        break;
      case 'querytotalduefiados':
        try {
          const storedCreditEntries = localStorage.getItem(STORAGE_KEY_CREDIT_NOTEBOOK);
          const creditEntries: CreditEntry[] = storedCreditEntries ? JSON.parse(storedCreditEntries).map((entry: any) => ({ ...entry, saleDate: new Date(entry.saleDate), dueDate: entry.dueDate ? new Date(entry.dueDate) : undefined })) : [];
          const totalDue = creditEntries.filter(entry => !entry.paid).reduce((sum, entry) => sum + entry.amount, 0);
          messageForChat = `O total pendente na caderneta de fiados é de R$ ${totalDue.toFixed(2)}.`;
        } catch (e) {
          console.error("Error parsing credit entries for queryTotalDueFiados:", e);
          messageForChat = "Desculpe, não consegui calcular o total de fiados. Verifique os dados na Caderneta de Fiados ou se há erros de carregamento.";
          toast({variant: 'destructive', title: 'Erro de Dados', description: 'Falha ao ler dados de fiados.'})
        }
        break;
      case 'querypendingfiadoscount':
        try {
          const storedCreditEntries = localStorage.getItem(STORAGE_KEY_CREDIT_NOTEBOOK);
          const creditEntries: CreditEntry[] = storedCreditEntries ? JSON.parse(storedCreditEntries).map((entry: any) => ({ ...entry, saleDate: new Date(entry.saleDate), dueDate: entry.dueDate ? new Date(entry.dueDate) : undefined })) : [];
          const pendingCount = creditEntries.filter(entry => !entry.paid).length;
          messageForChat = `Você tem ${pendingCount} fiados pendentes de pagamento.`;
        } catch (e) {
          console.error("Error parsing credit entries for queryPendingFiadosCount:", e);
          messageForChat = "Desculpe, não consegui contar os fiados pendentes. Verifique os dados ou se há erros de carregamento.";
           toast({variant: 'destructive', title: 'Erro de Dados', description: 'Falha ao ler dados de fiados pendentes.'})
        }
        break;
      case 'querylowstockproductscount':
        try {
          const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
          const products: ProductEntry[] = storedProducts ? JSON.parse(storedProducts) : [];
          const lowStockCount = products.filter(p => {
            const stockNumber = parseInt(p.stock || "0", 10);
            return !isNaN(stockNumber) && stockNumber > 0 && stockNumber <= LOW_STOCK_THRESHOLD;
          }).length;
          messageForChat = `Você tem ${lowStockCount} produtos com estoque baixo (igual ou inferior a ${LOW_STOCK_THRESHOLD} unidades).`;
        } catch (e) {
          console.error("Error parsing products for queryLowStockProductsCount:", e);
          messageForChat = "Desculpe, não consegui verificar o estoque dos produtos. Verifique os dados ou se há erros de carregamento.";
          toast({variant: 'destructive', title: 'Erro de Dados', description: 'Falha ao ler dados de produtos para estoque.'})
        }
        break;
      
      case 'initiateaddcustomer':
        navigationPath = '/dashboard/customers';
        messageForChat = `Certo! Indo para a página de clientes. Clique em 'Adicionar Novo Cliente' para continuar.`;
        if (customerNameParam) {
          messageForChat += ` Você pode adicionar o cliente ${customerNameParam}.`;
        }
        break;
      case 'initiateaddcreditentry':
        navigationPath = '/dashboard/credit-notebook';
        messageForChat = `Ok! Indo para a Caderneta de Fiados. Clique em 'Adicionar Novo Fiado' para registrar.`;
        if (customerNameParam) {
          messageForChat += ` Você pode registrar um fiado para ${customerNameParam}.`;
        }
        break;
      case 'initiateaddtransaction':
        navigationPath = '/dashboard/notebook';
        messageForChat = `Entendido. Indo para a Caderneta Digital. Clique em 'Adicionar Transação'.`;
        if (transactionType) {
            messageForChat += ` Você pode registrar uma ${transactionType === 'income' ? 'receita' : 'despesa'}`;
            if (transactionDesc) messageForChat += ` para "${transactionDesc}"`;
            if (transactionAmount) messageForChat += ` no valor de R$ ${transactionAmount}`;
            messageForChat += `.`;
        }
        break;
      case 'initiateaddproduct':
        navigationPath = '/dashboard/products';
        messageForChat = `Certo! Indo para a página de Produtos. Clique em 'Adicionar Novo' para cadastrar.`;
        if (productNameParam) {
          messageForChat += ` Você pode cadastrar o produto ${productNameParam}.`;
        }
        break;
      case 'initiatesendmonthlyreport':
        navigationPath = '/dashboard/monthly-report';
        messageForChat = `Ok! Indo para a página de Relatório Mensal.`;
        if (whatsappNumberParam) {
            messageForChat += ` Você pode inserir o número ${whatsappNumberParam} e clicar em 'Gerar e Enviar Relatório para WhatsApp'.`;
        } else {
            messageForChat += ` Por favor, insira o número de WhatsApp e clique em 'Gerar e Enviar Relatório para WhatsApp'.`;
        }
        break;

      case 'displaykpis':
        messageForChat = "Os principais indicadores (KPIs) são exibidos no Painel Central. Estou te levando para lá!";
        navigationPath = '/dashboard';
        break;
      case 'showsakes': 
      case 'showsales': // Legacy compatibility
        navigationPath = '/dashboard/sales-record';
        messageForChat = "Ok, abrindo o histórico de vendas.";
        break;
      case 'gotocustomeraccounts': 
        navigationPath = '/dashboard/customers';
        messageForChat = "Certo, indo para as contas de clientes.";
        break;
      case 'createnewinvoice':
        messageForChat = "Entendido! A funcionalidade de criar nova fatura ainda está em desenvolvimento.";
        break;
      case 'viewcustomerdetails':
        messageForChat = `Para ver detalhes do cliente ${customerNameParam || 'específico'}, por favor, vá para a seção Contas de Clientes e utilize a busca.`;
        navigationPath = '/dashboard/customers';
        break;
      case 'searchtransactions':
        const searchTerm = parameters?.term || 'algo específico';
        messageForChat = `Para buscar transações por '${searchTerm}', por favor, vá para a Caderneta Digital. A busca detalhada lá ainda está em desenvolvimento.`;
        navigationPath = '/dashboard/notebook';
        break;

      case 'unknown':
      case 'unknowncommand':
        messageForChat = "Desculpe, não entendi o comando. Pode tentar de outra forma ou ser mais específico?";
        break;
      default:
        messageForChat = `Recebi a ação '${action}', mas ainda não sei como executá-la.`;
        if (parameters && Object.keys(parameters).length > 0) {
            messageForChat += ` Parâmetros: ${JSON.stringify(parameters)}`;
        }
        break;
    }

    addMessage('assistant', messageForChat);

    if (navigationPath) {
      router.push(navigationPath);
      setIsDialogOpen(false); // Close dialog after navigation
    }
    return messageForChat;
  };

  const handleTextCommand = async () => {
    if (!inputText.trim()) return;
    const commandText = inputText;
    addMessage('user', commandText);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await interpretTextCommands({ command: commandText });
      const messageToSpeak = executeActionAndSpeak(response.action, response.parameters);
      speak(messageToSpeak);
    } catch (error) {
      console.error("Error interpreting text command:", error);
      const errMsg = `Desculpe, ocorreu um erro ao processar: "${commandText}"`;
      addMessage('assistant', errMsg);
      speak(errMsg);
      toast({ title: "Erro de Processamento", description: "Não foi possível processar o comando de texto.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const processSpokenCommand = async (commandText: string) => {
    if (!commandText.trim()) return;
    addMessage('user', `🎤: ${commandText}`); 
    setUserInputForVoice(""); 
    setIsLoading(true);

    try {
      const response = await interpretVoiceCommand({ voiceCommand: commandText });
      const messageToSpeak = executeActionAndSpeak(response.action, response.parameters);
      speak(messageToSpeak);
    } catch (error) {
      console.error("Error interpreting voice command:", error);
      const errMsg = `Desculpe, ocorreu um erro ao processar o comando de voz: "${commandText}"`;
      addMessage('assistant', errMsg);
      speak(errMsg);
      toast({ title: "Erro de Processamento", description: "Não foi possível processar o comando de voz.", variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  const handleToggleListening = () => {
    if (!supportedFeatures.speechRecognition || !recognition) {
      toast({ title: "Recurso Indisponível", description: "O reconhecimento de voz não é suportado pelo seu navegador.", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setUserInputForVoice(''); 
      try {
        recognition.start();
        setIsListening(true);
        toast({ title: "Ouvindo...", description: "Fale agora." });
      } catch (e) {
        console.error("Error starting recognition:", e);
        toast({ title: "Erro ao Iniciar", description: "Não foi possível iniciar o reconhecimento de voz. Verifique as permissões do microfone.", variant: "destructive" });
        setIsListening(false);
      }
    }
  };


  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open && recognition && isListening) {
        recognition.stop();
        setIsListening(false);
      }
      if (!open && window.speechSynthesis && isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bot className="h-5 w-5" />
          <span className="sr-only">Assistente Virtual</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col h-[80vh] max-h-[700px] min-h-[400px]">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-primary" /> Assistente Virtual MoneyWise
          </DialogTitle>
          <DialogDescription>
            Use comandos de texto ou voz. Ex: 'Abrir painel', 'Adicionar cliente Maria', 'Qual minha receita?'.
            {!supportedFeatures.speechRecognition && <span className="text-destructive block text-xs">Reconhecimento de voz não suportado neste navegador.</span>}
            {!supportedFeatures.speechSynthesis && <span className="text-destructive block text-xs">Síntese de voz não suportada neste navegador.</span>}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow w-full p-6 pt-2" ref={scrollAreaRef}>
          <div className="space-y-4 mb-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 text-sm shadow ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-card-foreground'
                  }`}
                >
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/80 text-right' : 'text-muted-foreground text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && ( 
              <div className="flex justify-start">
                 <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-muted text-card-foreground shadow">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                 </div>
              </div>
            )}
             {isListening && userInputForVoice && ( 
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm shadow bg-primary/80 text-primary-foreground italic">
                  <p className="whitespace-pre-wrap">🎤: {userInputForVoice}...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder={isListening ? "Ouvindo..." : "Digite seu comando..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading && inputText.trim()) {
                  handleTextCommand();
                }
              }}
              disabled={isLoading || isListening}
              className="flex-1 h-10 text-base"
              aria-label="Entrada de comando de texto"
            />
            <Button onClick={handleTextCommand} disabled={isLoading || !inputText.trim() || isListening} aria-label="Enviar comando de texto" size="icon" className="h-10 w-10">
              <Send className="h-5 w-5" />
            </Button>
            {supportedFeatures.speechRecognition && (
              <Button 
                variant="outline" 
                onClick={handleToggleListening} 
                disabled={isLoading || isSpeaking} 
                aria-label={isListening ? "Parar de ouvir" : "Começar a ouvir"} 
                size="icon" 
                className={`h-10 w-10 ${isListening ? 'border-destructive text-destructive hover:bg-destructive/10' : ''}`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
             {isSpeaking && <Volume2 className="h-5 w-5 text-primary animate-pulse" />}
          </div>
           <p className="text-xs text-muted-foreground mt-2 text-center">
            {isListening ? "Fale agora. Pressione o microfone novamente para parar." : "Pressione Enter para enviar texto ou clique no microfone para falar."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
