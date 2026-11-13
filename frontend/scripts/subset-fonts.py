#!/usr/bin/env python3
"""Regenerate committed fonts and CSS by hand, never during the build.

From the repo root:
  python3 -m venv /tmp/unified-font-tools
  /tmp/unified-font-tools/bin/pip install -r frontend/scripts/font-requirements.txt
  /tmp/unified-font-tools/bin/python frontend/scripts/subset-fonts.py

Rerun after content/character, CSS or inline axis/feature changes. When updating
font packages, replace the pinned input files first. Recheck browser pixels and
FreeType with check-fonts.mjs, diff-fonts.py and check-font-hinting.py.

Defaults preserve original axes, glyph IDs, Inter extended glyph data and serif
hinting because cutting these changed rendering. Diagnostics go to the OS temp
folder. Commit public/fonts/*.woff2 and src/fonts.css after visual verification.
"""
import argparse
from copy import deepcopy
import hashlib
import json
import re
import tempfile
from pathlib import Path

from fontTools import subset
from fontTools.pens.recordingPen import DecomposingRecordingPen
from math import isclose
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
FRONT = ROOT / 'frontend'
SOURCES = Path(__file__).parent / 'font-sources'
REPORT = Path(tempfile.gettempdir()) / 'unified-font-audit'
CORE = set(range(0x20, 0x7f)) | {0xa0, 0x2010, 0x2011, 0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x2022, 0x2190, 0x2191, 0x2192, 0x2193, 0x2194, 0x2197, 0x2212, 0x00a9, 0x00b7}
FEATURES = ['ccmp', 'locl', 'liga', 'clig', 'calt', 'kern', 'mark', 'mkmk', 'rlig', 'rvrn', 'tnum']
FONTS = [
    ('geist', 'geist-latin.woff2', 'Geist Variable', {'wght': (100, 900)}),
    ('inter', 'inter-latin.woff2', 'Inter Variable', {'wght': (100, 900), 'opsz': (14, 32)}),
    ('serif', 'GeistSerif-Regular.woff2', 'Geist Serif', {}),
]


def load_source(filename):
    f = TTFont(SOURCES / filename, recalcTimestamp=False)
    # Blink substitutes these missing characters with the font's ASCII hyphen
    # when the original broad unicode-range matches. Make that substitution
    # explicit so exact unicode-ranges preserve the same result.
    for table in f['cmap'].tables:
        if table.isUnicode() and hasattr(table, 'cmap') and 45 in table.cmap:
            for cp in [0x00ad, 0x2010, 0x2011]:
                table.cmap.setdefault(cp, table.cmap[45])
    return f


def inventory(path):
    f = TTFont(path)
    return dict(file=str(path.relative_to(ROOT)), bytes=path.stat().st_size,
                sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                glyphs=len(f.getGlyphOrder()), nonempty_glyphs=sum(f['glyf'][n].numberOfContours != 0 for n in f.getGlyphOrder()), characters=len(f.getBestCmap()),
                axes={a.axisTag: [a.minValue, a.defaultValue, a.maxValue] for a in f['fvar'].axes} if 'fvar' in f else {},
                features=sorted({r.FeatureTag for t in ['GSUB', 'GPOS'] if t in f and f[t].table.FeatureList for r in f[t].table.FeatureList.FeatureRecord}),
                hint_tables=[t for t in ['fpgm', 'prep', 'cvt ', 'hdmx', 'VDMX', 'LTSH', 'cvar'] if t in f],
                hinted_glyphs=sum(bool(getattr(f['glyf'][n], 'program', None) and f['glyf'][n].program.getBytecode()) for n in f.getGlyphOrder()),
                version=f['name'].getDebugName(5))


def usage():
    files = sorted(p for base in [FRONT / 'src', ROOT / 'shared'] for p in base.rglob('*') if p.suffix in {'.jsx', '.tsx', '.js', '.ts', '.mjs', '.css', '.json'})
    chars = set(range(0x20, 0x180)) | set(range(0x0300, 0x0370)) | CORE
    evidence = {}
    for p in files:
        text = p.read_text()
        chars.update(map(ord, text))
        chars.update(int(h, 16) for h in re.findall(r'\\u([0-9a-fA-F]{4})', text))
        lines = [f'{i}: {line.strip()}' for i, line in enumerate(text.splitlines(), 1) if re.search(r'font(?:-|Family|Weight|VariationSettings|FeatureSettings)|italic|hyphens|tabular-nums|proportional-nums', line)]
        if lines:
            evidence[str(p.relative_to(ROOT))] = lines
    # No CJK face exists today. Inter/Geist coverage will also bound this set.
    chars = {c for c in chars if c >= 0x20 and not 0x2e80 <= c <= 0x9fff and not 0xf900 <= c <= 0xfaff}
    return chars, evidence


def ranges(chars):
    runs = []
    for c in sorted(chars):
        if runs and c == runs[-1][1] + 1:
            runs[-1][1] = c
        else:
            runs.append([c, c])
    return ','.join(f'U+{a:04X}' + (f'-{b:04X}' if b != a else '') for a, b in runs)


def verify_geometry(source, emitted, characters):
    def same(a, b):
        if isinstance(a, (int, float)) and isinstance(b, (int, float)):
            return isclose(a, b, rel_tol=0, abs_tol=1e-7)
        if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
            return len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
        return a == b
    locations = [{}]
    if 'fvar' in source:
        locations = [{'wght': w} for w in [400, 500, 550, 600, 700]]
        if any(a.axisTag == 'opsz' for a in source['fvar'].axes):
            locations = [{**loc, 'opsz': size} for loc in locations for size in [14, 17, 18, 25, 32]]
    count = 0
    for location in locations:
        a = source.getGlyphSet(location=location)
        b = emitted.getGlyphSet(location=location)
        for cp in characters:
            old, new = source.getBestCmap()[cp], emitted.getBestCmap()[cp]
            p, q = DecomposingRecordingPen(a), DecomposingRecordingPen(b)
            a[old].draw(p)
            b[new].draw(q)
            assert same(p.value, q.value) and same(a[old].width, b[new].width), f'Outline/advance changed at U+{cp:04X}, {location}'
            assert source['hmtx'][old] == emitted['hmtx'][new], f'Side bearing changed at U+{cp:04X}'
            count += 1
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--audit', action='store_true', help='record the original imported font files before changing CSS')
    parser.add_argument('--weight-min', type=int, choices=[100, 400], default=100, help='400 is diagnostic: axis instancing can change rendering')
    parser.add_argument('--weight-max', type=int, choices=[700, 900], default=900, help='700 is experimental: boundary rounding changes outlines')
    parser.add_argument('--drop-serif-hinting', action='store_true', help='experimental: changes FreeType rendering, needs visual approval')
    parser.add_argument('--keep-hinting', action='store_true', help='diagnostic: retain original hint tables in every font')
    args = parser.parse_args()
    REPORT.mkdir(parents=True, exist_ok=True)
    chars, evidence = usage()
    (REPORT / 'usage.json').write_text(json.dumps(dict(characters=ranges(chars), source_evidence=evidence), indent=2) + '\n')
    if args.audit:
        paths = [SOURCES / 'GeistSerif-Regular.woff2']
        for family, pattern in [('geist', '*-wght-normal.woff2'), ('inter', '*-opsz-normal.woff2')]:
            paths += sorted((FRONT / f'node_modules/@fontsource-variable/{family}/files').glob(pattern))
        records = [inventory(p) for p in paths]
        records[0]['file'] = 'frontend/public/fonts/GeistSerif-Regular.woff2'
        (REPORT / 'before.json').write_text(json.dumps(records, indent=2) + '\n')
        return
    css = ['/* Generated by scripts/subset-fonts.py; do not edit. No fallback face between subsets. */']
    results = []
    for key, filename, family, axes in FONTS:
        axes = {**axes, 'wght': (args.weight_min, args.weight_max)} if axes else axes
        if key == 'serif':
            source = load_source(filename)
            available = set(source.getBestCmap()) & chars
            core = CORE | set(range(0x20, 0x180)) | set(range(0x0300, 0x0370))
            parts = [('core', filename, available & core), ('extended', filename, available - core)]
        else:
            # Preserve the original CSS composite font: do not give a web font characters
            # that previously fell through to Inter or the system font.
            declarations = json.loads((SOURCES / f'{key}-unicode.json').read_text())
            def declared(part):
                result = set()
                for run in declarations[part].split(','):
                    ends = [int(c, 16) for c in run[2:].split('-')]
                    result.update(range(ends[0], ends[-1] + 1))
                return result
            core = chars & declared('latin') & set(load_source(filename).getBestCmap())
            extended_file = f'{key}-latin-ext.woff2'
            extended = (chars & declared('latin-ext') & set(load_source(extended_file).getBestCmap()))
            parts = [('core', filename, core), ('extended', extended_file, extended)]
        for part, input_file, wanted in reversed(parts):
            source = load_source(input_file)
            f = load_source(input_file)
            if axes and any((a.minValue, a.maxValue) != axes[a.axisTag] for a in f['fvar'].axes):
                f = instantiateVariableFont(f, axes, inplace=True, optimize=False)
            # Instancing leaves lazy gvar entries absent for invariant glyphs.
            if 'gvar' in f:
                f['gvar'].variations = {n: f['gvar'].variations.get(n, []) for n in f.getGlyphOrder()}
            options = subset.Options()
            options.layout_features = FEATURES
            options.bidi_closure = False
            options.glyph_names = True
            options.retain_gids = True
            options.notdef_outline = True
            options.recommended_glyphs = True
            options.recalc_bounds = False
            # Serif instructions affect FreeType rasterization, so retain them by default.
            options.hinting = args.keep_hinting or (key == 'serif' and not args.drop_serif_hinting)
            options.name_IDs = ['*']
            options.name_legacy = True
            sub = subset.Subsetter(options=options)
            # Inter's extended glyph data must remain intact: cutting it changes native rasterization.
            sub.populate(unicodes=wanted, glyphs=source.getGlyphOrder() if key == 'inter' and part == 'extended' else [])
            sub.subset(f)
            # Keep cmap aliases for surviving dependency glyphs. HarfBuzz uses these
            # for canonical decomposition (for example A + macron in Ād kerning).
            retained = set(f.getGlyphOrder())
            for table in f['cmap'].tables:
                if not hasattr(table, 'cmap'):
                    continue
                original = next(t for t in source['cmap'].tables if (t.platformID, t.platEncID, t.format) == (table.platformID, table.platEncID, table.format))
                table.cmap.update({c: n for c, n in original.cmap.items() if n in retained})
            # Rename every derived family, including OFL Reserved Font Names. CSS aliases stay unchanged.
            rename_ids = {1, 3, 4, 6, 16, 21, 25}
            if 'fvar' in f:
                rename_ids.update(i.postscriptNameID for i in f['fvar'].instances if hasattr(i, 'postscriptNameID') and i.postscriptNameID != 0xffff)
            for record in f['name'].names:
                if record.nameID in rename_ids:
                    renamed = record.toUnicode().replace('Geist Serif', 'Unified Serif').replace('GeistSerif', 'UnifiedSerif').replace('Geist', 'UnifiedSans').replace('Inter', 'UnifiedFallback')
                    record.string = renamed.encode(record.getEncoding())
            # CoreText rasterization depends on post glyph names and global head bounds.
            f['OS/2'] = deepcopy(source['OS/2'])
            for field in ['minLeftSideBearing', 'minRightSideBearing', 'xMaxExtent', 'advanceWidthMax']:
                setattr(f['hhea'], field, getattr(source['hhea'], field))
            f.recalcBBoxes = False
            for field in ['xMin', 'yMin', 'xMax', 'yMax']:
                setattr(f['head'], field, getattr(source['head'], field))
            f.flavor = 'woff2'
            output = FRONT / f'public/fonts/{key}-{part}.woff2'
            f.save(output)
            check = TTFont(output)
            actual = set(check.getBestCmap())
            assert wanted <= actual, (key, part, wanted - actual)
            assert all(not 0x2e80 <= c <= 0x9fff for c in actual)
            if axes:
                assert {a.axisTag: (a.minValue, a.maxValue) for a in check['fvar'].axes} == axes
            if not options.hinting:
                assert not inventory(output)['hinted_glyphs']
                assert not inventory(output)['hint_tables']
            assert set(inventory(output)['features']) <= set(FEATURES)
            weight = '100 900' if axes else '400'
            font_format = 'woff2-variations' if axes else 'woff2'
            css.append(f'@font-face {{\n  font-family: "{family}";\n  font-style: normal;\n  font-weight: {weight};\n  font-display: swap;\n  src: url("/fonts/{output.name}") format("{font_format}");\n  unicode-range: {ranges(wanted)};\n}}')
            checks = verify_geometry(source, check, wanted)
            results.append({**inventory(output), 'advertised_characters': len(wanted), 'unicode_range': ranges(wanted), 'geometry_checks': checks})
    (FRONT / 'src/fonts.css').write_text('\n\n'.join(css) + '\n')
    (REPORT / 'after.json').write_text(json.dumps(results, indent=2) + '\n')


if __name__ == '__main__':
    main()
