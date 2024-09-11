import { atom } from 'jotai'
import { Stage } from '@/models/project'

export const selectedProcessesAtom = atom<Stage[]>([])