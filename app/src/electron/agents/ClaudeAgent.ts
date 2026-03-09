import { Agent } from "./AgentManager"

interface StreamResponse {
  stream: AsyncIterable<string>
}

export class ClaudeAgent implements Agent {
  private apiKey: string
  private baseURL: string

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || ""
    this.baseURL = "https://api.anthropic.com/v1"
    if (!this.apiKey) console.warn("Claude API key not set. Please configure it in settings.")
  }

  async sendMessage(message: string) {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey
        },
        body: JSON.stringify({ prompt: message })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return response.json()
    } catch (error) {
      console.error("ClaudeAgent sendMessage error:", error)
      throw new Error(`Claude API request failed: ${error.message}`)
    }
  }

  async streamResponse(sessionId: string, message: string): Promise<StreamResponse> {
    try {
      const stream = await fetch(`${this.baseURL}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey
        },
        body: JSON.stringify({ prompt: message })
      })
      if (!stream.ok || !stream.body) throw new Error("Stream request failed")

      return {
        stream: stream.body as unknown as AsyncIterable<string>
      }
    } catch (error) {
      console.error("ClaudeAgent streamResponse error:", error)
      throw new Error(`Claude stream failed: ${error.message}`)
    }
  }

  async getSessionHistory(sessionId: string) {
    try {
      // Replace with actual session history logic
      return { history: [] }
    } catch (error) {
      console.error("ClaudeAgent getSessionHistory error:", error)
      throw new Error(`Failed to load session history: ${error.message}`)
    }
  }
}