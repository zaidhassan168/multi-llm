//models\employee.ts
import { fetchTasksEmail, Task } from './task';
 type Employee = {
    id: string;
    name: string;
    role: 'developer' | 'management' | 'projectManager' | 'undefined';
    availability?: number;
    currentProject?: string;
    email: string;
    projectIds?: string[];
    taskIds?: string[];
    photoURL?: string;
    streak?: number;
    points?: number;
    levelProgress?: number;
    tasksCompletedThisWeek?: number;
    rank?: string;
    currentProjectProgress?: number;
    lastStatsUpdate?: string;
  };
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

export async function updateEmployeeStreak(email: string): Promise<number> {
    const response = await fetch(`${API_URL}/${email}/streak`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to update employee streak');
    const data = await response.json();
    return data.streak;
  }


////////////utils functions///////////////////
export async function triggerAsyncStatsUpdate(employeeId: string, email: string): Promise<void> {
    // Start the async operation
    console.log("Starting async stats update for employee:", employeeId);
    calculateAndUpdateEmployeeStats(employeeId, email).catch(error => {
      console.error("Error in async stats update:", error);
    });
  }

async function calculatePoints(tasks: Task[]): Promise<number> {
    const completedTasks = tasks.filter(task => task.status === 'done');
    return completedTasks.length * 10; // 10 points per completed task
  }
  
  async function calculateStreak(tasks: Task[]): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);
  
    while (true) {
      const tasksCompletedOnDate = tasks.filter(task => 
        task.status === 'done' && 
        task.completedAt && 
        new Date(task.completedAt).toDateString() === currentDate.toDateString()
      );
  
      if (tasksCompletedOnDate.length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
  
    return streak;
  }
  
  function calculateRank(points: number): string {
    if (points < 100) return 'Novice';
    if (points < 500) return 'Intermediate';
    if (points < 1000) return 'Advanced';
    return 'Expert';
  }
  
  async function calculateTasksCompletedThisWeek(tasks: Task[]): Promise<number> {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => 
      task.status === 'done' && 
      task.completedAt && 
      new Date(task.completedAt) >= oneWeekAgo
    ).length;
  }
  
  function calculateLevelProgress(points: number): number {
    const currentLevel = Math.floor(points / 100);
    const nextLevelPoints = (currentLevel + 1) * 100;
    return ((points % 100) / 100) * 100;
  }
  
  async function calculateProjectProgress(tasks: Task[]): Promise<number> {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }
  
  export async function calculateAndUpdateEmployeeStats(employeeId: string, email: string): Promise<Employee> {
    // Fetch current employee data
    const currentEmployee = await fetchEmployee(email);
    
    // Fetch tasks for the employee
    const tasks = await fetchTasksEmail(email, currentEmployee.role);
  
    // Calculate all stats
    const points = await calculatePoints(tasks);
    const streak = await calculateStreak(tasks);
    const rank = calculateRank(points);
    const tasksCompletedThisWeek = await calculateTasksCompletedThisWeek(tasks);
    const levelProgress = calculateLevelProgress(points);
    const currentProjectProgress = await calculateProjectProgress(tasks);
  
    // Create updated employee object
    const updatedEmployee: Employee = {
      ...currentEmployee,
      points,
      streak,
      rank,
      tasksCompletedThisWeek,
      levelProgress,
      currentProjectProgress,
      lastStatsUpdate: new Date().toISOString()
    };
  
    // Update employee in Firebase
    return await updateEmployee(updatedEmployee);
  }





















export type { Employee };







