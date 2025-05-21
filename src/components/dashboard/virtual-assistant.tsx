
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
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
import { Bot, Mic, Send, Loader2 } from 'lucide-react';
import { interpretTextCommands, InterpretTextCommandsOutput } from '@/ai/flows/interpret-text-commands';
import { interpretVoiceCommand, InterpretVoiceCommandOutput } from '@/ai/flows/interpret-voice-commands';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  response?: InterpretTextCommandsOutput | InterpretVoiceCommandOutput; // Keep this for potential direct display
  processedMessage?: string; // For messages processed by executeAction
  timestamp: Date;
}

export function VirtualAssistant() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // Initialize router

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewportElement = scrollAreaRef.current.querySelector('div[style*="overflow: scroll"]');
      if (viewportElement) {
        viewportElement.scrollTop = viewportElement.scrollHeight;
      }
    }
  }, [chatMessages]);

  const addMessage = (sender: ChatMessage['sender'], text?: string, response?: ChatMessage['response'], processedMessage?: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender, text, response, processedMessage, timestamp: new Date() }]);
  };

  const executeAction = (action: string, parameters: any) => {
    let navigationPath: string | null = null;
    let messageForChat: string | null = null;

    switch (action?.toLowerCase()) { // Normalize action string
      case 'showsales':
        navigationPath = '/dashboard/sales-record';
        messageForChat = "Ok, abrindo o histórico de vendas.";
        break;
      case 'gotocustomeraccounts':
        navigationPath = '/dashboard/customers';
        messageForChat = "Certo, indo para as contas de clientes.";
        break;
      case 'navigatetodashboard':
        navigationPath = '/dashboard';
        messageForChat = "Redirecionando para o painel central.";
        break;
      case 'generatereport':
        navigationPath = '/dashboard/monthly-report';
        messageForChat = "Entendido. Abrindo a página de relatório mensal.";
        break;
      case 'displaykpis':
        messageForChat = "Entendido! Os KPIs seriam exibidos no painel principal.";
        // In a real scenario, this might involve a state change or event
        break;
      case 'createnewinvoice':
        messageForChat = "Entendido! Simulando a abertura do formulário para criar uma nova fatura...";
        // This would typically open a new page or a modal
        // e.g., router.push('/dashboard/invoices/new');
        break;
      case 'viewcustomerdetails':
        const customerNameParam = parameters?.customerName || parameters?.name || 'um cliente específico';
        messageForChat = `Entendido! Exibindo detalhes para: ${customerNameParam}.`;
        // e.g., router.push(`/dashboard/customers/${parameters?.customerId}`);
        break;
      case 'searchtransactions':
        const searchTerm = parameters?.term || 'algo específico';
        messageForChat = `Entendido! Buscando transações por: ${searchTerm}.`;
        break;
      case 'unknown':
      case 'unknowncommand':
        messageForChat = "Desculpe, não entendi o comando. Pode tentar de outra forma ou ser mais específico?";
        break;
      default:
        messageForChat = `Recebi a ação '${action}', mas ainda não sei como executá-la diretamente.`;
        if (parameters && Object.keys(parameters).length > 0) {
            messageForChat += ` Parâmetros: ${JSON.stringify(parameters)}`;
        }
        break;
    }

    if (navigationPath) {
      addMessage('assistant', undefined, undefined, messageForChat || `Navegando para ${action}...`);
      router.push(navigationPath);
      setIsDialogOpen(false); // Close dialog on navigation
    } else if (messageForChat) {
      addMessage('assistant', undefined, undefined, messageForChat);
    }
  };

  const handleTextCommand = async () => {
    if (!inputText.trim()) return;
    const commandText = inputText;
    addMessage('user', commandText);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await interpretTextCommands({ command: commandText });
      // addMessage('assistant', undefined, response); // Keep original response for debug if needed
      executeAction(response.action, response.parameters);
    } catch (error) {
      console.error("Error interpreting text command:", error);
      addMessage('assistant', undefined, undefined, `Desculpe, ocorreu um erro ao processar: "${commandText}"`);
      toast({ title: "Erro de Processamento", description: "Não foi possível processar o comando de texto.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleVoiceCommand = async () => {
    if (!inputText.trim()) {
        toast({ title: "Comando de Voz (Simulado)", description: "Digite um comando no campo para simular a entrada de voz e tente novamente.", variant: "default" });
        return;
    }
    const commandText = inputText; 
    addMessage('user', commandText);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await interpretVoiceCommand({ voiceCommand: commandText });
      // addMessage('assistant', undefined, response); // Keep original response for debug if needed
      executeAction(response.action, response.parameters);
    } catch (error) {
      console.error("Error interpreting voice command:", error);
      addMessage('assistant', undefined, undefined, `Desculpe, ocorreu um erro ao processar o comando de voz: "${commandText}"`);
      toast({ title: "Erro de Processamento", description: "Não foi possível processar o comando de voz.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bot className="h-5 w-5" />
          <span className="sr-only">Assistente Virtual</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col h-[80vh] max-h-[700px] min-h-[400px]">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-primary" /> Assistente Virtual
          </DialogTitle>
          <DialogDescription>
            Use comandos de texto. Ex: 'Mostrar painel', 'Ir para clientes'.
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
                  {msg.sender === 'user' && msg.text}
                  {msg.sender === 'assistant' && msg.processedMessage && <p>{msg.processedMessage}</p>}
                  {/* Optionally display raw response for debugging if needed, or remove this block
                  {msg.sender === 'assistant' && msg.response && !msg.processedMessage && (
                    <div>
                      <p><strong>Ação (bruta):</strong> {msg.response.action}</p>
                      {msg.response.parameters && Object.keys(msg.response.parameters).length > 0 && (
                        <p className="break-all"><strong>Parâmetros (brutos):</strong> {JSON.stringify(msg.response.parameters)}</p>
                      )}
                    </div>
                  )}
                  */}
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
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Digite seu comando..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading && inputText.trim()) {
                  handleTextCommand();
                }
              }}
              disabled={isLoading}
              className="flex-1 h-10 text-base"
              aria-label="Entrada de comando"
            />
            <Button onClick={handleTextCommand} disabled={isLoading || !inputText.trim()} aria-label="Enviar comando de texto" size="icon" className="h-10 w-10">
              <Send className="h-5 w-5" />
            </Button>
            {/* Voice command button can be kept for future real voice integration */}
            <Button variant="outline" onClick={handleVoiceCommand} disabled={isLoading} aria-label="Enviar comando de voz (simulado com texto)" size="icon" className="h-10 w-10">
              <Mic className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            O assistente pode ajudar com navegação e busca de informações. Pressione Enter para enviar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
