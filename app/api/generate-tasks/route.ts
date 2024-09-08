import { db } from '@/firebase'
import { doc, setDoc, collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore'
import { NextResponse } from 'next/server'
import Configuration from 'openai'
import OpenAIApi from 'openai'
import { EmployeeSummary, TaskSummary } from '@/models/summaries'
import { Task } from '@/models/task'

// Set up OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });
// Utility function to save a task to Firebase
async function saveTaskToFirebaseAndUpdateProject(email: string, task: Task, projectId: string) {
  try {
    const taskRef = doc(collection(db, 'tasks'))  // Automatically generates a unique ID
    const taskId = taskRef.id  // Get the auto-generated task ID

    const cleanTask = {
      ...task,
      id: taskId,  // Assign the generated ID to the task
    }

    await setDoc(taskRef, cleanTask)

    // Create TaskSummary
    const taskSummary: TaskSummary = {
      id: task.id,
      title: task.title,
      status: task.status,
      assignee: task.assignee?.name || '',
      time: task.time ? `${task.time}h` : undefined,
    }

    // Update project with TaskSummary
    const projectRef = doc(db, 'projects', projectId)
    await updateDoc(projectRef, {
      tasks: arrayUnion(taskSummary)
    })

  } catch (error) {
    console.error('Error saving task to Firebase or updating project:', error)
    throw error
  }
}
// Fetch employees from Firebase
async function fetchEmployees(): Promise<EmployeeSummary[]> {
  const employeesCollection = collection(db, 'employees')
  const employeesSnapshot = await getDocs(employeesCollection)
  return employeesSnapshot.docs.map(doc => {
    const data = doc.data() as EmployeeSummary
    // Ensure the name field exists and is a string
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      console.warn(`Employee ${doc.id} has an invalid name:`, data.name)
      data.name = 'Unknown'  // Set a default name
    }
    return data
  })
}

// Find employee by name
function findEmployeeByName(employees: EmployeeSummary[], name: string): EmployeeSummary | undefined {
  if (typeof name !== 'string') {
    console.warn('Invalid name provided:', name)
    return undefined
  }
  return employees.find(emp => emp.name.toLowerCase() === name.toLowerCase())
}
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const email = formData.get('email') as string
    const file = formData.get('file') as File
    let userMessage = formData.get('message') as string
    const projectId = formData.get('projectId') as string

    if (!email || !projectId) {
      console.error('Missing email or projectId in POST request')
      return NextResponse.json({ error: 'Missing email or projectId' }, { status: 400 })
    }

    // If a file is uploaded, convert it to text
    if (file) {
      userMessage = await convertFileToText(file)
    }

    // Fetch employees from the database
    const employees = await fetchEmployees()


    // Instruction to generate tasks
    const systemInstruction = `Generate a list of tasks in JSON format based on the following content. Fields with ? are optional, if they are available generate. The tasks should be structured as:
    {
      id: string;
      title: string;
      description: string;
      time: number; // in hours
      efforts: 'backend' | 'frontend' | 'backend + frontend';
      assignee: string; // Just the name, we'll match it later
      status: 'backlog' | 'todo' | 'inProgress' | 'done';
      createdAt?: string; // ISO date string
      projectId?: string;
      stageId?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical' | 'null';
      dueDate?: string; // ISO date string
      reporter?: string; // Just the name, we'll match it later
    }`

    // Call the OpenAI model
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Use the appropriate model version
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

    const rawTasks: any[] = JSON.parse(generatedText)

    // Process and save each task
    const processedTasks: Task[] = rawTasks.map(rawTask => {
      const assignee = rawTask.assignee ? findEmployeeByName(employees, rawTask.assignee) : null
      const reporter = rawTask.reporter ? findEmployeeByName(employees, rawTask.reporter) : null

      const task: Task = {
        ...rawTask,
        assignee: assignee || null,
        reporter: reporter || null,
        projectId: projectId,
        stageId: rawTask.stageId || null,
        createdAt: rawTask.createdAt ? new Date(rawTask.createdAt) : new Date(),
        dueDate: rawTask.dueDate ? new Date(rawTask.dueDate) : null,
      }

      return task
    })


    // Save each task to Firebase
    await Promise.all(processedTasks.map(task => saveTaskToFirebaseAndUpdateProject(email, task, projectId)))

    // Create task summaries
    // const taskSummaries: TaskSummary[] = processedTasks.map(task => ({
    //   id: task.id,
    //   title: task.title,
    //   status: task.status,
    //   assignee: task.assignee?.name || '',
    //   time: task.time ? `${task.time}h` : undefined,
    // }))
    console.log('Task summaries')
    return NextResponse.json({ success: true }, { status: 200 })
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