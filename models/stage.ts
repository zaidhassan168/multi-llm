

import { TaskSummary } from "./summaries";
type Stage = {  
  id: string;  
  name: string;  
  owner?: string;  
  processGroup: string;  // Process Group (e.g., "Planning", "Executing")
  knowledgeArea?: string;  
  taskIds?: string[];  // Array of task IDs within this stage
  employeeIds?: string[];  // Array of employee IDs working on this stage
  tasks?:  TaskSummary[];
  totalTaskHours?: Number;
  taskHoursCompleted?: Number;
  completedTasks?: Number;
  totalTasks?: Number;
  progress?: Number;

};

  export async function fetchStages(): Promise<Stage[]> {
    const response = await fetch('/api/project-management/stages');
    if (!response.ok) {
      throw new Error(`Failed to fetch stages: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  export async function createStage(stage: Omit<Stage, 'id'>): Promise<Stage> {
    const response = await fetch('/api/project-management/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stage),
    });
    if (!response.ok) {
      throw new Error(`Failed to create stage: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  export async function updateStage(stage: Stage): Promise<Stage> {
    const response = await fetch(`/api/project-management/stages/${stage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stage),
    });
    if (!response.ok) {
      throw new Error(`Failed to update stage: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  export async function deleteStage(id: string): Promise<void> {
    const response = await fetch(`/api/project-management/stages/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete stage: ${response.status} ${response.statusText}`);
    }
  }


  //funtion to fetch the stage of the project
  export async function fetchProjectStages(projectId: string): Promise<Stage> {
   const response = await fetch(`/api/project-management/stages/projectStages?projectId=${projectId}`);
   console.log("response", response)
    if (!response.ok) {
      throw new Error(`Failed to fetch stage: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  export type { Stage };