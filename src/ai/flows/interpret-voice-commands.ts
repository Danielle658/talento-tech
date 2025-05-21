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
  action: z.string().describe('The action to perform based on the voice command.'),
  parameters: z.record(z.string()).describe('Parameters for the action, if any.'),
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

Interpret the following voice command and provide the corresponding action and parameters in JSON format.

Voice Command: {{{voiceCommand}}}

Output should be a JSON object with "action" and "parameters" fields. Possible actions include: navigateToDashboard, createNewInvoice, viewCustomerDetails, searchTransactions, generateReport.
If the command is unclear or doesn't match any known action, return an action of 'unknownCommand'.`,
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
