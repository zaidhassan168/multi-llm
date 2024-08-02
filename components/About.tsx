"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input"; // Assuming you have a ui/input component
import { Button } from "@/components/ui/button";
import { useState } from 'react';

interface Message {
  id: string;
  sender: string;
  text: string;
}

interface ChatProps {
  initialMessages?: Message[];
}

const About: React.FC<ChatProps> = ({ initialMessages = [] }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      const newMsg = {
        id: Date.now().toString(),
        sender: 'You', // Assuming you'll handle actual user logic later
        text: newMessage
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto">
        About page
    </div>
  );
};

export default About;
