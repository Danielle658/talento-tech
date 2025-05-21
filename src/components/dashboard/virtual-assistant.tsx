
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
import { interpretTextCommands, InterpretTextCommandsOutput } from '@/ai/flows/interpret-text-commands';
import { interpretVoiceCommand, InterpretVoiceCommandOutput } from '@/ai/flows/interpret-voice-commands';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

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
        setUserInputForVoice(finalTranscript || interimTranscript); // Update visual feedback
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

    return () => {
      if (recognition) {
        recognition.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

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

    switch (action?.toLowerCase()) {
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
        messageForChat = "Entendido! Os KPIs são exibidos no painel principal.";
        break;
      case 'createnewinvoice':
        messageForChat = "Entendido! Simulando a abertura do formulário para criar uma nova fatura...";
        break;
      case 'viewcustomerdetails':
        const customerNameParam = parameters?.customerName || parameters?.name || 'um cliente específico';
        messageForChat = `Entendido! Exibindo detalhes para: ${customerNameParam}.`;
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
        messageForChat = `Recebi a ação '${action}', mas ainda não sei como executá-la.`;
        if (parameters && Object.keys(parameters).length > 0) {
            messageForChat += ` Parâmetros: ${JSON.stringify(parameters)}`;
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
    addMessage('user', `🎤: ${commandText}`); // Indicate voice input
    setUserInputForVoice(""); // Clear visual feedback
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
      }
      if (!open && window.speechSynthesis && isSpeaking) {
        window.speechSynthesis.cancel();
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
            <Bot className="h-6 w-6 text-primary" /> Assistente Virtual
          </DialogTitle>
          <DialogDescription>
            Use comandos de texto ou voz. Ex: 'Mostrar painel', 'Ir para clientes'.
            {!supportedFeatures.speechRecognition && <span className="text-destructive block text-xs">Reconhecimento de voz não suportado.</span>}
            {!supportedFeatures.speechSynthesis && <span className="text-destructive block text-xs">Síntese de voz não suportada.</span>}
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
                  {msg.text && <p>{msg.text}</p>}
                  <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/80 text-right' : 'text-muted-foreground text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && ( // General loading for AI processing
              <div className="flex justify-start">
                 <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-muted text-card-foreground shadow">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                 </div>
              </div>
            )}
             {isListening && userInputForVoice && ( // Visual feedback for ongoing speech input
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm shadow bg-primary/80 text-primary-foreground italic">
                  <p>🎤: {userInputForVoice}...</p>
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
            <Button 
              variant="outline" 
              onClick={handleToggleListening} 
              disabled={isLoading || !supportedFeatures.speechRecognition || isSpeaking} 
              aria-label={isListening ? "Parar de ouvir" : "Começar a ouvir"} 
              size="icon" 
              className={`h-10 w-10 ${isListening ? 'border-destructive text-destructive hover:bg-destructive/10' : ''}`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
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

