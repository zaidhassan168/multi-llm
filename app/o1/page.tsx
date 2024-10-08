
'use client'
import { useChat } from 'ai/react'
import { useState, useRef, useEffect, JSX, SVGProps } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, duotoneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { Check, Copy } from 'lucide-react'

export default function ChatGPTInterface() {
  const { messages, input, handleInputChange, handleSubmit, error, isLoading: chatLoading } = useChat({
    streamProtocol: 'text',
  })

  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim() === "") return
    setIsLoading(true)
    await handleSubmit(e)
    setIsLoading(false)
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  const CodeBlock = ({ language, children }: { language: string, children: string }) => {
    const [isCopied, setIsCopied] = useState(false)

    const copyToClipboard = () => {
      navigator.clipboard.writeText(children).then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
    }

    return (
      <div className="relative">
        <Button
          className="absolute top-2 right-2 h-8 w-8"
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <SyntaxHighlighter
          language={language}
          style={duotoneLight}
          className="rounded-md text-sm"
        >
          {children}
        </SyntaxHighlighter>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] container">
      <div className="flex-1 overflow-auto bg-background" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="w-8 h-8 border">
                <AvatarImage src={message.role === 'user' ? "/user-avatar.png" : "/ai-avatar.png"} alt={`${message.role} Avatar`} />
                <AvatarFallback>{message.role === 'user' ? 'U' : 'AI'}</AvatarFallback>
              </Avatar>
              <div className={`rounded-lg p-4 max-w-[90%] ${
                message.role === 'user' ? 'bg-muted text-foreground' : 'bg-transparent text-foreground'
              }`}>
                <ReactMarkdown
                  className="prose dark:prose-invert max-w-none text-sm"
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return  match ? (
                        <CodeBlock language={match[1]}>
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      ) : (
                        <code className={`${className} bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5`} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-start gap-4">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="/ai-avatar.png" alt="AI Avatar" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="bg-transparent rounded-lg p-4 max-w-[90%]">
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-background border-t py-4 px-4">
        <form onSubmit={onSubmit} className="max-w-4xl mx-auto relative">
          <Textarea
            placeholder="Message ChatGPT..."
            name="message"
            id="message"
            value={input}
            onChange={handleInputChange}
            rows={1}
            className="min-h-[48px] rounded-2xl resize-none p-4 border border-neutral-400 shadow-sm pr-16"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSubmit(e as any)
              }
            }}
            disabled={isLoading}
            required
          />
          <Button type="submit" size="icon" className="absolute w-8 h-8 top-3 right-3" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            ) : (
              <ArrowUpIcon className="w-4 h-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
        {error && (
          <div className="mt-2 text-red-500 text-sm text-center max-w-4xl mx-auto">
            {error.message}
          </div>
        )}
      </div>
    </div>
  )
}

// ... (TypingIndicator and ArrowUpIcon components remain the same)
function TypingIndicator() {
  return (
    <div className="flex space-x-1">
      <motion.div
        className="w-2 h-2 bg-gray-500 rounded-full"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-500 rounded-full"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-500 rounded-full"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  )
}

function ArrowUpIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  )
}