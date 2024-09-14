//models\employee.ts
import { fetchTasksEmail, Task } from './task';
 export type Employee = {
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
    activeProjectStreak?: number;
    points?: number;
    improvementBonus?: number;
    rank?: string;
    levelProgress?: number;
    tasksCompletedThisWeek?: number;
    leadershipRoles?: string[]; // IDs of projects led
    collaborativeTasks?: string[]; // IDs of tasks collaborated on
    currentProjectProgress?: number;
    lastStatsUpdate?: string;
    bonus?: number; // Level-based bonus
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


// Trigger Asynchronous Stats Update
export async function triggerAsyncStatsUpdate(employeeId: string, email: string): Promise<void> {
    console.log("Starting async stats update for employee:", employeeId);
    calculateAndUpdateEmployeeStats(employeeId, email).catch(error => {
      console.error("Error in async stats update:", error);
    });
  }
  
  // Calculate Points Based on Task Attributes
  async function calculatePoints(tasks: Task[], employee: Employee): Promise<number> {
    const completedTasks = tasks.filter(task => task.status === 'done');
    let points = 0;
  
    completedTasks.forEach(task => {
      // Points based on priority
      switch (task.priority) {
        case 'low':
          points += 5;
          break;
        case 'medium':
          points += 10;
          break;
        case 'high':
          points += 20;
          break;
      }
  
      // Additional points based on complexity
      switch (task.complexity) {
        case 'simple':
          points += 0;
          break;
        case 'moderate':
          points += 5;
          break;
        case 'complex':
          points += 10;
          break;
      }
  
      // Bonus for timely completion
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const dueDate = new Date(task?.dueDate || '');
        if (completedDate <= dueDate) {
          points += 5; // Timely completion bonus
        } else {
          points -= 5; // Penalty for late completion
        }
      }
  
      // Bonus for quality
      if (task.qualityRating) {
        points += task.qualityRating; // 1 to 5 points
      }
  
      // Bonus for leadership
      if (employee.leadershipRoles && employee.leadershipRoles.includes(task?.projectId || '')) {
        points += 10; // Leadership bonus
      }
  
      // Bonus for collaboration
      if (employee.collaborativeTasks && employee.collaborativeTasks.includes(task.id)) {
        points += 5; // Collaboration bonus
      }
    });
  
    return points;
  }
  
  // Calculate Task Completion Streak and Active Project Streak
  async function calculateStreaks(tasks: Task[]): Promise<{ taskStreak: number; activeProjectStreak: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let taskStreak = 0;
    let activeProjectStreak = 0;
    let currentDate = new Date(today);
  
    // Task Completion Streak
    while (true) {
      const tasksCompletedOnDate = tasks.filter(task => 
        task.status === 'done' && 
        task.completedAt && 
        new Date(task.completedAt).toDateString() === currentDate.toDateString()
      );
  
      if (tasksCompletedOnDate.length > 0) {
        taskStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
  
    // Reset currentDate for active project streak
    currentDate = new Date(today);
  
    // Active Project Participation Streak
    while (true) {
      const activeProjectsOnDate = tasks.filter(task => 
        task.completedAt && 
        new Date(task.completedAt).toDateString() === currentDate.toDateString()
      );
  
      if (activeProjectsOnDate.length > 0) {
        activeProjectStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
  
    return { taskStreak, activeProjectStreak };
  }
  
  // Calculate Rank Based on Multiple Metrics
  function calculateRank(points: number, streak: number, tasksCompleted: number, leadershipRoles: number): string {
    if (points < 100) return 'Novice';
    if (points < 500) return 'Intermediate';
    if (points < 1000) return 'Advanced';
    if (points >= 1000 && streak >= 10 && tasksCompleted >= 50 && leadershipRoles > 0) return 'Expert';
    return 'Advanced';
  }
  
  // Calculate Improvement in Points
  async function calculateImprovement(currentPoints: number, previousPoints: number): Promise<number> {
    return currentPoints - previousPoints;
  }
  
  // Calculate Tasks Completed This Week
  async function calculateTasksCompletedThisWeek(tasks: Task[]): Promise<number> {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => 
      task.status === 'done' && 
      task.completedAt && 
      new Date(task.completedAt) >= oneWeekAgo
    ).length;
  }
  
  // Calculate Level Progress
  function calculateLevelProgress(points: number): number {
    const currentLevel = Math.floor(points / 100);
    const nextLevelPoints = (currentLevel + 1) * 100;
    return ((points % 100) / 100) * 100;
  }
  
  // Calculate Project Progress
  async function calculateProjectProgress(tasks: Task[]): Promise<number> {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  }
  
  // Define Level Thresholds and Bonuses
  const LEVEL_THRESHOLDS = [
    { level: 'Novice', points: 0, bonus: 0 },
    { level: 'Intermediate', points: 100, bonus: 50 },
    { level: 'Advanced', points: 500, bonus: 100 },
    { level: 'Expert', points: 1000, bonus: 200 },
  ];
  
  // Calculate and Update Employee Stats
  export async function calculateAndUpdateEmployeeStats(employeeId: string, email: string): Promise<Employee> {
    try {
      // Fetch current employee data
      const currentEmployee = await fetchEmployee(email);
      
      // Fetch tasks for the employee
      const tasks = await fetchTasksEmail(email, currentEmployee.role);
  
      // Calculate all stats
      const points = await calculatePoints(tasks, currentEmployee);
      const { taskStreak, activeProjectStreak } = await calculateStreaks(tasks);
      const tasksCompletedThisWeek = await calculateTasksCompletedThisWeek(tasks);
      const levelProgress = calculateLevelProgress(points);
      const currentProjectProgress = await calculateProjectProgress(tasks);
      const leadershipRoles = currentEmployee.leadershipRoles ? currentEmployee.leadershipRoles.length : 0;
      
      // Calculate improvement
      const previousPoints = currentEmployee.points || 0;
      const improvement = await calculateImprovement(points, previousPoints);
      let improvementBonus = 0;
      if (improvement > 50) improvementBonus = 20;
      else if (improvement > 20) improvementBonus = 10;
  
      // Calculate rank with multiple metrics
      const rank = calculateRank(points, taskStreak, tasksCompletedThisWeek, leadershipRoles);
  
      // Determine bonus based on level
      const levelInfo = LEVEL_THRESHOLDS.find(l => points >= l.points) || LEVEL_THRESHOLDS[0];
      const bonus = levelInfo.bonus;
  
      // Create updated employee object
      const updatedEmployee: Employee = {
        ...currentEmployee,
        points,
        streak: taskStreak,
        activeProjectStreak,
        rank,
        tasksCompletedThisWeek,
        levelProgress,
        currentProjectProgress,
        improvementBonus,
        bonus,
        lastStatsUpdate: new Date().toISOString()
      };
  
      // Update employee in the database
      return await updateEmployee(updatedEmployee);
    } catch (error) {
      console.error("Error in calculateAndUpdateEmployeeStats:", error);
      throw error;
    }
  }
  
  // Fetch Leaderboard (Top 10 Employees by Points)
  export async function fetchLeaderboard(): Promise<Employee[]> {
    const employees = await fetchEmployees();
    return employees
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10); // Top 10
  }














