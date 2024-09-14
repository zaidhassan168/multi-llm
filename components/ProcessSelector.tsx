"use client"

import React, { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { Stage } from '@/models/project'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Check } from "lucide-react"
import { fetchStages } from '@/models/stage'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { selectedProcessesAtom } from '@/lib/states/stageAtom'

const processGroups = [
  { name: 'Initiating', color: 'text-red-700', bgColor: 'bg-red-100', mutedColor: 'bg-red-200' },
  { name: 'Planning', color: 'text-blue-700', bgColor: 'bg-blue-100', mutedColor: 'bg-blue-200' },
  { name: 'Executing', color: 'text-green-700', bgColor: 'bg-green-100', mutedColor: 'bg-green-200' },
  { name: 'Monitoring and Controlling', color: 'text-yellow-700', bgColor: 'bg-yellow-100', mutedColor: 'bg-yellow-200' },
  { name: 'Closing', color: 'text-purple-700', bgColor: 'bg-purple-100', mutedColor: 'bg-purple-200' },
]

export function ProcessSelector() {
  const [stages, setStages] = useState<Stage[]>([])
  const [selectedProcesses, setSelectedProcesses] = useAtom(selectedProcessesAtom)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStages = async () => {
      try {
        const fetchedStages = await fetchStages()
        setStages(fetchedStages)
      } catch (error) {
        console.error('Error fetching stages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStages()
  }, [])

  const handleProcessToggle = (process: Stage) => {
    setSelectedProcesses(prev => {
      const isSelected = prev.some(p => p.id === process.id)
      if (isSelected) {
        return prev.filter(p => p.id !== process.id)
      } else {
        return [...prev, process]
      }
    })
  }

  const handleRemoveProcess = (processId: string) => {
    setSelectedProcesses(prev => prev.filter(p => p.id !== processId))
  }

  const groupByProcessGroup = (stages: Stage[]) => {
    return processGroups.reduce((acc: Record<string, Stage[]>, group) => {
      acc[group.name] = stages.filter(stage => stage.processGroup === group.name)
      return acc
    }, {})
  }

  const groupedStages = groupByProcessGroup(stages)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Project Processes</h2>

        <div className="min-h-[100px] p-4 bg-secondary/20 rounded-lg border-2 border-dashed border-secondary">
          <AnimatePresence>
            {selectedProcesses.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-center"
              >
                No processes selected. Click Select Processes to add.
              </motion.p>
            ) : (
              <motion.div className="flex flex-wrap gap-2" layout>
                {selectedProcesses.map((process) => (
                  <Tooltip key={process.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-50 rounded-md p-2 flex items-center justify-between"
                      >
                        <span className="text-xs">{process.name}</span>
                        <button
                          onClick={() => handleRemoveProcess(process.id)}
                          className="ml-2 hover:bg-gray-200 rounded-full p-1"
                          aria-label={`Remove ${process.name}`}
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{process.processGroup}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Select Processes
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] sm:h-[600px]">
            <DialogHeader>
              <DialogTitle>Select Project Processes by Group</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {processGroups.map((group) => (
                  <div key={group.name} className="space-y-2">
                    <div className={`${group.bgColor} rounded-t-lg p-2`}>
                      <h3 className={`font-bold text-center ${group.color} text-sm`}>{group.name}</h3>
                    </div>
                    <div className="space-y-2 bg-gray-50 p-2 rounded-b-lg">
                      {groupedStages[group.name] && groupedStages[group.name].length > 0 ? (
                        groupedStages[group.name].map((process, index) => {
                          const isSelected = selectedProcesses.some(p => p.id === process.id)
                          return (
                            <motion.div
                              key={process.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div
                                className={`w-full py-2 px-3 rounded-md cursor-pointer transition-colors duration-200 ${
                                  isSelected ? group.mutedColor : 'bg-white'
                                }`}
                                onClick={() => handleProcessToggle(process)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium break-words" title={process.name}>
                                    {process.name}
                                  </span>
                                  {isSelected && <Check size={14} className="flex-shrink-0 ml-2" />}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground">No processes available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}