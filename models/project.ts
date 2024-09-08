//models\project.ts

import { Stage } from './stage';
import { Task } from './task';
import { Employee } from './employee';
import { EmployeeSummary, StageSummary, TaskSummary } from './summaries';
type Project = {  
  id: string;  
  name: string;  
  currentStage?: StageSummary;  // Link to the current stage summary
  onTrack?: boolean;  // Whether the project is on track
  stages?: Stage[];  // Summaries of all stages
  tasks?: TaskSummary[]; 
  taskids?: string[];
  manager: EmployeeSummary;
  resources?: EmployeeSummary[]// Summaries of employees working on the project
};


  const API_URL = '/api/project-management/projects';

  export async function fetchProjects(): Promise<Project[]> {  
    const response = await fetch(API_URL);  
    if (!response.ok) {  
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);  
    }  
    return response.json();  
  }  

  // funtion to fetch the oneproject data using project id 
  export async function getProjectById(projectId: string): Promise<Project> {
    const response = await fetch(`${API_URL}/${projectId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch project with ID ${projectId}: ${response.status} ${response.statusText}`);
    }
    return response.json();
}
export async function createProject(project: Omit<Project, 'id'>): Promise<Project> {
    // add the id in the prject 
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
}

export async function updateProject(project: Project): Promise<Project> {
    const response = await fetch(API_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
}

export async function deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete project');
}
  export type { Project, Stage }


  export const addTaskToProjectAndStage = async (task: TaskSummary, projectId: string, stageId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, stageId }),  // Only send the task object
    });

    if (!response.ok) throw new Error('Failed to add task');
    return response.json();
};
