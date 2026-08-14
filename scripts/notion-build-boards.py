#!/usr/bin/env python3
"""Build ILALI / Aliento / KitFix Notion boards via the Notion API.

Usage: NOTION_API_TOKEN=ntn_xxx python3 notion-build-boards.py
Creates top-level workspace pages + databases + seed content.
"""
import json
import os
import sys
import urllib.error
import urllib.request

TOKEN = os.environ.get("NOTION_API_TOKEN") or os.environ.get("NOTION_API_KEY")
if not TOKEN:
    sys.exit("Set NOTION_API_TOKEN")

BASE = "https://api.notion.com"
HDRS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2025-09-03",
    "Content-Type": "application/json",
}

def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=HDRS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  !! {method} {path} -> {e.code}: {err[:400]}")
        return {"error": err, "status": e.code}

def find_page_by_title(title):
    """Search workspace for an existing page with this exact title."""
    body = {"query": title, "filter": {"value": "page", "property": "object"}}
    res = api("POST", "/v1/search", body)
    if isinstance(res, dict) and res.get("results"):
        for r in res["results"]:
            t = r.get("title") or r.get("properties", {}).get("title", [])
            if isinstance(t, list) and t:
                if t[0].get("plain_text") == title or t[0].get("text", {}).get("content") == title:
                    return r["id"]
    return None

def create_page(title, parent_page=None, markdown=None, icon=None):
    # Idempotent: reuse existing page with the same title
    existing = find_page_by_title(title)
    if existing:
        print(f"  (reused existing page: {title})")
        return {"id": existing, "url": f"https://app.notion.com/p/{existing}"}
    parent = {"type": "workspace", "workspace": True} if not parent_page else {"type": "page_id", "page_id": parent_page}
    body = {
        "parent": parent,
        "properties": {"title": [{"text": {"content": title}}]},
    }
    if icon:
        body["icon"] = {"type": "emoji", "emoji": icon}
    if markdown:
        body["markdown"] = markdown
    return api("POST", "/v1/pages", body)

def create_db(parent_page, title, properties, icon=None):
    body = {
        "parent": {"type": "page_id", "page_id": parent_page},
        "title": [{"text": {"content": title}}],
        "initial_data_source": {"properties": properties},
    }
    if icon:
        body["icon"] = {"type": "emoji", "emoji": icon}
    return api("POST", "/v1/databases", body)

def create_db_row(database_id, props):
    body = {"parent": {"database_id": database_id}, "properties": props}
    return api("POST", "/v1/pages", body)

# ── property builders ────────────────────────────────────────────────
def sel(options, default=None):
    return {"select": {"options": [{"name": o} for o in options]}}

def title_prop():
    return {"title": {}}

def rich():
    return {"rich_text": {}}

def date_prop():
    return {"date": {}}

def checkbox():
    return {"checkbox": {}}

def email_prop():
    return {"email": {}}

def phone_prop():
    return {"phone_number": {}}

def url_prop():
    return {"url": {}}

def ms(options):
    return {"multi_select": {"options": [{"name": o} for o in options]}}

def txt(content):
    return {"rich_text": [{"text": {"content": content}}]}

def sel_val(name):
    return {"select": {"name": name}}

def date_val(s):
    return {"date": {"start": s}}

def title_val(content):
    return {"title": [{"text": {"content": content}}]}

def check_val(b):
    return {"checkbox": b}

# ════════════════════════════════════════════════════════════════════
# Explicit page IDs override auto-discovery (canonical pages from prior run)
ILALI_PAGE_ID = os.environ.get("ILALI_PAGE_ID")
ALIENTO_PAGE_ID = os.environ.get("ALIENTO_PAGE_ID")
KITFIX_PAGE_ID = os.environ.get("KITFIX_PAGE_ID")

def resolve_page(title, icon, forced_id):
    if forced_id:
        return {"id": forced_id, "url": f"https://app.notion.com/p/{forced_id}"}
    return create_page(title, icon=icon)

print("== ILALI board ==")
ilali = resolve_page("ILALI — Launch HQ", "🎭", ILALI_PAGE_ID)
ilali_id = ilali.get("id")
print("ILALI page:", ilali_id, ilali.get("url", ""))

if ilali_id:
    # 1. Launch Tasks
    tasks = create_db(ilali_id, "Launch Tasks", {
        "Name": title_prop(),
        "Status": sel(["Backlog", "This Week", "In Progress", "Done", "Blocked"], "Backlog"),
        "Priority": sel(["Critical", "High", "Medium", "Low"], "Medium"),
        "Owner": sel(["Ricky", "Leroy", "George", "Yvette"], "Ricky"),
        "Deadline": date_prop(),
        "Spec Ref": rich(),
        "Notes": rich(),
    }, icon="🗄️")
    tasks_id = tasks.get("id")
    print("Launch Tasks DB:", tasks_id)

    # 2. Provider Onboarding
    prov = create_db(ilali_id, "Provider Onboarding", {
        "Provider Name": title_prop(),
        "Organisation": sel(["Assitej SA", "Direct", "Referral", "Other"], "Assitej SA"),
        "Stage": sel(["Listed", "Applied", "Approved", "Account Created", "Claimed", "Listing Live", "Needs Help"], "Listed"),
        "Email": email_prop(),
        "Phone": phone_prop(),
        "Location": sel(["Cape Town", "National", "Other"], "Cape Town"),
        "Category": sel(["Arts & Culture", "Sports", "Music Lessons", "Education & Tutoring", "Holiday Programs", "Dance & Movement", "Emotional Intelligence", "Other"], "Other"),
        "Onboarding Date": date_prop(),
        "Notes": rich(),
    }, icon="🏢")
    prov_id = prov.get("id")
    print("Provider Onboarding DB:", prov_id)

    # 3. Risks & Blockers
    risks = create_db(ilali_id, "Risks & Blockers", {
        "Risk": title_prop(),
        "Status": sel(["Open", "Mitigating", "Closed"], "Open"),
        "Severity": sel(["Critical", "High", "Medium", "Low"], "Medium"),
        "Owner": sel(["Ricky", "Leroy", "George", "Yvette"], "Leroy"),
        "Mitigation": rich(),
        "Raised": date_prop(),
    }, icon="⚠️")
    risks_id = risks.get("id")
    print("Risks DB:", risks_id)

    # 4. Decisions Log
    dec = create_db(ilali_id, "Decisions Log", {
        "Date": date_prop(),
        "Decision": title_prop(),
        "Context": rich(),
        "Options": rich(),
        "Decided By": sel(["Leroy", "George", "Yvette", "Ricky"], "Leroy"),
    }, icon="📝")
    dec_id = dec.get("id")
    print("Decisions DB:", dec_id)

    # 5. Meeting Notes
    meet = create_db(ilali_id, "Meeting Notes", {
        "Date": date_prop(),
        "Topic": title_prop(),
        "Attendees": ms(["Leroy", "George", "Yvette", "Ricky"]),
        "Action Items": rich(),
        "Notes": rich(),
    }, icon="🤝")
    meet_id = meet.get("id")
    print("Meeting Notes DB:", meet_id)

    # 6. Backlog
    bk = create_db(ilali_id, "Backlog", {
        "Feature": title_prop(),
        "Trigger": rich(),
        "Effort": sel(["Small", "Medium", "Large"], "Medium"),
        "Status": sel(["Proposed", "Pulled Forward", "Done"], "Proposed"),
    }, icon="📦")
    bk_id = bk.get("id")
    print("Backlog DB:", bk_id)

    # Seed risks
    seed_risks = [
        ("Temp password delivery — no email infra yet", "Open", "Critical", "Leroy", "WS-2 Resend + ilali.co email; claim via WhatsApp until then", "2026-08-06"),
        ("Bulk import of 100+ providers absent", "Open", "High", "Leroy", "WS-4 CSV import; migration script covers existing rows", "2026-08-06"),
        ("Claim flow security hole (slug@ilali.co derivable)", "Open", "High", "Ricky", "WS-3 real ownership verification after email", "2026-08-06"),
        ("ilali.co SPF record missing", "Mitigating", "Medium", "George", "Add SPF TXT via Google Workspace admin (setup email sent)", "2026-08-06"),
        ("Neon free tier limits (256MB)", "Open", "Medium", "Leroy", "Upgrade path to $19/m when close", "2026-08-06"),
        ("Non-technical providers (theatre facilitators)", "Open", "Medium", "George", "Simple claim link + WhatsApp support; Yvette helps spread word", "2026-08-06"),
        ("Paystack business verification takes days", "Open", "Medium", "George", "Start account now (setup email item #1)", "2026-08-06"),
    ]
    if risks_id:
        for name, status, sev, owner, mit, raised in seed_risks:
            create_db_row(risks_id, {
                "Risk": title_val(name),
                "Status": sel_val(status),
                "Severity": sel_val(sev),
                "Owner": sel_val(owner),
                "Mitigation": txt(mit),
                "Raised": date_val(raised),
            })
        print(f"Seeded {len(seed_risks)} risks")

    # Seed decisions
    seed_dec = [
        ("2026-08-04", "Provider portal Phase 1+2 combined", "Grill-me session on provider portal scope", "Separate phases vs combined", "Leroy"),
        ("2026-08-04", "Admin approval auto-creates provider account + temp password", "Provider portal spec FR-1", "Manual vs auto account creation", "Leroy"),
        ("2026-08-05", "Reverted Hallmark structural redesign on ILALI", "Design risk — keep current layouts", "Hallmark redesign vs revert", "Leroy"),
        ("2026-08-06", "Assitej SA onboarding begins Sept 2026, Cape Town first", "George + Yvette Hardie agreement", "National vs CT-first", "George/Yvette"),
        ("2026-08-06", "Paystack as payment gateway (WS-6)", "Leroy request", "Paystack vs other SA gateways", "Leroy"),
    ]
    if dec_id:
        for d, decision, context, opts, by in seed_dec:
            create_db_row(dec_id, {
                "Date": date_val(d),
                "Decision": title_val(decision),
                "Context": txt(context),
                "Options": txt(opts),
                "Decided By": sel_val(by),
            })
        print(f"Seeded {len(seed_dec)} decisions")

    # Assitej plan page
    create_page("Assitej SA Onboarding Plan", parent_page=ilali_id, icon="🚀", markdown=(
        "# Assitej SA Onboarding Plan\n\n"
        "**Context:** Assitej SA (theatre for young people, CEO Yvette Hardie) was main NPO partner for the BASA-funded pilot. "
        "100s of service providers (facilitators + partner orgs) nationally. Onboarding starts **Sept 2026, Cape Town first**. Yvette spreads the word.\n\n"
        "**Goal:** First CT cohort live by Sept 1 2026.\n\n"
        "## Pipeline (matches ILALI stages)\n"
        "1. Listed — provider record exists (seed/import)\n"
        "2. Applied — /providers/signup\n"
        "3. Approved — admin approves\n"
        "4. Account Created — user + temp password\n"
        "5. Claimed — provider logged in + set password\n"
        "6. Listing Live — profile complete\n\n"
        "## Owners\n- George — partner comms\n- Yvette — Assitej comms\n- Leroy — tech direction\n- Ricky — execution"
    ))
    print("Assitej plan page: ok")

    # Launch checklist page
    create_page("Launch Checklist", parent_page=ilali_id, icon="📅", markdown=(
        "# Launch Checklist\n\n"
        "- [ ] Codebase audit complete (Ricky) — Aug 6\n"
        "- [ ] WS-1 approval → account flow merged + deployed\n"
        "- [ ] WS-2 email delivery (Resend)\n"
        "- [ ] WS-3 claim security\n"
        "- [ ] WS-4 bulk import\n"
        "- [ ] WS-5 parent-facing quick wins (WhatsApp, reviews)\n"
        "- [ ] Test suite green + production deploy\n"
        "- [ ] Assitej comms ready (Yvette)\n"
        "- [ ] First cohort import (CT providers)\n"
        "- [ ] Onboarding day (Sept 1)"
    ))
    print("Launch Checklist page: ok")

# ════════════════════════════════════════════════════════════════════
print("\n== Aliento board ==")
aliento = resolve_page("Aliento Health", "🩺", ALIENTO_PAGE_ID)
aliento_id = aliento.get("id")
print("Aliento page:", aliento_id, aliento.get("url", ""))
if aliento_id:
    atasks = create_db(aliento_id, "Aliento Tasks", {
        "Name": title_prop(),
        "Status": sel(["Backlog", "This Week", "In Progress", "Done", "Blocked"], "Backlog"),
        "Priority": sel(["Critical", "High", "Medium", "Low"], "Medium"),
        "Owner": sel(["Ricky", "Leroy"], "Ricky"),
        "Deadline": date_prop(),
        "Notes": rich(),
    }, icon="🗄️")
    at_id = atasks.get("id")
    print("Aliento Tasks DB:", at_id)
    if at_id:
        seed = [
            ("Dr Leegale account maintenance (1181300 / MP0531502)", "Done", "Medium", "Ricky", "2026-08-01", "Keep script generator in sync"),
            ("Prescription script generator — verify live on alientomd.com", "This Week", "High", "Ricky", "2026-08-07", "Load aliento-scripts skill before work"),
            ("Check Dr Leegale on recent sessions", "Backlog", "Low", "Ricky", None, "Session recall"),
        ]
        for name, status, prio, owner, dl, note in seed:
            row = {
                "Name": title_val(name),
                "Status": sel_val(status),
                "Priority": sel_val(prio),
                "Owner": sel_val(owner),
            }
            if dl:
                row["Deadline"] = date_val(dl)
            if note:
                row["Notes"] = txt(note)
            create_db_row(at_id, row)
        print(f"Seeded {len(seed)} Aliento tasks")

# ════════════════════════════════════════════════════════════════════
print("\n== KitFix board ==")
kitfix = resolve_page("KitFix", "👕", KITFIX_PAGE_ID)
kitfix_id = kitfix.get("id")
print("KitFix page:", kitfix_id, kitfix.get("url", ""))
if kitfix_id:
    ktasks = create_db(kitfix_id, "KitFix Tasks", {
        "Name": title_prop(),
        "Status": sel(["Backlog", "This Week", "In Progress", "Done", "Blocked"], "Backlog"),
        "Priority": sel(["Critical", "High", "Medium", "Low"], "Medium"),
        "Owner": sel(["Ricky", "Leroy"], "Ricky"),
        "Deadline": date_prop(),
        "Notes": rich(),
    }, icon="🗄️")
    kt_id = ktasks.get("id")
    print("KitFix Tasks DB:", kt_id)
    if kt_id:
        seed = [
            ("Restyle + inner pages (PENDING)", "Backlog", "High", "Ricky", None, "Load kitfix skill; dark+#00E859 premium sport brand"),
            ("Cold outbound pipeline status check", "This Week", "Medium", "Ricky", "2026-08-07", "Load cold-outbound skills if resuming"),
            ("Vercel Blob private-access fix (audio/media proxy)", "Done", "High", "Ricky", "2026-07-30", "kitfix-vercel-blob-private-access skill"),
        ]
        for name, status, prio, owner, dl, note in seed:
            row = {
                "Name": title_val(name),
                "Status": sel_val(status),
                "Priority": sel_val(prio),
                "Owner": sel_val(owner),
            }
            if dl:
                row["Deadline"] = date_val(dl)
            if note:
                row["Notes"] = txt(note)
            create_db_row(kt_id, row)
        print(f"Seeded {len(seed)} KitFix tasks")

print("\n=== DONE ===")
