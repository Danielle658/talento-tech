
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
import { Bot, Mic, Send, Loader2, Volume2, MicOff, VolumeX } from 'lucide-react';
import { interpretTextCommands, type InterpretTextCommandsOutput, type InterpretTextCommandsInput } from '@/ai/flows/interpret-text-commands';
import { interpretVoiceCommand, type InterpretVoiceCommandOutput, type InterpretVoiceCommandInput } from '@/ai/flows/interpret-voice-commands';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import type { Transaction } from '@/app/(app)/dashboard/notebook/page';
import { STORAGE_KEY_NOTEBOOK } from '@/app/(app)/dashboard/notebook/page';
import type { ProductEntry } from '@/app/(app)/dashboard/products/page';
import { STORAGE_KEY_PRODUCTS } from '@/app/(app)/dashboard/products/page';
import type { CreditEntry } from '@/app/(app)/dashboard/credit-notebook/page';
import { STORAGE_KEY_CREDIT_NOTEBOOK } from '@/app/(app)/dashboard/credit-notebook/page';
import type { CustomerEntry } from '@/app/(app)/dashboard/customers/page';
import { STORAGE_KEY_CUSTOMERS } from '@/app/(app)/dashboard/customers/page';
import { parseISO, isValid as isValidDate, format as formatDate } from 'date-fns';


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

// Helper function to safely parse localStorage
function getStoredData<T>(key: string, defaultValue: T[], toastInstance?: ReturnType<typeof useToast>['toast']): T[] {
  try {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (error) {
    console.error(`Error parsing data from localStorage for key ${key}:`, error);
    localStorage.removeItem(key);
    toastInstance?.({ title: `Erro de Dados (${key.replace('moneywise-','')})`, description: `Dados locais para ${key.replace('moneywise-','')} parecem corrompidos e foram resetados.`, variant: "destructive", duration: 7000});
    return defaultValue;
  }
}

// Helper function to save data to localStorage
function saveStoredData<T>(key: string, data: T[], toastInstance?: ReturnType<typeof useToast>['toast']): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving data to localStorage for key ${key}:`, error);
    toastInstance?.({ title: `Erro ao Salvar Dados (${key.replace('moneywise-','')})`, description: `Não foi possível salvar dados para ${key.replace('moneywise-','')}. Pode ser um problema de limite de armazenamento.`, variant: "destructive", duration: 7000});
    return false;
  }
}


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
    if (!supportedFeatures.speechSynthesis || !textToSpeak) return;
    if (isSpeaking) speechSynthesis.cancel(); 

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

  const executeActionAndSpeak = (action: string, paramsString?: string): string => {
    let navigationPath: string | null = null;
    let messageForChat: string = "Ação não reconhecida.";
    let parsedParameters: Record<string, any> = {};

    if (paramsString) {
      try {
        parsedParameters = JSON.parse(paramsString);
      } catch (e) {
        console.error("Failed to parse parameters JSON string:", paramsString, e);
        messageForChat = "Desculpe, houve um problema ao entender os detalhes do seu comando. Por favor, verifique o formato dos parâmetros JSON.";
        addMessage('assistant', messageForChat);
        speak(messageForChat);
        return messageForChat;
      }
    }
    
    const customerNameParam = parsedParameters?.customerName;
    const customerPhoneParam = parsedParameters?.phone;
    const customerEmailParam = parsedParameters?.email;
    const customerAddressParam = parsedParameters?.address;

    const creditAmountParam = parsedParameters?.amount;
    let creditDueDateParam = parsedParameters?.dueDate; 
    const creditWhatsappParam = parsedParameters?.whatsappNumber;
    const creditNotesParam = parsedParameters?.notes;
    
    const transactionTypeParam = parsedParameters?.type?.toLowerCase(); 
    const transactionDescParam = parsedParameters?.description;
    const transactionAmountParam = parsedParameters?.amount;

    const productNameParam = parsedParameters?.productName;
    const productCodeParam = parsedParameters?.productCode;
    const productPriceParam = parsedParameters?.productPrice;
    const productCategoryParam = parsedParameters?.category;
    const productStockParam = parsedParameters?.stock;
    
    const whatsappNumberParam = parsedParameters?.whatsapp;


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
          const transactionsData = getStoredData<Transaction>(STORAGE_KEY_NOTEBOOK, [], toast);
          const totalIncome = transactionsData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          messageForChat = `Sua receita total registrada na caderneta digital é de R$ ${totalIncome.toFixed(2)}.`;
        } catch (e) {
          console.error("Error processing queryTotalRevenue:", e);
          messageForChat = "Desculpe, não consegui calcular a receita total. Verifique os dados na Caderneta Digital.";
        }
        break;
      case 'querytotalcustomers':
        try {
          const customersData = getStoredData<CustomerEntry>(STORAGE_KEY_CUSTOMERS, [], toast);
          messageForChat = `Você tem ${customersData.length} clientes cadastrados.`;
        } catch (e) {
          console.error("Error processing queryTotalCustomers:", e);
          messageForChat = "Desculpe, não consegui contar os clientes. Verifique os dados em Contas de Clientes.";
        }
        break;
      case 'querytotalduefiados':
        try {
          const creditEntriesRaw = getStoredData<any>(STORAGE_KEY_CREDIT_NOTEBOOK, [], toast);
          const creditEntriesData = creditEntriesRaw.map(entry => ({...entry, saleDate: parseISO(entry.saleDate), dueDate: entry.dueDate ? parseISO(entry.dueDate) : undefined}));
          const totalDue = creditEntriesData.filter(entry => !entry.paid).reduce((sum, entry) => sum + entry.amount, 0);
          messageForChat = `O total pendente na caderneta de fiados é de R$ ${totalDue.toFixed(2)}.`;
        } catch (e) {
          console.error("Error processing queryTotalDueFiados:", e);
          messageForChat = "Desculpe, não consegui calcular o total de fiados. Verifique os dados na Caderneta de Fiados.";
        }
        break;
      case 'querypendingfiadoscount':
        try {
          const creditEntriesRaw = getStoredData<any>(STORAGE_KEY_CREDIT_NOTEBOOK, [], toast);
          const creditEntriesData = creditEntriesRaw.map(entry => ({...entry, saleDate: parseISO(entry.saleDate), dueDate: entry.dueDate ? parseISO(entry.dueDate) : undefined}));
          const pendingCount = creditEntriesData.filter(entry => !entry.paid).length;
          messageForChat = `Você tem ${pendingCount} fiados pendentes de pagamento.`;
        } catch (e) {
          console.error("Error processing queryPendingFiadosCount:", e);
          messageForChat = "Desculpe, não consegui contar os fiados pendentes. Verifique os dados.";
        }
        break;
      case 'querylowstockproductscount':
        try {
          const productsData = getStoredData<ProductEntry>(STORAGE_KEY_PRODUCTS, [], toast);
          const lowStockCount = productsData.filter(p => {
            const stockNumber = parseInt(p.stock || "0", 10);
            return !isNaN(stockNumber) && stockNumber > 0 && stockNumber <= LOW_STOCK_THRESHOLD;
          }).length;
          messageForChat = `Você tem ${lowStockCount} produtos com estoque baixo (igual ou inferior a ${LOW_STOCK_THRESHOLD} unidades).`;
        } catch (e) {
          console.error("Error processing queryLowStockProductsCount:", e);
          messageForChat = "Desculpe, não consegui verificar o estoque dos produtos. Verifique os dados.";
        }
        break;

      case 'initiateaddcustomer':
        if (customerNameParam && customerPhoneParam) {
          const customers = getStoredData<CustomerEntry>(STORAGE_KEY_CUSTOMERS, [], toast);
          const newCustomer: CustomerEntry = {
            id: `CUST${String(Date.now()).slice(-6)}`,
            name: customerNameParam,
            phone: customerPhoneParam,
            email: customerEmailParam || "",
            address: customerAddressParam || "",
          };
          if(saveStoredData<CustomerEntry>(STORAGE_KEY_CUSTOMERS, [...customers, newCustomer].sort((a,b) => a.name.localeCompare(b.name)), toast)) {
            messageForChat = `Cliente '${customerNameParam}' adicionado com sucesso! Vou te mostrar na lista de clientes.`;
          } else {
            messageForChat = `Não foi possível salvar o cliente '${customerNameParam}' diretamente. Por favor, tente adicioná-lo na página de clientes.`;
          }
          navigationPath = '/dashboard/customers';
        } else {
          messageForChat = "Para adicionar um cliente diretamente, preciso pelo menos do nome e telefone. Por exemplo: 'Adicionar cliente João Silva telefone (11) 91234-5678'. Se preferir, estou te levando para a página de Clientes para você preencher os detalhes.";
          navigationPath = '/dashboard/customers';
        }
        break;

      case 'initiateaddcreditentry':
        if (customerNameParam && creditAmountParam) {
            const creditEntriesRaw = getStoredData<any>(STORAGE_KEY_CREDIT_NOTEBOOK, [], toast);
            const creditEntries = creditEntriesRaw.map(entry => ({
                ...entry,
                saleDate: isValidDate(parseISO(entry.saleDate)) ? parseISO(entry.saleDate) : new Date(),
                dueDate: entry.dueDate && isValidDate(parseISO(entry.dueDate)) ? parseISO(entry.dueDate) : undefined,
            }));
            
            let parsedDueDate: Date | undefined = undefined;
            if (creditDueDateParam) {
                const date = parseISO(creditDueDateParam); // YYYY-MM-DD
                if(isValidDate(date)) parsedDueDate = date;
                else console.warn(`Assistente: Data de vencimento inválida recebida: ${creditDueDateParam}`);
            }

            const newEntry: CreditEntry = {
                id: `CF${String(Date.now()).slice(-6)}`,
                customerName: customerNameParam,
                amount: Number(creditAmountParam),
                saleDate: new Date(), 
                dueDate: parsedDueDate,
                whatsappNumber: creditWhatsappParam || "",
                notes: creditNotesParam || "",
                paid: false,
            };
            const entriesToSave = [...creditEntries, newEntry].sort((a,b) => b.saleDate.getTime() - a.saleDate.getTime());
            const entriesForStorage = entriesToSave.map(entry => ({
              ...entry,
              saleDate: (entry.saleDate as Date).toISOString(), 
              dueDate: entry.dueDate ? (entry.dueDate as Date).toISOString() : undefined,
            })) as unknown as CreditEntry[];

            if(saveStoredData<CreditEntry>(STORAGE_KEY_CREDIT_NOTEBOOK, entriesForStorage, toast)) {
                messageForChat = `Fiado de R$ ${Number(creditAmountParam).toFixed(2)} para '${customerNameParam}' adicionado com sucesso! Vou te mostrar na caderneta de fiados.`;
            } else {
                messageForChat = `Não foi possível salvar o fiado para '${customerNameParam}' diretamente. Por favor, tente adicioná-lo na página de fiados.`;
            }
            navigationPath = '/dashboard/credit-notebook';
        } else {
            messageForChat = "Para adicionar um fiado diretamente, preciso do nome do cliente e do valor. Por exemplo: 'Adicionar fiado para Maria Silva valor 50'. Se preferir, estou te levando para a Caderneta de Fiados para você preencher os detalhes.";
            navigationPath = '/dashboard/credit-notebook';
        }
        break;

      case 'initiateaddtransaction':
        if (transactionDescParam && transactionAmountParam && (transactionTypeParam === 'income' || transactionTypeParam === 'expense')) {
            const transactionsRaw = getStoredData<any>(STORAGE_KEY_NOTEBOOK, [], toast);
            const transactions = transactionsRaw.map(t => ({...t, date: isValidDate(parseISO(t.date)) ? parseISO(t.date) : new Date() }));
            
            const newTransaction: Transaction = {
                id: `T${String(Date.now()).slice(-6)}`,
                description: transactionDescParam,
                amount: Number(transactionAmountParam),
                type: transactionTypeParam as "income" | "expense",
                date: new Date(), 
            };
            const transactionsToSave = [...transactions, newTransaction].sort((a,b) => b.date.getTime() - a.date.getTime());
            const transactionsForStorage = transactionsToSave.map(t => ({ ...t, date: (t.date as Date).toISOString() })) as unknown as Transaction[];


            if(saveStoredData<Transaction>(STORAGE_KEY_NOTEBOOK, transactionsForStorage, toast)) {
                messageForChat = `${transactionTypeParam === 'income' ? 'Receita' : 'Despesa'} de '${transactionDescParam}' no valor de R$ ${Number(transactionAmountParam).toFixed(2)} registrada com sucesso! Vou te mostrar na caderneta.`;
            } else {
                 messageForChat = `Não foi possível salvar a transação diretamente. Por favor, tente adicioná-la na caderneta digital.`;
            }
            navigationPath = '/dashboard/notebook';
        } else {
            messageForChat = "Para adicionar uma transação diretamente, preciso da descrição, valor e tipo (receita ou despesa). Por exemplo: 'Registrar despesa aluguel valor 500'. Se preferir, estou te levando para a Caderneta Digital.";
            navigationPath = '/dashboard/notebook';
        }
        break;

      case 'initiateaddproduct':
        if (productNameParam && productCodeParam && productPriceParam !== undefined) { // Price can be 0, so check for undefined
            const products = getStoredData<ProductEntry>(STORAGE_KEY_PRODUCTS, [], toast);
            const newProduct: ProductEntry = {
                id: `PROD${String(Date.now()).slice(-6)}`,
                name: productNameParam,
                code: productCodeParam,
                price: Number(productPriceParam),
                category: productCategoryParam || "",
                stock: productStockParam || "",
            };
            if(saveStoredData<ProductEntry>(STORAGE_KEY_PRODUCTS, [...products, newProduct].sort((a,b) => a.name.localeCompare(b.name)), toast)) {
                messageForChat = `Produto '${productNameParam}' (código '${productCodeParam}', preço R$ ${Number(productPriceParam).toFixed(2)}) adicionado com sucesso! Vou te mostrar no catálogo.`;
            } else {
                messageForChat = `Não foi possível salvar o produto '${productNameParam}' diretamente. Por favor, tente adicioná-lo na página de produtos.`;
            }
            navigationPath = '/dashboard/products';
        } else {
             messageForChat = "Para adicionar um produto diretamente, preciso do nome, código e preço. Por exemplo: 'Adicionar produto Caneta Azul código CA001 preço 2.50'. Se preferir, estou te levando para a página de Produtos.";
             navigationPath = '/dashboard/products';
        }
        break;
        
      case 'initiatesendmonthlyreport':
        navigationPath = '/dashboard/monthly-report';
        if (whatsappNumberParam) {
            messageForChat = `Ok! Para enviar o relatório mensal para o WhatsApp ${whatsappNumberParam}, estou abrindo a página de Relatório Mensal. Confirme o número e clique em 'Gerar e Enviar Relatório para WhatsApp'.`;
        } else {
            messageForChat = `Ok! Indo para a página de Relatório Mensal. Por favor, insira o número de WhatsApp e clique em 'Gerar e Enviar Relatório para WhatsApp'.`;
        }
        break;

      case 'displaykpis':
        messageForChat = "Os principais indicadores (KPIs) são exibidos no Painel Central. Estou te levando para lá!";
        navigationPath = '/dashboard';
        break;
      case 'showsakes': 
      case 'showsales': 
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
        messageForChat = `Para ver detalhes do cliente ${customerNameParam || 'específico'}, por favor, vá para a seção Contas de Clientes e utilize a busca. Estou te direcionando para lá.`;
        navigationPath = '/dashboard/customers';
        break;
      case 'searchtransactions':
        const searchTerm = parsedParameters?.term || 'algo específico';
        messageForChat = `Para buscar transações por '${searchTerm}', por favor, vá para a Caderneta Digital. A busca detalhada lá ainda está em desenvolvimento. Vou te levar para a Caderneta.`;
        navigationPath = '/dashboard/notebook';
        break;
      
      case 'unknown':
      case 'unknowncommand':
        messageForChat = "Desculpe, não entendi o comando. Pode tentar de outra forma ou ser mais específico?";
        break;
      default:
        messageForChat = `Recebi a ação '${action}', mas ainda não sei como executá-la.`;
        if (parsedParameters && Object.keys(parsedParameters).length > 0) {
            messageForChat += ` Parâmetros: ${JSON.stringify(parsedParameters)}`;
        }
        break;
    }

    addMessage('assistant', messageForChat);

    if (navigationPath) {
      router.push(navigationPath);
      setIsDialogOpen(false); 
    }
    return messageForChat;
  };

  const handleTextCommand = async () => {
    if (!inputText.trim()) return;
    if (isSpeaking) speechSynthesis.cancel();

    const commandText = inputText;
    addMessage('user', commandText);
    setInputText('');
    setIsLoading(true);

    try {
      const response: InterpretTextCommandsOutput = await interpretTextCommands({ command: commandText } as InterpretTextCommandsInput);
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
    if (isSpeaking) speechSynthesis.cancel();

    addMessage('user', `🎤: ${commandText}`);
    setUserInputForVoice("");
    setIsLoading(true);

    try {
      const response: InterpretVoiceCommandOutput = await interpretVoiceCommand({ voiceCommand: commandText } as InterpretVoiceCommandInput);
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

  const handleVoiceControlButtonClick = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (isListening) {
      if (recognition) {
        recognition.stop();
      }
    } else {
      if (!supportedFeatures.speechRecognition || !recognition) {
        toast({ title: "Recurso Indisponível", description: "O reconhecimento de voz não é suportado pelo seu navegador.", variant: "destructive" });
        return;
      }
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

  let VoiceControlIcon = Mic;
  let voiceControlButtonLabel = "Começar a ouvir";
  let voiceControlButtonClass = "";
  let voiceControlButtonVariant: "outline" | "default" | "destructive" | "ghost" | "link" | "secondary" | null | undefined  = "outline";


  if (isSpeaking) {
    VoiceControlIcon = VolumeX;
    voiceControlButtonLabel = "Parar de falar";
    voiceControlButtonClass = "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 dark:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-400/10";
  } else if (isListening) {
    VoiceControlIcon = MicOff;
    voiceControlButtonLabel = "Parar de ouvir";
    voiceControlButtonClass = "border-destructive text-destructive hover:bg-destructive/10";
    voiceControlButtonVariant = "destructive";
  }


  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) { 
        if (recognition && isListening) {
          recognition.stop();
        }
        if (window.speechSynthesis && isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
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
            Use comandos de texto ou voz. Ex: 'Abrir painel', 'Adicionar cliente Maria telefone (11)9...', 'Qual minha receita?'.
            {!supportedFeatures.speechRecognition && <span className="text-destructive block text-xs mt-1">Reconhecimento de voz não suportado neste navegador.</span>}
            {!supportedFeatures.speechSynthesis && <span className="text-destructive block text-xs mt-1">Síntese de voz não suportada neste navegador.</span>}
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
              placeholder={isListening ? "Ouvindo..." : (isSpeaking ? "Assistente falando..." : "Digite seu comando...")}
              value={isListening ? userInputForVoice : inputText}
              onChange={(e) => {
                if (!isListening) setInputText(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading && inputText.trim() && !isListening && !isSpeaking) {
                  handleTextCommand();
                }
              }}
              disabled={isLoading || isListening || isSpeaking}
              className="flex-1 h-10 text-base"
              aria-label="Entrada de comando de texto"
            />
            <Button onClick={handleTextCommand} disabled={isLoading || !inputText.trim() || isListening || isSpeaking} aria-label="Enviar comando de texto" size="icon" className="h-10 w-10">
              <Send className="h-5 w-5" />
            </Button>
            {supportedFeatures.speechRecognition && (
              <Button
                variant={voiceControlButtonVariant}
                onClick={handleVoiceControlButtonClick}
                disabled={isLoading || (!isSpeaking && !isListening && !supportedFeatures.speechRecognition)}
                aria-label={voiceControlButtonLabel}
                size="icon"
                className={cn("h-10 w-10", voiceControlButtonClass)}
              >
                <VoiceControlIcon className="h-5 w-5" />
              </Button>
            )}
             {isSpeaking && !isLoading && <Volume2 className="h-5 w-5 text-primary animate-pulse ml-2" />}
          </div>
           <p className="text-xs text-muted-foreground mt-2 text-center">
            {isSpeaking ? "Assistente falando..." : (isListening ? "Fale agora. Pressione o microfone novamente para parar." : "Pressione Enter para enviar texto ou clique no microfone para falar.")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
