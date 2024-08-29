import React, { useState } from 'react'
import { Dialog, DialogOverlay, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/hooks'
export function FileUploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
const { user } = useAuth()
  const handleSubmit = async () => {
    if (!text && !file) return

    let content = text

    if (file) {
      content = await readFileContent(file)
    }

    try {
      const formData = new FormData()
      if (user?.email) {
        formData.append('email', user.email)
      }
      formData.append('message', content)

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
      } else {
        console.error('Failed to generate tasks:', result.error)
      }
    } catch (error) {
      console.error('Error uploading file or sending message:', error)
    }

    onClose()
  }
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target?.result as string)
      reader.onerror = (error) => reject(error)
      reader.readAsText(file)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent aria-label="File Upload Modal" className="bg-white p-6 rounded-lg">
        <h2 className="text-lg font-bold">Upload a file or paste text</h2>
        <textarea
          className="w-full h-32 p-2 mt-4 border rounded-lg"
          placeholder="Paste text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-4">
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="mt-4 flex justify-end space-x-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-blue-500 text-white">Submit</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
