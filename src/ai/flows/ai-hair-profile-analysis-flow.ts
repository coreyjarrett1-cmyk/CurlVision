
'use server';
/**
 * @fileOverview A warm hair guide that analyzes hair characteristics from a photo.
 *
 * - analyzeHairProfile - A function that handles the hair profile analysis process.
 * - AnalyzeHairProfileInput - The input type for the analyzeHairProfile function.
 * - AnalyzeHairProfileOutput - The return type for the analyzeHairProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeHairProfileInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of hair or scalp, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeHairProfileInput = z.infer<typeof AnalyzeHairProfileInputSchema>;

const AnalyzeHairProfileOutputSchema = z.object({
  curlPattern: z.string().describe('The curl pattern of the hair, e.g., "3C", "4A", "TWA", "Wavy", "Straight", or "Bald".'),
  porosity: z.enum(['Low', 'Medium', 'High', 'N/A (Bald)']).describe('The porosity level of the hair (Low, Medium, High, or N/A if bald).'),
  density: z.enum(['Thin', 'Medium', 'Thick', 'N/A (Bald)']).describe('The density of the hair (Thin, Medium, Thick, or N/A if bald).'),
  analysisSummary: z.string().describe('A very brief (max 50 characters), warm and direct summary of the findings.'),
});
export type AnalyzeHairProfileOutput = z.infer<typeof AnalyzeHairProfileOutputSchema>;

export async function analyzeHairProfile(input: AnalyzeHairProfileInput): Promise<AnalyzeHairProfileOutput> {
  return analyzeHairProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeHairProfilePrompt',
  input: {schema: AnalyzeHairProfileInputSchema},
  output: {schema: AnalyzeHairProfileOutputSchema},
  prompt: `You are a helpful and warm hair care guide. 
Your task is to analyze the provided photo to determine the user's hair and scalp characteristics.

Speak with warmth but be concise and direct.

Determine:
- Curl Pattern: Categorize the rhythm (e.g., 3C, 4A, TWA, Wavy, Straight). If the user is shaved or bald, specify "Bald".
- Porosity: Is it thirsty (High), balanced (Medium), or guarded (Low)? If bald, specify "N/A (Bald)".
- Density: Is it lush (Thick), gentle (Medium), or light (Thin)? If bald, specify "N/A (Bald)".
- Analysis Summary: Provide a very short summary (strictly under 50 characters). If bald, focus on scalp health.

Photo: {{media url=photoDataUri}}`,
});

const analyzeHairProfileFlow = ai.defineFlow(
  {
    name: 'analyzeHairProfileFlow',
    inputSchema: AnalyzeHairProfileInputSchema,
    outputSchema: AnalyzeHairProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
