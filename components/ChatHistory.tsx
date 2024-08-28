import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, MessageSquare, Send, Loader2 } from "lucide-react";
import { useAuth } from '@/lib/hooks';
import { useChat } from 'ai/react';

type Conversation = {
  id: string;
  name: string;
  timestamp: number;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
};

function ConversationSkeleton() {
  return (
    <div className="flex flex-col p-2 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2 mt-1" />
    </div>
  );
}

export default function EnhancedChatHistoryComponent() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini');
  const [isSending, setIsSending] = useState(false);

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
    },
  });

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations?email=${user.email}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const deleteConversation = async (id: string) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/conversations/${id}?email=${user.email}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (id === selectedConversation) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const loadConversation = async (id: string) => {
    if (!user) return;
    setSelectedConversation(id);
    try {
      const response = await fetch(`/api/conversations/${id}?email=${user.email}`);
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      const loadedMessages = await response.json();
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const updateConversationName = useCallback((id: string | null, content: string) => {
    if (!id) return;
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, name: content.slice(0, 30), timestamp: Date.now() } : conv
    ));
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    handleSubmit(e).finally(() => setIsSending(false));
  };
  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
  };
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Chat History</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-4 space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => <ConversationSkeleton key={i} />)
            ) : (
              conversations.map((conv) => (
                <Card key={conv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <CardHeader className="p-4">
                    <CardTitle className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        className="text-left w-full"
                        onClick={() => loadConversation(conv.id)}
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        {conv.name}
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatTimestamp(conv.timestamp)}</p>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {selectedConversation ? 'Conversation' : 'Select a Conversation'}
          </h2>
          <Select value={selectedModel} onValueChange={handleModelChange} >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="chatgpt">ChatGPT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="flex-1 p-4">
          {messages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'} shadow-lg`}>
                {message.content}
                {message.role === 'assistant' && (
                  <p className="mt-1 text-xs text-gray-500">{message.model}</p>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900 z-10">
          <form onSubmit={onSubmit} className="flex space-x-2">
            <input
              className="flex-1 p-2 border rounded-md dark:bg-gray-800 dark:text-white"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
            />
            <Button type="submit" disabled={!selectedConversation || isSending}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}