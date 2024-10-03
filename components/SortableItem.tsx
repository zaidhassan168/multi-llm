// import React from 'react'
// import { Draggable } from '@hello-pangea/dnd'
// import { Task } from '@/types/tasks'

// type SortableItemProps = {
//   task: Task
//   index: number
//   onClick: () => void
// }

// export function SortableItem({ task, index, onClick }: SortableItemProps) {
//   return (
//     <Draggable draggableId={task.id} index={index}>
//       {(provided: { draggableProps: React.JSX.IntrinsicAttributes & React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement>; innerRef: React.LegacyRef<HTMLDivElement> | undefined; dragHandleProps: React.JSX.IntrinsicAttributes & React.ClassAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLDivElement> }, snapshot: { isDragging: any }) => {
//         const style = {
//           ...provided.draggableProps.style,
//           transform: snapshot.isDragging ? provided.draggableProps.style?.transform : 'none',
//           transition: snapshot.isDragging ? 'transform 0.2s ease' : 'none',
//         }

//         return (
//           <div
//             ref={provided.innerRef}
//             {...provided.draggableProps}
//             {...provided.dragHandleProps}
//             style={style}
//             className="bg-white p-3 rounded-lg shadow-sm mb-4 cursor-pointer"
//             onClick={onClick}
//           >
//             <h3 className="text-sm font-semibold mb-1">{task.title}</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
//             <div className="mt-2 text-xs text-gray-500">
//               <p>Time: {task.time}h</p>
//               <p>Efforts: {task.efforts}</p>
//               <p>Assignee: {task.assignee}</p>
//             </div>
//           </div>
//         )
//       }}
//     </Draggable>
//   )
// }
