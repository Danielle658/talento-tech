
// src/ai/flows/interpret-voice-commands.ts
'use server';
/**
 * @fileOverview An AI agent that interprets voice commands for the MoneyWise application.
 *
 * - interpretVoiceCommand - A function that interprets a voice command and returns the corresponding action.
 * - InterpretVoiceCommandInput - The input type for the interpretVoiceCommand function.
 * - InterpretVoiceCommandOutput - The return type for the interpretVoiceCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretVoiceCommandInputSchema = z.object({
  voiceCommand: z.string().describe('The voice command to interpret. Examples: "Abrir painel central", "Adicionar novo cliente Maria", "Qual minha receita?"'),
});
export type InterpretVoiceCommandInput = z.infer<typeof InterpretVoiceCommandInputSchema>;

const InterpretVoiceCommandOutputSchema = z.object({
  action: z
    .string()
    .describe(
      'The action to perform based on the voice command. Examples: \'navigateToDashboard\', \'navigateToNotebook\', \'navigateToCustomers\', \'navigateToSales\', \'navigateToProducts\', \'navigateToCreditNotebook\', \'navigateToSalesRecord\', \'navigateToMonthlyReport\', \'navigateToSettings\', \'queryTotalRevenue\', \'queryTotalCustomers\', \'queryTotalDueFiados\', \'queryPendingFiadosCount\', \'queryLowStockProductsCount\', \'initiateAddCustomer\', \'initiateAddCreditEntry\', \'initiateAddTransaction\', \'initiateAddProduct\', \'initiateSendMonthlyReport\', \'displayKPIs\'. If the command is not understood, return \'unknownCommand\''
    ),
  parameters: z
    .record(z.string(), z.unknown()) // Changed z.any() to z.unknown()
    .optional()
    .describe(
      'A JSON object containing parameters for the action. For example, for \'initiateAddCustomer\', parameters might be { customerName: "Maria" }.'
    ),
});
export type InterpretVoiceCommandOutput = z.infer<typeof InterpretVoiceCommandOutputSchema>;

export async function interpretVoiceCommand(input: InterpretVoiceCommandInput): Promise<InterpretVoiceCommandOutput> {
  return interpretVoiceCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretVoiceCommandPrompt',
  input: {schema: InterpretVoiceCommandInputSchema},
  output: {schema: InterpretVoiceCommandOutputSchema},
  prompt: `You are an AI assistant for the MoneyWise application. Your task is to interpret voice commands and determine the appropriate action to take.

The application has the following sections/actions (map to the given action):

  Navigation (Abrir Abas):
  - "Painel Central", "Dashboard", "Tela inicial": action: navigateToDashboard
  - "Caderneta Digital", "Minhas finanças", "Ver transações": action: navigateToNotebook
  - "Contas de Clientes", "Meus Clientes": action: navigateToCustomers
  - "Vendas", "PDV", "Ponto de Venda", "Registrar nova venda": action: navigateToSales
  - "Produtos", "Meu catálogo", "Ver produtos": action: navigateToProducts
  - "Caderneta de Fiados", "Fiados", "Contas a receber": action: navigateToCreditNotebook
  - "Registro de Vendas", "Histórico de vendas": action: navigateToSalesRecord
  - "Relatório Mensal", "Ver relatório": action: navigateToMonthlyReport
  - "Configurações", "Ajustes": action: navigateToSettings

  Data Queries:
  - "Qual minha receita total?": queryTotalRevenue
  - "Quantos clientes tenho?": queryTotalCustomers
  - "Quanto devo receber de fiados?": queryTotalDueFiados
  - "Quantos fiados pendentes existem?": queryPendingFiadosCount
  - "Existem produtos com estoque baixo?": queryLowStockProductsCount
  - "Quais são meus KPIs?": displayKPIs

  Initiate Actions:
  - "Adicionar novo cliente", "Cadastrar cliente [nome]": action: initiateAddCustomer (extract name if provided)
  - "Adicionar novo fiado", "Registrar fiado para [cliente]": action: initiateAddCreditEntry (extract customer name if provided)
  - "Adicionar nova transação", "Lançar receita [descrição] [valor]", "Registrar despesa [descrição] [valor]": action: initiateAddTransaction (extract type, description, amount if provided)
  - "Adicionar novo produto", "Cadastrar produto [nome]": action: initiateAddProduct (extract name if provided)
  - "Enviar relatório mensal", "Gerar relatório para [whatsapp]": action: initiateSendMonthlyReport (extract whatsapp if provided)


Interpret the following voice command and provide the corresponding action and parameters in JSON format.

Voice Command: {{{voiceCommand}}}

Output should be a JSON object with "action" and "parameters" fields.
If the command is unclear or doesn't match any known action, return an action of 'unknownCommand'.
Prioritize specific query actions if the user is asking for specific data.
Prioritize navigation actions if the user is asking to go to a specific section.
Prioritize 'initiate...' actions if the user wants to start a process like adding data.
Extract relevant entities as parameters (e.g., customerName, productName, amount, description, type: 'income' or 'expense').
If no parameters are extracted, the 'parameters' field can be omitted from the output.
Ensure that the output is valid JSON conforming to the InterpretVoiceCommandOutputSchema schema.`,
});

const interpretVoiceCommandFlow = ai.defineFlow(
  {
    name: 'interpretVoiceCommandFlow',
    inputSchema: InterpretVoiceCommandInputSchema,
    outputSchema: InterpretVoiceCommandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

