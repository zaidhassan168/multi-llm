import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { UploadIcon, FileTextIcon, XIcon, Loader2Icon } from 'lucide-react'
import { Project, fetchProjects } from '@/models/project'
import { EmployeeSummary } from '@/models/summaries'

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose }) => {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const { user } = useAuth()
  const { toast } = useToast()
  const [reporter, setReporter] = useState<EmployeeSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(error => {
        console.error('Failed to fetch projects:', error)
        toast({
          title: 'Error',
          description: 'Failed to load projects.',
          variant: 'destructive'
        })
      })
  }, [toast])

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    const project = projects.find(p => p.id === projectId)
    setReporter(project?.manager || null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!text && !file) {
      toast({
        title: 'Error',
        description: 'Please provide either text or a file to upload.',
        variant: 'destructive'
      })
      return
    }

    if (!selectedProjectId) {
      toast({
        title: 'Error',
        description: 'Please select a project.',
        variant: 'destructive'
      })
      return
    }

    let content = text

    if (file) {
      try {
        content = await readFileContent(file)
      } catch (error) {
        console.error('Error reading file:', error)
        toast({
          title: 'Error',
          description: 'Failed to read the uploaded file.',
          variant: 'destructive'
        })
        return
      }
    }

    try {
      setLoading(true)

      const formData = new FormData()
      if (user?.email) formData.append('email', user.email)
      formData.append('message', content)
      formData.append('projectId', selectedProjectId)
      if (reporter) formData.append('reporter', JSON.stringify(reporter))

      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate tasks')
      }

      toast({
        title: 'Success',
        description: `${result.tasksLength} tasks generated and saved.`,
      })

      clearForm()
      onClose()
    } catch (error) {
      console.error('Error uploading file or sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate tasks. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const clearForm = () => {
    setText('')
    setFile(null)
    setSelectedProjectId('')
    setReporter(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upload Tasks</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="project-select" className="text-lg font-semibold mb-2 block">Select Project</Label>
              <Select
                onValueChange={handleProjectChange}
                value={selectedProjectId}
                disabled={loading}
              >
                <SelectTrigger id="project-select" className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file-input" className="text-lg font-semibold mb-2 block">Upload a File</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="file-input"
                  type="file"
                  aria-label='Upload a file'
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="flex items-center w-full justify-center py-6"
                  disabled={loading}
                >
                  {file ? (
                    <>
                      <FileTextIcon className="mr-2 h-5 w-5" />
                      {file.name}
                    </>
                  ) : (
                    <>
                      <UploadIcon className="mr-2 h-5 w-5" />
                      Choose File
                    </>
                  )}
                </Button>
                {file && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    disabled={loading}
                  >
                    <XIcon className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="text-input" className="text-lg font-semibold mb-2 block">Paste Text</Label>
            <Textarea
              id="text-input"
              placeholder="Paste your tasks here, one per line..."
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={loading}
              className="h-64 resize-none"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto mt-2 sm:mt-0"
          >
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 h-5 w-5" />
                Upload and Generate Tasks
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}