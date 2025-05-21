
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react"; // Renamed to avoid conflict

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Configurações</CardTitle>
          </div>
          <CardDescription>Ajuste as configurações da sua conta e da aplicação.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade de Configurações em desenvolvimento. Em breve você poderá ajustar dados da empresa, preferências de notificação, configurações de segurança e outras opções da aplicação.</p>
          <div className="mt-8 flex justify-center">
            <img 
              src="https://placehold.co/600x400.png" 
              alt="Placeholder para Configurações" 
              className="rounded-lg shadow-md"
              data-ai-hint="application settings interface" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    