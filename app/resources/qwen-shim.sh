#!/usr/bin/env python3
import sys
import subprocess
import os
import datetime
import shutil

# Portable Shim for Qwen Cowork
# This script bridges the compatibility gap between Anthropic SDK and Qwen Code CLI.
# It filters unsupported arguments and enables non-blocking mode (-y).

LOG_FILE = "/tmp/qwen-shim.log"

def log(msg):
    # Optional logging
    # with open(LOG_FILE, "a") as f:
    #     f.write(msg + "\n")
    pass

def find_qwen_executable():
    # Try to find qwen or qwen-code in PATH
    qwen = shutil.which("qwen")
    if qwen: return qwen
    qwen_code = shutil.which("qwen-code")
    if qwen_code: return qwen_code
    
    # Fallback to hardcoded attempts if needed (e.g. nvm)
    # But usually PATH should be sufficient if user can run it.
    return None

def main():
    log(f"--- SHIM START {datetime.datetime.now()} ---")
    
    real_qwen = find_qwen_executable()
    if not real_qwen:
        print("Error: 'qwen' or 'qwen-code' executable not found in PATH.", file=sys.stderr)
        log("Error: qwen not found")
        sys.exit(1)
        
    log(f"Using executable: {real_qwen}")
    log(f"Original Args: {sys.argv[1:]}")
    
    # Blocklist of arguments not supported by qwen-code (fork of gemini-cli)
    BLACKLIST_FLAGS = {
        "--verbose", 
        "--setting-sources", 
        "--permission-mode", 
        "--permission-prompt-tool", 
        "--allow-dangerously-skip-permissions"
    }

    new_args = []
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        arg = args[i]
        
        is_bad = False
        for bad in BLACKLIST_FLAGS:
            if arg == bad or arg.startswith(bad + "="):
                is_bad = True
                break
        
        if is_bad:
            log(f"Dropping arg: {arg}")
            # Skip value if next arg is not a flag
            # Flags that take values: permission-mode, permission-prompt-tool, setting-sources
            if arg in ["--permission-mode", "--permission-prompt-tool", "--setting-sources"]:
                if i + 1 < len(args) and not args[i+1].startswith("-"):
                    log(f"Dropping value: {args[i+1]}")
                    i += 1
            i += 1
            continue
            
        new_args.append(arg)
        i += 1

    # Inject YOLO (-y) mode to ensure non-blocking execution (SDK expects bypassPermissions)
    if "-y" not in new_args and "--yolo" not in new_args:
        log("Injecting -y (YOLO mode)")
        new_args.append("-y")

    log(f"Filtered Args: {new_args}")
    
    # Replace process
    cmd = [real_qwen] + new_args
    try:
        os.execv(real_qwen, cmd)
    except Exception as e:
        log(f"EXEC FAILED: {e}")
        print(f"Shim Execution Failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
