#!/usr/bin/env python3
"""Manual FreeType check, independent of the browser's native text rasterizer."""
import argparse
from io import BytesIO
import json
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageChops, ImageDraw, ImageFont

front = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path)
parser.add_argument('--font', type=Path, default=front / 'public/fonts/serif-core.woff2')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
fonts = {}
for label, file in [('before', front / 'scripts/font-sources/GeistSerif-Regular.woff2'), ('after', args.font)]:
    font = TTFont(file)
    font.flavor = None
    buffer = BytesIO()
    font.save(buffer)
    fonts[label] = buffer.getvalue()
results = []
for size in [16, 27, 36, 58]:
    images = []
    widths = []
    for label, data in fonts.items():
        font = ImageFont.truetype(BytesIO(data), size)
        image = Image.new('RGB', (1400, 110), 'white')
        text = 'Review your feedback — “ready”, it’s working…'
        ImageDraw.Draw(image).text((8, 8), text, font=font, fill='black')
        widths.append(font.getlength(text))
        image.save(args.output / f'{label}-{size}.png')
        images.append(image)
    difference = ImageChops.difference(*images)
    count = sum(any(pixel) for pixel in difference.getdata())
    difference.save(args.output / f'diff-{size}.png')
    results.append(dict(size=size, changed_pixels=count,
                        max_channel_delta=max(channel[1] for channel in difference.getextrema()),
                        before_width=widths[0], after_width=widths[1]))
(args.output / 'results.json').write_text(json.dumps(dict(freetype=ImageFont.core.freetype2_version, results=results), indent=2) + '\n')
print(json.dumps(results, indent=2))
raise SystemExit(int(any(result['changed_pixels'] for result in results)))
