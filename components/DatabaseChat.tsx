import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message } from '@/app/actions';
import { Send } from 'lucide-react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ConnectDatabase from './ConnectDatabase';

interface ChatProps {
  initialMessages?: Message[];
}

const DatabaseChat: React.FC<ChatProps> = ({ initialMessages = [] }) => {
  const [conversation, setConversation] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: input };
    setConversation(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/dbChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMessage] }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setConversation(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling API:', error);
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
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Database Chat</h1>
          <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
            Connect Database
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Type your message..."
                className="flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />

              <Button
                onClick={handleSendMessage}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <ConnectDatabase
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onDatabaseConnected={setSettings}
      />
    </div>
  );
};

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => (
  <div className={`flex items-start gap-4 ${message.role === "user" ? "justify-end" : ""}`}>
    <Avatar className={`w-8 h-8 ${message.role === "user" ? "order-2" : ""}`}>
      <AvatarImage src={`/placeholder-${message.role}.jpg`} alt={message.role} />
      <AvatarFallback>{message.role.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
    <div className={`rounded-lg p-3 text-sm max-w-[70%] ${message.role === "user"
      ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      }`}>
      <Markdown
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter language={match[1]} style={oneDark} PreTag="div" className="rounded-md text-sm">
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className} bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5`}>
                {children}
              </code>
            );
          }
        }}
      >
        {message.content}
      </Markdown>
    </div>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default DatabaseChat;
