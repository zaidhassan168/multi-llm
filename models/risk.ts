//models\risk.ts
type Risk = {
    id: string
    description: string
    severity: 'Low' | 'Medium' | 'High'
    projectId: string
    probability: 'Low' | 'Medium' | 'High'

  }
const API_URL = '/api/project-management/risks';

export async function fetchRisks(): Promise<Risk[]> {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch risks');
    return response.json();
}

export async function createRisk(risk: Omit<Risk, 'id'>): Promise<Risk> {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(risk),
    });
    if (!response.ok) throw new Error('Failed to create risk');
    return response.json();
}

export async function updateRisk(risk: Risk): Promise<Risk> {
    const response = await fetch(`${API_URL}/${risk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(risk),
    });
    if (!response.ok) throw new Error('Failed to update risk');
    return response.json();
}

export async function deleteRisk(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete risk');
}

export type { Risk };

