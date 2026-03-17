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

type UsageEntry = {
  professor?: string;
  room?: string;
  timestamp?: string;
  duration?: number;
};

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

function fallbackSummaryFromUsageData(usageData: string): string {
  let parsed: UsageEntry[] = [];

  try {
    const raw = JSON.parse(usageData);
    parsed = Array.isArray(raw) ? raw : [];
  } catch {
    return 'Unable to summarize data right now. Please try again later.';
  }

  if (parsed.length === 0) {
    return 'No usage data to summarize yet.';
  }

  const roomCounts: Record<string, number> = {};
  const professorCounts: Record<string, number> = {};

  for (const entry of parsed) {
    if (entry.room) roomCounts[entry.room] = (roomCounts[entry.room] ?? 0) + 1;
    if (entry.professor) professorCounts[entry.professor] = (professorCounts[entry.professor] ?? 0) + 1;
  }

  const topRoom = Object.entries(roomCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'N/A';
  const topProfessor = Object.entries(professorCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'N/A';

  return `Summary unavailable from AI service right now. Based on current records: ${parsed.length} sessions logged, most active room: ${topRoom}, most frequent user: ${topProfessor}.`;
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
    let parsedUsage: unknown;

    try {
      parsedUsage = JSON.parse(input.usageData);
    } catch (e) {
      console.error('Invalid JSON data provided:', e);
      return {summary: 'Invalid laboratory usage data provided.'};
    }

    if (!Array.isArray(parsedUsage) || parsedUsage.length === 0) {
      return {summary: 'No usage data to summarize yet.'};
    }

    try {
      const {output} = await summarizeLabUsageDataPrompt(input);
      if (!output?.summary) {
        return {summary: fallbackSummaryFromUsageData(input.usageData)};
      }

      return output;
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return {summary: fallbackSummaryFromUsageData(input.usageData)};
    }
  }
);
