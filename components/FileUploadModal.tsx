import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { UploadIcon, FileTextIcon, XIcon, LoaderIcon } from 'lucide-react'
import { Project, fetchProjects } from '@/models/project'  // Make sure to create this type
import  { EmployeeSummary } from '@/models/summaries'

export function FileUploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const { user } = useAuth()
  const { toast } = useToast()
  const [reporter, setReporter] = useState<EmployeeSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProjects().then(setProjects).catch(console.error)
  }, [])

  const handleSubmit = async () => {
    if (!text && !file) {
      toast({
        title: "Error",
        description: "Please provide either text or a file to upload.",
        variant: "destructive",
      })
      return
    }
  
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project.",
        variant: "destructive",
      })
      return
    }
  
    let content = text
  
    if (file) {
      content = await readFileContent(file)
    }
  
    try {
      setLoading(true)  // Start loading
      const formData = new FormData()
      if (user?.email) {
        formData.append('email', user.email)
      }
      formData.append('message', content)
      formData.append('projectId', selectedProjectId)
      
      // Append reporter information to formData
      if (reporter) {
        formData.append('reporter', JSON.stringify(reporter))
      }
  
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        body: formData,
      })
  
      if (!response.ok) {
        throw new Error('Failed to generate tasks')
      }
  
      const result = await response.json()
      if (result.success) {
        console.log('Tasks generated and saved:', result.tasks)
        toast({
          title: "Success",
          description: `${result?.tasksLength} tasks generated and saved.`,
        })
        // Clear the form inputs after success
        clearForm()
        onClose()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error uploading file or sending message:', error)
      toast({
        title: "Error",
        description: "Failed to generate tasks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)  // Stop loading
    }
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    const project = projects.find(p => p.id === projectId)
    // Set the reporter from the selected project
    setReporter(project?.manager || null)
    console.log('Reporter:', project?.manager)
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target?.result as string)
      reader.onerror = (error) => reject(error)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Tasks</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-select">Select Project</Label>
            <Select onValueChange={handleProjectChange} value={selectedProjectId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="text-input">Paste text</Label>
            <Textarea
              id="text-input"
              placeholder="Paste your tasks here, one per line..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-32 resize-none"
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file-input">Or upload a file</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-input"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                disabled={loading}
              />
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                {file ? (
                  <>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    {file.name}
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Choose file
                  </>
                )}
              </Button>
              {file && (
                <Button
                  onClick={() => setFile(null)}
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  disabled={loading}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600" disabled={loading}>
            {loading ? (
              <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadIcon className="mr-2 h-4 w-4" />
            )}
            {loading ? "Uploading..." : "Upload and Generate Tasks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
