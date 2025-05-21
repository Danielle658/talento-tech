
"use client";

import { useState, useEffect, useRef } from 'react';
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
  response?: InterpretTextCommandsOutput | InterpretVoiceCommandOutput;
  timestamp: Date;
}

export function VirtualAssistant() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      // Access the viewport element correctly based on ScrollArea structure
      const viewportElement = scrollAreaRef.current.querySelector('div[style*="overflow: scroll"]');
      if (viewportElement) {
        viewportElement.scrollTop = viewportElement.scrollHeight;
      }
    }
  }, [chatMessages]);

  const addMessage = (sender: ChatMessage['sender'], text?: string, response?: ChatMessage['response']) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender, text, response, timestamp: new Date() }]);
  };

  const handleTextCommand = async () => {
    if (!inputText.trim()) return;
    const commandText = inputText;
    addMessage('user', commandText);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await interpretTextCommands({ command: commandText });
      addMessage('assistant', undefined, response);
    } catch (error) {
      console.error("Error interpreting text command:", error);
      addMessage('assistant', `Desculpe, ocorreu um erro ao processar: "${commandText}"`);
      toast({ title: "Erro", description: "Não foi possível processar o comando.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleVoiceCommand = async () => {
    if (!inputText.trim()) {
        toast({ title: "Comando de Voz", description: "Digite um comando no campo para simular a entrada de voz.", variant: "default" });
        return;
    }
    const commandText = inputText; // Simulate voice input with current text
    addMessage('user', commandText);
    setInputText(''); // Clear input after simulating voice command submission
    setIsLoading(true);

    try {
      // Assuming interpretVoiceCommand expects a similar structure or just the text
      const response = await interpretVoiceCommand({ voiceCommand: commandText });
      addMessage('assistant', undefined, response);
    } catch (error) {
      console.error("Error interpreting voice command:", error);
      addMessage('assistant', `Desculpe, ocorreu um erro ao processar o comando de voz: "${commandText}"`);
      toast({ title: "Erro", description: "Não foi possível processar o comando de voz.", variant: "destructive" });
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
            Use comandos de texto ou voz. Ex: 'Mostrar painel'.
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
                  {msg.sender === 'assistant' && msg.text && <p>{msg.text}</p>}
                  {msg.sender === 'assistant' && msg.response && (
                    <div>
                      <p><strong>Ação:</strong> {msg.response.action}</p>
                      {msg.response.parameters && Object.keys(msg.response.parameters).length > 0 && (
                        <p className="break-all"><strong>Parâmetros:</strong> {JSON.stringify(msg.response.parameters)}</p>
                      )}
                    </div>
                  )}
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
            <Button variant="outline" onClick={handleVoiceCommand} disabled={isLoading} aria-label="Enviar comando de voz (simulado)" size="icon" className="h-10 w-10">
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
