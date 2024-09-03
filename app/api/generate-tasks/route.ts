import { db } from '@/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { NextResponse } from 'next/server'
import Configuration from 'openai'
import OpenAIApi from 'openai'
import { Task } from '@/models/task'

// Set up OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });

// Utility function to save a task to Firebase
async function saveTaskToFirebase(email: string, task: Task) {
  try {
    const taskRef = doc(db, 'tasks', task.id)
    await setDoc(taskRef, task, { merge: true })
  } catch (error) {
    console.error('Error saving task to Firebase:', error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const email = formData.get('email') as string
    const file = formData.get('file') as File
    let userMessage = formData.get('message') as string

    if (!email) {
      console.error('Missing email in POST request')
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    // If a file is uploaded, convert it to text
    if (file) {
      userMessage = await convertFileToText(file)
    }

    // Instruction to generate tasks
    const systemInstruction = `Generate a list of tasks in JSON format based on the following content. fiels with ? are optional, if they are available generate. The tasks should be structured as:
    {
    id: string;
    title: string;
    description: string;
    time: number; // in hours
    efforts: 'backend' | 'frontend' | 'backend + frontend';
    assignee: string;
    status: 'backlog' | 'todo' | 'inProgress' | 'done';
    createdAt?: Date;
    projectName?: string;
    reporter?: string;    priority?: 'low' | 'medium' | 'high';
    dueDate?: Date;
    comments?: Comment[];
    assgneeEmail?: string;
    reporterEmail?: string;
    }`

    // Call the OpenAI model
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use the appropriate model version
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 4096,
    })

    let generatedText = response.choices[0]?.message?.content?.trim()

    if (!generatedText) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    // Remove ```json and ``` from the start and end of the response
    if (generatedText.startsWith('```json')) {
      generatedText = generatedText.slice(7) // Remove ```json\n
    }
    if (generatedText.endsWith('```')) {
      generatedText = generatedText.slice(0, -3) // Remove \n```
    }

    const tasks: Task[] = JSON.parse(generatedText)
    console.log('Generated tasks:', tasks)
    // Save each task to Firebase
    await Promise.all(tasks.map(task => saveTaskToFirebase(email, task)))

    return NextResponse.json({ success: true, tasks }, { status: 200 })
  } catch (error) {
    console.error('Error in POST handler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function convertFileToText(file: File): Promise<string> {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}
