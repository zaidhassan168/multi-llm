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
    if (!response.ok) {  
        const errorBody = await response.text();  
        throw new Error(`Failed to fetch risks: ${response.status} ${response.statusText}. ${errorBody}`);  
    }  
    return response.json();  
}  

export async function createRisk(risk: Omit<Risk, 'id'>): Promise<Risk> {  
    const response = await fetch(API_URL, {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify(risk),  
    });  
    if (!response.ok) {  
        const errorBody = await response.text();  
        throw new Error(`Failed to create risk: ${response.status} ${response.statusText}. ${errorBody}`);  
    }  
    return response.json();  
} 
export async function updateRisk(risk: Risk): Promise<Risk> {  
    const response = await fetch(`${API_URL}/${risk.id}`, {  
        method: 'PUT', // Changed from PATCH to PUT  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify(risk),  
    });  
    if (!response.ok) {  
        const errorBody = await response.text();  
        throw new Error(`Failed to update risk: ${response.status} ${response.statusText}. ${errorBody}`);  
    }  
    return response.json();  
}  

export async function deleteRisk(id: string): Promise<void> {  
    const response = await fetch(`${API_URL}/${id}`, {  
        method: 'DELETE',  
    });  
    if (!response.ok) {  
        const errorBody = await response.text();  
        throw new Error(`Failed to delete risk: ${response.status} ${response.statusText}. ${errorBody}`);  
    }  
}  

export type { Risk };

