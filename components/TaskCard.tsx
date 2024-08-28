// /app/(your-taskcard).tsx
import { useState } from 'react';
import { Task } from '@/types/task';
import { Modal, Button } from 'shadcn/ui';

export default function TaskCard({ task }: { task: Task }) {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="bg-white p-3 rounded-lg shadow-sm mb-4"
      >
        <h3 className="text-sm font-semibold mb-1">{task.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {task.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {task.time} hours | {task.efforts} | {task.assignee}
        </p>
      </div>
      <Modal open={isModalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-4">
          <h2 className="text-xl font-semibold">{task.title}</h2>
          <p className="mt-2">{task.description}</p>
          <p className="mt-2">Time: {task.time} hours</p>
          <p className="mt-2">Efforts: {task.efforts}</p>
          <p className="mt-2">Assignee: {task.assignee}</p>
        </div>
        <Button onClick={() => setModalOpen(false)}>Close</Button>
      </Modal>
    </>
  );
}
