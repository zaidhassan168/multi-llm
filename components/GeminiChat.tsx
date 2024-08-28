'use client'

import React, { useEffect, useRef, useState, Suspense, useCallback } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, Mic, Image as ImageIcon, Trash2, Plus, Moon, Sun } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Markdown from 'react-markdown'
import { useChat } from 'ai/react'
import { useAuth } from '@/lib/hooks'
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from 'framer-motion'

type Conversation = {
  id: string
  name: string
  timestamp: number
}

function MessageSkeleton() {
  return (
    <div className="flex items-start space-x-2 animate-pulse">
      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  )
}

function ConversationSkeleton() {
  return (
    <div className="flex flex-col p-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2 mt-1" />
    </div>
  )
}

function ConversationList({ conversations, loadConversation, deleteConversation, formatTimestamp }: {
  conversations: Conversation[]
  loadConversation: (id: string) => void
  deleteConversation: (id: string) => void
  formatTimestamp: (timestamp: number) => string
}) {
  return (
    <AnimatePresence>
      {conversations.map((conv) => (
        <motion.div
          key={conv.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
        >
          <div className="flex items-center justify-between">
            <Button
              onClick={() => loadConversation(conv.id)}
              variant="ghost"
              className="w-full justify-start truncate text-xs"
            >
              {conv.name}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => deleteConversation(conv.id)}
                    variant="ghost"
                    className="hover:bg-red-100 dark:hover:bg-red-900 transition-colors duration-200"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Conversation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-gray-500 mt-1">{formatTimestamp(Number(conv.id))}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

export default function ImprovedGeminiChat() {
  const { user } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading, setMessages } = useChat({
    api: '/api/geminiChat',
    body: { email: user?.email, conversationId },
    onFinish: (message) => {
      updateConversationName(conversationId, message.content)
    },
  })

  const fetchConversations = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/conversations?email=${user.email}`)
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      const data = await response.json()
      setConversations(data)
      startNewChat()
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user, fetchConversations])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const startNewChat = useCallback(() => {
    const newId = Date.now().toString()
    setConversationId(newId)
    setMessages([])
    setConversations(prev => [{ id: newId, name: 'New Chat', timestamp: Date.now() }, ...prev])
  }, [setMessages])

  const loadConversation = useCallback(async (id: string) => {
    if (!user) return
    setConversationId(id)
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/conversations/${id}?email=${user.email}`)
      if (!response.ok) {
        throw new Error('Failed to load conversation')
      }
      const loadedMessages = await response.json()
      setMessages(loadedMessages)
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [user, setMessages])

  const deleteConversation = useCallback(async (id: string) => {
    if (!user) return
    try {
      const response = await fetch(`/api/conversations/${id}?email=${user.email}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }
      setConversations(prev => prev.filter(conv => conv.id !== id))
      if (id === conversationId) {
        setConversationId(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }, [user, conversationId, setMessages])

  const updateConversationName = useCallback((id: string | null, content: string) => {
    if (!id) return
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, name: content.slice(0, 30), timestamp: Date.now() } : conv
    ))
  }, [])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }, [handleSubmit])

  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 text-sm transition-colors duration-200`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center bg-white dark:bg-gray-800 transition-colors duration-200">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Gemini Chat</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem('messages'); location.reload() }}>
              Clear Chat
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {isLoadingMessages ? (
            <>
              <MessageSkeleton />
              <MessageSkeleton />
              <MessageSkeleton />
            </>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] ${message.role === "user" ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-800"} rounded-lg p-3 shadow-md`}>
                    {message.role === "assistant" && (
                      <div className="flex items-center mb-2">
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarImage src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" />
                          <AvatarFallback>G</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">Gemini</span>
                      </div>
                    )}
                    <Markdown
                      components={{
                        code(props) {
                          const { children, className, node } = props
                          const match = /language-(\w+)/.exec(className || '')
                          return match ? (
                            <SyntaxHighlighter
                              PreTag="div"
                              language={match[1]}
                              style={isDarkMode ? oneDark : oneLight}
                              className="rounded-md text-xs"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={`${className} bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5 text-xs`} {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {message.content}
                    </Markdown>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800 transition-colors duration-200">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach File</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach Image</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Input
              type="text"
              placeholder="Type your message..."
              className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isChatLoading}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voice Input</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button type="submit" disabled={isChatLoading} className=" text-white transition-colors duration-200">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Conversation List */}
      <div className="w-64 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 transition-colors duration-200">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200">History</h2>
          <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" onClick={startNewChat}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Start New Chat</p>
            </TooltipContent>
          </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={[...Array(5)].map((_, i) => <ConversationSkeleton key={i} />)}>
            {isLoading ? (
              [...Array(5)].map((_, i) => <ConversationSkeleton key={i} />)
            ) : (
              <ConversationList
                conversations={conversations}
                loadConversation={loadConversation}
                deleteConversation={deleteConversation}
                formatTimestamp={formatTimestamp}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}