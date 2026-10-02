"""`mineiro` command: starts the bundled web app on localhost and opens the browser."""

import argparse
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

from . import __version__

APP_DIR = Path(__file__).parent / "_app"
MIN_NODE = (22, 5)  # node:sqlite


def _node_version(node: str):
    try:
        out = subprocess.run([node, "--version"], capture_output=True, text=True, timeout=10).stdout
        match = re.match(r"v(\d+)\.(\d+)", out.strip())
        return (int(match.group(1)), int(match.group(2))) if match else None
    except (OSError, subprocess.SubprocessError):
        return None


def find_node():
    """Prefer a system Node >= 22.5; fall back to the one shipped by `nodejs-wheel-binaries`."""
    system = shutil.which("node")
    if system:
        version = _node_version(system)
        if version and version >= MIN_NODE:
            return system
    try:
        import nodejs_wheel  # type: ignore

        bundled = Path(nodejs_wheel.__file__).parent / "bin" / ("node.exe" if os.name == "nt" else "node")
        if not bundled.exists():  # Windows wheels keep node.exe at the package root
            bundled = Path(nodejs_wheel.__file__).parent / "node.exe"
        if bundled.exists():
            return str(bundled)
    except ImportError:
        pass
    return None


def _free_port(host: str, preferred: int) -> int:
    for port in range(preferred, preferred + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex((host, port)) != 0:
                return port
    raise SystemExit(f"No free port found in {preferred}-{preferred + 49}")


def _wait_ready(url: str, timeout: float = 20.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{url}/api/health", timeout=1):
                return True
        except OSError:
            time.sleep(0.25)
    return False


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="mineiro", description="Mineiro OSINT workbench (public signals only).")
    parser.add_argument("--version", action="version", version=f"mineiro {__version__}")
    parser.add_argument("--host", default="127.0.0.1", help="bind address (default 127.0.0.1; local only)")
    parser.add_argument("--port", type=int, default=3000, help="preferred port (default 3000; next free one is used)")
    parser.add_argument("--no-browser", action="store_true", help="do not open the browser")
    parser.add_argument("--data-dir", default=str(Path.home() / ".mineiro"), help="where the SQLite store lives")
    parser.add_argument("--check", action="store_true", help="print environment diagnostics and exit")
    args = parser.parse_args(argv)

    node = find_node()
    server = APP_DIR / "server.cjs"

    if args.check:
        print(f"mineiro {__version__}")
        print(f"app bundle : {'ok' if server.exists() else 'MISSING'} ({APP_DIR})")
        print(f"node       : {node or 'NOT FOUND'}")
        return 0 if node and server.exists() else 1

    if not server.exists():
        print("The app bundle is missing from this installation. Reinstall: pip install --force-reinstall mineiro-osint", file=sys.stderr)
        return 1
    if not node:
        print(
            "Node.js >= 22.5 was not found. Install it from https://nodejs.org or run:\n"
            "  pip install --upgrade nodejs-wheel-binaries",
            file=sys.stderr,
        )
        return 1

    port = _free_port(args.host, args.port)
    data_dir = Path(args.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)

    env = dict(
        os.environ,
        NODE_ENV="production",
        HOST=args.host,
        PORT=str(port),
        MINEIRO_DB=str(data_dir / "mineiro.sqlite"),
        NODE_NO_WARNINGS="1",
    )
    url = f"http://{args.host}:{port}"
    print(f"Mineiro {__version__} -> {url}  (Ctrl+C to stop)")
    print("Public signals only. Use within a legitimate and authorized purpose.")

    process = subprocess.Popen([node, str(server)], cwd=str(APP_DIR), env=env)
    try:
        if not args.no_browser:
            threading.Thread(
                target=lambda: _wait_ready(url) and webbrowser.open(url), daemon=True
            ).start()
        return process.wait()
    except KeyboardInterrupt:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
