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
import { PaperclipIcon, SendIcon, FileIcon, Trash2Icon, SunIcon, MoonIcon, ChevronDownIcon } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface FileInfo {
  file_id: string
  filename: string
  status: string
}

export default function ChatBotInterface() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [loadingFileUpload, setLoadingFileUpload] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

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
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) setTheme(savedTheme)
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

  useEffect(() => {
    const handleScroll = () => {
      if (scrollAreaRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
        setShowScrollButton(scrollHeight - scrollTop > clientHeight + 100)
      }
    }

    scrollAreaRef.current?.addEventListener('scroll', handleScroll)
    return () => scrollAreaRef.current?.removeEventListener('scroll', handleScroll)
  }, [])

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
      setLoadingFileUpload(true)
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/assistants/files', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          console.log('Error uploading file:', response)
          throw new Error('File upload failed')
        }

        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
        fetchFiles()
      } catch (error) {
        console.error('Error uploading file:', error)
        toast({
          title: "Error",
          description: "File upload failed",
          variant: "destructive",
        })
      } finally {
        setLoadingFileUpload(false)
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
      fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Error",
        description: "File deletion failed",
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitMessage(event as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', newTheme)
      return newTheme
    })
  }

  return (
    <div className={`flex flex-col h-screen w-full bg-background transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex-grow flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="flex justify-between items-center py-4 gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Files
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[300px]">
              {loadingFileUpload ? (
                <DropdownMenuItem disabled>
                  <span className="loading loading-spinner loading-md mr-2" />
                  Uploading...
                </DropdownMenuItem>
              ) : files.length === 0 ? (
                <DropdownMenuItem disabled>No files uploaded</DropdownMenuItem>
              ) : (
                files.map((file) => (
                  <DropdownMenuItem key={file.file_id} className="flex items-center p-0">
                    <div className="flex-grow min-w-0 pr-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                      <div className="flex items-center p-2">
                        <FileIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{file.filename}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFileDelete(file.file_id)
                      }}
                      className="flex-shrink-0 mr-2"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" onClick={toggleTheme} size="icon">
              {theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-grow border rounded-md p-4 mb-4 relative" ref={scrollAreaRef}>
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
                    ? 'bg-muted'
                    : ''
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
                          style={theme === 'dark' ? oneDark : oneLight}
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
              <span className="loading loading-dots loading-sm ml-2"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
        {showScrollButton && (
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-20 right-6 rounded-full"
            onClick={scrollToBottom}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        )}
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