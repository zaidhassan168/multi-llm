import { atom } from 'jotai'
import { Task } from '@/models/task'

export const isModalOpenAtom = atom(false)
export const selectedTaskAtom = atom<Task | null>(null)