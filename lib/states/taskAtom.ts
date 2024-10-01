// import { atom, useAtom } from 'jotai'
// import { useEffect } from 'react'
// import { collection, onSnapshot, query } from "firebase/firestore"
// import { db } from "@/firebase"
// import { Task } from '@/models/task'

// const tasksAtom = atom<Task[]>([])
// const isLoadingAtom = atom(true)

// export function useTasks() {
//   const [tasks, setTasks] = useAtom(tasksAtom)
//   const [isLoading, setIsLoading] = useAtom(isLoadingAtom)

//   useEffect(() => {
//     const q = query(collection(db, "tasks"))
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const updatedTasks: Task[] = []
//       snapshot.docChanges().forEach((change) => {
//         const updatedTask = { ...change.doc.data(), id: change.doc.id } as Task
//         if (change.type === "added" || change.type === "modified") {
//           updatedTasks.push(updatedTask)
//         }
//       })
//       setTasks((prevTasks) => {
//         const newTasks = [...prevTasks]
//         updatedTasks.forEach((updatedTask) => {
//           const index = newTasks.findIndex(task => task.id === updatedTask.id)
//           if (index !== -1) {
//             newTasks[index] = updatedTask
//           } else {
//             newTasks.push(updatedTask)
//           }
//         })
//         return newTasks.filter(task => !snapshot.docChanges().some(change => 
//           change.type === "removed" && change.doc.id === task.id
//         ))
//       })
//       setIsLoading(false)
//     })
//     return () => unsubscribe()
//   }, [setTasks, setIsLoading])

//   return { tasks, isLoading }
// }