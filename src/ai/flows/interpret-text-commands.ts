
// This file is machine-generated - do not edit!

'use server';

/**
 * @fileOverview This file defines a Genkit flow for interpreting text commands
 * to navigate and interact with the MoneyWise application.
 *
 * - interpretTextCommands - A function that interprets text commands and returns
 *   the corresponding action or navigation target.
 * - InterpretTextCommandsInput - The input type for the interpretTextCommands function.
 * - InterpretTextCommandsOutput - The return type for the interpretTextCommands function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretTextCommandsInputSchema = z.object({
  command: z
    .string()
    .describe(
      'The text command entered by the user. Examples: \'Show me my sales\', \'Go to customer accounts\', \'What are my key performance indicators?\', \'Qual minha receita total?\', \'Leve-me para a caderneta de fiados\', \'Adicionar novo cliente João\', \'Registrar nova despesa de aluguel\''
    ),
});
export type InterpretTextCommandsInput = z.infer<typeof InterpretTextCommandsInputSchema>;

const InterpretTextCommandsOutputSchema = z.object({
  action: z
    .string()
    .describe(
      'The action to perform based on the command. Examples: \'navigateToDashboard\', \'navigateToNotebook\', \'navigateToCustomers\', \'navigateToSales\', \'navigateToProducts\', \'navigateToCreditNotebook\', \'navigateToSalesRecord\', \'navigateToMonthlyReport\', \'navigateToSettings\', \'queryTotalRevenue\', \'queryTotalCustomers\', \'queryTotalDueFiados\', \'queryPendingFiadosCount\', \'queryLowStockProductsCount\', \'initiateAddCustomer\', \'initiateAddCreditEntry\', \'initiateAddTransaction\', \'initiateAddProduct\', \'initiateSendMonthlyReport\', \'displayKPIs\'. If the command is not understood, return \'unknown\''
    ),
  parameters: z
    .string()
    .optional()
    .describe(
      'A JSON string containing parameters for the action. For example, if the action is \'initiateAddCustomer\', the JSON string might be \'{"customerName": "João"}\'. For \'initiateAddTransaction\', it might be \'{"type": "expense", "description": "aluguel", "amount": 500}\'.'
    ),
});
export type InterpretTextCommandsOutput = z.infer<typeof InterpretTextCommandsOutputSchema>;

export async function interpretTextCommands(
  input: InterpretTextCommandsInput
): Promise<InterpretTextCommandsOutput> {
  return interpretTextCommandsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretTextCommandsPrompt',
  input: {schema: InterpretTextCommandsInputSchema},
  output: {schema: InterpretTextCommandsOutputSchema},
  prompt: `You are an AI assistant that interprets user text commands for the MoneyWise application.

  The application allows users to manage their business data, including sales, customer accounts, key performance indicators, financial notebook, credit notebook, product catalog, sales records, and monthly reports.

  The application responds to the following commands (map to the given action):

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
  - (Legacy) "Show me my sales": action: navigateToSalesRecord
  - (Legacy) "Go to customer accounts": action: navigateToCustomers
  - (Legacy) "What are my key performance indicators?": action: displayKPIs

  Data Queries:
  - "Qual é minha receita total?", "Quanto ganhei no total?": action: queryTotalRevenue
  - "Quantos clientes eu tenho?", "Total de clientes": action: queryTotalCustomers
  - "Quanto tenho a receber de fiados?", "Total de fiados pendentes em valor": action: queryTotalDueFiados
  - "Quantos fiados estão pendentes?", "Número de fiados pendentes": action: queryPendingFiadosCount
  - "Quais produtos estão com estoque baixo?", "Contar produtos com estoque baixo": action: queryLowStockProductsCount

  Initiate Actions:
  - "Adicionar novo cliente", "Cadastrar cliente [nome]": action: initiateAddCustomer (extract name if provided)
  - "Adicionar novo fiado", "Registrar fiado para [cliente]": action: initiateAddCreditEntry (extract customer name if provided)
  - "Adicionar nova transação", "Lançar receita [descrição] [valor]", "Registrar despesa [descrição] [valor]": action: initiateAddTransaction (extract type, description, amount if provided)
  - "Adicionar novo produto", "Cadastrar produto [nome]": action: initiateAddProduct (extract name if provided)
  - "Enviar relatório mensal", "Gerar relatório para [whatsapp]": action: initiateSendMonthlyReport (extract whatsapp if provided)


  Interpret the following command and provide the corresponding action and parameters:

  Command: {{{command}}}

  If a command can be interpreted as a data query, prefer the query action.
  If a command is a general request for information typically found on the dashboard (like KPIs), use action: displayKPIs which will be handled on the client.
  If the command is to start a process like adding something, use the 'initiate...' actions.
  If the command is ambiguous or not understood, return action: 'unknown'.
  Extract relevant entities as parameters (e.g., customerName, productName, amount, description, type: 'income' or 'expense').
  **Provide these parameters as a valid JSON string in the 'parameters' field.**
  If no parameters are extracted, the 'parameters' field can be omitted from the output.
  Ensure that the output is valid JSON conforming to the InterpretTextCommandsOutputSchema schema.`,
});

const interpretTextCommandsFlow = ai.defineFlow(
  {
    name: 'interpretTextCommandsFlow',
    inputSchema: InterpretTextCommandsInputSchema,
    outputSchema: InterpretTextCommandsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

