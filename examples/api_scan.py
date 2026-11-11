#!/usr/bin/env python3
"""Varre um handle PÚBLICO em alguns detectores usando a API local do Mineiro.

    mineiro --no-browser &                      # ou: npm run dev
    python3 examples/api_scan.py forgejo --ids codeberg devto keybase

Só biblioteca padrão. Use apenas handles de organizações públicas ou com autorização.
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor


def call(base, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, headers={"content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=40) as res:
            return res.status, json.load(res)
    except urllib.error.HTTPError as err:  # a API explica o erro no corpo
        return err.code, json.load(err)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("handle")
    ap.add_argument("--base", default="http://127.0.0.1:3000")
    ap.add_argument("--ids", nargs="*", help="ids de detectores (ex.: codeberg devto keybase)")
    ap.add_argument("--category", help="alternativa a --ids: todos os detectores de uma categoria")
    ap.add_argument("--limit", type=int, default=10, help="máximo de detectores quando usar --category")
    ap.add_argument("--store", action="store_true", help="grava as observações no SQLite local")
    ap.add_argument("--jsonl", help="arquivo onde salvar o resultado bruto (1 JSON por linha)")
    args = ap.parse_args()

    _, listing = call(args.base, "/api/registry/detectors" + (f"?category={args.category}" if args.category else ""))
    detectors = {d["id"]: d for d in listing["detectors"] if d["scannable"]}
    chosen = args.ids or list(detectors)[: args.limit]
    missing = [i for i in chosen if i not in detectors]
    if missing:
        sys.exit(f"detectores desconhecidos ou não escaneáveis: {', '.join(missing)}")

    def probe(det_id):
        det = detectors[det_id]
        url = det["urlPattern"].replace("{username}", urllib.request.quote(args.handle, safe=""))
        _, out = call(args.base, "/api/osint/verify", {
            "platformId": det_id, "url": url, "username": args.handle,
            "enableEvidenceChecks": True, "baseline": True,
            "scanDepth": "fast", "wafRetryStrategy": "none",  # não tenta contornar bloqueios
        })
        return det, out

    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(probe, chosen))

    print(f"{'detector':<14} {'status':<10} {'http':<5} {'conf':<5} {'evidência':<10} hash")
    for det, r in rows:
        print(f"{det['id']:<14} {r.get('status','?'):<10} {r.get('statusCode',''):<5} "
              f"{r.get('confidenceScore',''):<5} {r.get('evidenceLevel','-'):<10} {(r.get('evidenceHash') or '-')[:12]}")

    if args.jsonl:
        with open(args.jsonl, "w") as fh:
            for det, r in rows:
                fh.write(json.dumps(r, ensure_ascii=False) + "\n")

    if args.store:
        obs = [{
            "entity": {"type": "username", "value": args.handle}, "source": det["name"], "detectorId": det["id"],
            "detectorVersion": r.get("detectorVersion"), "status": r.get("status", "error"),
            "confidence": r.get("confidenceScore"), "url": r.get("url"), "evidenceHash": r.get("evidenceHash"),
            "collectedAt": r.get("collectedAt"),
        } for det, r in rows]
        code, out = call(args.base, "/api/store/observations", {"observations": obs})
        print(f"\nstore: HTTP {code} {out}")


if __name__ == "__main__":
    main()
