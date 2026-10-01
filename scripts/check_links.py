"""Check every URL in data/roadmap.json and report the ones that fail.

Usage:  python scripts/check_links.py
Exit code is 1 if any link looks broken.
"""
import json
import ssl
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def collect(node, out):
    if isinstance(node, dict):
        if "url" in node and isinstance(node["url"], str):
            out.append((node.get("title", "?"), node["url"]))
        for v in node.values():
            collect(v, out)
    elif isinstance(node, list):
        for v in node:
            collect(v, out)


# Only used to test reachability, so fall back to an unverified context when a
# local proxy/antivirus breaks certificate verification.
UNVERIFIED = ssl._create_unverified_context()


def fetch(url, context=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=25, context=context) as r:
        return r.status, r.geturl()


def check(entry):
    title, url = entry
    try:
        try:
            status, final = fetch(url)
        except urllib.error.URLError as e:
            if not isinstance(getattr(e, "reason", None), ssl.SSLError):
                raise
            status, final = fetch(url, UNVERIFIED)
        return title, url, status, final
    except urllib.error.HTTPError as e:
        return title, url, e.code, url
    except Exception as e:  # noqa: BLE001
        return title, url, f"ERR {type(e).__name__}: {e}", url


def main():
    data = json.loads((ROOT / "data" / "roadmap.json").read_text(encoding="utf-8"))
    entries = []
    collect(data, entries)
    unique = list(dict.fromkeys(entries))
    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(check, unique))
    bad = 0
    for title, url, status, final in results:
        ok = isinstance(status, int) and status < 400
        # Some sites block scripted requests even though they work in a browser.
        blocked = status in (403, 429, 999)
        if not ok:
            bad += 0 if blocked else 1
            tag = "BLOCKED?" if blocked else "BROKEN "
            print(f"{tag} {status}  {title}\n          {url}")
        elif final.rstrip("/") != url.rstrip("/"):
            print(f"REDIRECT {title}\n          {url}\n       -> {final}")
    print(f"\nChecked {len(unique)} links, {bad} broken.")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
