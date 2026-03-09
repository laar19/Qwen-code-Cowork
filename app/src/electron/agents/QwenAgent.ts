import { Agent } from "./AgentManager"

export class QwenAgent implements Agent {
  private apiKey: string
  private baseURL: string

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY || ""
    this.baseURL = "https://api.qwen.com/v1"
  }

  async sendMessage(message: string) {
    const response = await fetch(`${this.baseURL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ content: message })
    })
    return response.json()
  }

  async streamResponse(sessionId: string) {
    return { stream: "Qwen stream response" }
  }

  async getSessionHistory(sessionId: string) {
    return { history: [] }
  }
}