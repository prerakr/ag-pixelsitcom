"""Build the standalone sprite review page (the "model sheet") from the generated atlases.

    python scripts/sprites/build_review_page.py [--out art/review/sprite_review.html]

The page is a single self-contained HTML file: the character atlases and a floor texture are
embedded as data URIs, so it opens straight from disk (double-click) with no server and no
build. Re-run after process_characters.py whenever the art changes.
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from process_characters import CONFIG, DIRECTIONS, FRAMES_PER_DIRECTION, REGEN_DIR, read_cast  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = Path(__file__).with_name("review_template.html")
ATLAS_TS = ROOT / "src" / "data" / "sprites" / "generated" / "characterAtlas.ts"
TILE_TS = ROOT / "src" / "data" / "sprites" / "generated" / "tileAtlas.ts"
DEFAULT_OUT = ROOT / "art" / "review" / "sprite_review.html"

SHOW_NAMES = {"the_office": "The Office", "friends": "Friends", "silicon_valley": "Silicon Valley", "himym": "How I Met Your Mother"}
SHOW_TOKENS = {"the_office": "office", "friends": "friends", "silicon_valley": "silicon", "himym": "himym"}


def data_uri(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def nicknames() -> dict[str, str]:
    out: dict[str, str] = {}
    for path in (ROOT / "src" / "data" / "characters").glob("*_cast.ts"):
        text = path.read_text(encoding="utf-8")
        ids = list(re.finditer(r"\bid:\s*'([a-z_]+)'", text))
        for i, m in enumerate(ids):
            block = text[m.end(): ids[i + 1].start() if i + 1 < len(ids) else len(text)]
            nick = re.search(r"\bnickname:\s*(['\"])(.+?)\1", block)
            if nick:
                out[m.group(1)] = nick.group(2)
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--fragment", action="store_true",
                        help="omit the doctype/head wrapper (for hosts that add their own, e.g. a Claude artifact)")
    args = parser.parse_args()

    atlas_text = ATLAS_TS.read_text(encoding="utf-8")
    cell = re.search(r"CHARACTER_CELL = \{ width: (\d+), height: (\d+), baseline: (\d+) \}", atlas_text)
    entries = {m.group(1): (m.group(2), int(m.group(3)))
               for m in re.finditer(r"\b([a-z_]+): \{ imageKey: '(\w+)', row: (\d+) \}", atlas_text)}
    images = dict(re.findall(r"\b(\w+): '(/sprites/characters/\w+\.png)'", atlas_text))

    tile_text = TILE_TS.read_text(encoding="utf-8")
    tile_json = json.loads(re.search(r"TILE_THEME_ATLAS: Record<string, TileThemeAtlas> = (\{.*?\n\});", tile_text, re.S).group(1))
    carpet = tile_json["office"]["tiles"]["floor_carpet_grey"]

    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    cast = read_cast()
    nicks = nicknames()
    characters, shows = [], []
    for show_id, show in cfg["shows"].items():
        token = SHOW_TOKENS.get(show_id, show_id)
        shows.append({"id": token, "name": SHOW_NAMES.get(show_id, show_id)})
        for sheet in show["sheets"]:
            for char_id in sheet["rows"]:
                if char_id is None or char_id not in entries:
                    continue
                atlas, row = entries[char_id]
                info = cast.get(char_id, {})
                characters.append({
                    "id": char_id,
                    "name": info.get("name", char_id),
                    "nickname": nicks.get(char_id),
                    "show": token,
                    "showName": SHOW_NAMES.get(show_id, show_id),
                    "atlas": atlas,
                    "row": row,
                    "heightScale": info.get("heightScale", 1.0),
                    "bodyType": info.get("bodyType", "normal"),
                    "source": "regen" if (REGEN_DIR / f"{char_id}.png").exists() else "original",
                })

    data = {
        "generated": time.strftime("%Y-%m-%d %H:%M"),
        "cell": {"width": int(cell.group(1)), "height": int(cell.group(2)), "baseline": int(cell.group(3))},
        "framesPerDirection": FRAMES_PER_DIRECTION,
        "directions": DIRECTIONS,
        "atlases": {key: data_uri(ROOT / "public" / url.lstrip("/")) for key, url in images.items()},
        "floor": {"src": data_uri(ROOT / "public" / "sprites" / "tiles" / f"{tile_json['office']['imageKey']}.png"),
                  "x": carpet["x"], "y": carpet["y"], "w": 32 * carpet["cols"], "h": 32 * carpet["rows"]},
        "shows": shows,
        "characters": characters,
    }
    html = TEMPLATE.read_text(encoding="utf-8").replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":")))
    if not args.fragment:
        html = (
            '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + html
        )
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(html)
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB, {len(characters)} characters)")


if __name__ == "__main__":
    main()
