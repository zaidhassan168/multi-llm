//models\project.ts
type Stage = {
    name: string
    completionTime: number
    owner: string
  }

  type Project = {
    id: string
    name: string
    manager: string
    stages?: Stage[]
    currentStage: Stage
    onTrack: boolean
  }

  const API_URL = '/api/projects';

export async function fetchProjects(): Promise<Project[]> {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
}

export async function createProject(project: Omit<Project, 'id'>): Promise<Project> {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
}

export async function updateProject(project: Project): Promise<Project> {
    const response = await fetch(`${API_URL}/${project.id}`, {
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