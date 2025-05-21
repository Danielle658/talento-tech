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
      'The text command entered by the user.  Examples: \'Show me my sales\', \'Go to customer accounts\', \'What are my key performance indicators?\''
    ),
});
export type InterpretTextCommandsInput = z.infer<typeof InterpretTextCommandsInputSchema>;

const InterpretTextCommandsOutputSchema = z.object({
  action: z
    .string()
    .describe(
      'The action to perform based on the command.  Examples: \'showSales\', \'goToCustomerAccounts\', \'displayKPIs\'. If the command is not understood, return \'unknown\''
    ),
  parameters: z
    .record(z.any())
    .describe(
      'A JSON object containing parameters for the action.  For example, if the action is \'showSales\', the parameters might include a date range.'
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

  The application allows users to manage their business data, including sales, customer accounts, and key performance indicators.

  The application responds to the following commands:

  - Show me my sales:  action: showSales
  - Go to customer accounts: action: goToCustomerAccounts
  - What are my key performance indicators?: action: displayKPIs

  Interpret the following command and provide the corresponding action and parameters:

  Command: {{{command}}}

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
