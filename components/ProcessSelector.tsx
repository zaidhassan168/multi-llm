import React, { useEffect, useState } from 'react'
import { Stage } from '@/models/project'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Check } from "lucide-react"
import { fetchStages } from '@/models/stage'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"  // Assuming you have a Tooltip component

type ProcessSelectorProps = {
  previousProcesses?: Stage[]
  onProcessesSelected: (processes: Stage[]) => void
}

const processGroups = [
  { name: 'Initiating', color: 'text-red-700' },
  { name: 'Planning', color: 'text-blue-700' },
  { name: 'Executing', color: 'text-green-700' },
  { name: 'Monitoring and Controlling', color: 'text-yellow-700' },
  { name: 'Closing', color: 'text-purple-700' },
]

export function ProcessSelector({ onProcessesSelected, previousProcesses }: ProcessSelectorProps) {
  const [stages, setStages] = useState<Stage[]>([])
  // set the previous processes
  const [selectedProcesses, setSelectedProcesses] = useState<Stage[]>(previousProcesses || [])
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

  const handleSave = () => {
    onProcessesSelected(selectedProcesses)
  }

  const getProcessColor = (index: number) => {
    const colors = [
      'bg-red-100 text-red-800 hover:bg-red-200',
      'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'bg-green-100 text-green-800 hover:bg-green-200',
      'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
    ]
    return colors[index % colors.length]
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

        {/* Display selected processes */}
        <div className="min-h-[100px] p-4 bg-secondary/20 rounded-lg border-2 border-dashed border-secondary">
          <AnimatePresence>
            {selectedProcesses.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-center"
              >
                No processes selected. Click 'Select Processes' to add.
              </motion.p>
            ) : (
              <motion.div className="flex flex-wrap gap-2" layout>
                {selectedProcesses.map((process, index) => (
                  <Tooltip key={process.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge className={`${getProcessColor(index)} px-3 py-1 text-xs font-semibold rounded-full truncate`}>
                          <span className="truncate max-w-[150px]">{process.name}</span>
                          <button
                            onClick={() => handleRemoveProcess(process.id)}
                            className="ml-2 hover:bg-white/20 rounded-full p-1"
                            aria-label={`Remove ${process.name}`}
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{process.processGroup}</p> {/* Display the process group in the tooltip */}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dialog for selecting processes */}
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
              <div className="grid grid-cols-5 gap-4">
                {processGroups.map((group, groupIndex) => (
                  <div key={group.name} className="space-y-2">
                    <h3 className={`font-bold text-center ${group.color}`}>{group.name}</h3>
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
                            <Badge
                              className={`w-full py-2 px-3 flex items-center justify-between cursor-pointer transition-colors duration-200 truncate ${
                                getProcessColor(index)
                              } ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                              onClick={() => handleProcessToggle(process)}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-semibold truncate max-w-[150px]" title={process.name}>
                                  {process.name}
                                </span>
                                <span className="text-xs opacity-70">{process.completionTime} days</span>
                              </div>
                              {isSelected && <Check size={16} className="flex-shrink-0" />}
                            </Badge>
                          </motion.div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">No processes available</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Button onClick={handleSave} className="w-full">Save Selected Processes</Button>
      </div>
    </TooltipProvider>
  )
}
