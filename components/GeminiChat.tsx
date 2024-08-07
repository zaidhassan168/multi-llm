'use client';
import React, { useState, useEffect, FormEvent } from 'react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function GeminiChat() {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load messages from local storage when the component mounts
  useEffect(() => {
    const savedMessages = localStorage.getItem('messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/geminiChat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data: { response: { candidates: { content: { parts: { text: string }[] } }[] } } = await response.json();
      const aiContent = data.response.candidates[0].content.parts.map(part => part.text).join('');
      const aiMessage: Message = { role: 'model', content: aiContent };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="bg-gray-100 p-4 rounded-lg mb-4 h-96 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
              {message.content}
            </span>
          </div>
        ))}
        {isLoading && <div className="text-center">AI is thinking...</div>}
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}
