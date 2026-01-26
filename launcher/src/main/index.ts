/**
 * Qwen-Code Companion - Main Electron entry point
 * Provides LiteLLM proxy + settings UI for Qwen-Code
 */

// Type imports
import type { BrowserWindow as BrowserWindowType } from 'electron';

// Runtime imports (CommonJS)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { LiteLLMManager } = require('./litellm-manager');

// Type definitions
interface LiteLLMConfig {
    port: number;
    host: string;
    model: string;
    dropParams: boolean;
    debug: boolean;
    apiKeys: {
        qwen?: string;
        openai?: string;
        deepseek?: string;
        anthropic?: string;
    };
}

let mainWindow: BrowserWindowType | null = null;
let litellmManager: any;

// Paths
const isDev = process.env.NODE_ENV === 'development';
const resourcesPath = isDev
    ? path.join(__dirname, '..', '..', 'resources')
    : path.join(process.resourcesPath);

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// Default settings
interface AppSettings {
    litellm: LiteLLMConfig;
}

const defaultSettings: AppSettings = {
    litellm: {
        port: 4000,
        host: '0.0.0.0',
        model: 'openai/gpt-4o',
        dropParams: true,
        debug: false,
        apiKeys: {}
    }
};

function loadSettings(): AppSettings {
    try {
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf-8');
            return { ...defaultSettings, ...JSON.parse(data) };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
    return defaultSettings;
}

function saveSettings(settings: AppSettings): void {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// Check if qwen-code is installed
function checkQwenCodeInstalled(): Promise<{ installed: boolean; version?: string }> {
    return new Promise((resolve) => {
        exec('qwen --version', (error: Error | null, stdout: string) => {
            if (error) {
                resolve({ installed: false });
            } else {
                const version = stdout.trim();
                resolve({ installed: true, version });
            }
        });
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        title: 'Qwen-Code Companion',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5174');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist-react', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function setupLiteLLMManager() {
    const proxyPath = isDev
        ? path.join(__dirname, '..', 'resources', 'lite_llm_proxy')
        : path.join(resourcesPath, 'lite_llm_proxy');

    litellmManager = new LiteLLMManager(proxyPath);

    // Load saved config
    const settings = loadSettings();
    litellmManager.setConfig(settings.litellm);

    // Forward events to renderer
    litellmManager.on('log', (log: string) => {
        mainWindow?.webContents.send('litellm:log', log);
    });

    litellmManager.on('status', (status: string) => {
        mainWindow?.webContents.send('litellm:status-change', status);
    });

    litellmManager.on('error', (error: Error) => {
        mainWindow?.webContents.send('litellm:log', `Error: ${error.message}`);
    });
}

function setupIpcHandlers() {
    // LiteLLM handlers
    ipcMain.handle('litellm:start', async () => {
        try {
            await litellmManager.start();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('litellm:stop', () => {
        litellmManager.stop();
        return { success: true };
    });

    ipcMain.handle('litellm:restart', async () => {
        await litellmManager.restart();
        return { success: true };
    });

    ipcMain.handle('litellm:status', () => {
        return litellmManager.isRunning() ? 'running' : 'stopped';
    });

    ipcMain.handle('litellm:get-config', () => {
        return litellmManager.getConfig();
    });

    ipcMain.handle('litellm:set-config', (_event: any, config: Partial<LiteLLMConfig>) => {
        litellmManager.setConfig(config);
        const settings = loadSettings();
        settings.litellm = litellmManager.getConfig();
        saveSettings(settings);
        return { success: true };
    });

    // Qwen-Code detection
    ipcMain.handle('qwen:check-installed', async () => {
        return await checkQwenCodeInstalled();
    });

    // Settings handlers
    ipcMain.handle('settings:save', (_event: any, settings: AppSettings) => {
        saveSettings(settings);
        return { success: true };
    });

    ipcMain.handle('settings:load', () => {
        return loadSettings();
    });
}

app.whenReady().then(() => {
    setupLiteLLMManager();
    setupIpcHandlers();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    litellmManager.stop();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    litellmManager.stop();
});
