import { db } from '@/firebase'
import { doc, setDoc, collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore'
import { NextResponse } from 'next/server'
import Configuration from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { EmployeeSummary, TaskSummary } from '@/models/summaries'
import { Task } from '@/models/task'
import OpenAIApi from 'openai'

// Define the Task schema using zod
const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  time: z.number(), // in hours
  efforts: z.enum(['backend', 'frontend', 'backend + frontend']),
  assignee: z.string(), // Just the name
  status: z.enum(['backlog', 'todo', 'inProgress', 'done']),
  // createdAt: z.date(), // ISO date string
  projectId: z.string().optional(),
  stageId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical', 'null']).optional(),
})

// Since the AI will return a list of tasks, define an array schema
const TasksResponseSchema = z.object({
  tasks: z.array(TaskSchema)
})
// Set up OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });

// const openai = new OpenAIApi(configuration)

// Utility function to save a task to Firebase
async function saveTaskToFirebaseAndUpdateProject(email: string, task: Task, projectId: string) {
  try {
    const taskRef = doc(collection(db, 'tasks'))  // Automatically generates a unique ID
    const taskId = taskRef.id  // Get the auto-generated task ID

    const cleanTask = {
      ...task,
      id: taskId,
      createdAt: new Date(),
    }

    await setDoc(taskRef, cleanTask)

    // Create TaskSummary
    // const taskSummary: TaskSummary = {
    //   id: task.id,
    //   title: task.title,
    //   status: task.status,
    //   assignee: task.assignee?.name || '',
    //   time: task.time ? `${task.time}h` : undefined,
    // }

    // Update project with TaskSummary
    const projectRef = doc(db, 'projects', projectId)
    await updateDoc(projectRef, {
      // tasks: arrayUnion(taskSummary),
      taskIds: arrayUnion(taskId)
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
  console.log('Searching for employee:', name)
  return employees.find(emp => emp.name.toLowerCase() === name.toLowerCase())
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const email = formData.get('email') as string
    const file = formData.get('file') as File
    let userMessage = formData.get('message') as string
    const projectId = formData.get('projectId') as string
    const reporterData = formData.get('reporter')
    let reporter = null
    if (reporterData) {
      reporter = JSON.parse(reporterData as string)
    }

    console.log('Reporter:', reporter)
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

    // Define the system instruction with clear schema expectations
    const systemInstruction = `Generate a list of tasks in JSON format based on the following content. Fields with ? are optional. The tasks should be structured as:
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "time": number, // in hours
      "efforts": "backend" | "frontend" | "backend + frontend",
      "assignee": "string", // Just the name
      "status": "backlog" | "todo" | "inProgress" | "done",
      "createdAt"?: "string", // ISO date string
      "projectId"?: "string",
      "stageId"?: "string",
      "priority"?: "low" | "medium" | "high" | "urgent" | "critical" | "null",
      "dueDate"?: "string" // ISO date string
    }
  ]
}`
    console.log('Employees: here iam' , TasksResponseSchema)
    // Call the OpenAI model with Structured Outputs
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06', // Ensure you're using a supported model
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage },
      ],
      response_format: zodResponseFormat(TasksResponseSchema, 'tasks'),
      max_tokens: 4096,
    })

    // Access the parsed tasks directly
    const parsedResponse = completion.choices[0].message.parsed

    if (!parsedResponse) {
      if (completion.choices[0].message.refusal) {
        console.warn('AI Refusal:', completion.choices[0].message.refusal)
        return NextResponse.json({ error: 'AI refused to generate tasks' }, { status: 400 })
      }
      throw new Error('Invalid response from AI')
    }

    // Extract tasks from the parsed response
    const parsedTasks = parsedResponse.tasks

    // Process and save each task
    const processedTasks: Task[] = parsedTasks.map(rawTask => {
      const assignee = rawTask.assignee ? findEmployeeByName(employees, rawTask.assignee) : null
      console.log('Assignee:', assignee)
      const task: Task = {
        ...rawTask,
        assignee: assignee || null,
        reporter: reporter || null,
        projectId: projectId,
        type: 'task',
        stageId: rawTask.stageId || undefined,
        createdAt: new Date(),
      }

      return task
    })

    // Save each task to Firebase
    await Promise.all(processedTasks.map(task => saveTaskToFirebaseAndUpdateProject(email, task, projectId)))
    console.log('tasks length', processedTasks.length)

    return NextResponse.json({ success: true, tasksLength: processedTasks.length }, { status: 200 })
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
