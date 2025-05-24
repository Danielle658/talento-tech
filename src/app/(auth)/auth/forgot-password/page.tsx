
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function ForgotPasswordDisabledPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
        <CardTitle className="text-2xl">Funcionalidade Desabilitada</CardTitle>
        <CardDescription>
          A opção de recuperação de senha não está disponível no momento.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">
          Se você tiver problemas para acessar sua conta, entre em contato com o suporte (se aplicável) ou verifique seus dados de login.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-center">
        <Button variant="outline" asChild className="w-full">
          <Link href="/auth">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
