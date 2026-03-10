import { Agent } from "./AgentManager"

interface StreamResponse {
  stream: AsyncIterable<string>
}

export class QwenAgent implements Agent {
  private apiKey: string
  private baseURL: string

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY || ""
    this.baseURL = "https://api.qwen.com/v1"
    if (!this.apiKey) console.warn("Qwen API key not set. Please configure it in settings.")
  }

  async sendMessage(message: string) {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ content: message })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return response.json()
    } catch (error) {
      console.error("QwenAgent sendMessage error:", error)
      throw new Error(`Qwen API request failed: ${error.message}`)
    }
  }

  async streamResponse(sessionId: string, message: string): Promise<StreamResponse> {
    try {
      const stream = await fetch(`${this.baseURL}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ content: message })
      })
      if (!stream.ok || !stream.body) throw new Error("Stream request failed")

      return {
        stream: stream.body as unknown as AsyncIterable<string>
      }
    } catch (error) {
      console.error("QwenAgent streamResponse error:", error)
      throw new Error(`Qwen stream failed: ${error.message}`)
    }
  }

  async getSessionHistory(sessionId: string) {
    try {
      // Replace with actual session history logic
      return { history: [] }
    } catch (error) {
      console.error("QwenAgent getSessionHistory error:", error)
      throw new Error(`Failed to load session history: ${error.message}`)
    }
  }
}