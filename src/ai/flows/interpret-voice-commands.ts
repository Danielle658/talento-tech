
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
  voiceCommand: z.string().describe('The voice command to interpret.'),
});
export type InterpretVoiceCommandInput = z.infer<typeof InterpretVoiceCommandInputSchema>;

const InterpretVoiceCommandOutputSchema = z.object({
  action: z
    .string()
    .describe(
      'The action to perform based on the voice command. Examples: \'navigateToDashboard\', \'navigateToNotebook\', \'navigateToCustomers\', \'navigateToSales\', \'navigateToProducts\', \'navigateToCreditNotebook\', \'navigateToSalesRecord\', \'navigateToMonthlyReport\', \'navigateToSettings\', \'queryTotalRevenue\', \'queryTotalCustomers\', \'queryTotalDueFiados\', \'queryPendingFiadosCount\', \'queryLowStockProductsCount\', \'displayKPIs\'. If the command is not understood, return \'unknownCommand\''
    ),
  parameters: z
    .record(z.any())
    .describe(
      'A JSON object containing parameters for the action. For example, if the action is \'findProductStock\', parameters might be { productName: "Milk" }.'
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

The application has the following sections/actions:
  - Painel Central: navigateToDashboard
  - Caderneta Digital (transações financeiras): navigateToNotebook
  - Contas de Clientes: navigateToCustomers
  - Vendas (PDV): navigateToSales
  - Produtos (catálogo): navigateToProducts
  - Caderneta de Fiados: navigateToCreditNotebook
  - Registro de Vendas (histórico): navigateToSalesRecord
  - Relatório Mensal: navigateToMonthlyReport
  - Configurações: navigateToSettings

The assistant can also answer questions about data:
  - "Qual minha receita total?": queryTotalRevenue
  - "Quantos clientes tenho?": queryTotalCustomers
  - "Quanto devo receber de fiados?": queryTotalDueFiados
  - "Quantos fiados pendentes existem?": queryPendingFiadosCount
  - "Existem produtos com estoque baixo?": queryLowStockProductsCount
  - "Quais são meus KPIs?": displayKPIs (This will be handled by the client, possibly showing dashboard info)


Interpret the following voice command and provide the corresponding action and parameters in JSON format.

Voice Command: {{{voiceCommand}}}

Output should be a JSON object with "action" and "parameters" fields.
If the command is unclear or doesn't match any known action, return an action of 'unknownCommand'.
Prioritize specific query actions if the user is asking for specific data.
Prioritize navigation actions if the user is asking to go to a specific section.
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

