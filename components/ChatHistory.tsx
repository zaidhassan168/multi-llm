'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, MessageSquare, Send } from "lucide-react";
import { useAuth } from '@/lib/hooks';
import { useChat } from 'ai/react';
import { readStreamableValue } from 'ai/rsc';
import { continueConversation } from '@/app/actions';

type Conversation = {
  id: string;
  name: string;
  timestamp: number;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function ConversationSkeleton() {
  return (
    <div className="flex flex-col p-2">
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
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);

  const { messages, handleSubmit: handleGeminiSubmit, setMessages } = useChat({
    api: '/api/geminiChat',
    body: { email: user?.email, conversationId: selectedConversation },
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
        setConversation([]);
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
      setConversation(loadedMessages);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

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

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: input };
    setConversation(prev => [...prev, userMessage]);
    setInput('');

    try {
      if (selectedModel === 'gemini') {
        // Modify this part to correctly use handleGeminiSubmit
        await handleGeminiSubmit();
      } else if (selectedModel === 'chatgpt') {
        const { messages, newMessage } = await continueConversation([
          ...conversation,
          userMessage,
        ]);

        let textContent = '';

        for await (const delta of readStreamableValue(newMessage)) {
          textContent = `${textContent}${delta}`;
          setConversation([
            ...messages,
            { role: 'assistant', content: textContent } as Message,
          ]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {selectedConversation ? 'Conversation' : 'Select a Conversation'}
          </h2>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
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
          {(selectedModel === 'gemini' ? messages : conversation).map((message, index) => (
            <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-2">
            <input
              className="flex-1 p-2 border rounded-md dark:bg-gray-800 dark:text-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
            />
            <Button type="submit" disabled={!selectedConversation || isLoading}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}