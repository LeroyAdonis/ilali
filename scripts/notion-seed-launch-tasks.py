#!/usr/bin/env python3
"""Seed ILALI Launch Tasks DB with the Sept-2026 workstream plan."""
import json, os, sys, urllib.error, urllib.request

TOKEN = os.environ.get("NOTION_API_TOKEN")
BASE = "https://api.notion.com"
HDRS = {"Authorization": f"Bearer {TOKEN}", "Notion-Version": "2025-09-03", "Content-Type": "application/json"}
TASKS_DB = "75151a9e-87f5-4cdf-a69c-7d40394e58d1"

def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=HDRS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()[:300], "status": e.code}

db = api("GET", f"/v1/databases/{TASKS_DB}")
dsid = db.get("data_sources", [{}])[0].get("id")

tasks = [
    # (Name, Status, Priority, Owner, Deadline, Spec Ref, Notes)
    ("WS-1 Admin approval → account flow", "Done", "Critical", "Ricky", "2026-08-06", "provider-portal T009/T018", "Built on fix/admin-approval-accounts; awaiting review + deploy"),
    ("WS-2 Email delivery (Resend + ilali.co)", "Backlog", "Critical", "Ricky", "2026-08-15", "backlog #16", "Temp password + welcome emails; needs Resend account + ilali.co SPF (George email #3)"),
    ("WS-3 Claim flow security", "Backlog", "High", "Ricky", "2026-08-18", "provider-portal FR-4", "Kill slug@ilali.co hole; real ownership verification"),
    ("WS-4 Bulk import (CSV → applications)", "Backlog", "High", "Ricky", "2026-08-22", "SDD spec first", "Admin CSV upload for 100+ Assitej providers; batch approve"),
    ("WS-5 Parent-facing quick wins", "Backlog", "Medium", "Ricky", "2026-08-25", "ilali-mvp FR-3", "WhatsApp button on club pages, reviews on club page, similar providers"),
    ("WS-6 Paystack payments (spec first)", "Backlog", "Medium", "Leroy", "2026-08-28", "new", "George starts Paystack account now (verification takes days)"),
    ("WS-0 Housekeeping", "Backlog", "Medium", "Ricky", "2026-08-10", "audit", "56 lint errors, Playwright port, DeepSeek key, drizzle 0001/0002 SQL"),
    ("Assitej onboarding day", "Backlog", "Critical", "George", "2026-09-01", "launch", "First Cape Town cohort goes live — Yvette spreads the word"),
]

created = 0
for name, status, prio, owner, dl, ref, notes in tasks:
    body = {
        "parent": {"data_source_id": dsid},
        "properties": {
            "Name": {"title": [{"text": {"content": name}}]},
            "Status": {"select": {"name": status}},
            "Priority": {"select": {"name": prio}},
            "Owner": {"select": {"name": owner}},
            "Deadline": {"date": {"start": dl}},
            "Spec Ref": {"rich_text": [{"text": {"content": ref}}]},
            "Notes": {"rich_text": [{"text": {"content": notes}}]},
        },
    }
    res = api("POST", "/v1/pages", body)
    if "error" not in res:
        created += 1
    else:
        print("  FAIL:", name[:40], res.get("error", "")[:120])
print(f"Created {created}/{len(tasks)} rows in Launch Tasks")
