"""Generate source art through OpenRouter with a hard spend cap.

    python scripts/sprites/generate_sheet.py --prompt-file p.txt --out art/source/x.png \
        [--ref ref1.png --ref ref2.png] [--model google/gemini-3.1-flash-image]

Reads OPENROUTER_API_KEY from .env. Every call's reported cost is appended to
art/source/generation_ledger.jsonl (append-only, safe for parallel runs); a call is refused when the ledger total plus a
per-call estimate would exceed BUDGET_USD.
"""
from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
LEDGER = ROOT / "art" / "source" / "generation_ledger.jsonl"
BUDGET_USD = 7.0  # raised from 6.0 with the owner's approval for the heavy-build redo
ESTIMATE_PER_CALL_USD = 0.35  # conservative ceiling used only for the pre-flight check


def api_key() -> str:
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        if line.startswith("OPENROUTER_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("OPENROUTER_API_KEY missing from .env")


def ledger() -> list[dict]:
    if not LEDGER.exists():
        return []
    return [json.loads(line) for line in LEDGER.read_text(encoding="utf-8").splitlines() if line.strip()]


def spent() -> float:
    return sum(e.get("cost_usd", 0.0) for e in ledger())


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt-file", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--ref", action="append", default=[])
    parser.add_argument("--model", default="google/gemini-3.1-flash-image")
    parser.add_argument("--aspect", default="16:9")
    args = parser.parse_args()

    total = spent()
    if total + ESTIMATE_PER_CALL_USD > BUDGET_USD:
        sys.exit(f"Refusing: ${total:.2f} already spent of ${BUDGET_USD:.2f} budget.")

    prompt = Path(args.prompt_file).read_text(encoding="utf-8")
    content: list[dict] = [{"type": "text", "text": prompt}]
    for ref in args.ref:
        content.append({"type": "image_url", "image_url": {"url": data_uri(Path(ref))}})

    body = {
        "model": args.model,
        "messages": [{"role": "user", "content": content}],
        "modalities": ["image", "text"],
        "image_config": {"aspect_ratio": args.aspect},
        "usage": {"include": True},
    }
    started = time.time()
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key()}", "Content-Type": "application/json"},
        json=body,
        timeout=300,
    )
    data = resp.json()
    usage = data.get("usage") or {}
    cost = float(usage.get("cost") or 0.0)
    entry = {
        "time": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "model": args.model,
        "out": args.out,
        "status": resp.status_code,
        "cost_usd": cost,
        "seconds": round(time.time() - started, 1),
    }
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    with LEDGER.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry) + "\n")

    if resp.status_code != 200 or "choices" not in data:
        sys.exit(f"Request failed ({resp.status_code}): {json.dumps(data)[:800]}")

    message = data["choices"][0]["message"]
    images = message.get("images") or []
    if not images:
        sys.exit(f"No image returned. Text: {str(message.get('content'))[:500]}")
    url = images[0]["image_url"]["url"]
    raw = base64.b64decode(url.split(",", 1)[1])
    out = ROOT / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(raw)
    print(f"wrote {args.out}  cost ${cost:.4f}  total spent ${spent():.4f} / ${BUDGET_USD:.2f}")


if __name__ == "__main__":
    main()
