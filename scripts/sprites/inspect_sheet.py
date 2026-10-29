"""Debug helper: segment a sheet and write a numbered contact sheet of every detected figure.

Usage: python scripts/sprites/inspect_sheet.py <sheet.png|jpg> <out.png>
"""
import sys

from PIL import Image, ImageDraw

from sheetlib import extract_figures, group_rows


def main() -> None:
    src, out = sys.argv[1], sys.argv[2]
    figures, _ = extract_figures(src)
    rows = group_rows(figures)
    cell_h = 150
    max_cols = max(len(r) for r in rows)
    sheet = Image.new("RGBA", (max_cols * 110 + 40, len(rows) * (cell_h + 20)), (40, 44, 52, 255))
    draw = ImageDraw.Draw(sheet)
    for ri, row in enumerate(rows):
        draw.text((4, ri * (cell_h + 20) + 4), str(ri), fill=(255, 255, 0, 255))
        for ci, fig in enumerate(row):
            im = Image.fromarray(fig.rgba, "RGBA")
            scale = min(100 / im.width, cell_h / im.height)
            im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.NEAREST)
            ox = 40 + ci * 110
            oy = ri * (cell_h + 20) + 16
            sheet.alpha_composite(im, (ox, oy))
            draw.text((ox, oy - 12), str(ci), fill=(255, 255, 255, 255))
    sheet.save(out)
    print(src, "rows:", [len(r) for r in rows])


if __name__ == "__main__":
    main()
