#!/usr/bin/env python3
"""
Generate platform-specific decoder data files from the canonical JSON sources.

Usage:
    python3 scripts/generate_decoder_data.py

Sources (edit these to add or update model codes):
    tools/decoder-data/modern_models.json       [[code, identifier, name], ...]
    tools/decoder-data/vintage_model_codes.json {code: name | null, ...}

Outputs:
    ios/.../SerialDecoder/Data/modern_models.swift      (chunked to avoid OOM)
    ios/.../SerialDecoder/Data/vintage_model_codes.swift
    tools/serial-decoder/.../modern_models.swift        (same, for CLI tool)
    tools/serial-decoder/.../vintage_model_codes.swift
    web/src/lib/modern_models.json                      (direct import for TypeScript)
    web/src/lib/vintage_model_codes.json                (direct import for TypeScript)
"""

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODERN_JSON  = os.path.join(ROOT, "tools", "decoder-data", "modern_models.json")
VINTAGE_JSON = os.path.join(ROOT, "tools", "decoder-data", "vintage_model_codes.json")

IOS_DIR   = os.path.join(ROOT, "ios", "InventoryDifferent", "InventoryDifferent",
                         "Utilities", "SerialDecoder", "Data")
TOOLS_DIR = os.path.join(ROOT, "tools", "serial-decoder", "Sources",
                         "SerialDecoderLib", "Data")
WEB_LIB   = os.path.join(ROOT, "web", "src", "lib")

CHUNK_SIZE = 500

# ── Modern models ─────────────────────────────────────────────────────────────

def generate_modern_swift(entries, out_path):
    chunks = [entries[i:i+CHUNK_SIZE] for i in range(0, len(entries), CHUNK_SIZE)]
    lines = [
        "// Modern Apple Mac model lookup table.",
        "// DO NOT EDIT — regenerate with scripts/generate_decoder_data.py",
        "// Split into chunks to avoid swift-frontend memory exhaustion on large dictionary literals.",
        "",
        "typealias ModernModelEntry = (identifier: String, name: String)",
        "",
    ]
    chunk_names = []
    for i, chunk in enumerate(chunks):
        name = f"_modernModelChunk{i+1:02d}"
        chunk_names.append(name)
        lines.append(f"private let {name}: [String: ModernModelEntry] = [")
        for code, ident, model_name in chunk:
            lines.append(f'    "{code}": ("{ident}", "{model_name}"),')
        lines.append("]")
        lines.append("")

    lines += [
        f"let modernModelCodes: [String: ModernModelEntry] = {{",
        f"    var d = [String: ModernModelEntry](minimumCapacity: {len(entries) + 50})",
    ]
    for name in chunk_names:
        lines.append(f"    for (k, v) in {name} {{ d[k] = v }}")
    lines += [
        "    return d",
        "}()",
        "",
        "func lookupModernModel(_ configCode: String) -> (String?, String?) {",
        "    guard let entry = modernModelCodes[configCode] else { return (nil, nil) }",
        "    return (entry.identifier, entry.name)",
        "}",
    ]
    _write(out_path, "\n".join(lines) + "\n")

# ── Vintage model codes ───────────────────────────────────────────────────────

def generate_vintage_swift(codes, out_path):
    lines = [
        "// Vintage Apple serial number model code lookup table.",
        "// DO NOT EDIT — regenerate with scripts/generate_decoder_data.py",
        "",
        "let vintageModelCodes: [String: String?] = [",
    ]
    for code, name in sorted(codes.items()):
        if name is None:
            lines.append(f'    "{code}":      nil,')
        else:
            escaped = name.replace('"', '\\"')
            lines.append(f'    "{code}":      "{escaped}",')
    lines += [
        "]",
        "",
        "func lookupVintageModel(_ code: String) -> String? {",
        "    vintageModelCodes[code] ?? nil",
        "}",
    ]
    _write(out_path, "\n".join(lines) + "\n")

# ── Helpers ───────────────────────────────────────────────────────────────────

def _write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  wrote {os.path.relpath(path, ROOT)}")

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    modern  = json.load(open(MODERN_JSON,  encoding="utf-8"))
    vintage = json.load(open(VINTAGE_JSON, encoding="utf-8"))
    print(f"modern: {len(modern)} entries  |  vintage: {len(vintage)} entries")

    print("Generating Swift (iOS)...")
    generate_modern_swift(modern,  os.path.join(IOS_DIR,   "modern_models.swift"))
    generate_vintage_swift(vintage, os.path.join(IOS_DIR,  "vintage_model_codes.swift"))

    print("Generating Swift (tools/serial-decoder)...")
    generate_modern_swift(modern,  os.path.join(TOOLS_DIR, "modern_models.swift"))
    generate_vintage_swift(vintage, os.path.join(TOOLS_DIR, "vintage_model_codes.swift"))

    print("Copying JSON for web...")
    _write(os.path.join(WEB_LIB, "modern_models.json"),
           json.dumps(modern, indent=2) + "\n")
    _write(os.path.join(WEB_LIB, "vintage_model_codes.json"),
           json.dumps(vintage, indent=2, sort_keys=True) + "\n")

    print("Done.")

if __name__ == "__main__":
    main()
