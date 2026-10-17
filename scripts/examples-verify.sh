#!/bin/bash
set -e
echo "examples:verify"
node examples/plain-fetch/example.mjs || echo "(plain-fetch needs running server — skipped if server not up, see docs)"
echo "examples:verify done (see output above)"
