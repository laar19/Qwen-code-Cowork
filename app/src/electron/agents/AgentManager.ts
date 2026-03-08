import { ClaudeAgent } from "./ClaudeAgent"
import { QwenAgent } from "./QwenAgent"
import { OpenClawAgent } from "./OpenClawAgent"
import { getAgentConfig } from "../libs/config-store"

// Define the interface for all agents
interface Agent {
  sendMessage(message: string): Promise<any>
  streamResponse(sessionId: string): Promise<any>
  getSessionHistory(sessionId: string): Promise<any>
}

// AgentManager to handle different agents
export class AgentManager {
  private agents: Record<string, Agent>
  private activeAgent: Agent

  constructor() {
    this.agents = {
      qwen: new QwenAgent(),
      claude: new ClaudeAgent(),
      openclaw: new OpenClawAgent(),
    }
    // Default to Qwen agent
    this.activeAgent = this.agents.qwen
  }

  async initialize() {
    const config = await getAgentConfig()
    if (config.agent && this.agents[config.agent]) {
      this.setActiveAgent(config.agent)
    }
  }

  setActiveAgent(agentName: string): void {
    const agent = this.agents[agentName]
    if (!agent) throw new Error(`Agent ${agentName} not found`)
    this.activeAgent = agent
  }

  getActiveAgent(): Agent {
    return this.activeAgent
  }

  async sendMessage(message: string) {
    return this.activeAgent.sendMessage(message)
  }

  async streamResponse(sessionId: string) {
    return this.activeAgent.streamResponse(sessionId)
  }

  async getSessionHistory(sessionId: string) {
    return this.activeAgent.getSessionHistory(sessionId)
  }
}