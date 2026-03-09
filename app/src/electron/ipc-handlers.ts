import { ipcMain } from "electron"
import { dialog } from "electron"
import { writeFileSync } from "fs"
import { v4 as uuidv4 } from "uuid"
import { BrowserWindow } from "electron"
import type { ClientEvent, ServerEvent } from "./types.js"
import { runClaude, type RunnerHandle } from "./libs/runner.js"
import { SessionStore } from "./libs/session-store.js"
import { app } from "electron"
import { join } from "path"
import { saveAgentConfig, getAgentConfig } from "./libs/config-store.js"
import { AgentManager } from "./agents/AgentManager"

let sessions: SessionStore
const runnerHandles = new Map<string, RunnerHandle>()
let workspaces: Record<string, { name: string; sessionIds: string[] }> = {}
const agentManager = new AgentManager()

function initializeSessions() {
  if (!sessions) {
    const DB_PATH = join(app.getPath("userData"), "sessions.db")
    sessions = new SessionStore(DB_PATH)
  }
  return sessions
}

function broadcast(event: ServerEvent) {
  const payload = JSON.stringify(event)
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    win.webContents.send("server-event", payload)
  }
}

function hasLiveSession(sessionId: string): boolean {
  if (!sessions) return false
  return Boolean(sessions.getSession(sessionId))
}

function emit(event: ServerEvent) {
  if (
    (event.type === "session.status" ||
      event.type === "stream.message" ||
      event.type === "stream.user_prompt" ||
      event.type === "permission.request") &&
    !hasLiveSession(event.payload.sessionId)
  ) {
    return
  }

  if (event.type === "session.status") {
    sessions.updateSession(event.payload.sessionId, { status: event.payload.status })
  }
  if (event.type === "stream.message") {
    sessions.recordMessage(event.payload.sessionId, event.payload.message)
  }
  if (event.type === "stream.user_prompt") {
    sessions.recordMessage(event.payload.sessionId, {
      type: "user_prompt",
      prompt: event.payload.prompt
    })
  }
  broadcast(event)
}

// Add agent config handlers
ipcMain.handle("save-agent-config", async (_, config) => {
  try {
    await saveAgentConfig(config)
    // Update active agent if needed
    if (config.agent) agentManager.setActiveAgent(config.agent)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle("get-agent-config", async () => {
  try {
    return await getAgentConfig()
  } catch (error) {
    return { error: error.message }
  }
})

// Export conversation as JSON or Markdown
ipcMain.handle("export-conversation", async (_, { sessionId, format }) => {
  const session = sessions.getSession(sessionId)
  if (!session) throw new Error("Session not found")
  const messages = session.messages || []
  let content: string
  if (format === "markdown") {
    content = messages.map((m: any) => `**${m.role || "unknown"}**: ${m.content || ""}`).join("\n\n")
  } else {
    content = JSON.stringify(messages, null, 2)
  }
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: `conversation_${sessionId}.${format}`,
    filters: [{ name: format.toUpperCase(), extensions: [format] }]
  })
  if (filePath) writeFileSync(filePath, content)
  return { success: !!filePath }
})

// Workspace management
ipcMain.handle("workspace.create", (_, { name }) => {
  const id = uuidv4()
  workspaces[id] = { name, sessionIds: [] }
  return { id }
})

ipcMain.handle("workspace.rename", (_, { id, name }) => {
  if (!workspaces[id]) throw new Error("Workspace not found")
  workspaces[id].name = name
  return { success: true }
})

ipcMain.handle("workspace.delete", (_, { id }) => {
  if (!workspaces[id]) throw new Error("Workspace not found")
  delete workspaces[id]
  return { success: true }
})

ipcMain.handle("workspace.add-session", (_, { workspaceId, sessionId }) => {
  if (!workspaces[workspaceId]) throw new Error("Workspace not found")
  if (!sessions.getSession(sessionId)) throw new Error("Session not found")
  workspaces[workspaceId].sessionIds.push(sessionId)
  return { success: true }
})

ipcMain.handle("workspace.remove-session", (_, { workspaceId, sessionId }) => {
  if (!workspaces[workspaceId]) throw new Error("Workspace not found")
  workspaces[workspaceId].sessionIds = workspaces[workspaceId].sessionIds.filter((id: string) => id !== sessionId)
  return { success: true }
})

ipcMain.handle("workspace.list", () => {
  return Object.entries(workspaces).map(([id, ws]) => ({ id, ...ws }))
})

// Initialize agent manager on startup
agentManager.initialize().catch(console.error)

export function handleClientEvent(event: ClientEvent) {
  const sessions = initializeSessions()
  // ... rest of your existing handleClientEvent logic
  if (event.type === "session.list") {
    emit({
      type: "session.list",
      payload: { sessions: sessions.listSessions() }
    })
    return
  }
  // ... rest of your logic
  if (event.type === "session.start") {
    const session = sessions.createSession({
      cwd: event.payload.cwd,
      title: event.payload.title,
      allowedTools: event.payload.allowedTools,
      prompt: event.payload.prompt
    })

    sessions.updateSession(session.id, {
      status: "running",
      lastPrompt: event.payload.prompt
    })
    emit({
      type: "session.status",
      payload: { sessionId: session.id, status: "running", title: session.title, cwd: session.cwd }
    })

    emit({
      type: "stream.user_prompt",
      payload: { sessionId: session.id, prompt: event.payload.prompt }
    })

    // Use agent manager to send message
    agentManager.sendMessage(event.payload.prompt)
      .then((response) => {
        emit({
          type: "stream.message",
          payload: { sessionId: session.id, message: response }
        })
      })
      .catch((error) => {
        emit({
          type: "stream.message",
          payload: {
            sessionId: session.id,
            message: { role: "system", content: `Error: ${error.message}` }
          }
        })
      })

    // Use agent manager to stream response
    agentManager.streamResponse(session.id, event.payload.prompt)
      .then(async ({ stream }) => {
        try {
          for await (const chunk of stream) {
            emit({
              type: "stream.message",
              payload: {
                sessionId: session.id,
                message: { role: "assistant", content: chunk }
              }
            })
          }
        } catch (error) {
          emit({
            type: "stream.message",
            payload: {
              sessionId: session.id,
              message: { role: "system", content: `Stream error: ${error.message}` }
            }
          })
        }
      })
      .catch((error) => {
        emit({
          type: "stream.message",
          payload: {
            sessionId: session.id,
            message: { role: "system", content: `Stream failed: ${error.message}` }
          }
        })
      })

    return
  }
  // ... rest of your logic
}

export function cleanupAllSessions(): void {
  for (const [, handle] of runnerHandles) {
    handle.abort()
  }
  runnerHandles.clear()
  if (sessions) {
    sessions.close()
  }
}

export { sessions }