#!/usr/bin/env python3
"""
OpenAgentic Config Injector for OpenCode
=========================================
Injects OpenAgentic provider config into your existing opencode.json
WITHOUT overwriting your other settings (providers, model, agents, etc.)

Usage:
  python3 inject-openagentic.py
  python3 inject-openagentic.py --api-key sk-your-key-here
  python3 inject-openagentic.py --set-default
  python3 inject-openagentic.py --remove

One-liner install:
  curl -fsSL https://openagentic.id/inject-openagentic.py | python3 - --api-key YOUR_KEY
"""

import json
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime

# ─── OpenAgentic Provider Config ──────────────────────────────────────────────

OPENAGENTIC_PROVIDER = {
    "npm": "@ai-sdk/openai-compatible",
    "name": "OpenAgentic",
    "options": {
        "baseURL": "https://openagentic.id/api/v1",
        "apiKey": "YOUR_API_KEY_HERE"
    },
    "models": {
        "claude-sonnet-4.5-1m": {
            "name": "Claude Sonnet 4.5 (1M)",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 1000000, "output": 64000}
        },
        "claude-sonnet-4.5": {
            "name": "Claude Sonnet 4.5",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "claude-sonnet-4": {
            "name": "Claude Sonnet 4",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "claude-sonnet-4.6": {
            "name": "Claude Sonnet 4.6",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "claude-opus-4.6": {
            "name": "Claude Opus 4.6",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "claude-opus-4.6-thinking": {
            "name": "Claude Opus 4.6 (Thinking)",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "claude-opus-4.7": {
            "name": "Claude Opus 4.7",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "claude-opus-4.7-thinking": {
            "name": "Claude Opus 4.7 (Thinking)",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "claude-opus-4.8": {
            "name": "Claude Opus 4.8",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "claude-opus-4.8-thinking": {
            "name": "Claude Opus 4.8 (Thinking)",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "oa-claude-opus-4.6": {
            "name": "OA Claude Opus 4.6",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "gpt-5.5": {
            "name": "GPT 5.5",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "gpt-5.3-codex": {
            "name": "GPT 5.3 Codex",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "gpt-5.4": {
            "name": "GPT 5.4",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 64000}
        },
        "gemini-2.5-flash": {
            "name": "Gemini 2.5 Flash",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 1048576, "output": 65536}
        },
        "gemini-2.5-pro": {
            "name": "Gemini 2.5 Pro",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 1048576, "output": 65536}
        },
        "gemini-2.5-flash-image": {
            "name": "Gemini 2.5 Flash (Image)",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text", "image"]},
            "limit": {"context": 32768, "output": 32768}
        },
        "gemini-3.1-flash-tts-preview": {
            "name": "Gemini 3.1 Flash TTS Preview",
            "attachment": False, "reasoning": False, "tool_call": False, "temperature": True,
            "modalities": {"input": ["text"], "output": ["text", "audio"]},
            "limit": {"context": 8192, "output": 16384}
        },
        "gemini-3.1-pro-preview": {
            "name": "Gemini 3.1 Pro Preview",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 1048576, "output": 65536}
        },
        "gemini-3.1-pro": {
            "name": "Gemini 3.1 Pro",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 1048576, "output": 65536}
        },
        "gemini-3.5-flash": {
            "name": "Gemini 3.5 Flash",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 1048576, "output": 65536}
        },
        "DeepSeek-V4-Pro": {
            "name": "DeepSeek V4 Pro",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 128000, "output": 32768}
        },
        "deepseek-3.2": {
            "name": "DeepSeek 3.2",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 128000, "output": 32768}
        },
        "Qwen3.5-9B": {
            "name": "Qwen 3.5 9B",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 32768, "output": 8192}
        },
        "Qwen3.6-27B": {
            "name": "Qwen 3.6 27B",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 131072, "output": 32768}
        },
        "qwen3.7-max": {
            "name": "Qwen 3.7 Max",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 131072, "output": 32768}
        },
        "Kimi-K2.6": {
            "name": "Kimi K2.6",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 131072, "output": 32768}
        },
        "glm-5": {
            "name": "GLM 5",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 128000, "output": 16384}
        },
        "GLM-5.1": {
            "name": "GLM 5.1",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 128000, "output": 16384}
        },
        "MiniMax-M2.7": {
            "name": "MiniMax M2.7",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 32768}
        },
        "minimax-m2.1": {
            "name": "MiniMax M2.1",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 32768}
        },
        "minimax-m3": {
            "name": "MiniMax M3",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 200000, "output": 32768}
        },
        "mimo-v2.5-pro": {
            "name": "Mimo V2.5 Pro",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 128000, "output": 32768}
        },
        "mimo-v2.5": {
            "name": "Mimo V2.5",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 128000, "output": 32768}
        },
        "mimo-v2-pro": {
            "name": "Mimo V2 Pro",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "pdf"], "output": ["text"]},
            "limit": {"context": 128000, "output": 32768}
        },
        "mimo-v2-omni": {
            "name": "Mimo V2 Omni",
            "attachment": True, "reasoning": True, "tool_call": True, "temperature": True,
            "modalities": {"input": ["text", "image", "audio"], "output": ["text"]},
            "limit": {"context": 128000, "output": 32768}
        }
    }
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_config_path():
    """Find opencode.json config path (cross-platform)"""
    xdg = os.environ.get("XDG_CONFIG_HOME")
    if xdg:
        return Path(xdg) / "opencode" / "opencode.json"
    if sys.platform == "darwin":
        return Path.home() / ".config" / "opencode" / "opencode.json"
    elif sys.platform == "win32":
        appdata = os.environ.get("APPDATA", str(Path.home() / "AppData" / "Roaming"))
        return Path(appdata) / "opencode" / "opencode.json"
    else:
        return Path.home() / ".config" / "opencode" / "opencode.json"


def colored(text, color):
    """Simple ANSI color"""
    colors = {"green": "32", "yellow": "33", "red": "31", "cyan": "36", "bold": "1", "dim": "2"}
    code = colors.get(color, "0")
    return "\033[{}m{}\033[0m".format(code, text)


def print_banner():
    print()
    print(colored("╔══════════════════════════════════════════════════╗", "cyan"))
    print(colored("║   OpenAgentic Config Injector for OpenCode       ║", "cyan"))
    print(colored("║   https://openagentic.id                         ║", "cyan"))
    print(colored("╚══════════════════════════════════════════════════╝", "cyan"))
    print()


def print_models():
    print(colored("  Available models (36):", "dim"))
    print(colored("  ─────────────────────", "dim"))
    for model_id, info in OPENAGENTIC_PROVIDER["models"].items():
        print("    \u2022 {} \u2014 {}".format(model_id, info['name']))
    print()


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Inject OpenAgentic provider into OpenCode config")
    parser.add_argument("--api-key", help="Your OpenAgentic API key (from dashboard)")
    parser.add_argument("--set-default", action="store_true", help="Set openagentic/claude-sonnet-4.5 as default model")
    parser.add_argument("--list-models", action="store_true", help="List all available models")
    parser.add_argument("--config", help="Custom path to opencode.json")
    parser.add_argument("--remove", action="store_true", help="Remove OpenAgentic provider from config")
    args = parser.parse_args()

    print_banner()

    if args.list_models:
        print_models()
        return

    # Determine config path
    config_path = Path(args.config) if args.config else get_config_path()
    print("  Config: {}".format(colored(str(config_path), 'cyan')))

    # Load existing config or create new
    config = {}
    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
            print("  Status: {}".format(colored('Existing config found', 'green')))
        except json.JSONDecodeError as e:
            print("  {}".format(colored('Warning: Config has invalid JSON: {}'.format(e), 'red')))
            print("  {}".format(colored('  Creating backup and starting fresh...', 'yellow')))
            backup = config_path.with_suffix(".json.bak.{}".format(datetime.now().strftime('%Y%m%d%H%M%S')))
            shutil.copy2(config_path, backup)
            print("  Backup: {}".format(colored(str(backup), 'dim')))
            config = {}
    else:
        print("  Status: {}".format(colored('No existing config — creating new', 'yellow')))
        config_path.parent.mkdir(parents=True, exist_ok=True)

    # Handle --remove
    if args.remove:
        if "provider" in config and "openagentic" in config["provider"]:
            del config["provider"]["openagentic"]
            if not config["provider"]:
                del config["provider"]
            if config.get("model", "").startswith("openagentic/"):
                del config["model"]
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
                f.write("\n")
            print("\n  {}".format(colored('✓ OpenAgentic provider removed', 'green')))
        else:
            print("\n  {}".format(colored('ℹ OpenAgentic provider not found in config', 'yellow')))
        return

    # Backup before modifying
    if config_path.exists():
        backup = config_path.with_suffix(".json.bak.{}".format(datetime.now().strftime('%Y%m%d%H%M%S')))
        shutil.copy2(config_path, backup)
        print("  Backup: {}".format(colored(str(backup), 'dim')))

    # Ensure schema
    if "$schema" not in config:
        config["$schema"] = "https://opencode.ai/config.json"

    # Ensure provider dict exists
    if "provider" not in config:
        config["provider"] = {}

    # Deep copy provider data
    provider_data = json.loads(json.dumps(OPENAGENTIC_PROVIDER))

    # Handle API key
    if args.api_key:
        provider_data["options"]["apiKey"] = args.api_key
    elif "openagentic" in config["provider"]:
        existing_key = config["provider"]["openagentic"].get("options", {}).get("apiKey", "")
        if existing_key and existing_key != "YOUR_API_KEY_HERE":
            provider_data["options"]["apiKey"] = existing_key
            print("  API Key: {}".format(colored('Preserved existing key', 'green')))
        else:
            print("  API Key: {}".format(colored('YOUR_API_KEY_HERE (replace with your key)', 'yellow')))
    else:
        print()
        try:
            key = input("  Enter your API key (or press Enter to skip): ").strip()
            if key:
                provider_data["options"]["apiKey"] = key
            else:
                print("  API Key: {}".format(colored('Skipped — edit config later to add your key', 'yellow')))
        except (EOFError, KeyboardInterrupt):
            print()
            print("  API Key: {}".format(colored('Skipped', 'yellow')))

    # Check what's being updated
    if "openagentic" in config["provider"]:
        old_models = len(config["provider"]["openagentic"].get("models", {}))
        new_models = len(provider_data["models"])
        print("\n  {}".format(colored(
            'Updating OpenAgentic provider ({} -> {} models)'.format(old_models, new_models), 'green')))
    else:
        num_models = len(provider_data["models"])
        print("\n  {}".format(colored(
            '+ Adding OpenAgentic provider ({} models)'.format(num_models), 'green')))

    # Inject provider (only touches config["provider"]["openagentic"])
    config["provider"]["openagentic"] = provider_data

    # Optionally set default model
    if args.set_default:
        config["model"] = "openagentic/claude-sonnet-4.5"
        print("  {}".format(colored('✓ Default model set to openagentic/claude-sonnet-4.5', 'green')))

    # Show other providers (not touched)
    other_providers = [k for k in config["provider"] if k != "openagentic"]
    if other_providers:
        print("\n  Other providers (untouched): {}".format(colored(', '.join(other_providers), 'dim')))

    # Write config
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print("\n  {} Config saved to {}".format(colored('✅ Done!', 'green'), config_path))
    print()
    print("  {}".format(colored("Quick start:", "bold")))
    print("    opencode --model openagentic/claude-sonnet-4.5")
    print()
    print("  {}".format(colored("All models use prefix: openagentic/<model-id>", "dim")))
    print("  {}".format(colored("Run with --list-models to see all available models", "dim")))
    print()


if __name__ == "__main__":
    main()
