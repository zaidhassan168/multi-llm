'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, MessageSquare, Send, Loader2, Plus } from "lucide-react"
import { useAuth } from '@/lib/hooks'
import { useChat } from 'ai/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type Conversation = {
  id: string
  name: string
}

function ConversationSkeleton() {
  return (
    <div className="flex flex-col p-2 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2 mt-1" />
    </div>
  )
}

export default function ImprovedMultiModelChat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('gemini')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
    setMessages
  } = useChat({
    api: '/api/multi-model-chat',
    body: {
      email: user?.email,
      conversationId: selectedConversation,
      selectedModel,
    },
    onFinish: (message) => {
      updateConversationName(selectedConversation, message.content);
      setIsSending(false);

      // Ensure that the new message has the model data
      if (message.data && typeof message.data === 'object' && 'model' in message.data) {
        console.log('Model found in message:', message.data.model);
      } else {
        console.warn('Model not found in message:', message);
      }

      // Trigger a re-render if needed
      setMessages(prevMessages => [...prevMessages]);
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
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const deleteConversation = async (id: string) => {
    if (!user) return
    try {
      const response = await fetch(`/api/conversations/${id}?email=${user.email}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }
      setConversations(prev => prev.filter(conv => conv.id !== id))
      if (id === selectedConversation) {
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const loadConversation = async (id: string) => {
    if (!user) return
    setSelectedConversation(id)
    try {
      const response = await fetch(`/api/conversations/${id}?email=${user.email}`)
      if (!response.ok) {
        throw new Error('Failed to load conversation')
      }
      const loadedMessages = await response.json()
      setMessages(loadedMessages)
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const updateConversationName = useCallback((id: string | null, content: string) => {
    if (!id) return
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, name: content.slice(0, 30), timestamp: Date.now() } : conv
    ))
  }, [])

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  }

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }, [handleSubmit])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSending(true)
    handleSubmit(e)
  }

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel)
  }

  const startNewConversation = () => {
    const newId = Date.now().toString()
    setSelectedConversation(newId)
    setMessages([])
    setConversations(prev => [{ id: newId, name: 'New Conversation' }, ...prev])
  }
  const modelImageMap: Record<string, string> = {
    'gemini-1.5-flash': "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    'gpt-4o': "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    // Add more models and their corresponding image URLs here
  };
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Chat History</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={startNewConversation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start New Conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ScrollArea className="flex-grow">
          <AnimatePresence>
            {isLoading ? (
              [...Array(5)].map((_, i) => <ConversationSkeleton key={i} />)
            ) : (
              conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="m-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                    <CardHeader className="p-4">
                      <CardTitle className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          className="text-left w-full"
                          onClick={() => loadConversation(conv.id)}
                        >
                          <MessageSquare className="w-5 h-5 mr-2" />
                          <span className="truncate">{conv.name}</span>
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteConversation(conv.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Conversation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatTimestamp(Number(conv.id))}</p>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {selectedConversation ? 'Conversation' : 'Select a Conversation'}
          </h2>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">
                <div className="flex items-center">
                  <Avatar className="w-6 h-6 mr-2">
                    <AvatarImage src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" />
                    <AvatarFallback>G</AvatarFallback>
                  </Avatar>
                  Gemini
                </div>
              </SelectItem>
              <SelectItem value="chatgpt">
                <div className="flex items-center">
                  <Avatar className="w-6 h-6 mr-2">
                    <AvatarImage src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="ChatGPT" />
                    <AvatarFallback>C</AvatarFallback>
                  </Avatar>
                  ChatGPT
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="flex-grow p-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div className={`inline-block p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'} shadow-lg max-w-[70%]`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center mb-2">
                      <Avatar className="w-6 h-6 mr-2">

                        <AvatarImage
                          src={message.data && typeof message.data === 'object' && 'model' in message.data
                            ? modelImageMap[(message.data as any).model] || "/placeholder.svg"
                            : "/placeholder.svg"}
                          alt={(message.data && typeof message.data === 'object' && 'model' in message.data)
                            ? (message.data as any).model
                            : 'AI'}
                        />

                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">
                        {message.data && typeof message.data === 'object' && 'model' in message.data
                          ? (message.data as any).model.charAt(0).toUpperCase() + (message.data as any).model.slice(1)
                          : 'AI'}
                      </span>
                    </div>
                  )}
                  {message.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </ScrollArea>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
          <form onSubmit={onSubmit} className="flex space-x-2">
            <input
              className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={!selectedConversation || isSending}
            />
            <Button type="submit" disabled={!selectedConversation || isSending} className="text-white transition-colors duration-200">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}