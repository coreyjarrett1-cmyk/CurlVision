'use server';
/**
 * @fileOverview A Genkit flow for generating curated content for the CurlVision AI's Content Hub.
 *
 * - getCuratedContent - A function that fetches curated articles and educational resources.
 * - CuratedContentHubInput - The input type for the getCuratedContent function.
 * - CuratedContentHubOutput - The return type for the getCuratedContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CuratedContentHubInputSchema = z
  .object({
    query: z
      .string()
      .optional()
      .describe('An optional search query to refine content suggestions.'),
  })
  .describe('Input schema for the Curated Content Hub flow.');
export type CuratedContentHubInput = z.infer<typeof CuratedContentHubInputSchema>;

const CuratedContentHubOutputSchema = z
  .object({
    articles: z
      .array(
        z.object({
          title: z.string().describe('The title of the article.'),
          summary: z.string().describe('A concise summary of the article content.'),
          url: z
            .string()
            .url()
            .describe(
              'A placeholder URL for the article. This should be a valid URL format, e.g., "https://curlvision.ai/blog/article-slug".'
            ),
        })
      )
      .min(3)
      .max(5)
      .describe('A list of 3 to 5 curated articles related to hair care.'),
  })
  .describe('Output schema for the Curated Content Hub flow.');
export type CuratedContentHubOutput = z.infer<typeof CuratedContentHubOutputSchema>;

export async function getCuratedContent(
  input: CuratedContentHubInput
): Promise<CuratedContentHubOutput> {
  return curatedContentHubFlow(input);
}

const prompt = ai.definePrompt({
  name: 'curatedContentHubPrompt',
  input: {schema: CuratedContentHubInputSchema},
  output: {schema: CuratedContentHubOutputSchema},
  prompt: `You are an expert hair care journalist specializing in diverse hair types, with a strong focus on Black hair. Your task is to generate articles for a magazine-style blog focused on hair science, trends, and culturally relevant hair care tips.

Generate 3 to 5 distinct articles. Each article must have a compelling title, a concise summary of its content, and a placeholder URL. Ensure the content is scientifically sound and culturally accurate.

If the user provides a 'query', tailor the articles to that specific topic. Otherwise, provide a general selection of relevant and trending topics.

Query: {{{query}}}

Make sure your output is a valid JSON object matching the following schema. For URLs, use a placeholder like "https://curlvision.ai/blog/article-slug" or a similar valid URL format.
`,
});

const curatedContentHubFlow = ai.defineFlow(
  {
    name: 'curatedContentHubFlow',
    inputSchema: CuratedContentHubInputSchema,
    outputSchema: CuratedContentHubOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
