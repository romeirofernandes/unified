#!/usr/bin/env python3
"""Compare QA runs, fail on every changed pixel, and save readable magnified diffs."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('before', type=Path)
parser.add_argument('after', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--rounding-tolerance', type=int, choices=[0, 1, 2], default=0, help='explicitly classify tiny channel rounding, raw changed-pixel counts stay intact')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
before = json.loads((args.before / 'pages.json').read_text())
after = json.loads((args.after / 'pages.json').read_text())
assert before['browser'] == after['browser']
assert [p['name'] for p in before['pages']] == [p['name'] for p in after['pages']]
results = []
for a, b in zip(before['pages'], after['pages']):
    assert a['text'] == b['text'], f"Content changed: {a['name']}"
    x = Image.open(args.before / (a['name'] + '.png')).convert('RGB')
    y = Image.open(args.after / (a['name'] + '.png')).convert('RGB')
    canvas_size = (max(x.width, y.width), max(x.height, y.height))
    def canvas(im):
        c = Image.new('RGB', canvas_size, 'magenta')
        c.paste(im, (0, 0))
        return c
    diff = ImageChops.difference(canvas(x), canvas(y))
    count = sum(any(rgb) for rgb in diff.getdata())
    max_delta = max(v[1] for v in diff.getextrema())
    beyond_tolerance = sum(max(rgb) > args.rounding_tolerance for rgb in diff.getdata())
    assert a['sizes'] == b['sizes'], 'Layout changed: ' + a['name']
    assert a.get('glyphMetrics') == b.get('glyphMetrics'), 'Character positions changed: ' + a['name']
    ImageEnhance.Brightness(diff).enhance(4).save(args.output / (a['name'] + '.png'))
    results.append(dict(page=a['name'], before_bytes=a['bytes'], after_bytes=b['bytes'],
                        changed_pixels=count, max_channel_delta=max_delta, pixels_beyond_tolerance=beyond_tolerance, total_pixels=canvas_size[0]*canvas_size[1],
                        before_size=x.size, after_size=y.size, bounds=diff.getbbox(),
                        same_layout=a['sizes'] == b['sizes']))
(args.output / 'results.json').write_text(json.dumps(dict(browser=before['browser'], results=results), indent=2) + '\n')
for r in results:
    print(r['page'], r['before_bytes'], '->', r['after_bytes'], 'bytes;', r['changed_pixels'], 'changed pixels')
raise SystemExit(int(any(r['pixels_beyond_tolerance'] for r in results)))
