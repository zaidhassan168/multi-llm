'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import ChatBotInterface from './chat-bot-interface'
import { motion, AnimatePresence } from "framer-motion"

export function ChatButton() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <AnimatePresence>
        {!isChatOpen && (
          <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
          >
            <Button
              onClick={() => setIsChatOpen(true)}
              variant="outline"
              className="rounded-full shadow-lg border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 ease-in-out group"
              size="icon"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
                className="relative"
              >
                <Bot className="h-6 w-6" />
                <span className="absolute left-full ml-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Chat with AI
                </span>
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      {isChatOpen && <ChatBotInterface onClose={() => setIsChatOpen(false)} />}
    </>
  )
}