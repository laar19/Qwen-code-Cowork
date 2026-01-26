#!/usr/bin/env python3
"""
LiteLLM Proxy Launcher
======================
A configurable Python script to run LiteLLM as a local proxy server.
This allows you to use models like DeepSeek, Qwen, or Mistral with
applications that expect Anthropic/OpenAI API format.

Environment Variables:
----------------------
LITELLM_PORT          - Port to run the proxy on (default: 4000)
LITELLM_HOST          - Host address (default: 0.0.0.0)
LITELLM_MODEL         - Model to use (default: deepseek/deepseek-chat)
LITELLM_DROP_PARAMS   - Drop unsupported params (default: true)
LITELLM_DEBUG         - Enable debug mode (default: false)
LITELLM_CONFIG_PATH   - Path to config.yaml (optional)

API Keys (set these based on your provider):
DEEPSEEK_API_KEY      - DeepSeek API key
OPENAI_API_KEY        - OpenAI/SiliconFlow API key
MISTRAL_API_KEY       - Mistral API key
ANTHROPIC_API_KEY     - Anthropic API key
GEMINI_API_KEY        - Google Gemini API key

Usage:
------
1. Copy .env.example to .env and configure your settings
2. Run: python litellm_proxy.py
   Or:  ./litellm_proxy.py (if executable)
"""

import os
import sys
import subprocess
from pathlib import Path

# Try to load dotenv if available
try:
    from dotenv import load_dotenv
    # Load .env file from script directory
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✓ Loaded environment from: {env_path}")
except ImportError:
    print("ℹ python-dotenv not installed. Using system environment variables only.")
    print("  Install with: pip install python-dotenv")


def get_env(key: str, default: str = "") -> str:
    """Get environment variable with default value."""
    return os.environ.get(key, default)


def get_env_bool(key: str, default: bool = False) -> bool:
    """Get environment variable as boolean."""
    value = os.environ.get(key, str(default)).lower()
    return value in ("true", "1", "yes", "on")


# =============================================================================
# CONFIGURATION - Modify these defaults or set via environment variables
# =============================================================================

# Server Configuration
PORT = get_env("LITELLM_PORT", "4000")
HOST = get_env("LITELLM_HOST", "0.0.0.0")

# Model Configuration
# Common models:
#   - deepseek/deepseek-chat
#   - deepseek/deepseek-coder
#   - openai/gpt-4
#   - openai/gpt-3.5-turbo
#   - mistral/mistral-large-latest
#   - anthropic/claude-3-sonnet-20240229
#   - gemini/gemini-pro
MODEL = get_env("LITELLM_MODEL", "deepseek/deepseek-chat")

# Proxy Options
DROP_PARAMS = get_env_bool("LITELLM_DROP_PARAMS", True)
DEBUG = get_env_bool("LITELLM_DEBUG", False)

# Optional: Path to config.yaml for advanced configuration
CONFIG_PATH = get_env("LITELLM_CONFIG_PATH", "")

# =============================================================================
# API KEY VALIDATION
# =============================================================================

def check_api_keys():
    """Check which API keys are configured."""
    api_keys = {
        "DEEPSEEK_API_KEY": "DeepSeek",
        "OPENAI_API_KEY": "OpenAI/SiliconFlow",
        "MISTRAL_API_KEY": "Mistral",
        "ANTHROPIC_API_KEY": "Anthropic",
        "GEMINI_API_KEY": "Google Gemini",
        "AZURE_API_KEY": "Azure OpenAI",
        "COHERE_API_KEY": "Cohere",
        "HUGGINGFACE_API_KEY": "HuggingFace",
    }
    
    print("\n🔑 API Keys Status:")
    print("-" * 40)
    
    configured = []
    for key, name in api_keys.items():
        value = os.environ.get(key, "")
        if value:
            # Show masked key
            masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
            print(f"  ✓ {name}: {masked}")
            configured.append(name)
        else:
            print(f"  ✗ {name}: Not set")
    
    print("-" * 40)
    
    if not configured:
        print("\n⚠️  WARNING: No API keys configured!")
        print("   Set at least one API key in .env or environment variables.")
        return False
    
    return True


# =============================================================================
# MAIN LAUNCHER
# =============================================================================

def build_command() -> list:
    """Build the litellm command with all options."""
    cmd = ["litellm"]
    
    # Use config file if specified
    if CONFIG_PATH and Path(CONFIG_PATH).exists():
        cmd.extend(["--config", CONFIG_PATH])
        print(f"📄 Using config file: {CONFIG_PATH}")
    else:
        # Use command line options
        cmd.extend(["--model", MODEL])
    
    # Server options
    cmd.extend(["--port", PORT])
    cmd.extend(["--host", HOST])
    
    # Additional options
    if DROP_PARAMS:
        cmd.append("--drop_params")
    
    if DEBUG:
        cmd.append("--debug")
    
    return cmd


def print_banner():
    """Print startup banner with configuration info."""
    print("=" * 60)
    print("  LiteLLM Proxy Launcher")
    print("=" * 60)
    print(f"""
📡 Server Configuration:
   Host: {HOST}
   Port: {PORT}
   URL:  http://{HOST}:{PORT}

🤖 Model: {MODEL}

⚙️  Options:
   Drop Params: {DROP_PARAMS}
   Debug Mode:  {DEBUG}
   Config File: {CONFIG_PATH or 'None'}
""")


def print_usage_instructions():
    """Print instructions for using the proxy."""
    print(f"""
📋 Usage Instructions:
{"=" * 60}

1. Set your API Base URL in your application to:
   http://localhost:{PORT}/v1/messages  (for Anthropic format)
   http://localhost:{PORT}/v1/chat/completions  (for OpenAI format)

2. Use any dummy API key (e.g., sk-1234) since the real key
   is configured in the proxy.

3. Example curl command:
   curl -X POST http://localhost:{PORT}/v1/chat/completions \\
     -H "Authorization: Bearer sk-1234" \\
     -H "Content-Type: application/json" \\
     -d '{{"model": "{MODEL}", "messages": [{{"role": "user", "content": "Hello!"}}]}}'

{"=" * 60}
""")


def main():
    """Main entry point."""
    print_banner()
    
    # Check API keys
    if not check_api_keys():
        print("\n❌ Exiting: Please configure at least one API key.")
        sys.exit(1)
    
    # Build command
    cmd = build_command()
    
    print_usage_instructions()
    
    print(f"🚀 Starting LiteLLM Proxy...")
    print(f"   Command: {' '.join(cmd)}")
    print("-" * 60)
    print()
    
    # Run litellm
    try:
        subprocess.run(cmd, check=True)
    except FileNotFoundError:
        print("\n❌ Error: LiteLLM not found!")
        print("   Install with: pip install 'litellm[proxy]'")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 Proxy stopped by user.")
        sys.exit(0)
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error: LiteLLM exited with code {e.returncode}")
        sys.exit(e.returncode)


if __name__ == "__main__":
    main()
