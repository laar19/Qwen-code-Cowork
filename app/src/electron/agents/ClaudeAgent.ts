import { Agent } from "./AgentManager"

export class ClaudeAgent implements Agent {
  private apiKey: string
  private baseURL: string

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || ""
    this.baseURL = "https://api.anthropic.com/v1"
  }

  async sendMessage(message: string) {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey
      },
      body: JSON.stringify({ prompt: message })
    })
    return response.json()
  }

  async streamResponse(sessionId: string) {
    return { stream: "Claude stream response" }
  }

  async getSessionHistory(sessionId: string) {
    return { history: [] }
  }
}