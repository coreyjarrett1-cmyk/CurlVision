'use server';
/**
 * @fileOverview An AI agent that provides proactive alerts and personalized advice for protective styles.
 *
 * - generateProtectiveStyleGuidance - A function that generates guidance for protective styles.
 * - ProtectiveStyleGuidanceInput - The input type for the generateProtectiveStyleGuidance function.
 * - ProtectiveStyleGuidanceOutput - The return type for the generateProtectiveStyleGuidance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProtectiveStyleGuidanceInputSchema = z.object({
  protectiveStyleType: z.string().describe('The type of protective style currently worn (e.g., "braids", "faux locs", "wigs").'),
  dateApplied: z.string().describe('The date when the protective style was applied, in YYYY-MM-DD format.'),
  hairCurlPattern: z.string().describe('The user\'s hair curl pattern (e.g., "4C", "3C", "kinky", "coily").'),
  hairPorosity: z.string().describe('The user\'s hair porosity (e.g., "high", "low", "normal").'),
  scalpCondition: z.string().describe('The current condition of the user\'s scalp (e.g., "normal", "dry", "oily", "itchy", "flaky").'),
});
export type ProtectiveStyleGuidanceInput = z.infer<typeof ProtectiveStyleGuidanceInputSchema>;

const ProtectiveStyleGuidanceOutputSchema = z.object({
  alertMessage: z.string().describe('A concise alert message regarding the protective style and its maintenance.'),
  detailedAdvice: z.string().describe('Comprehensive, personalized advice for maintaining the style, preparing for takedown, or addressing scalp issues. This advice should be specific to the protective style, hair type, and scalp condition.'),
  recommendedNextAction: z.string().describe('A short, actionable step the user should take next (e.g., "Schedule takedown appointment", "Apply scalp oil", "Gentle wash").'),
  daysRemainingUntilTakedown: z.number().nullable().describe('The estimated number of days until the protective style should ideally be taken down, based on a maximum recommended duration of 6-8 weeks (42-56 days). Return 0 if the style is already past due, or null if a specific recommendation cannot be made.'),
});
export type ProtectiveStyleGuidanceOutput = z.infer<typeof ProtectiveStyleGuidanceOutputSchema>;

export async function generateProtectiveStyleGuidance(
  input: ProtectiveStyleGuidanceInput
): Promise<ProtectiveStyleGuidanceOutput> {
  return aiProtectiveStyleGuidanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'protectiveStyleGuidancePrompt',
  input: {schema: ProtectiveStyleGuidanceInputSchema},
  output: {schema: ProtectiveStyleGuidanceOutputSchema},
  prompt: `You are an expert hair care assistant specializing in protective styles, particularly for Black hair.\nYour goal is to provide proactive alerts and personalized advice to users to prevent damage and keep their hair healthy.\n\nAnalyze the following user data to determine the appropriate guidance:\nProtective Style Type: {{{protectiveStyleType}}}\nDate Applied: {{{dateApplied}}} (format: YYYY-MM-DD)\nHair Curl Pattern: {{{hairCurlPattern}}}\nHair Porosity: {{{hairPorosity}}}\nScalp Condition: {{{scalpCondition}}}\n\nBased on this information, provide:\n1.  A concise 'alertMessage'.\n2.  'detailedAdvice' for maintaining the style, preparing for takedown, or addressing scalp issues, specific to the user's hair and style.\n3.  A 'recommendedNextAction' which is a short, actionable step.\n4.  Calculate 'daysRemainingUntilTakedown'. Assume a maximum recommended duration of 6-8 weeks (42-56 days) for most protective styles. If the style is past this period, set 'daysRemainingUntilTakedown' to 0.\n\nConsider these general guidelines for protective styles:\n- Most protective styles should not be kept in longer than 6-8 weeks to prevent hair damage and breakage.\n- Scalp health is crucial. Address itchy or dry scalp promptly with moisture or gentle cleansing.\n- Hair porosity affects how well hair retains moisture; adjust product and routine recommendations accordingly.\n- For the protective style "{{{protectiveStyleType}}}" applied on "{{{dateApplied}}}", provide an estimated ideal takedown date and calculate the remaining days.\n`,
});

const aiProtectiveStyleGuidanceFlow = ai.defineFlow(
  {
    name: 'aiProtectiveStyleGuidanceFlow',
    inputSchema: ProtectiveStyleGuidanceInputSchema,
    outputSchema: ProtectiveStyleGuidanceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
