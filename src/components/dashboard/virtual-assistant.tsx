
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Mic, Send, Loader2 } from 'lucide-react';
import { interpretTextCommands, InterpretTextCommandsOutput } from '@/ai/flows/interpret-text-commands';
import { interpretVoiceCommand, InterpretVoiceCommandOutput } from '@/ai/flows/interpret-voice-commands'; // Assuming voice input as text for now
import { useToast } from "@/hooks/use-toast";

export function VirtualAssistant() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<InterpretTextCommandsOutput | InterpretVoiceCommandOutput | null>(null);
  const { toast } = useToast();

  const handleTextCommand = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setAssistantResponse(null);
    try {
      const response = await interpretTextCommands({ command: inputText });
      setAssistantResponse(response);
      toast({ title: "Comando Processado", description: `Ação: ${response.action}` });
    } catch (error) {
      console.error("Error interpreting text command:", error);
      toast({ title: "Erro", description: "Não foi possível processar o comando.", variant: "destructive" });
    }
    setIsLoading(false);
    setInputText('');
  };
  
  const handleVoiceCommand = async () => {
    // This is a placeholder. Real voice input would require microphone access and Speech-to-Text.
    // We'll use the current inputText as if it were a voice command.
    if (!inputText.trim()) {
        toast({ title: "Comando de Voz", description: "Digite um comando para simular a voz.", variant: "default" });
        return;
    }
    setIsLoading(true);
    setAssistantResponse(null);
    try {
      const response = await interpretVoiceCommand({ voiceCommand: inputText });
      setAssistantResponse(response);
      toast({ title: "Comando de Voz Processado", description: `Ação: ${response.action}` });
    } catch (error) {
      console.error("Error interpreting voice command:", error);
      toast({ title: "Erro", description: "Não foi possível processar o comando de voz.", variant: "destructive" });
    }
    setIsLoading(false);
    setInputText('');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center gap-2">
        <Bot className="h-6 w-6 text-primary" />
        <div>
          <CardTitle>Assistente Virtual</CardTitle>
          <CardDescription>Use comandos de texto ou voz para navegar.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ex: 'Mostrar vendas do mês passado'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextCommand()}
            disabled={isLoading}
          />
          <Button onClick={handleTextCommand} disabled={isLoading} aria-label="Enviar comando de texto">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={handleVoiceCommand} disabled={isLoading} aria-label="Enviar comando de voz (simulado)">
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        {assistantResponse && (
          <div className="mt-4 p-3 bg-muted rounded-md text-sm">
            <p><strong>Ação Interpretada:</strong> {assistantResponse.action}</p>
            {assistantResponse.parameters && Object.keys(assistantResponse.parameters).length > 0 && (
              <p><strong>Parâmetros:</strong> {JSON.stringify(assistantResponse.parameters)}</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          O assistente pode ajudar com navegação e busca de informações.
        </p>
      </CardFooter>
    </Card>
  );
}
