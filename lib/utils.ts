import { Message } from "ai"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// funtion generate the name fo the conversation using gpr 4o-mini
// export async function generateConversationName(messages: Message[]) {
//   const model = openai('gpt-4o-mini')
//   const {text} = await generateText({
//     model,
//     prompt: `Generate a name for this conversation: ${messages.map(message => message.content).join(' ')}`,
//     maxTokens: 10,
//     temperature: 0.7,
//     topP: 0.4,
//   })
//   return text
// }