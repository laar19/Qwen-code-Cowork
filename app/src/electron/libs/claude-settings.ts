import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { loadApiConfig, saveApiConfig, type ApiConfig } from "./config-store.js";
import { app } from "electron";

import { execSync } from "child_process";

// Portable Shim Mode
export function getClaudeCodePath(): string {
  if (app.isPackaged) {
    // extraResources preserves the 'resources' folder structure inside the resources directory
    return join(process.resourcesPath, 'resources', 'qwen-shim.sh');
  }
  // Dev mode
  return join(app.getAppPath(), 'resources', 'qwen-shim.sh');
}

// 获取当前有效的配置（优先界面配置，回退到文件配置）
export function getCurrentApiConfig(): ApiConfig | null {
  const uiConfig = loadApiConfig();
  if (uiConfig) {
    // Launcher passes the current LiteLLM port via env var
    // We must prioritize this over any saved config to ensure connectivity
    if (process.env.ANTHROPIC_BASE_URL) {
      uiConfig.baseURL = process.env.ANTHROPIC_BASE_URL;
      console.log("[claude-settings] Overriding baseURL from env:", uiConfig.baseURL);
    }

    console.log("[claude-settings] Using UI config:", {
      baseURL: uiConfig.baseURL,
      model: uiConfig.model,
      apiType: uiConfig.apiType
    });
    return uiConfig;
  }

  // 回退到 ~/.claude/settings.json
  try {
    const settingsPath = join(homedir(), ".claude", "settings.json");
    const raw = readFileSync(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as { env?: Record<string, unknown> };
    if (parsed.env) {
      const authToken = parsed.env.ANTHROPIC_AUTH_TOKEN;
      const baseURL = parsed.env.ANTHROPIC_BASE_URL;
      const model = parsed.env.ANTHROPIC_MODEL;

      if (authToken && baseURL && model) {
        console.log("[claude-settings] Using file config from ~/.claude/settings.json");
        const config: ApiConfig = {
          apiKey: String(authToken),
          baseURL: String(baseURL),
          model: String(model),
          apiType: "anthropic"
        };
        // 持久化到 api-config.json
        try {
          saveApiConfig(config);
          console.log("[claude-settings] Persisted config to api-config.json");
        } catch (e) {
          console.error("[claude-settings] Failed to persist config:", e);
        }
        return config;
      }
    }
  } catch {
    // Ignore missing or invalid settings file.
  }

  console.log("[claude-settings] No config found, returning dummy config for native CLI mode");
  return {
    apiKey: "dummy-native-cli",
    baseURL: "http://localhost",
    model: "qwen-code-native",
    apiType: "anthropic"
  };
}

export function buildEnvForConfig(config: ApiConfig): Record<string, string> {
  const baseEnv = { ...process.env } as Record<string, string>;

  // If using native CLI mode (dummy config), do NOT inject ENV vars
  // This allows qwen-code to use its internal auth/config
  if (config.apiKey === "dummy-native-cli") {
    console.log("[claude-settings] Native CLI mode detected - skipping ENV injection");
    return baseEnv;
  }

  baseEnv.ANTHROPIC_AUTH_TOKEN = config.apiKey;
  baseEnv.ANTHROPIC_BASE_URL = config.baseURL;
  baseEnv.ANTHROPIC_MODEL = config.model;

  return baseEnv;
}
