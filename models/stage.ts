

type Stage = {  
    id: string  
    name: string  
    completionTime: number  
    owner: string  
    processGroup?: string  // Process Group (e.g., "Planning", "Executing")
    knowledgeArea?: string 
    taskIds?: string[] // Consider changing to Task[] if you have a Task type
  }  

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
      method: 'PUT',
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

  export type { Stage };