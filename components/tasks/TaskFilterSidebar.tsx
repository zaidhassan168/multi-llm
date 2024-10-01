import React, { use, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRightIcon, XIcon, CalendarIcon } from 'lucide-react'
import { priorityIcons, taskTypeIcons } from '@/lib/icons/icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { fetchProjects,Project } from '@/models/project'
type Priority = 'low' | 'medium' | 'high' | 'urgent' | 'critical' | 'all' | null
type TaskType = 'bug' | 'feature' | 'documentation' | 'task' | 'changeRequest' | 'other' | 'all' | null

type FilterProps = {
  isOpen: boolean
  onToggle: () => void
  onFilterChange: (filters: Partial<FilterState>) => void
  projectIds: string[]
  employees: string[] 
}

type FilterState = {
  assignee: string | null
  project: string | null
  priority: Priority
  type: TaskType
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  } | null
}

export default function TaskFilterSidebar({ isOpen, onToggle, onFilterChange, projectIds, employees }: FilterProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [filters, setFilters] = useState<FilterState>({
    assignee: null,
    project: null,
    priority: 'all',
    type: 'all',
    dateRange: null,
  })
  const memoizedFetchProjects = React.useMemo(() => fetchProjects, [])

  useEffect(() => {
    memoizedFetchProjects().then((projects) => {
      setProjects(projects)
    })
  }, [memoizedFetchProjects])
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange({ [key]: value })
  }

  const resetFilters = () => {
    const resetFilters: FilterState = {
      assignee: null,
      project: null,
      priority: 'all',
      type: 'all',
      dateRange: null,
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <div className={`fixed right-0 top-0 h-full bg-background shadow-lg transition-all duration-300 ${isOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
      <Button variant="ghost" className="absolute -left-8 top-4" onClick={onToggle}>
        <ChevronRightIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>
      <ScrollArea className="h-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Filters</h3>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <XIcon className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        <div className="space-y-6">
          <FilterSection title="Assignee" value={filters.assignee}>
            <Select
              value={filters.assignee || 'no name'}
              onValueChange={(value) => handleFilterChange('assignee', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {employees.map((employee) => (
                <SelectItem key={employee} value={employee || 'unNamed'}>
                    {employee}


                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="Project" value={filters.project}>
            <Select
              value={filters.project || ''}
              onValueChange={(value) => handleFilterChange('project', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {projectIds.map((projectId) => (
                  <SelectItem key={projectId} value={projectId}>
                    {projects.find(p => p.id === projectId)?.name || projectId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="Priority" value={filters.priority}>
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => handleFilterChange('priority', value as Priority)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(priorityIcons).map(([priority, { icon: Icon, color }]) => (
                  <SelectItem key={priority} value={priority}>
                    <div className="flex items-center">
                      <Icon className={`h-4 w-4 mr-2 ${color}`} />
                      <span className="capitalize">{priority}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="Type" value={filters.type}>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value as TaskType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(taskTypeIcons).map(([type, { icon: Icon, color }]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center">
                      <Icon className={`h-4 w-4 mr-2 ${color}`} />
                      <span className="capitalize">{type}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="Date Range" value={filters.dateRange}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange?.from}
                  selected={filters.dateRange || undefined}
                  onSelect={(value) => handleFilterChange('dateRange', value)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </FilterSection>
        </div>
      </ScrollArea>
    </div>
  )
}

function FilterSection({ title, children, value }: { title: string; children: React.ReactNode; value: any }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label className="text-sm font-medium">{title}</Label>
        {value && value !== 'all' && (
          <Badge variant="secondary" className="text-xs">
            1
          </Badge>
        )}
      </div>
      {children}
    </div>
  )
}