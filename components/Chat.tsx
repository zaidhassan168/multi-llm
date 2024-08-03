import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message, continueConversation } from '@/app/actions';
import { readStreamableValue } from 'ai/rsc';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeProps } from "react-markdown/lib/ast-to-react";

interface ChatProps {
  initialMessages?: Message[];
}

const Chat: React.FC<ChatProps> = ({ initialMessages = [] }) => {
  const [conversation, setConversation] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: input };
    setConversation(prev => [...prev, userMessage]);
    setInput('');

    try {
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
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally add error handling UI here
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
    <div className=" w-2/3 mx-auto max-h-screen min-h-screen flex flex-col">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 ${
              message.role === "user" ? "justify-end" : ""
            }`}
          >
            <Avatar
              className={`w-8 h-8 ${message.role === "user" ? "order-2" : ""}`}
            >
              <AvatarImage
                src={message.role === "user" ? "/placeholder-user.jpg" : "/placeholder-assistant.jpg"}
                alt={message.role}
              />
              <AvatarFallback>{message.role.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div
              className={`bg-gray-200 dark:bg-gray-800 rounded-lg p-3 text-sm ${
                message.role === "user" ? "bg-blue-100 dark:bg-blue-900" : "w-full"
              }`}
            >
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: CodeProps) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            className="flex-1 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
