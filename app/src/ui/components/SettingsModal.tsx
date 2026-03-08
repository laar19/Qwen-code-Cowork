import { useEffect, useState } from "react"
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeAgent, setActiveAgent] = useState("qwen")
  const [apiKey, setApiKey] = useState("")
  const [baseURL, setBaseURL] = useState("")
  const [model, setModel] = useState("")
  const [port, setPort] = useState("8080")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = () => {
    // Save settings logic here
    alert(`Settings saved! Active agent: ${activeAgent}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-ink-900/5 bg-surface p-6 shadow-elevated">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-ink-800">Settings</div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface-tertiary hover:text-ink-700 transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Active Agent</label>
            <select
              value={activeAgent}
              onChange={(e) => setActiveAgent(e.target.value)}
              className="w-full p-2 border border-ink-900/20 rounded"
            >
              <option value="qwen">Qwen Code</option>
              <option value="claude">Claude Agent</option>
              <option value="openclaw">OpenClaw Agent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-ink-900/20 rounded"
              placeholder="Enter your API key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Base URL</label>
            <input
              type="url"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              className="w-full p-2 border border-ink-900/20 rounded"
              placeholder="https://api.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Model Name</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 border border-ink-900/20 rounded"
              placeholder="claude-3-5-sonnet-20241022"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full p-2 border border-ink-900/20 rounded"
              placeholder="Enter port number"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
              Configuration saved successfully!
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-900/10 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-accent text-white rounded hover:bg-accent-hover"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}