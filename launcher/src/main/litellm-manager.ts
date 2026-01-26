/**
 * LiteLLM Process Manager
 * Spawns and manages the Python LiteLLM proxy process
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

export interface LiteLLMConfig {
    port: number;
    host: string;
    model: string;
    dropParams: boolean;
    debug: boolean;
    apiKeys: {
        deepseek?: string;
        openai?: string;
        mistral?: string;
        anthropic?: string;
        gemini?: string;
    };
}

export class LiteLLMManager extends EventEmitter {
    private process: ChildProcess | null = null;
    private config: LiteLLMConfig;
    private resourcesPath: string;

    constructor(resourcesPath: string) {
        super();
        this.resourcesPath = resourcesPath;
        this.config = {
            port: 4000,
            host: '0.0.0.0',
            model: 'deepseek/deepseek-chat',
            dropParams: true,
            debug: false,
            apiKeys: {}
        };
    }

    setConfig(config: Partial<LiteLLMConfig>) {
        this.config = { ...this.config, ...config };
    }

    getConfig(): LiteLLMConfig {
        return this.config;
    }

    isRunning(): boolean {
        return this.process !== null && !this.process.killed;
    }

    async start(): Promise<void> {
        if (this.isRunning()) {
            this.emit('log', 'LiteLLM is already running');
            return;
        }

        // Check for bundled executable first (standalone), then Python script (dev)
        const bundledPath = path.join(this.resourcesPath, 'dist', 'litellm-proxy', 'litellm-proxy');
        const pythonPath = path.join(this.resourcesPath, 'main.py');

        const useBundled = fs.existsSync(bundledPath);
        const usePython = !useBundled && fs.existsSync(pythonPath);

        if (!useBundled && !usePython) {
            throw new Error(`LiteLLM proxy not found at: ${bundledPath} or ${pythonPath}`);
        }

        // Build environment variables
        const env: Record<string, string> = {
            ...process.env as Record<string, string>,
            LITELLM_PORT: String(this.config.port),
            LITELLM_HOST: this.config.host,
            LITELLM_MODEL: this.config.model,
            LITELLM_DROP_PARAMS: this.config.dropParams ? 'true' : 'false',
            LITELLM_DEBUG: this.config.debug ? 'true' : 'false'
        };

        // Add API keys
        if (this.config.apiKeys.deepseek) {
            env.DEEPSEEK_API_KEY = this.config.apiKeys.deepseek;
        }
        if (this.config.apiKeys.openai) {
            env.OPENAI_API_KEY = this.config.apiKeys.openai;
        }
        if (this.config.apiKeys.mistral) {
            env.MISTRAL_API_KEY = this.config.apiKeys.mistral;
        }
        if (this.config.apiKeys.anthropic) {
            env.ANTHROPIC_API_KEY = this.config.apiKeys.anthropic;
        }
        if (this.config.apiKeys.gemini) {
            env.GEMINI_API_KEY = this.config.apiKeys.gemini;
        }

        this.emit('log', `Starting LiteLLM proxy on port ${this.config.port}...`);
        this.emit('log', `Using ${useBundled ? 'bundled executable' : 'Python script'}`);
        this.emit('status', 'starting');

        // Spawn process - bundled executable or Python script
        if (useBundled) {
            this.process = spawn(bundledPath, [], {
                env,
                cwd: path.dirname(bundledPath)
            });
        } else {
            this.process = spawn('python3', [pythonPath], {
                env,
                cwd: path.dirname(pythonPath)
            });
        }

        this.process.stdout?.on('data', (data: Buffer) => {
            const text = data.toString();
            this.emit('log', text);

            // Detect when server is ready
            if (text.includes('Starting LiteLLM') || text.includes('Uvicorn running')) {
                this.emit('status', 'running');
            }
        });

        this.process.stderr?.on('data', (data: Buffer) => {
            const text = data.toString();
            this.emit('log', `[stderr] ${text}`);

            // Uvicorn logs go to stderr, detect running state
            if (text.includes('Uvicorn running') || text.includes('Application startup complete')) {
                this.emit('status', 'running');
            }
        });

        this.process.on('error', (error: Error) => {
            this.emit('error', error);
            this.emit('status', 'error');
        });

        this.process.on('exit', (code: number | null) => {
            this.emit('log', `LiteLLM process exited with code: ${code}`);
            this.emit('status', 'stopped');
            this.process = null;
        });
    }

    stop(): void {
        if (this.process && !this.process.killed) {
            this.emit('log', 'Stopping LiteLLM proxy...');
            this.process.kill('SIGTERM');

            // Force kill after 5 seconds if still running
            setTimeout(() => {
                if (this.process && !this.process.killed) {
                    this.process.kill('SIGKILL');
                }
            }, 5000);
        }
    }

    restart(): Promise<void> {
        this.stop();
        return new Promise((resolve) => {
            setTimeout(async () => {
                await this.start();
                resolve();
            }, 1000);
        });
    }
}
