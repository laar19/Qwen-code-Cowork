import { useState, useEffect } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Dialog from "@radix-ui/react-dialog"
import { useAppStore } from "../store/useAppStore"

interface SidebarProps {
  connected: boolean
  onNewSession: () => void
  onDeleteSession: (sessionId: string) => void
}

export function Sidebar({ onNewSession, onDeleteSession }: SidebarProps) {
  const sessions = useAppStore((state) => state.sessions)
  const activeSessionId = useAppStore((state) => state.activeSessionId)
  const setActiveSessionId = useAppStore((state) => state.setActiveSessionId)
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)

  // Fetch workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const wsList = await window.electron.workspaceList()
      setWorkspaces(wsList)
    }
    fetchWorkspaces()
  }, [])

  // Workspace actions
  const handleCreateWorkspace = async () => {
    const name = prompt("Enter workspace name:")
    if (name) {
      const { id } = await window.electron.workspaceCreate({ name })
      setWorkspaces(prev => [...prev, { id, name, sessionIds: [] }])
      setActiveWorkspaceId(id)
    }
  }

  // Session actions
  const handleExportSession = async (sessionId: string, format: "json" | "markdown") => {
    const result = await window.electron.exportConversation({ sessionId, format })
    if (result.success) {
      alert(`Exported as ${format}!`)
    }
  }

  const formatCwd = (cwd?: string) => {
    if (!cwd) return "Working dir unavailable"
    const parts = cwd.split(/[\/]+/).filter(Boolean)
    const tail = parts.slice(-2).join("/")
    return `/${tail || cwd}`
  }

  const sessionList = Object.values(sessions)

  return (
    <aside className="fixed inset-y-0 left-0 flex h-full w-[280px] flex-col gap-4 border-r border-ink-900/5 bg-[#FAF9F6] px-4 pb-4 pt-12">
      <div
        className="absolute top-0 left-0 right-0 h-12"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      
      {/* Workspace selector and actions */}
      <div className="p-2 border-b border-ink-900/10">
        <select
          value={activeWorkspaceId || ""}
          onChange={(e) => setActiveWorkspaceId(e.target.value)}
          className="w-full p-2 text-xs bg-surface rounded border border-ink-900/20"
        >
          <option value="">Select Workspace</option>
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleCreateWorkspace}
            className="flex-1 px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover"
          >
            New Workspace
          </button>
        </div>
      </div>
      
      {/* Session list and actions */}
      <div className="flex flex-col gap-2 overflow-y-auto">
        <div className="flex justify-between items-center mb-2 px-2">
          <span className="text-xs font-medium text-ink-700">Sessions</span>
          <button
            onClick={onNewSession}
            className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover"
          >
            New Session
          </button>
        </div>
        {sessionList.length === 0 ? (
          <div className="rounded-xl border border-ink-900/5 bg-surface px-4 py-5 text-center text-xs text-muted">
            No sessions yet. Click "New Session" to start.
          </div>
        ) : (
          sessionList.map((session) => (
            <div
              key={session.id}
              className={`cursor-pointer rounded-xl border px-2 py-3 text-left transition ${
                activeSessionId === session.id ? "border-accent/30 bg-accent-subtle" : "border-ink-900/5 bg-surface hover:bg-surface-tertiary"
              }`}
              onClick={() => setActiveSessionId(session.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSessionId(session.id); } }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                  <div className={`text-[12px] font-medium ${
                    session.status === "running" ? "text-info" : 
                    session.status === "completed" ? "text-success" : 
                    session.status === "error" ? "text-error" : "text-ink-800"
                  }`}>
                    {session.title}
                  </div>
                  <div className="flex items-center justify-between mt-0.5 text-xs text-muted">
                    <span className="truncate">{formatCwd(session.cwd)}</span>
                  </div>
                </div>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className="flex-shrink-0 rounded-full p-1.5 text-ink-500 hover:bg-ink-900/10"
                      aria-label="Open session menu"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <circle cx="5" cy="12" r="1.7" />
                        <circle cx="12" cy="12" r="1.7" />
                        <circle cx="19" cy="12" r="1.7" />
                      </svg>
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="z-50 min-w-[220px] rounded-xl border border-ink-900/10 bg-white p-1 shadow-lg"
                      align="center"
                      sideOffset={8}
                    >
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 outline-none hover:bg-ink-900/5"
                        onSelect={() => handleExportSession(session.id, "json")}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                          <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
                        </svg>
                        Export as JSON
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 outline-none hover:bg-ink-900/5"
                        onSelect={() => handleExportSession(session.id, "markdown")}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                          <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
                        </svg>
                        Export as Markdown
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 outline-none hover:bg-ink-900/5"
                        onSelect={() => onDeleteSession(session.id)}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-error/80" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l1-12" />
                        </svg>
                        Delete this session
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          ))
        )
        }
      </div>
      
      {/* Resume session dialog (unchanged) */}
      <Dialog.Root open={!!resumeSessionId} onOpenChange={(open) => !open && setResumeSessionId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="text-lg font-semibold text-ink-800">Resume</Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-full p-1 text-ink-500 hover:bg-ink-900/10" aria-label="Close dialog">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink-900/10 bg-surface px-3 py-2 font-mono text-xs text-ink-700">
              <span className="flex-1 break-all">{resumeSessionId ? `claude --resume ${resumeSessionId}` : ""}</span>
              <button className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-900/10" onClick={handleCopyCommand} aria-label="Copy resume command">
                {copied ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l4 4L19 6" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </aside>
  )
}

const handleCopyCommand = async ({ resumeSessionId, setCopied, setResumeSessionId }) => {
  if (!resumeSessionId) return
  const command = `claude --resume ${resumeSessionId}`
  try {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => {
      setResumeSessionId(null)
    }, 3000)
  } catch (err) {
    console.error("Failed to copy:", err)
  }
}