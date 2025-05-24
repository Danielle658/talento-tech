
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { Bot, Mic, Send, Loader2, Volume2, MicOff, VolumeX, AlertTriangle } from 'lucide-react';
import { interpretTextCommands, type InterpretTextCommandsOutput, type InterpretTextCommandsInput } from '@/ai/flows/interpret-text-commands';
import { interpretVoiceCommand, type InterpretVoiceCommandOutput, type InterpretVoiceCommandInput } from '@/ai/flows/interpret-voice-commands';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  STORAGE_KEY_NOTEBOOK_BASE,
  STORAGE_KEY_PRODUCTS_BASE,
  STORAGE_KEY_CREDIT_NOTEBOOK_BASE,
  STORAGE_KEY_CUSTOMERS_BASE,
  getCompanySpecificKey
} from '@/lib/constants';
import type { Transaction } from '@/app/(app)/dashboard/notebook/page';
import type { ProductEntry } from '@/app/(app)/dashboard/products/page';
import type { CreditEntry } from '@/app/(app)/dashboard/credit-notebook/page';
import type { CustomerEntry } from '@/app/(app)/dashboard/customers/page';
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
function getStoredData<T>(key: string | null, defaultValue: T[], toastInstance?: ReturnType<typeof useToast>['toast'], companyName?: string | null): T[] {
  if (typeof window === 'undefined' || !key) return defaultValue;
  try {
    const storedData = localStorage.getItem(key);
    const parsed = storedData ? JSON.parse(storedData) : defaultValue;
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (error) {
    console.error(`Error parsing data from localStorage for key ${key} (Company: ${companyName || 'N/A'}):`, error);
    if (key) localStorage.removeItem(key); // Remove corrupted data
    toastInstance?.({ title: `Erro de Dados (${key.replace('moneywise-','').replace(`_${companyName}`, '')})`, description: `Dados locais para ${key.replace('moneywise-','').replace(`_${companyName}`, '')} parecem corrompidos e foram resetados.`, variant: "destructive", duration: 7000, toastId: `loadError-${key}` });
    return defaultValue;
  }
}

// Helper function to save data to localStorage
function saveStoredData<T>(key: string | null, data: T[], toastInstance?: ReturnType<typeof useToast>['toast'], companyName?: string | null): boolean {
  if (typeof window === 'undefined' || !key) return false;
  try {
    const dataToSave = data.map(item => {
      if (typeof item === 'object' && item !== null) {
        const newItem = { ...item } as any;
        if (newItem.date && newItem.date instanceof Date) {
          newItem.date = newItem.date.toISOString();
        }
        if (newItem.saleDate && newItem.saleDate instanceof Date) {
          newItem.saleDate = newItem.saleDate.toISOString();
        }
        if (newItem.dueDate && newItem.dueDate instanceof Date) {
          newItem.dueDate = newItem.dueDate.toISOString();
        }
        return newItem;
      }
      return item;
    });
    localStorage.setItem(key, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error(`Error saving data to localStorage for key ${key} (Company: ${companyName || 'N/A'}):`, error);
    toastInstance?.({ title: `Erro ao Salvar Dados (${key.replace('moneywise-','').replace(`_${companyName}`, '')})`, description: `Não foi possível salvar dados para ${key.replace('moneywise-','').replace(`_${companyName}`, '')}. Pode ser um problema de limite de armazenamento.`, variant: "destructive", duration: 7000, toastId: `saveError-${key}` });
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
  const { currentCompany } = useAuth();

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportedFeatures, setSupportedFeatures] = useState<BrowserSupport>({
    speechRecognition: false,
    speechSynthesis: false,
  });
  const [userInputForVoice, setUserInputForVoice] = useState("");

  const notebookStorageKey = useMemo(() => getCompanySpecificKey(STORAGE_KEY_NOTEBOOK_BASE, currentCompany), [currentCompany]);
  const productsStorageKey = useMemo(() => getCompanySpecificKey(STORAGE_KEY_PRODUCTS_BASE, currentCompany), [currentCompany]);
  const creditNotebookStorageKey = useMemo(() => getCompanySpecificKey(STORAGE_KEY_CREDIT_NOTEBOOK_BASE, currentCompany), [currentCompany]);
  const customersStorageKey = useMemo(() => getCompanySpecificKey(STORAGE_KEY_CUSTOMERS_BASE, currentCompany), [currentCompany]);


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

  const addMessage = useCallback((sender: ChatMessage['sender'], text?: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender, text, timestamp: new Date() }]);
  }, []);
  
  const speak = useCallback((textToSpeak: string) => {
    if (!supportedFeatures.speechSynthesis || !textToSpeak || typeof window.speechSynthesis === 'undefined') return;
    
    // Cancel any ongoing speech first
    if (isSpeaking || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'pt-BR';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      toast({ title: "Erro na Fala", description: "Não foi possível reproduzir a resposta.", variant: "destructive" });
    };
    window.speechSynthesis.speak(utterance);
  }, [supportedFeatures.speechSynthesis, toast, isSpeaking]); // Added isSpeaking to dependencies

  useEffect(() => {
    if (isDialogOpen && supportedFeatures.speechSynthesis && chatMessages.length === 0 && !isSpeaking) {
      const initialGreeting = "Olá! Sou seu assistente virtual MoneyWise. Como posso te ajudar hoje?";
      speak(initialGreeting);
      addMessage('assistant', initialGreeting);
    }
  }, [isDialogOpen, supportedFeatures.speechSynthesis, chatMessages.length, speak, addMessage, isSpeaking]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewportElement = scrollAreaRef.current.querySelector('div[style*="overflow: scroll"]');
      if (viewportElement) {
        viewportElement.scrollTop = viewportElement.scrollHeight;
      }
    }
  }, [chatMessages]);


  const executeActionAndSpeak = (action: string, paramsString?: string): string => {
    let navigationPath: string | null = null;
    let messageForChat: string = "Ação não reconhecida.";
    let parsedParameters: Record<string, any> = {};

    if (!currentCompany) {
      messageForChat = "Por favor, faça login primeiro para usar o assistente com os dados da sua empresa.";
      addMessage('assistant', messageForChat);
      return messageForChat;
    }

    if (paramsString) {
      try {
        parsedParameters = JSON.parse(paramsString);
      } catch (e) {
        console.error("Failed to parse parameters JSON string:", paramsString, e);
        messageForChat = "Desculpe, houve um problema ao entender os detalhes do seu comando. Verifique o formato dos parâmetros.";
        addMessage('assistant', messageForChat);
        return messageForChat;
      }
    }

    const customerNameParam = parsedParameters?.customerName;
    const customerPhoneParam = parsedParameters?.phone;
    const customerEmailParam = parsedParameters?.email;
    const customerAddressParam = parsedParameters?.address;

    const creditAmountParam = parsedParameters?.amount;
    const creditDueDateParam = parsedParameters?.dueDate;
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
      case 'navigatetotonotebook':
         navigationPath = '/dashboard/notebook';
         messageForChat = "Ok, abrindo a caderneta digital.";
         break;

      case 'querytotalrevenue':
        try {
          const transactionsDataRaw = getStoredData<any>(notebookStorageKey, [], toast, currentCompany);
          const transactionsData: Transaction[] = transactionsDataRaw.map(t => ({...t, date: parseISO(t.date)}));
          const totalIncome = transactionsData.filter(t => t.type === 'income' && isValidDate(t.date)).reduce((sum, t) => sum + t.amount, 0);
          messageForChat = `Sua receita total registrada na caderneta digital é de R$ ${totalIncome.toFixed(2)}.`;
        } catch (e) {
          console.error("Error processing queryTotalRevenue for", currentCompany, e);
          messageForChat = "Desculpe, não consegui calcular a receita total. Verifique os dados na Caderneta Digital.";
        }
        break;
      case 'querytotalcustomers':
        try {
          const customersData = getStoredData<CustomerEntry>(customersStorageKey, [], toast, currentCompany);
          messageForChat = `Você tem ${customersData.length} clientes cadastrados.`;
        } catch (e) {
          console.error("Error processing queryTotalCustomers for", currentCompany, e);
          messageForChat = "Desculpe, não consegui contar os clientes. Verifique os dados em Contas de Clientes.";
        }
        break;
      case 'querytotalduefiados':
        try {
          const creditEntriesRaw = getStoredData<any>(creditNotebookStorageKey, [], toast, currentCompany);
          const creditEntriesData: CreditEntry[] = creditEntriesRaw.map((entry: any) => ({
            ...entry,
            saleDate: parseISO(entry.saleDate),
            dueDate: entry.dueDate ? parseISO(entry.dueDate) : undefined,
          }));
          const totalDue = creditEntriesData.filter(entry => !entry.paid && isValidDate(entry.saleDate)).reduce((sum, entry) => sum + entry.amount, 0);
          messageForChat = `O total pendente na caderneta de fiados é de R$ ${totalDue.toFixed(2)}.`;
        } catch (e) {
          console.error("Error processing queryTotalDueFiados for", currentCompany, e);
          messageForChat = "Desculpe, não consegui calcular o total de fiados. Verifique os dados na Caderneta de Fiados.";
        }
        break;
      case 'querypendingfiadoscount':
        try {
          const creditEntriesRaw = getStoredData<any>(creditNotebookStorageKey, [], toast, currentCompany);
           const creditEntriesData: CreditEntry[] = creditEntriesRaw.map((entry: any) => ({
            ...entry,
            saleDate: parseISO(entry.saleDate),
            dueDate: entry.dueDate ? parseISO(entry.dueDate) : undefined,
          }));
          const pendingCount = creditEntriesData.filter(entry => !entry.paid && isValidDate(entry.saleDate)).length;
          messageForChat = `Você tem ${pendingCount} fiados pendentes de pagamento.`;
        } catch (e) {
          console.error("Error processing queryPendingFiadosCount for", currentCompany, e);
          messageForChat = "Desculpe, não consegui contar os fiados pendentes. Verifique os dados.";
        }
        break;
      case 'querylowstockproductscount':
        try {
          const productsData = getStoredData<ProductEntry>(productsStorageKey, [], toast, currentCompany);
          const lowStockCount = productsData.filter(p => {
            const stockNumber = parseInt(p.stock || "0", 10);
            return !isNaN(stockNumber) && stockNumber > 0 && stockNumber <= LOW_STOCK_THRESHOLD;
          }).length;
          messageForChat = `Você tem ${lowStockCount} produtos com estoque baixo (igual ou inferior a ${LOW_STOCK_THRESHOLD} unidades).`;
        } catch (e) {
          console.error("Error processing queryLowStockProductsCount for", currentCompany, e);
          messageForChat = "Desculpe, não consegui verificar o estoque dos produtos. Verifique os dados.";
        }
        break;

      case 'initiateaddcustomer':
        if (customerNameParam && customerPhoneParam) {
          const customers = getStoredData<CustomerEntry>(customersStorageKey, [], toast, currentCompany);
          const newCustomer: CustomerEntry = {
            id: `CUST${String(Date.now()).slice(-6)}`,
            name: customerNameParam,
            phone: customerPhoneParam,
            email: customerEmailParam || "",
            address: customerAddressParam || "",
          };
          if(saveStoredData<CustomerEntry>(customersStorageKey, [...customers, newCustomer].sort((a,b) => a.name.localeCompare(b.name)), toast, currentCompany)) {
            messageForChat = `Cliente '${customerNameParam}' adicionado com sucesso! Vou te mostrar na lista de clientes.`;
          } else {
            messageForChat = `Não foi possível salvar o cliente '${customerNameParam}' diretamente. Por favor, tente adicioná-lo na página de clientes.`;
          }
          navigationPath = '/dashboard/customers';
        } else {
          let missingFields = [];
          if (!customerNameParam) missingFields.push("nome");
          if (!customerPhoneParam) missingFields.push("telefone");
          messageForChat = `Para adicionar um cliente diretamente, preciso pelo menos do ${missingFields.join(' e do ')}. Exemplo: 'Adicionar cliente João Silva telefone (11) 91234-5678'. Você pode adicionar na página de Clientes.`;
          navigationPath = '/dashboard/customers';
        }
        break;

      case 'initiateaddcreditentry':
        if (customerNameParam && creditAmountParam) {
            const creditEntriesRaw = getStoredData<any>(creditNotebookStorageKey, [], toast, currentCompany);
            const creditEntries: CreditEntry[] = creditEntriesRaw.map((entry: any) => ({
                ...entry,
                saleDate: isValidDate(parseISO(entry.saleDate)) ? parseISO(entry.saleDate) : new Date(),
                dueDate: entry.dueDate && isValidDate(parseISO(entry.dueDate)) ? parseISO(entry.dueDate) : undefined,
            }));

            let parsedDueDate: Date | undefined = undefined;
            let dateWarning = "";
            if (creditDueDateParam) {
                const date = parseISO(creditDueDateParam);
                if(isValidDate(date)) parsedDueDate = date;
                else {
                    console.warn(`Assistente: Data de vencimento inválida recebida: ${creditDueDateParam}`);
                    dateWarning = ` A data de vencimento '${creditDueDateParam}' não é válida (use AAAA-MM-DD). O fiado será adicionado sem data de vencimento.`;
                }
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

            if(saveStoredData<CreditEntry>(creditNotebookStorageKey, [...creditEntries, newEntry].sort((a,b) => ((b.saleDate instanceof Date) ? b.saleDate.getTime() : 0) - ((a.saleDate instanceof Date) ? a.saleDate.getTime() : 0)), toast, currentCompany)) {
                messageForChat = `Fiado de R$ ${Number(creditAmountParam).toFixed(2)} para '${customerNameParam}' adicionado com sucesso!${dateWarning} Vou te mostrar na caderneta de fiados.`;
            } else {
                messageForChat = `Não foi possível salvar o fiado para '${customerNameParam}' diretamente. Por favor, tente adicioná-lo na página de fiados.`;
            }
            navigationPath = '/dashboard/credit-notebook';
        } else {
            let missingFields = [];
            if (!customerNameParam) missingFields.push("nome do cliente");
            if (!creditAmountParam) missingFields.push("valor");
            messageForChat = `Para registrar um fiado diretamente, preciso do ${missingFields.join(' e do ')}. Exemplo: 'Registrar fiado para Maria Silva de 50 reais'. Você pode adicionar na página de Fiados.`;
            navigationPath = '/dashboard/credit-notebook';
        }
        break;

      case 'initiateaddtransaction':
        if (transactionDescParam && transactionAmountParam && (transactionTypeParam === 'income' || transactionTypeParam === 'expense')) {
            const transactionsRaw = getStoredData<any>(notebookStorageKey, [], toast, currentCompany);
            const transactions: Transaction[] = transactionsRaw.map((t: any) => ({...t, date: isValidDate(parseISO(t.date)) ? parseISO(t.date) : new Date() }));

            const newTransaction: Transaction = {
                id: `T${String(Date.now()).slice(-6)}`,
                description: transactionDescParam,
                amount: Number(transactionAmountParam),
                type: transactionTypeParam as "income" | "expense",
                date: new Date(),
            };

            if(saveStoredData<Transaction>(notebookStorageKey, [...transactions, newTransaction].sort((a,b) => ((b.date instanceof Date) ? b.date.getTime() : 0) - ((a.date instanceof Date) ? a.date.getTime() : 0)), toast, currentCompany)) {
                messageForChat = `${transactionTypeParam === 'income' ? 'Receita' : 'Despesa'} de '${transactionDescParam}' no valor de R$ ${Number(transactionAmountParam).toFixed(2)} registrada com sucesso! Vou te mostrar na caderneta.`;
            } else {
                 messageForChat = `Não foi possível salvar a transação diretamente. Por favor, tente adicioná-la na caderneta digital.`;
            }
            navigationPath = '/dashboard/notebook';
        } else {
            let missingFields = [];
            if(!transactionDescParam) missingFields.push("descrição");
            if(!transactionAmountParam) missingFields.push("valor");
            if(!transactionTypeParam) missingFields.push("tipo (receita ou despesa)");
            messageForChat = `Para adicionar uma transação diretamente, preciso da ${missingFields.join(', da ')}, do tipo (receita ou despesa) e do valor. Exemplo: 'Lançar despesa aluguel valor 500'. Você pode adicionar na Caderneta Digital.`;
            navigationPath = '/dashboard/notebook';
        }
        break;

      case 'initiateaddproduct':
        if (productNameParam && productCodeParam && productPriceParam !== undefined) {
            const products = getStoredData<ProductEntry>(productsStorageKey, [], toast, currentCompany);
            const newProduct: ProductEntry = {
                id: `PROD${String(Date.now()).slice(-6)}`,
                name: productNameParam,
                code: productCodeParam,
                price: Number(productPriceParam),
                category: productCategoryParam || "",
                stock: productStockParam || "",
            };
            if(saveStoredData<ProductEntry>(productsStorageKey, [...products, newProduct].sort((a,b) => a.name.localeCompare(b.name)), toast, currentCompany)) {
                messageForChat = `Produto '${productNameParam}' (código '${productCodeParam}', preço R$ ${Number(productPriceParam).toFixed(2)}) adicionado com sucesso! Vou te mostrar no catálogo.`;
            } else {
                messageForChat = `Não foi possível salvar o produto '${productNameParam}' diretamente. Por favor, tente adicioná-lo na página de produtos.`;
            }
            navigationPath = '/dashboard/products';
        } else {
            let missingFields = [];
            if(!productNameParam) missingFields.push("nome");
            if(!productCodeParam) missingFields.push("código");
            if(productPriceParam === undefined) missingFields.push("preço");
            messageForChat = `Para adicionar um produto diretamente, preciso do ${missingFields.join(', do ')}. Exemplo: 'Cadastrar produto Camisa Azul código CA001 preço 79.90'. Você pode adicionar na página de Produtos.`;
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

      case 'initiateeditcustomer': {
        const customerNameToEdit = parsedParameters?.customerName;
        messageForChat = `Para editar o cliente ${customerNameToEdit ? `'${customerNameToEdit}'` : 'desejado'}, estou te levando para a página de Clientes. Lá você poderá encontrar o cliente e usar o botão de editar.`;
        navigationPath = '/dashboard/customers';
        break;
      }
      case 'initiateeditproduct': {
        const productIdentifier = parsedParameters?.productName || parsedParameters?.productCode;
        messageForChat = `Para editar o produto ${productIdentifier ? `'${productIdentifier}'` : 'desejado'}, estou te levando para a página de Produtos. Lá você poderá encontrar o produto e usar a funcionalidade de edição (que ainda não foi implementada).`;
        navigationPath = '/dashboard/products'; // Edição de produto ainda não implementada na UI.
        break;
      }

      case 'initiatedeletecustomer': {
        const customerNameToDelete = parsedParameters?.customerName;
        if (customerNameToDelete) {
            const customers = getStoredData<CustomerEntry>(customersStorageKey, [], toast, currentCompany);
            const customerExists = customers.some(c => c.name.toLowerCase() === customerNameToDelete.toLowerCase());
            if (customerExists) {
                messageForChat = `Entendi que você quer excluir o cliente '${customerNameToDelete}'. Para confirmar esta ação e prosseguir com a exclusão, vou te levar para a página de Clientes. Lá você poderá encontrar '${customerNameToDelete}' e usar o botão de lixeira.`;
            } else {
                messageForChat = `Não encontrei um cliente chamado '${customerNameToDelete}'. Você pode verificar o nome ou ir para a página de Clientes para ver a lista e excluir manualmente.`;
            }
        } else {
            messageForChat = "Para excluir um cliente, por favor, me diga o nome. Ou, estou te levando para a página de Clientes para você escolher.";
        }
        navigationPath = '/dashboard/customers';
        break;
      }
      case 'initiatedeleteproduct': {
        const productNameToDelete = parsedParameters?.productName;
        const productCodeToDelete = parsedParameters?.productCode;
        if (productNameToDelete || productCodeToDelete) {
            const products = getStoredData<ProductEntry>(productsStorageKey, [], toast, currentCompany);
            const productExists = products.some(p =>
                (productNameToDelete && p.name.toLowerCase() === productNameToDelete.toLowerCase()) ||
                (productCodeToDelete && p.code.toLowerCase() === productCodeToDelete.toLowerCase())
            );
            const identifier = productNameToDelete || productCodeToDelete;
            if (productExists) {
                messageForChat = `Entendi que você quer excluir o produto '${identifier}'. Para confirmar, vou te levar para a página de Produtos. Lá você poderá encontrar o produto e usar o botão de lixeira.`;
            } else {
                messageForChat = `Não encontrei um produto com nome/código '${identifier}'. Verifique os dados ou vá para a página de Produtos para excluir manualmente.`;
            }
        } else {
            messageForChat = "Para excluir um produto, por favor, me diga o nome ou código. Ou, estou te levando para a página de Produtos.";
        }
        navigationPath = '/dashboard/products';
        break;
      }
      case 'initiatedeletetransaction': {
        const descriptionToDelete = parsedParameters?.description;
        if (descriptionToDelete) {
            const transactionsRaw = getStoredData<any>(notebookStorageKey, [], toast, currentCompany);
            const transactions: Transaction[] = transactionsRaw.map((t: any) => ({...t, date: isValidDate(parseISO(t.date)) ? parseISO(t.date) : new Date() }));
            const transactionExists = transactions.some(t => t.description.toLowerCase().includes(descriptionToDelete.toLowerCase()));
            if (transactionExists) {
                messageForChat = `Entendi que você quer excluir a transação com descrição contendo '${descriptionToDelete}'. Para confirmar, vou te levar para a Caderneta Digital. Lá você poderá encontrar a transação e usar o botão de lixeira.`;
            } else {
                messageForChat = `Não encontrei uma transação com a descrição contendo '${descriptionToDelete}'. Verifique a descrição ou vá para a Caderneta Digital para excluir manualmente.`;
            }
        } else {
            messageForChat = "Para excluir uma transação, por favor, me diga parte da descrição. Ou, estou te levando para a Caderneta Digital.";
        }
        navigationPath = '/dashboard/notebook';
        break;
      }
      case 'initiatedeletecreditentry': {
        const customerNameForCreditDelete = parsedParameters?.customerName;
        if (customerNameForCreditDelete) {
            const creditEntriesRaw = getStoredData<any>(creditNotebookStorageKey, [], toast, currentCompany);
            const creditEntries: CreditEntry[] = creditEntriesRaw.map((entry: any) => ({
                ...entry,
                saleDate: parseISO(entry.saleDate),
                dueDate: entry.dueDate ? parseISO(entry.dueDate) : undefined,
            }));
            const entryExists = creditEntries.some(ce => ce.customerName.toLowerCase() === customerNameForCreditDelete.toLowerCase());
            if (entryExists) {
                messageForChat = `Entendi que você quer excluir o fiado de '${customerNameForCreditDelete}'. Para confirmar, vou te levar para a Caderneta de Fiados. Lá você poderá encontrar o registro e usar o botão de lixeira.`;
            } else {
                messageForChat = `Não encontrei um fiado para o cliente '${customerNameForCreditDelete}'. Verifique o nome ou vá para a Caderneta de Fiados para excluir manualmente.`;
            }
        } else {
            messageForChat = "Para excluir um fiado, por favor, me diga o nome do cliente. Ou, estou te levando para a Caderneta de Fiados.";
        }
        navigationPath = '/dashboard/credit-notebook';
        break;
      }


      case 'displaykpis':
        messageForChat = "Os principais indicadores (KPIs) são exibidos no Painel Central. Estou te levando para lá!";
        navigationPath = '/dashboard';
        break;

      case 'unknown':
      case 'unknowncommand':
        messageForChat = "Desculpe, não consegui entender o seu comando. Você poderia tentar reformular? Por exemplo, diga 'Abrir painel', 'Adicionar cliente João telefone (11) 99999-8888', 'Qual minha receita?', 'Excluir cliente João', ou 'Registrar despesa Aluguel valor 500'. Para editar, diga 'Editar cliente Maria'.";
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
    }
    return messageForChat;
  };

  const handleTextCommand = async () => {
    if (!inputText.trim()) return;
    if (isSpeaking && window.speechSynthesis) window.speechSynthesis.cancel();

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
    if (isSpeaking && window.speechSynthesis) window.speechSynthesis.cancel();

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
    if (isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (isListening) {
      if (recognition) {
        recognition.stop();
      }
      // setIsListening(false); // recognition.onend will set this
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
        if ((e as Error).name === 'InvalidStateError') {
            // Already started, do nothing or handle appropriately
        } else {
            toast({ title: "Erro ao Iniciar", description: "Não foi possível iniciar o reconhecimento de voz. Verifique as permissões do microfone.", variant: "destructive" });
            setIsListening(false);
        }
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
          setIsListening(false); 
        }
        if (window.speechSynthesis && isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false); 
        }
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
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
            Use comandos de texto ou voz. Ex: 'Abrir painel', 'Adicionar cliente Maria telefone (11)9...', 'Qual minha receita?', 'Excluir cliente João', 'Editar cliente Maria'.
            {!supportedFeatures.speechRecognition && <span className="text-destructive block text-xs mt-1"><AlertTriangle className="inline h-3 w-3 mr-1"/>Reconhecimento de voz não suportado neste navegador.</span>}
            {!supportedFeatures.speechSynthesis && <span className="text-destructive block text-xs mt-1"><AlertTriangle className="inline h-3 w-3 mr-1"/>Síntese de voz não suportada neste navegador.</span>}
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

    