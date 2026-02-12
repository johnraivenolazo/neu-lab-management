'use server';
/**
 * @fileOverview Summarizes laboratory usage data to identify peak hours and frequent users.
 *
 * - summarizeLabUsageData - A function that summarizes lab usage data.
 * - SummarizeLabUsageDataInput - The input type for the summarizeLabUsageData function.
 * - SummarizeLabUsageDataOutput - The return type for the summarizeLabUsageData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLabUsageDataInputSchema = z.object({
  usageData: z.string().describe('A JSON string containing laboratory usage data, including professor name, room number, timestamp, and duration.'),
});
export type SummarizeLabUsageDataInput = z.infer<typeof SummarizeLabUsageDataInputSchema>;

const SummarizeLabUsageDataOutputSchema = z.object({
  summary: z.string().describe('A brief text summary of the laboratory’s peak hours and most frequent users.'),
});
export type SummarizeLabUsageDataOutput = z.infer<typeof SummarizeLabUsageDataOutputSchema>;

export async function summarizeLabUsageData(input: SummarizeLabUsageDataInput): Promise<SummarizeLabUsageDataOutput> {
  return summarizeLabUsageDataFlow(input);
}

const summarizeLabUsageDataPrompt = ai.definePrompt({
  name: 'summarizeLabUsageDataPrompt',
  input: {schema: SummarizeLabUsageDataInputSchema},
  output: {schema: SummarizeLabUsageDataOutputSchema},
  prompt: `You are an AI assistant helping summarize laboratory usage data.
  Your goal is to provide a brief text summary of the laboratory’s peak hours and most frequent users based on the data provided.
  If the usage data is empty, respond with a message indicating that there is no usage data to summarize.

  Usage Data: {{{usageData}}}
  `,
});

const summarizeLabUsageDataFlow = ai.defineFlow(
  {
    name: 'summarizeLabUsageDataFlow',
    inputSchema: SummarizeLabUsageDataInputSchema,
    outputSchema: SummarizeLabUsageDataOutputSchema,
  },
  async input => {
    try {
      JSON.parse(input.usageData);
    } catch (e) {
      console.error('Invalid JSON data provided:', e);
      return {summary: 'Invalid laboratory usage data provided.'};
    }

    const {output} = await summarizeLabUsageDataPrompt(input);
    return output!;
  }
);
