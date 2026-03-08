import { useCallback, useEffect, useState } from "react"
import { Chainlit } from "@chainlit/react-client"
import { useAppStore } from "./store/useAppStore"
import { useIPC } from "./hooks/useIPC"

const SCROLL_THRESHOLD = 50

export default function App() {
  const { connected, sendEvent } = useIPC()
  const sessions = useAppStore((s) => s.sessions)
  const activeSessionId = useAppStore((s) => s.activeSessionId)
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId)
  const activeSession = activeSessionId ? sessions[activeSessionId] : undefined

  // Map your session/messages to Chainlit format
  const chainlitSession = {
    id: activeSessionId,
    messages: activeSession?.messages || [],
    title: activeSession?.title || "New Session",
    status: activeSession?.status || "idle",
  }

  // Handle sending messages via Chainlit
  const handleSendMessage = useCallback((message: string) => {
    sendEvent({
      type: "user.message",
      payload: {
        sessionId: activeSessionId,
        message: { type: "text", content: message },
      },
    })
  }, [sendEvent, activeSessionId])

  // Handle session selection
  const handleSessionSelect = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
  }, [setActiveSessionId])

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      sendEvent({
        type: "user.message",
        payload: {
          sessionId: activeSessionId,
          message: {
            type: "text",
            content: `User uploaded file: ${file.name}\n\n\[File content start]\n${content.substring(0, 2000)}\n\n\[File content truncated]\n\nWhat would you like to do with this file?`,
          },
        },
      })
    }
    reader.readAsText(file)
  }, [sendEvent, activeSessionId])

  // Handle conversation export
  const handleExport = useCallback(async (format: "json" | "markdown") => {
    if (!activeSessionId) return
    const result = await window.electron.exportConversation({ sessionId: activeSessionId, format })
    if (result.success) {
      alert(`Exported as ${format}!`)
    }
  }, [activeSessionId])

  // Handle workspace creation
  const handleCreateWorkspace = useCallback(async () => {
    const name = prompt("Enter workspace name:")
    if (name) {
      const { id } = await window.electron.workspaceCreate({ name })
      return { id, name }
    }
  }, [])

  return (
    <div className="flex h-screen bg-surface">
      <Chainlit
        session={chainlitSession}
        onMessageSend={handleSendMessage}
        onSessionSelect={handleSessionSelect}
        onFileUpload={handleFileUpload}
        features={
          fileUpload: true,
          sessionManagement: true,
          exportConversations: true,
        }}
        sidebarProps={
          workspaces: await window.electron.workspaceList(),
          onNewWorkspace: handleCreateWorkspace,
          onExportConversation: handleExport,
        }}
      />
    </div>
  )
}