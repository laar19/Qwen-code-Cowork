import { Agent } from "./AgentManager"

export class OpenClawAgent implements Agent {
  private apiKey: string
  private baseURL: string

  constructor() {
    this.apiKey = process.env.OPENCLAW_API_KEY || ""
    this.baseURL = "https://api.openclaw.com/v1"
  }

  async sendMessage(message: string) {
    const response = await fetch(`${this.baseURL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ message })
    })
    return response.json()
  }

  async streamResponse(sessionId: string) {
    return { stream: "OpenClaw stream response" }
  }

  async getSessionHistory(sessionId: string) {
    return { history: [] }
  }
}