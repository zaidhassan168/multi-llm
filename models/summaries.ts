type TaskSummary = {
    id: string;
    title: string;
    status: 'backlog' | 'todo' | 'inProgress' | 'done';
    assignee: string;
    time?: string;
  };
  
  type EmployeeSummary = {
    id: string;
    name: string;
    email: string;
    role: 'developer' | 'management' | 'projectManager' | 'undefined';
    tasksCount?: number;  // Optionally store how many tasks this employee is handling
  };
  type StageSummary = {
    id: string;
    name: string;
    progress?: number; // Pre-calculated progress for this stage
    tasks?: TaskSummary[]  // The employee responsible for the stage
  };
  
  export type { TaskSummary, EmployeeSummary, StageSummary };