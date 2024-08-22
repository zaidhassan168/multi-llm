'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Mic, Image as ImageIcon, Trash2, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Markdown from 'react-markdown';
import { useChat } from 'ai/react';
import { useAuth } from '@/lib/hooks';

type Conversation = {
  id: string;
  name: string;
};

export default function Component() {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/geminiChat',
    body: { email: user?.email, conversationId },
    onFinish: (message) => {
      updateConversationName(conversationId, message.content);
    },
  });

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    const response = await fetch(`/api/conversations?email=${user.email}`);
    const data = await response.json();
    setConversations(data);
  };

  const startNewChat = async () => {
    if (!user) return;
    const newConversationId = Date.now().toString();
    setConversationId(newConversationId);
    setMessages([]);
    setConversations(prev => [...prev, { id: newConversationId, name: 'New Chat' }]);
  };

  const loadConversation = async (id: string) => {
    if (!user) return;
    setConversationId(id);
    const response = await fetch(`/api/conversations/${id}?email=${user.email}`);
    const loadedMessages = await response.json();
    setMessages(loadedMessages);
  };

  const deleteConversation = async (id: string) => {
    if (!user) return;
    await fetch(`/api/conversations/${id}?email=${user.email}`, { method: 'DELETE' });
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (id === conversationId) {
      setConversationId(null);
      setMessages([]);
    }
  };

  const updateConversationName = (id: string | null, content: string) => {
    if (!id) return;
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, name: content.slice(0, 30) } : conv
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-sm">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold">Chat Assistant</h1>
          <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem('messages'); location.reload(); }}>
            Clear Chat
          </Button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] ${message.role === "user" ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-800"} rounded-lg p-2`}>
                <Markdown
                  components={{
                    code(props) {
                      const { children, className, node } = props
                      const match = /language-(\w+)/.exec(className || '')
                      return match ? (
                        <SyntaxHighlighter
                          PreTag="div"
                          language={match[1]}
                          style={oneDark}
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
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              placeholder="Type your message..."
              className="flex-1 text-sm"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button type="button" variant="ghost" size="icon">
              <Mic className="h-4 w-4" />
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Conversation List */}
      <div className="w-56 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-semibold text-sm">New Chat</h2>
          <Button variant="ghost" size="sm" onClick={startNewChat}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div key={conv.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Button
                onClick={() => loadConversation(conv.id)}
                variant="ghost"
                className="w-full justify-start truncate text-xs"
              >
                {conv.name}
              </Button>
              <Button
                onClick={() => deleteConversation(conv.id)}
                variant="ghost"
                size="icon"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}