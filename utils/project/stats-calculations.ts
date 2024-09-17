import { Project, fetchProjects } from '@/models/project';
import { EmployeeSummary } from '@/models/summaries';
export interface ProjectStats {
  totalProjects: number;
  projectsOnTrack: number;
  projectsOffTrack: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksIncomplete: number;
  tasksOverdue: number;
  tasksOnTrack: number;
  totalTaskHours: number;
  taskHoursCompleted: number;
  averageProjectProgress: number;
  resourceUtilization: { [key: string]: number };
}

export function calculateProjectStats(projects: Project[]): ProjectStats {
  const stats: ProjectStats = {
    totalProjects: projects.length,
    projectsOnTrack: 0,
    projectsOffTrack: 0,
    totalTasks: 0,
    tasksCompleted: 0,
    tasksIncomplete: 0,
    tasksOverdue: 0,
    tasksOnTrack: 0,
    totalTaskHours: 0,
    taskHoursCompleted: 0,
    averageProjectProgress: 0,
    resourceUtilization: {},
  };

  let totalProgress = 0;

  projects.forEach(project => {
    // Project tracking
    if (project.onTrack) {
      stats.projectsOnTrack++;
    } else {
      stats.projectsOffTrack++;
    }

    // Task statistics
    stats.totalTasks += project.totalTasks ?? 0;
    stats.tasksCompleted += project.totalTasksCompleted ?? 0;
    stats.tasksIncomplete += project.totalTasksIncomplete ?? 0;
    stats.tasksOverdue += project.totalTasksOverdue ?? 0;
    stats.tasksOnTrack += project.totalTasksOnTrack ?? 0;
    stats.totalTaskHours += project.totalTasksHours ?? 0;
    stats.taskHoursCompleted += project.tasksHoursCompleted ?? 0;

    // Project progress
    totalProgress += project.progress ?? 0;

    // Resource utilization
    if (project.resources) {
      project.resources.forEach(resource => {
        stats.resourceUtilization[resource.id] = (stats.resourceUtilization[resource.id] || 0) + 1;
      });
    }

    // Include project manager in resource utilization
    stats.resourceUtilization[project.manager.id] = (stats.resourceUtilization[project.manager.id] || 0) + 1;
  });

  // Calculate average project progress
  stats.averageProjectProgress = projects.length > 0 ? totalProgress / projects.length : 0;

  return stats;
}

export function getResourceUtilizationPercentage(stats: ProjectStats): { [key: string]: number } {
  const utilizationPercentage: { [key: string]: number } = {};
  
  for (const [resourceId, projectCount] of Object.entries(stats.resourceUtilization)) {
    utilizationPercentage[resourceId] = (projectCount / stats.totalProjects) * 100;
  }

  return utilizationPercentage;
}

export async function processProjects(): Promise<{stats: ProjectStats, utilizationPercentage: { [key: string]: number }}> {
  try {
    const projects = await fetchProjects();
    const stats = calculateProjectStats(projects);
    const utilizationPercentage = getResourceUtilizationPercentage(stats);

    return { stats, utilizationPercentage };
  } catch (error) {
    console.error('Error processing projects:', error);
    throw error;
  }
}

// Helper function to get top N utilized resources
export function getTopUtilizedResources(utilizationPercentage: { [key: string]: number }, n: number): { id: string; percentage: number }[] {
  return Object.entries(utilizationPercentage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([id, percentage]) => ({ id, percentage }));
}

// Example usage
export async function generateProjectReport(): Promise<void> {
  try {
    const { stats, utilizationPercentage } = await processProjects();
    const topUtilizedResources = getTopUtilizedResources(utilizationPercentage, 5);

    console.log('Project Statistics:', stats);
    console.log('Resource Utilization Percentage:', utilizationPercentage);
    console.log('Top 5 Utilized Resources:', topUtilizedResources);

    // You can now use these statistics to update your UI or perform further analysis
  } catch (error) {
    console.error('Error generating project report:', error);
  }
}