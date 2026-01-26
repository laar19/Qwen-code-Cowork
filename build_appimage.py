#!/usr/bin/env python3
"""
Qwen Code Companion - AppImage Builder
======================================
Builds the standalone Qwen Cowork GUI AppImage.

Usage:
    python3 build_appimage.py
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.absolute()
APP_DIR = PROJECT_ROOT / "app"

def run_cmd(cmd: list, cwd: Path = None, check=True) -> subprocess.CompletedProcess:
    """Run a command in the app directory."""
    print(f"\n{'-'*60}")
    print(f"Running: {' '.join(cmd)}")
    print(f"{'-'*60}")
    
    return subprocess.run(
        cmd,
        cwd=cwd or APP_DIR,
        capture_output=False,
        text=True,
        check=check
    )

def main():
    print("=" * 60)
    print("  Qwen Code Companion - Builder")
    print("=" * 60)
    print(f"\nProject root: {PROJECT_ROOT}")
    print(f"App dir: {APP_DIR}")
    
    if not APP_DIR.exists():
        print(f"\n❌ Error: App directory not found at {APP_DIR}")
        return 1
    
    # 1. Install dependencies
    print("\n📦 Installing dependencies...")
    run_cmd(['bun', 'install'])
    
    # 2. Build React UI
    print("\n🔨 Building UI...")
    run_cmd(['bun', 'run', 'build'])
    
    # 3. Build AppImage
    print("\n📦 Building AppImage...")
    # Clean previous builds to avoid confusion
    dist_dir = APP_DIR / "dist"
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
        
    run_cmd(['bun', 'run', 'dist:linux'])
    
    # 4. Copy to root
    appimages = list(dist_dir.glob('*.AppImage'))
    
    if appimages:
        src = appimages[0]
        # Copy to root with standard name
        dest = PROJECT_ROOT / src.name
        
        print(f"\n✅ Copying {src.name} to project root...")
        shutil.copy2(src, dest)
        dest.chmod(0o755)
        
        print(f"\n🎉 Build Complete!")
        print(f"  > {dest}")
        print(f"  > Size: {dest.stat().st_size / (1024*1024):.1f} MB")
        print(f"\nRun with: ./{dest.name} --no-sandbox")
        return 0
    else:
        print("\n❌ Build failed: No AppImage found in dist/")
        return 1

if __name__ == '__main__':
    sys.exit(main())
