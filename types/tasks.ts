// /types/task.ts
export type Task = {
    id: string;
    title: string;
    description: string;
    time: number; // in hours
    efforts: 'backend' | 'frontend' | 'backend + frontend';
    assignee: string;
    status: 'backlog' | 'todo' | 'in progress' | 'done';
    createdAt: Date;
  };
  