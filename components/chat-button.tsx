'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import ChatBotInterface from './chat-bot-interface'

export function ChatButton() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 rounded-full shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Open chat</span>
      </Button>
      {isChatOpen && <ChatBotInterface onClose={() => setIsChatOpen(false)} />}
    </>
  )
}