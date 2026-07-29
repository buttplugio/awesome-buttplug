#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx"]
# ///
"""Check for dead links in the awesome-buttplug README."""

import asyncio
import re
import sys
from pathlib import Path

import httpx

TIMEOUT = 15
MAX_CONCURRENT = 10
RETRY_COUNT = 2
USER_AGENT = "awesome-buttplug-link-checker/1.0"

STATUS_OK = "ok"
STATUS_REDIRECT = "redirect"
STATUS_DEAD = "DEAD"
STATUS_ERROR = "ERROR"


def extract_links(markdown: str) -> list[tuple[str, str]]:
    pattern = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")
    return pattern.findall(markdown)


async def check_url(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    label: str,
    url: str,
) -> dict:
    async with semaphore:
        for attempt in range(RETRY_COUNT + 1):
            try:
                resp = await client.head(url, follow_redirects=True)
                if resp.status_code == 405:
                    resp = await client.get(url, follow_redirects=True)

                final_url = str(resp.url)
                redirected = final_url.rstrip("/") != url.rstrip("/")

                if resp.status_code < 400:
                    return {
                        "label": label,
                        "url": url,
                        "status_code": resp.status_code,
                        "final_url": final_url if redirected else None,
                        "state": STATUS_REDIRECT if redirected else STATUS_OK,
                    }
                else:
                    if attempt < RETRY_COUNT:
                        await asyncio.sleep(1)
                        continue
                    return {
                        "label": label,
                        "url": url,
                        "status_code": resp.status_code,
                        "final_url": None,
                        "state": STATUS_DEAD,
                    }
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                if attempt < RETRY_COUNT:
                    await asyncio.sleep(1)
                    continue
                return {
                    "label": label,
                    "url": url,
                    "status_code": None,
                    "final_url": None,
                    "state": STATUS_ERROR,
                    "error": str(e),
                }


async def main():
    # site/scripts/ -> repo root, where the generated README lives.
    readme_path = Path(__file__).resolve().parents[2] / "README.md"
    if not readme_path.exists():
        print("README.md not found", file=sys.stderr)
        sys.exit(1)

    links = extract_links(readme_path.read_text())
    seen = set()
    unique_links = []
    for label, url in links:
        if url not in seen:
            seen.add(url)
            unique_links.append((label, url))

    print(f"Checking {len(unique_links)} unique links...\n")

    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    async with httpx.AsyncClient(
        timeout=TIMEOUT,
        headers={"User-Agent": USER_AGENT},
    ) as client:
        tasks = [check_url(client, semaphore, label, url) for label, url in unique_links]
        results = await asyncio.gather(*tasks)

    dead = [r for r in results if r["state"] == STATUS_DEAD]
    errors = [r for r in results if r["state"] == STATUS_ERROR]
    redirects = [r for r in results if r["state"] == STATUS_REDIRECT]
    ok = [r for r in results if r["state"] == STATUS_OK]

    if dead:
        print(f"--- DEAD LINKS ({len(dead)}) ---")
        for r in dead:
            print(f"  [{r['label']}] {r['url']} -> HTTP {r['status_code']}")
        print()

    if errors:
        print(f"--- CONNECTION ERRORS ({len(errors)}) ---")
        for r in errors:
            print(f"  [{r['label']}] {r['url']} -> {r.get('error', 'unknown')}")
        print()

    if redirects:
        print(f"--- REDIRECTS ({len(redirects)}) ---")
        for r in redirects:
            print(f"  [{r['label']}] {r['url']}")
            print(f"    -> {r['final_url']}")
        print()

    print(f"Summary: {len(ok)} ok, {len(redirects)} redirected, {len(dead)} dead, {len(errors)} errors")
    sys.exit(1 if dead or errors else 0)


if __name__ == "__main__":
    asyncio.run(main())
