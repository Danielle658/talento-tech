
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
  voiceCommand: z.string().describe('The voice command to interpret. Examples: "Abrir painel central", "Adicionar novo cliente Maria telefone (11) 98765-4321 email maria@exemplo.com endereço Rua das Palmeiras 42", "Qual minha receita?", "Cadastrar produto Camisa P código CP001 preço 50 categoria Roupas estoque 5", "Excluir cliente João", "Remover produto Código X", "Editar cliente Maria"'),
});
export type InterpretVoiceCommandInput = z.infer<typeof InterpretVoiceCommandInputSchema>;

const InterpretVoiceCommandOutputSchema = z.object({
  action: z
    .string()
    .describe(
      'The action to perform based on the voice command. Examples: \'navigateToDashboard\', \'navigateToNotebook\', \'navigateToCustomers\', \'navigateToSales\', \'navigateToProducts\', \'navigateToCreditNotebook\', \'navigateToSalesRecord\', \'navigateToMonthlyReport\', \'navigateToSettings\', \'queryTotalRevenue\', \'queryTotalCustomers\', \'queryTotalDueFiados\', \'queryPendingFiadosCount\', \'queryLowStockProductsCount\', \'initiateAddCustomer\', \'initiateAddCreditEntry\', \'initiateAddTransaction\', \'initiateAddProduct\', \'initiateSendMonthlyReport\', \'displayKPIs\', \'initiateDeleteCustomer\', \'initiateDeleteProduct\', \'initiateDeleteTransaction\', \'initiateDeleteCreditEntry\', \'initiateEditCustomer\', \'initiateEditProduct\'. If the command is not understood, return \'unknownCommand\''
    ),
  parameters: z
    .string()
    .optional()
    .describe(
      'A JSON string containing parameters for the action. Examples: For \'initiateAddCustomer\', it might be \'{"customerName": "Maria", "phone": "(11) 98765-4321", "email": "maria@exemplo.com", "address": "Rua das Palmeiras 42"}\'. For \'initiateAddProduct\', it could be \'{"productName": "Camisa P", "productCode": "CP001", "productPrice": 50, "category": "Roupas", "stock": "5"}\'. For \'initiateAddCreditEntry\', it could be \'{"customerName": "Pedro", "amount": 200, "dueDate": "2025-01-15", "whatsappNumber": "5521912345678", "notes": "Pagamento em duas vezes"}\'. For \'initiateDeleteCustomer\' or \'initiateEditCustomer\', it might be \'{"customerName": "João"}\'. For \'initiateDeleteProduct\' or \'initiateEditProduct\', it might be \'{"productName": "Camisa P"}\'.'
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
  - "Configurações", "Ajustes", "Perfil": action: navigateToSettings

  Data Queries:
  - "Qual minha receita total?": queryTotalRevenue
  - "Quantos clientes tenho?": queryTotalCustomers
  - "Quanto devo receber de fiados?": queryTotalDueFiados
  - "Quantos fiados pendentes existem?": queryPendingFiadosCount
  - "Existem produtos com estoque baixo?": queryLowStockProductsCount
  - "Quais são meus KPIs?": displayKPIs

  Initiate Actions (Add - try to extract ALL parameters from the command):
  - "Adicionar novo cliente [nome] [telefone] [email] [endereco]", "Cadastrar cliente [nome] com telefone [telefone] email [email] e endereco [endereco]": action: initiateAddCustomer. Extract: customerName (required), phone (required), email (optional), address (optional).
  - "Adicionar novo fiado para [cliente] valor [valor] vencimento [data] whatsapp [numero] observacoes [texto]", "Registrar fiado para [cliente] de [valor] vencendo em [data no formato AAAA-MM-DD] com whatsapp [numero] e notas [texto]": action: initiateAddCreditEntry. Extract: customerName (required), amount (required), dueDate (optional, YYYY-MM-DD format), whatsappNumber (optional), notes (optional). Sale date defaults to today if not specified.
  - "Adicionar nova transação", "Lançar receita [descrição] [valor]", "Registrar despesa [descrição] [valor]": action: initiateAddTransaction. Extract: type (required: 'income' or 'expense'), description (required), amount (required). Date defaults to today if not specified.
  - "Adicionar novo produto [nome] código [código] preço [preço] categoria [categoria] estoque [estoque]", "Cadastrar produto [nome] com código [código] e preço [preço], categoria [categoria] e estoque [quantidade]": action: initiateAddProduct. Extract: productName (required), productCode (required), productPrice (required), category (optional), stock (optional).
  - "Enviar relatório mensal", "Gerar relatório para [whatsapp]": action: initiateSendMonthlyReport (extract whatsapp if provided)

  Initiate Actions (Edit - guide user to page):
  - "Editar cliente [nome]": action: initiateEditCustomer (extract customerName)
  - "Editar produto [nome/código]": action: initiateEditProduct (extract productName or productCode)

  Initiate Actions (Delete - guide user to page):
  - "Excluir cliente [nome]", "Remover cliente [nome]": action: initiateDeleteCustomer (extract customerName)
  - "Excluir produto [nome/código]", "Remover produto [nome/código]": action: initiateDeleteProduct (extract productName or productCode)
  - "Excluir transação [descrição]", "Apagar lançamento [descrição]": action: initiateDeleteTransaction (extract description of transaction)
  - "Excluir fiado de [nome]", "Remover fiado de [nome]": action: initiateDeleteCreditEntry (extract customerName for the credit entry)

Interpret the following voice command and provide the corresponding action and parameters in JSON format.

Voice Command: {{{voiceCommand}}}

Output should be a JSON object with "action" and "parameters" fields.
- If the command is unclear, too vague, or doesn't match any known action, return an action of 'unknownCommand'.
- Prioritize specific query actions if the user is asking for specific data.
- Prioritize navigation actions if the user is asking to go to a specific section.
- Prioritize 'initiateAdd...' actions if the user wants to start adding data.
- Prioritize 'initiateEdit...' or 'initiateDelete...' actions if the user wants to start editing/deleting data.
- For 'initiateAdd...' actions:
  - Extract ALL relevant entities from the user's command as specified above.
  - Provide these extracted entities as a valid JSON string in the 'parameters' field.
- For 'initiateEdit...' or 'initiateDelete...' actions, extract the primary identifier and provide it in the 'parameters' field as a JSON string.
- If no parameters are extracted where they would be expected for a direct addition (e.g. adding a customer without a name), the 'parameters' field can be omitted or be an empty JSON string.
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

