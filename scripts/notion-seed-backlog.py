#!/usr/bin/env python3
"""Seed ILALI Backlog DB from .specify/backlog.md (25 items)."""
import json, os, re, sys, urllib.error, urllib.request

TOKEN = os.environ.get("NOTION_API_TOKEN")
BASE = "https://api.notion.com"
HDRS = {"Authorization": f"Bearer {TOKEN}", "Notion-Version": "2025-09-03", "Content-Type": "application/json"}
BACKLOG_DS = "c006aaca-2813-46ba-8a14-b01682ec7640"  # database id; resolve data_source below

def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=HDRS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()[:300]}

db = api("GET", f"/v1/databases/{BACKLOG_DS}")
dsid = db.get("data_sources", [{}])[0].get("id")

# Parse backlog.md rows: | # | Feature | Trigger | Effort | Status |
items = []
with open("/root/ilali/.specify/backlog.md") as f:
    for line in f:
        m = re.match(r"\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(Small|Medium|Large)\s*\|\s*(\w+)\s*\|", line)
        if m:
            items.append((m.group(2), m.group(3), m.group(4), m.group(5)))

print(f"Parsed {len(items)} backlog items")
created = 0
for feat, trigger, effort, status in items:
    body = {
        "parent": {"data_source_id": dsid},
        "properties": {
            "Feature": {"title": [{"text": {"content": feat}}]},
            "Trigger": {"rich_text": [{"text": {"content": trigger}}]},
            "Effort": {"select": {"name": effort}},
            "Status": {"select": {"name": status}},
        },
    }
    res = api("POST", "/v1/pages", body)
    if "error" not in res:
        created += 1
    else:
        print("  FAIL:", feat[:40], res.get("error", "")[:120])
print(f"Created {created}/{len(items)} rows in Backlog")
