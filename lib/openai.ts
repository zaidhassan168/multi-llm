import Configuration from 'openai';
import OpenAIApi from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });
export const generateComment = async (codeSnippet: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Use the appropriate model
    messages: [
      { role: 'system', content: 'You are a helpful assistant that provides detailed comments for code snippets.' },
      { role: 'user', content: `Provide a detailed comment for the following code:\n\n${codeSnippet}` }
    ],
    max_tokens: 150,
  });

  return response.choices[0].message.content?.trim();
};
