import { Project, fetchProjects } from '@/models/project';
import { Task, fetchTasksAll } from '@/models/task';
import { Employee, fetchEmployees } from '@/models/employee';

export interface ProjectStats {
  totalProjects: number;
  projectsOnTrack: number;
  projectsOffTrack: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksTodo: number;
  tasksBacklog: number;
  averageProjectProgress: number;
  resourceUtilization: { [key: string]: number };
  projectCompletionRate: number;
  averageTasksPerProject: number;
}

export async function processProjects(): Promise<{ stats: ProjectStats, utilizationPercentage: { [key: string]: number } }> {
  try {
    const [projects, tasks, employees] = await Promise.all([
      fetchProjects(),
      fetchTasksAll(),
      fetchEmployees()
    ]);

    const stats = calculateProjectStats(projects, tasks, employees);
    const utilizationPercentage = getResourceUtilizationPercentage(stats);

    return { stats, utilizationPercentage };
  } catch (error) {
    console.error('Error processing projects:', error);
    throw error;
  }
}

export function calculateProjectStats(projects: Project[], tasks: Task[], employees: Employee[]): ProjectStats {
  const stats: ProjectStats = {
    totalProjects: projects.length,
    projectsOnTrack: 0,
    projectsOffTrack: 0,
    totalTasks: tasks.length,
    tasksCompleted: 0,
    tasksInProgress: 0,
    tasksTodo: 0,
    tasksBacklog: 0,
    averageProjectProgress: 0,
    resourceUtilization: {},
    projectCompletionRate: 0,
    averageTasksPerProject: 0,
  };

  let totalProgress = 0;
  let completedProjects = 0;

  projects.forEach(project => {
    // Project tracking
    if (project.onTrack) {
      stats.projectsOnTrack++;
    } else {
      stats.projectsOffTrack++;
    }

    // Task statistics
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const completedTasks = projectTasks.filter(task => task.status === 'done').length;
    const inProgressTasks = projectTasks.filter(task => task.status === 'inProgress').length;
    const todoTasks = projectTasks.filter(task => task.status === 'todo').length;
    const backlogTasks = projectTasks.filter(task => task.status === 'backlog').length;

    stats.tasksCompleted += completedTasks;
    stats.tasksInProgress += inProgressTasks;
    stats.tasksTodo += todoTasks;
    stats.tasksBacklog += backlogTasks;

    // Project progress
    const projectProgress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
    totalProgress += projectProgress;

    if (projectProgress === 100) {
      completedProjects++;
    }

    // Resource utilization
    if (project.manager) {
      stats.resourceUtilization[project.manager.id] = (stats.resourceUtilization[project.manager.id] || 0) + 1;
    }
    if (project.resources) {
      project.resources.forEach(resource => {
        stats.resourceUtilization[resource.id] = (stats.resourceUtilization[resource.id] || 0) + 1;
      });
    }
  });

  // Calculate averages and rates
  stats.averageProjectProgress = projects.length > 0 ? totalProgress / projects.length : 0;
  stats.projectCompletionRate = projects.length > 0 ? (completedProjects / projects.length) * 100 : 0;
  stats.averageTasksPerProject = projects.length > 0 ? stats.totalTasks / projects.length : 0;

  return stats;
}

export function getResourceUtilizationPercentage(stats: ProjectStats): { [key: string]: number } {
  const utilizationPercentage: { [key: string]: number } = {};

  for (const [resourceId, projectCount] of Object.entries(stats.resourceUtilization)) {
    utilizationPercentage[resourceId] = (projectCount / stats.totalProjects) * 100;
  }

  return utilizationPercentage;
}

export function getTopUtilizedResources(utilizationPercentage: { [key: string]: number }, count: number): { id: string; percentage: number }[] {
  return Object.entries(utilizationPercentage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([id, percentage]) => ({ id, percentage }));
}

export async function generateProjectReport(projectId: string): Promise<string> {
  try {
    const [project, tasks] = await Promise.all([
      fetchProjects().then(projects => projects.find(p => p.id === projectId)),
      fetchTasksAll().then(tasks => tasks.filter(t => t.projectId === projectId))
    ]);

    if (!project) {
      throw new Error('Project not found');
    }

    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return `
Project Report: ${project.name}

Status: ${project.onTrack ? 'On Track' : 'Off Track'}
Manager: ${project.manager?.name || 'Not Assigned'}
Current Stage: ${project.currentStage?.name || 'Not Set'}
Progress: ${progress.toFixed(2)}%

Tasks:
- Total: ${totalTasks}
- Completed: ${completedTasks}
- In Progress: ${tasks.filter(t => t.status === 'inProgress').length}
- To Do: ${tasks.filter(t => t.status === 'todo').length}
- Backlog: ${tasks.filter(t => t.status === 'backlog').length}

Resources:
${project.resources ? project.resources.map(r => `- ${r.name}`).join('\n') : 'No resources assigned'}

Description:
${'No description provided'}
    `;
  } catch (error) {
    console.error('Error generating project report:', error);
    throw error;
  }
}