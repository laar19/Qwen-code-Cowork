# Qwen Cowork

<p align="center">
  <strong>The Native GUI Companion for Qwen Code</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#building-from-source">Build</a> •
  <a href="#credits">Credits</a>
</p>

---

**Qwen Cowork** is a dedicated desktop interface for the **Qwen Code** CLI. It brings the powerful, agentic capabilities of Qwen directly into a beautiful, persistent chat workspace.

## 🚀 Why Qwen Cowork?

- **Native Integration**: Works directly with your installed `qwen-code` CLI. No complex proxies or config overrides needed.
- **Authentication Bridge**: Seamlessly uses the authentication you've already set up in your terminal.
- **Compatibility Shim**: Includes an embedded shim to bridge compatibility gaps between the standard agent protocol and Qwen's specific CLI arguments.
- **Free & Open**: If you have `qwen-code` access, you have Qwen Cowork access.

## ✨ Features

- 🖥️ **Agent Workspace**: A proper IDE-like interface for your AI agent.
- 📁 **File Context**: Easily drag & drop files or folders for context.
- ⚡ **Direct Execution**: The agent runs locally on your machine, interacting with your files directly (safe mode recommended).
- 🛠️ **Troubleshooting Logs**: Built-in compatibility logging to `/tmp/qwen-shim.log`.

---

## ⚡ Quick Start

### Prerequisites

1. **Install Qwen Code**: Follow the installation instructions from the [official Qwen Code repository](https://github.com/QwenLM/qwen-code/tree/main) or the [Qwen Code documentation](https://qwenlm.github.io/qwen-code-docs/en/users/overview/).

2. **Authenticate**:
   Authenticate with Qwen Code using the login command in your terminal.

### Run the App

1. Download the latest **AppImage** from releases.
2. Make it executable:
   ```bash
   chmod +x Qwen\ Cowork-*.AppImage
   ```
3. Run it:
   ```bash
   ./Qwen\ Cowork-*.AppImage --no-sandbox
   ```

*Note: The `--no-sandbox` flag is required for Electron AppImages on many Linux systems.*

---

## 🛠️ Building from Source

Requirements:
- Python 3.8+
- [Bun](https://bun.sh) (Globally installed)
- `qwen-code` (Globally installed)

### 1. Build the AppImage

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/qwen-code-companion.git
cd qwen-code-companion

# Run the build script
python3 build_appimage.py
```

This will automatically:
1. Install dependencies via `bun`
2. Compile the React UI
3. Package the Electron app
4. Generate the AppImage in the project root

---

## 🏗️ Project Structure

```
qwen_code_companion/
├── app/                  # Source code (Electron + React)
│   ├── resources/
│   │   └── qwen-shim.sh  # Compatibility bridge for Qwen CLI
│   ├── src/ui/           # React Frontend
│   └── src/electron/     # Electron Backend
├── build_appimage.py     # Automation script
└── README.md             # This file
```

---

## 🤝 Credits & Acknowledgments

This project builds upon the excellent work of **[Claude-Cowork](https://github.com/DevAgentForge/Claude-Cowork)** by **DevAgentForge**.
The original project provided the foundational UI/UX design and desktop application framework that made this Qwen adaptation possible.

### Original Project Attribution
- **Original Project**: [Claude-Cowork](https://github.com/DevAgentForge/Claude-Cowork)
- **Creator**: DevAgentForge
- **License**: MIT

### Our Adaptation
- **Adapted Interface**: The desktop UI and user experience was adapted from Claude-Cowork
- **Agent Engine**: [Qwen Code](https://qwen.aliyun.com/) (Alibaba Cloud)
- **Purpose**: Providing a native GUI companion for Qwen Code users

We thank the Claude-Cowork team for creating an open-source foundation that enabled this Qwen-specific implementation.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) file for details.
