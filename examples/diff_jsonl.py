#!/usr/bin/env python3
"""Compara duas execuções de examples/api_scan.py (--jsonl) e lista o que mudou.

    python3 examples/api_scan.py forgejo --ids codeberg devto keybase --jsonl hoje.jsonl
    python3 examples/diff_jsonl.py ontem.jsonl hoje.jsonl

Atenção: DISAPPEARED é uma diferença ENTRE COLETAS (escopo, bloqueio). Não prova que a conta foi apagada.
"""
import json
import sys


def load(path):
    with open(path) as fh:
        return {r["platformId"]: r for r in map(json.loads, fh) if r.get("platformId")}


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    before, after = load(sys.argv[1]), load(sys.argv[2])
    changes = 0
    for pid in sorted(set(before) | set(after)):
        b, a = before.get(pid), after.get(pid)
        if b is None:
            print(f"NEW          {pid}: {a['status']}"); changes += 1
        elif a is None:
            print(f"DISAPPEARED  {pid}: estava {b['status']}"); changes += 1
        elif b["status"] != a["status"]:
            print(f"CHANGED      {pid}: {b['status']} -> {a['status']}"); changes += 1
        elif abs((a.get("confidenceScore") or 0) - (b.get("confidenceScore") or 0)) >= 10:
            print(f"CONFIDENCE   {pid}: {b.get('confidenceScore')} -> {a.get('confidenceScore')}"); changes += 1
    print(f"{changes} mudança(s) material(is) em {len(set(before) | set(after))} plataforma(s).")
    sys.exit(1 if changes else 0)


if __name__ == "__main__":
    main()
