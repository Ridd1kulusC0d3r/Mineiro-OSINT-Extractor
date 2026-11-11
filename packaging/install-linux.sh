#!/usr/bin/env bash
# Mineiro installer for Linux: Debian, Ubuntu, Kali, Parrot and Amazon Linux 2023.
#
# Installs the mineiro-osint Python package (the web app plus the `mineiro` launcher) into its own virtual
# environment and links `mineiro` into PREFIX/bin. The system Python is never modified, so distributions that
# mark it as externally managed (PEP 668: Debian 12+, Ubuntu 24.04, Kali, Parrot) need no workaround.
# Node.js: a system Node >= 22.5 is used when present; otherwise the package's own dependency
# (nodejs-wheel-binaries, from PyPI) provides Node 22, for running the app and for --from-source builds.
#
# Root is only used, through sudo when needed, to install missing distribution packages (Python 3 with venv).
# Running it again upgrades or repairs the installation. See --help.
set -euo pipefail

VERSION="1.8.0"
REPO_URL="https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<EOF
Usage: install-linux.sh [options]

Installs Mineiro ${VERSION} for the current user.

Source (pick one; default: the release wheel from GitHub Releases, checked against its SHA256SUMS.txt):
  --from-source [DIR]   build from a checkout (default: the one holding this script) and install that build
  --wheel FILE          install a wheel file you already have
  --version X.Y.Z       release to download (default: ${VERSION})

Options:
  --prefix DIR          install under DIR (default: \$HOME/.local): DIR/share/mineiro-osint/venv and DIR/bin/mineiro
  --skip-system-packages  do not install distribution packages; fail if Python 3 with venv is missing
  --uninstall           remove the virtual environment and the DIR/bin/mineiro link (keeps ~/.mineiro data)
  -n, --dry-run         print what would be done, change nothing
  -h, --help            show this help

Supported: Debian, Ubuntu, Kali, Parrot (apt) and Amazon Linux 2023 (dnf).
EOF
}

say() { printf '%s\n' "$*"; }
die() { printf 'install-linux.sh: %s\n' "$*" >&2; exit 1; }

DRY_RUN=0
show() { printf '+'; printf ' %q' "$@"; printf '\n'; }
run() { show "$@"; if [ "$DRY_RUN" -eq 0 ]; then "$@"; fi; }
# Runs a command from DIR without changing the script's own directory.
run_in() {
  local dir=$1
  shift
  printf '+ (cd %q &&' "$dir"; printf ' %q' "$@"; printf ')\n'
  if [ "$DRY_RUN" -eq 0 ]; then (cd "$dir" && "$@"); fi
}
# Only package installs go through here.
run_root() {
  if [ "$(id -u)" -eq 0 ]; then
    run "$@"
  elif command -v sudo >/dev/null 2>&1; then
    run sudo "$@"
  else
    die "root is needed for: $* (run it as root, install sudo, or install the packages yourself and pass --skip-system-packages)"
  fi
}

PREFIX="${HOME}/.local"
SOURCE="release"
WHEEL=""
SRC_DIR=""
SKIP_PACKAGES=0
UNINSTALL=0

while [ $# -gt 0 ]; do
  case "$1" in
    --from-source)
      SOURCE="source"
      if [ $# -gt 1 ] && [ "${2#-}" = "$2" ]; then SRC_DIR=$2; shift; fi
      ;;
    --wheel) [ $# -gt 1 ] || die "--wheel needs a file"; SOURCE="wheel"; WHEEL=$2; shift ;;
    --version) [ $# -gt 1 ] || die "--version needs a value"; VERSION=${2#v}; shift ;;
    --prefix) [ $# -gt 1 ] || die "--prefix needs a directory"; PREFIX=$2; shift ;;
    --prefix=*) PREFIX=${1#--prefix=} ;;
    --skip-system-packages) SKIP_PACKAGES=1 ;;
    --uninstall) UNINSTALL=1 ;;
    -n | --dry-run) DRY_RUN=1 ;;
    -h | --help) usage; exit 0 ;;
    *) die "unknown option: $1 (see --help)" ;;
  esac
  shift
done

case "$PREFIX" in /*) ;; *) PREFIX="$(pwd)/$PREFIX" ;; esac
APP_HOME="$PREFIX/share/mineiro-osint"
VENV="$APP_HOME/venv"
LINK="$PREFIX/bin/mineiro"

# --- distribution -------------------------------------------------------------------------------------------
# MINEIRO_OS_RELEASE only exists to test the detection with another os-release file.
OS_RELEASE=${MINEIRO_OS_RELEASE:-/etc/os-release}
[ -r "$OS_RELEASE" ] || die "$OS_RELEASE not found; supported: Debian, Ubuntu, Kali, Parrot, Amazon Linux 2023"
# Read in a subshell: os-release defines VERSION, which would overwrite ours.
# shellcheck source=/dev/null
OS_ID=$(. "$OS_RELEASE" && printf '%s' "${ID:-}")
# shellcheck source=/dev/null
OS_VERSION_ID=$(. "$OS_RELEASE" && printf '%s' "${VERSION_ID:-}")
# shellcheck source=/dev/null
OS_NAME=$(. "$OS_RELEASE" && printf '%s' "${PRETTY_NAME:-${ID:-unknown}}")

case "$OS_ID" in
  debian | ubuntu | kali | parrot)
    PKG_TOOL="apt"
    PY_PACKAGES=(python3 python3-venv)
    CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
    ;;
  amzn)
    case "$OS_VERSION_ID" in
      2023*) ;;
      *) die "Amazon Linux ${OS_VERSION_ID:-?} is not supported; only Amazon Linux 2023 is" ;;
    esac
    PKG_TOOL="dnf"
    PY_PACKAGES=(python3 python3-pip)
    CA_BUNDLE=/etc/pki/tls/certs/ca-bundle.crt
    ;;
  *)
    die "unsupported distribution: ${OS_NAME} (ID=${OS_ID:-none}). Supported: Debian, Ubuntu, Kali, Parrot, Amazon Linux 2023. Elsewhere, install the wheel into a virtual environment yourself (see the README, Option 1)"
    ;;
esac

package_installed() {
  if [ "$PKG_TOOL" = "apt" ]; then
    dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -q 'install ok installed'
  else
    rpm -q "$1" >/dev/null 2>&1
  fi
}

# Scratch directory for downloads, the source build's wheel and the venv probe; removed on exit.
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# A Python >= 3.9 that can create a virtual environment with pip (Debian and derivatives need python3-venv).
python_ok() {
  "$1" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' >/dev/null 2>&1 || return 1
  rm -rf "$WORK/probe"
  "$1" -m venv "$WORK/probe" >/dev/null 2>&1 && [ -x "$WORK/probe/bin/pip" ]
}
find_python() {
  PYTHON=""
  local candidate
  for candidate in "$(command -v python3 || true)" /usr/bin/python3; do
    if [ -n "$candidate" ] && [ -x "$candidate" ] && python_ok "$candidate"; then PYTHON=$candidate; return 0; fi
  done
  return 1
}

# Distribution packages are installed only when something is missing: Python with venv, or the CA bundle.
NEEDED=()
find_python || NEEDED+=("${PY_PACKAGES[@]}")
[ -s "$CA_BUNDLE" ] || NEEDED+=(ca-certificates)
MISSING=()
for pkg in ${NEEDED[@]+"${NEEDED[@]}"}; do
  package_installed "$pkg" || MISSING+=("$pkg")
done
# python3 can be installed while python3-venv is not; keep the package that adds venv in the list.
if [ -z "$PYTHON" ] && [ ${#MISSING[@]} -eq 0 ]; then MISSING=("${PY_PACKAGES[@]}"); fi

# --- plan -----------------------------------------------------------------------------------------------------
case "$SOURCE" in
  release)
    WHEEL_NAME="mineiro_osint-${VERSION}-py3-none-any.whl"
    WHEEL_URL="$REPO_URL/releases/download/v${VERSION}/${WHEEL_NAME}"
    SOURCE_TEXT="release wheel $WHEEL_URL (checked against SHA256SUMS.txt)"
    ;;
  wheel)
    [ -f "$WHEEL" ] || die "wheel not found: $WHEEL"
    WHEEL="$(cd "$(dirname "$WHEEL")" && pwd)/$(basename "$WHEEL")"
    SOURCE_TEXT="wheel file $WHEEL"
    ;;
  source)
    SRC_DIR=${SRC_DIR:-"$SCRIPT_DIR/.."}
    [ -f "$SRC_DIR/package.json" ] && [ -f "$SRC_DIR/python/pyproject.toml" ] || die "not a Mineiro checkout: $SRC_DIR"
    SRC_DIR="$(cd "$SRC_DIR" && pwd)"
    SOURCE_TEXT="build from checkout $SRC_DIR (npm ci, npm run build:python, pip wheel)"
    ;;
esac

say "Mineiro installer"
say "  system        : $OS_NAME ($PKG_TOOL)"
if [ "$UNINSTALL" -eq 1 ]; then
  say "  action        : uninstall $VENV and $LINK (data in ~/.mineiro is kept)"
else
  say "  version       : $( [ "$SOURCE" = "release" ] && printf '%s' "$VERSION" || printf 'from %s' "$SOURCE")"
  say "  source        : $SOURCE_TEXT"
  say "  virtualenv    : $VENV"
  say "  command       : $LINK"
  if [ "$SKIP_PACKAGES" -eq 1 ]; then
    say "  packages      : skipped (--skip-system-packages)"
  elif [ ${#MISSING[@]} -gt 0 ]; then
    say "  packages      : ${MISSING[*]} (with $( [ "$(id -u)" -eq 0 ] && printf 'root' || printf 'sudo'))"
  else
    say "  packages      : none needed (Python ${PYTHON:-?} can create a virtual environment)"
  fi
fi
[ "$DRY_RUN" -eq 1 ] && say "  dry run       : nothing is changed"
if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
  say "  note          : running under sudo installs for root; run it as your own user instead (it calls sudo itself)"
fi
say ""

# --- uninstall -----------------------------------------------------------------------------------------------
if [ "$UNINSTALL" -eq 1 ]; then
  if [ -L "$LINK" ] && [ "$(readlink "$LINK")" = "$VENV/bin/mineiro" ]; then run rm -f "$LINK"; fi
  if [ -d "$APP_HOME" ]; then run rm -rf "$APP_HOME"; fi
  say "Mineiro removed."
  exit 0
fi

# --- system packages -----------------------------------------------------------------------------------------
if [ "$SKIP_PACKAGES" -eq 0 ] && [ ${#MISSING[@]} -gt 0 ]; then
  if [ "$PKG_TOOL" = "apt" ]; then
    run_root env DEBIAN_FRONTEND=noninteractive apt-get update
    run_root env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${MISSING[@]}"
  else
    run_root dnf install -y "${MISSING[@]}"
  fi
fi

# --- python with venv ----------------------------------------------------------------------------------------
if [ -z "$PYTHON" ] && ! find_python; then
  if [ "$DRY_RUN" -eq 1 ]; then
    PYTHON=python3
  else
    die "no Python >= 3.9 able to create a virtual environment (install: ${PY_PACKAGES[*]})"
  fi
fi

if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c 'import pip' >/dev/null 2>&1; then
  say "Reusing the virtual environment in $VENV"
else
  run rm -rf "$VENV"
  run mkdir -p "$APP_HOME"
  run "$PYTHON" -m venv "$VENV"
fi
VPY="$VENV/bin/python"
PIP=("$VPY" -m pip --disable-pip-version-check)

# --- the wheel -----------------------------------------------------------------------------------------------
case "$SOURCE" in
  release)
    WHEEL="$WORK/$WHEEL_NAME"
    for file in "$WHEEL_NAME" SHA256SUMS.txt; do
      say "+ download $REPO_URL/releases/download/v${VERSION}/$file"
      if [ "$DRY_RUN" -eq 0 ]; then
        "$VPY" - "$REPO_URL/releases/download/v${VERSION}/$file" "$WORK/$file" <<'PY' || die "download failed: $file (does release v${VERSION} exist? see $REPO_URL/releases)"
import sys, urllib.request
try:
    urllib.request.urlretrieve(sys.argv[1], sys.argv[2])
except OSError as error:
    sys.exit(f"  {error}")
PY
      fi
    done
    say "+ sha256sum -c (the SHA256SUMS.txt line for $WHEEL_NAME)"
    if [ "$DRY_RUN" -eq 0 ]; then
      grep -F "  $WHEEL_NAME" "$WORK/SHA256SUMS.txt" >"$WORK/expected.sha256" || die "$WHEEL_NAME is not listed in SHA256SUMS.txt"
      (cd "$WORK" && sha256sum -c expected.sha256) || die "checksum mismatch for $WHEEL_NAME"
    fi
    ;;
  source)
    node_ok() {
      command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1 &&
        node -e 'const [a, b] = process.versions.node.split(".").map(Number); process.exit(a > 22 || (a === 22 && b >= 5) ? 0 : 1)' 2>/dev/null
    }
    BUILD_ENV=()
    if node_ok; then
      say "Building with the system Node.js $(node --version)"
    else
      say "No system Node.js >= 22.5: building with the one from nodejs-wheel-binaries"
      run "${PIP[@]}" install --quiet "nodejs-wheel-binaries>=22"
      # The wheel's bin/npm and bin/npx only work as symlinks, which the wheel format flattens; small wrappers
      # in the scratch directory call npm's own entry points instead. The build scripts (npx vite, esbuild)
      # find this node, npm and npx through PATH.
      NODE_BIN="$WORK/node-bin"
      say "+ write node, npm and npx wrappers for the bundled Node.js in $NODE_BIN"
      if [ "$DRY_RUN" -eq 0 ]; then
        NODE_HOME=$("$VPY" -c 'import os, nodejs_wheel; print(os.path.dirname(nodejs_wheel.__file__))')
        mkdir -p "$NODE_BIN"
        ln -s "$NODE_HOME/bin/node" "$NODE_BIN/node"
        for tool in npm npx; do
          printf '#!/bin/sh\nexec "%s" "%s" "$@"\n' "$NODE_HOME/bin/node" "$NODE_HOME/lib/node_modules/npm/bin/$tool-cli.js" >"$NODE_BIN/$tool"
          chmod +x "$NODE_BIN/$tool"
        done
        say "  using Node.js $("$NODE_BIN/node" --version)"
      fi
      BUILD_ENV=(env "PATH=$NODE_BIN:$PATH")
    fi
    run_in "$SRC_DIR" ${BUILD_ENV[@]+"${BUILD_ENV[@]}"} npm ci --no-audit --no-fund
    run_in "$SRC_DIR" ${BUILD_ENV[@]+"${BUILD_ENV[@]}"} npm run build:python
    run "${PIP[@]}" wheel --quiet --no-deps -w "$WORK" "$SRC_DIR/python"
    built=("$WORK"/mineiro_osint-*.whl)
    WHEEL=${built[0]}
    ;;
esac

# --force-reinstall --no-deps replaces the package even at the same version (a rebuilt checkout);
# the second call only fetches missing dependencies.
run "${PIP[@]}" install --quiet --force-reinstall --no-deps "$WHEEL"
run "${PIP[@]}" install --quiet "$WHEEL"
run mkdir -p "$PREFIX/bin"
run ln -sfn "$VENV/bin/mineiro" "$LINK"
run "$LINK" --version
run "$LINK" --check

say ""
if [ "$DRY_RUN" -eq 1 ]; then
  say "Dry run finished; nothing was changed."
  exit 0
fi
say "Installed. Start it with: $LINK   (http://127.0.0.1:3000; --no-browser, --port, --data-dir: see --help)"
case ":$PATH:" in
  *":$PREFIX/bin:"*) ;;
  *) say "Note: $PREFIX/bin is not in PATH. Add it, e.g.: echo 'export PATH=\"$PREFIX/bin:\$PATH\"' >> ~/.profile" ;;
esac
