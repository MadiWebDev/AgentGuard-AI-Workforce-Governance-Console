#!/bin/bash
set -e
VERSION=${VERSION:-1.0.0}
OUT="agentguard-v${VERSION}.zip"
rm -f "$OUT"
# Use python zip to exclude node_modules/.next/dist/coverage/.env/zips
python3 - "$OUT" << 'PY'
import sys, zipfile, pathlib
out=sys.argv[1]; root=pathlib.Path(".")
exclude_dirs={".git","node_modules",".next","dist","coverage",".turbo",".storage"}
with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
    for p in sorted(root.rglob("*")):
        if not p.is_file(): continue
        parts=set(p.parts)
        if parts & exclude_dirs: continue
        if p.name==".env" or p.suffix==".zip": continue
        if ".git" in p.parts: continue
        z.write(p, p.as_posix())
print(f"wrote {out}")
PY
ls -lh "$OUT"
sha256sum "$OUT" || shasum -a 256 "$OUT"
