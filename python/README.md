# mineiro-osint

OSINT workbench for **public username presence**, evidence-first. This package installs the full Mineiro web app.

```bash
pip install mineiro-osint
mineiro            # starts on http://127.0.0.1:3000 and opens your browser
```

- Runs locally; binds to `127.0.0.1` by default. Nothing is sent anywhere except the public pages being checked.
- Uses your system Node.js (>= 22.5) if present, otherwise the Node bundled by `nodejs-wheel-binaries`.
- Data (SQLite store) lives in `~/.mineiro` (`--data-dir` to change).
- `mineiro --check` prints diagnostics.

Public signals only. No authentication or CAPTCHA bypass. Use within a legitimate and authorized purpose.

Source, docs and issues: https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor
