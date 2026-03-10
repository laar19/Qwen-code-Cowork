import { useState, useEffect } from "react"
import { Message } from "./types"

export function ChatWindow({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState(null)

  useEffect(() => {
    const handleStreamMessage = (_, payload) => {
      if (payload.sessionId === sessionId) {
        setMessages(prev => [...prev, payload.message])
        if (payload.message.role === "assistant") setIsStreaming(true)
      }
    }

    const handleStreamError = (_, payload) => {
      if (payload.sessionId === sessionId) {
        setStreamError(payload.message)
      }
    }

    const handleStreamEnd = () => {
      setIsStreaming(false)
    }

    window.electron.on("stream.message", handleStreamMessage)
    window.electron.on("stream.error", handleStreamError)
    window.electron.on("session.status", (_, payload) => {
      if (payload.sessionId === sessionId && payload.status === "idle") {
        handleStreamEnd()
      }
    })

    return () => {
      window.electron.off("stream.message", handleStreamMessage)
      window.electron.off("stream.error", handleStreamError)
      window.electron.off("session.status", handleStreamEnd)
    }
  }, [sessionId])

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      {isStreaming && <div className="streaming-indicator">Assistant is typing...</div>}
      {streamError && <div className="error-message">Error: {streamError.content}</div>}
    </div>
  )
}