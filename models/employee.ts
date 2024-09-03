//models\employee.ts
type Employee = {
    id: string
    name: string
    role: 'developer' | 'management' | 'projectManager' | 'undefined'  
    availability?: number
    currentProject?: string
    email: string
    projectId?: string | string[]
  }

  const API_URL = '/api/project-management/employees';

export async function fetchEmployees(): Promise<Employee[]> {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
}

export async function fetchEmployee(email: string ): Promise<Employee> {
    const response = await fetch(`${API_URL}/${email}`);
    if (!response.ok) throw new Error('Failed to fetch employee');
    return response.json();
}

export async function createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
    });
    if (!response.ok) throw new Error('Failed to create employee');
    return response.json();
}

export async function updateEmployee(employee: Employee): Promise<Employee> {
    const response = await fetch(API_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee),
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
}

export async function deleteEmployee(id: string): Promise<void> {
    const response = await fetch(API_URL, {
        method: 'DELETE',
        body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error('Failed to delete employee');
}

export type { Employee };