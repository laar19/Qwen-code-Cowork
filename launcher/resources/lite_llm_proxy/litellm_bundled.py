#!/usr/bin/env python3
"""
LiteLLM Proxy Bundled Executable
================================
This script is designed to be bundled with PyInstaller for the unified launcher.
It runs the LiteLLM proxy server with model aliasing for Anthropic -> DeepSeek translation.
"""

import os
import sys

def main():
    """Run the LiteLLM proxy with configured settings from environment."""
    
    # Get configuration from environment
    port = int(os.environ.get('LITELLM_PORT', '4000'))
    host = os.environ.get('LITELLM_HOST', '0.0.0.0')
    model = os.environ.get('LITELLM_MODEL', 'deepseek/deepseek-chat')
    drop_params = os.environ.get('LITELLM_DROP_PARAMS', 'true').lower() == 'true'
    debug = os.environ.get('LITELLM_DEBUG', 'false').lower() == 'true'
    
    # Get API key
    deepseek_key = os.environ.get('DEEPSEEK_API_KEY', '')
    
    print("=" * 60)
    print("  LiteLLM Proxy (Bundled)")
    print("=" * 60)
    print(f"\n📡 Server: http://{host}:{port}")
    print(f"🤖 Default Model: {model}")
    print(f"🔑 DeepSeek Key: {'✓ Set' if deepseek_key else '✗ Not Set'}")
    print(f"🔧 Drop Params: {drop_params}")
    print(f"🐛 Debug: {debug}")
    print("=" * 60)
    print("\n📋 Model Aliases (Anthropic → DeepSeek):")
    print("   claude-3-5-sonnet-20241022 → deepseek/deepseek-chat")
    print("   claude-3-sonnet-20240229 → deepseek/deepseek-chat")
    print("=" * 60 + "\n")
    
    try:
        import litellm
        from litellm import Router
        
        # Set litellm settings
        litellm.drop_params = drop_params
        if debug:
            litellm.set_verbose = True
        
        # Configure model list with aliases
        model_list = [
            # DeepSeek models
            {
                "model_name": "deepseek-chat",
                "litellm_params": {
                    "model": "deepseek/deepseek-chat",
                    "api_key": deepseek_key
                }
            },
            {
                "model_name": "deepseek/deepseek-chat",
                "litellm_params": {
                    "model": "deepseek/deepseek-chat",
                    "api_key": deepseek_key
                }
            },
            # Anthropic model aliases → DeepSeek
            {
                "model_name": "claude-3-5-sonnet-20241022",
                "litellm_params": {
                    "model": "deepseek/deepseek-chat",
                    "api_key": deepseek_key
                }
            },
            {
                "model_name": "claude-3-sonnet-20240229",
                "litellm_params": {
                    "model": "deepseek/deepseek-chat",
                    "api_key": deepseek_key
                }
            },
            {
                "model_name": "claude-3-opus-20240229",
                "litellm_params": {
                    "model": "deepseek/deepseek-chat",
                    "api_key": deepseek_key
                }
            },
            {
                "model_name": "claude-3-haiku-20240307",
                "litellm_params": {
                    "model": "deepseek/deepseek-chat",
                    "api_key": deepseek_key
                }
            },
        ]
        
        # Create router with model aliases
        router = Router(model_list=model_list)
        
        # Set the router on litellm proxy
        from litellm.proxy.proxy_server import app, ProxyConfig
        from litellm.proxy import proxy_server
        
        proxy_server.llm_router = router
        proxy_server.llm_model_list = model_list
        
        import uvicorn
        
        log_level = "debug" if debug else "info"
        
        print("🚀 Starting LiteLLM Proxy Server...\n")
        
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level=log_level,
            reload=False,
        )
        
    except ImportError as e:
        print(f"\n❌ Import Error: {e}")
        print("Make sure litellm[proxy] is installed")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
