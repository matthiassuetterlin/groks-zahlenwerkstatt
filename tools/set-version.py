#!/usr/bin/env python3
"""Cache-Busting: setzt ?v=<version> an Stylesheet, Skript und alle relativen JS-Importe.
Aufruf: python3 tools/set-version.py 3"""
import re, sys, pathlib
v = sys.argv[1]
root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'index.html'
s = idx.read_text()
s = re.sub(r'((?:href|src)="(?:css/style\.css|js/main\.js))(\?v=[\w.-]+)?"', lambda m: f'{m.group(1)}?v={v}"', s)
s = re.sub(r"(window\.GZW_VERSION\s*=\s*')[^']*(')", lambda m: m.group(1) + v + m.group(2), s)
idx.write_text(s)
for f in (root / 'js').rglob('*.js'):
    t = f.read_text()
    t2 = re.sub(r"(from\s+'(\./|\.\./)[^'?]+\.js)(\?v=[\w.-]+)?'", lambda m: f"{m.group(1)}?v={v}'", t)
    if t2 != t:
        f.write_text(t2)
print('version', v)
