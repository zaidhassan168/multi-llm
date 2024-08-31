// /types/task.ts
type Task = {
    id: string;
    title: string;
    description: string;
    time: number; // in hours
    efforts: 'backend' | 'frontend' | 'backend + frontend';
    assignee: string;
    status: 'backlog' | 'todo' | 'inProgress' | 'done';
    createdAt?: Date;
    projectName?: string;
    reporter?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical' | 'null';
    dueDate?: Date;
    comments?: Comment[];
    assigneeEmail?: string;
    reporterEmail?: string;
    name?: string;
    };
  
    type Risk = {
      id: string
      description: string
      severity: 'Low' | 'Medium' | 'High'
    }
  
  
    type Stage = {
      name: string
      completionTime: number
      owner: string
    }
  
    type Project = {
      id: string
      name: string
      progress: number
      risks: Risk[]
      tasks: Task[]
      currentStage: Stage
      onTrack: boolean
    }
  
    type Employee = {
      id: string
      name: string
      role: string
      availability: number
      currentProject: string
    }
  
    export type { Task, Risk, Stage, Project, Employee }