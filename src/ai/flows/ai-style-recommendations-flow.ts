
'use server';
/**
 * @fileOverview A soulful guide for style discovery.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiStyleRecommendationInputSchema = z.object({
  curlPattern: z.enum(['3C', '4A', '4B', '4C']).describe('The user\'s hair curl pattern.'),
  porosity: z.enum(['Low', 'Medium', 'High']).describe('The user\'s hair porosity.'),
  density: z.enum(['Fine', 'Medium', 'Thick']).describe('The user\'s hair density.'),
  favoriteStyles: z.array(z.string()).describe('A list of descriptions or names of hairstyles the user likes or has saved.'),
});
export type AiStyleRecommendationInput = z.infer<typeof AiStyleRecommendationInputSchema>;

const AiStyleRecommendationOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      name: z.string().describe('The name of the recommended hairstyle.'),
      description: z.string().describe('A soulful explanation of why this style fits their spirit.'),
      suitableFor: z.array(z.string()).describe('Vibes this style is suitable for (e.g., "gentle days", "ancestral events", "morning sun").'),
    })
  ).describe('A list of personalized hairstyle recommendations.'),
});
export type AiStyleRecommendationOutput = z.infer<typeof AiStyleRecommendationOutputSchema>;

const aiStyleRecommendationsPrompt = ai.definePrompt({
  name: 'aiStyleRecommendationsPrompt',
  input: {schema: AiStyleRecommendationInputSchema},
  output: {schema: AiStyleRecommendationOutputSchema},
  prompt: `Peace and blessings. You are a wise soul guide for hair artistry. 
The user is looking for a new way to adorn their crown. 

Based on their unique rhythm ({{{curlPattern}}}) and spirit, suggest 3-5 ways they can express themselves. 
Speak with the warmth of a morning sun and the wisdom of an elder. 

User's Hair Spirit:
- Rhythm: {{{curlPattern}}}
- Breath: {{{porosity}}}
- Strength: {{{density}}}

User's Loved Refections:
{{#if favoriteStyles}}
{{#each favoriteStyles}}- {{{this}}}
{{/each}}
{{else}}They are seeking a new beginning.
{{/if}}

Recommend styles that resonate with their being.
`,
});

const aiStyleRecommendationsFlow = ai.defineFlow(
  {
    name: 'aiStyleRecommendationsFlow',
    inputSchema: AiStyleRecommendationInputSchema,
    outputSchema: AiStyleRecommendationOutputSchema,
  },
  async (input) => {
    const {output} = await aiStyleRecommendationsPrompt(input);
    if (!output) {
      throw new Error('The spirits were silent. No output generated.');
    }
    return output;
  }
);

export async function aiStyleRecommendations(input: AiStyleRecommendationInput): Promise<AiStyleRecommendationOutput> {
  return aiStyleRecommendationsFlow(input);
}
