import React, { useState, useEffect, useRef } from 'react'
import { Message, useAssistant } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PaperclipIcon, SendIcon, FileIcon, Trash2Icon } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FileInfo {
  file_id: string
  filename: string
  status: string
}

export default function ChatBotInterface() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [loadingFileUpload, setLoadingFileUpload] = useState(false) // Loading state for file upload
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    status,
    messages,
    input,
    submitMessage,
    handleInputChange,
    error,
  
  } = useAssistant({ 
    api: '/api/assistants/chat',
  })

  useEffect(() => {
    fetchFiles()
  }, [])

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [error, toast])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/assistants/files')
      if (!response.ok) throw new Error('Failed to fetch files')
      const filesData = await response.json()
      setFiles(filesData)
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLoadingFileUpload(true) // Start loading indicator for file upload
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/assistants/files', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('File upload failed')
        }

        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        fetchFiles() // Refresh the file list
      } catch (error) {
        console.error('Error uploading file:', error)
        toast({
          title: "Error",
          description: "File upload failed",
          variant: "destructive",
        })
      } finally {
        setLoadingFileUpload(false) // Stop loading indicator after file upload
      }
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch('/api/assistants/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })

      if (!response.ok) {
        throw new Error('File deletion failed')
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      })
      fetchFiles() // Refresh the file list
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Error",
        description: "File deletion failed",
        variant: "destructive",
      })
    }
  }

  // Handle Enter key press to send a message
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitMessage(event as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <div className="flex-grow flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 overflow-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">Files</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[300px]">
              {loadingFileUpload ? ( // Show loading indicator during file upload
                <DropdownMenuItem disabled>
                  <span className="loading loading-spinner loading-md" />
                  Uploading...
                </DropdownMenuItem>
              ) : files.length === 0 ? (
                <DropdownMenuItem disabled>No files uploaded</DropdownMenuItem>
              ) : (
                files.map((file) => (
                  <DropdownMenuItem key={file.file_id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FileIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">{file.filename}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFileDelete(file.file_id)
                      }}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="w-full sm:w-auto ">
            <Input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <span>
                  <PaperclipIcon className="mr-2 h-4 w-4" />
                  {loadingFileUpload ? 'Uploading...' : 'Upload File'}
                </span>
              </Button>
            </label>
          </div>
        </div>
        <ScrollArea className="flex-grow border rounded-md p-4 mb-4">
          {messages.map((message: Message) => (
            <div
              key={message.id}
              className={`mb-4 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <span
                className={`inline-block p-2 rounded-lg max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <Markdown
                  components={{
                    code({ children, className }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return match ? (
                        <SyntaxHighlighter
                          PreTag="div"
                          language={match[1]}
                          style={oneDark}
                          className="rounded-md text-sm"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={`${className} bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5`}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {message.content}
                </Markdown>
              </span>
            </div>
          ))}
          {status === 'in_progress' && (
            <div className="flex items-center justify-start ml-4 mt-2">
              <span className="text-gray-400 italic">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
        <form onSubmit={submitMessage} className="sticky bottom-0 bg-background pb-4">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="pr-12 resize-none"
            rows={3}
            disabled={status !== 'awaiting_message'}
          />
          <Button
            type="submit"
            className="absolute bottom-7 right-2 px-2 py-1"
            size="sm"
            disabled={status !== 'awaiting_message'}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
