#!/usr/bin/env bash
# ILALI Launch HQ — Notion workspace bootstrap
# Usage: NOTION_API_KEY=ntn_xxx ./notion-bootstrap.sh
# Creates root page, 6 databases, 2 sub-pages, and seed rows.
set -euo pipefail

export NOTION_API_TOKEN="${NOTION_API_KEY:?Set NOTION_API_KEY first}"
export NOTION_KEYRING=0
NTN="ntn api"

echo "== Creating ILALI Launch HQ root page =="
ROOT=$($NTN v1/pages \
  parent[page_id]=$( [ -n "${NOTION_PARENT_PAGE:-}" ] && echo "$NOTION_PARENT_PAGE" || echo "root" ) \
  properties[title][0][text][content]="ILALI Launch HQ" \
  markdown="# ILALI Launch HQ

Mission: onboard Assitej SA providers, Cape Town first, from Sept 1 2026.
" 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" || echo "")

# If root page creation failed (needs a real parent), create under user workspace via search fallback
if [ -z "$ROOT" ]; then
  echo "Root page creation needs a parent — creating under first available page..."
  ROOT=$($NTN v1/search | python3 -c "import json,sys; r=json.load(sys.stdin); print(r['results'][0]['id'] if r.get('results') else '')")
fi
echo "Root page: $ROOT"
[ -z "$ROOT" ] && { echo "FATAL: no parent page found — share a page with your integration first"; exit 1; }

echo "== Creating Launch Tasks database =="
TASKS_DB=$($NTN v1/data_sources \
  parent[page_id]="$ROOT" \
  title[0][text][content]="Launch Tasks" \
  properties[Name][title]="{}" \
  properties[Status][select][options][0][name]="Backlog" \
  properties[Status][select][options][1][name]="This Week" \
  properties[Status][select][options][2][name]="In Progress" \
  properties[Status][select][options][3][name]="Done" \
  properties[Status][select][options][4][name]="Blocked" \
  properties[Priority][select][options][0][name]="Critical" \
  properties[Priority][select][options][1][name]="High" \
  properties[Priority][select][options][2][name]="Medium" \
  properties[Priority][select][options][3][name]="Low" \
  properties[Owner][select][options][0][name]="Ricky" \
  properties[Owner][select][options][1][name]="Leroy" \
  properties[Owner][select][options][2][name]="George" \
  properties[Owner][select][options][3][name]="Yvette" \
  properties[Deadline][date]="{}" \
  properties[Spec Ref][rich_text]="{}" \
  properties[Notes][rich_text]="{}" \
  2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))") || TASKS_DB=""
echo "Launch Tasks DB: $TASKS_DB"

echo "== Creating Provider Onboarding database =="
PROV_DB=$($NTN v1/data_sources \
  parent[page_id]="$ROOT" \
  title[0][text][content]="Provider Onboarding" \
  properties[Provider Name][title]="{}" \
  properties[Organisation][select][options][0][name]="Assitej SA" \
  properties[Organisation][select][options][1][name]="Direct" \
  properties[Organisation][select][options][2][name]="Referral" \
  properties[Stage][select][options][0][name]="Listed" \
  properties[Stage][select][options][1][name]="Applied" \
  properties[Stage][select][options][2][name]="Approved" \
  properties[Stage][select][options][3][name]="Account Created" \
  properties[Stage][select][options][4][name]="Claimed" \
  properties[Stage][select][options][5][name]="Listing Live" \
  properties[Stage][select][options][6][name]="Needs Help" \
  properties[Email][email]="{}" \
  properties[Phone][phone_number]="{}" \
  properties[Location][select][options][0][name]="Cape Town" \
  properties[Location][select][options][1][name]="National" \
  properties[Onboarding Date][date]="{}" \
  properties[Notes][rich_text]="{}" \
  2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))") || PROV_DB=""
echo "Provider Onboarding DB: $PROV_DB"

echo "== Creating Risks & Blockers database =="
RISK_DB=$($NTN v1/data_sources \
  parent[page_id]="$ROOT" \
  title[0][text][content]="Risks & Blockers" \
  properties[Risk][title]="{}" \
  properties[Status][select][options][0][name]="Open" \
  properties[Status][select][options][1][name]="Mitigating" \
  properties[Status][select][options][2][name]="Closed" \
  properties[Severity][select][options][0][name]="Critical" \
  properties[Severity][select][options][1][name]="High" \
  properties[Severity][select][options][2][name]="Medium" \
  properties[Severity][select][options][3][name]="Low" \
  properties[Owner][select][options][0][name]="Ricky" \
  properties[Owner][select][options][1][name]="Leroy" \
  properties[Owner][select][options][2][name]="George" \
  properties[Owner][select][options][3][name]="Yvette" \
  properties[Mitigation][rich_text]="{}" \
  properties[Raised][date]="{}" \
  2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))") || RISK_DB=""
echo "Risks DB: $RISK_DB"

echo "== Creating Decisions Log database =="
DEC_DB=$($NTN v1/data_sources \
  parent[page_id]="$ROOT" \
  title[0][text][content]="Decisions Log" \
  properties[Date][date]="{}" \
  properties[Decision][title]="{}" \
  properties[Context][rich_text]="{}" \
  properties[Options][rich_text]="{}" \
  properties[Decided By][select][options][0][name]="Leroy" \
  properties[Decided By][select][options][1][name]="George" \
  properties[Decided By][select][options][2][name]="Yvette" \
  properties[Decided By][select][options][3][name]="Ricky" \
  2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))") || DEC_DB=""
echo "Decisions DB: $DEC_DB"

echo "== Creating Meeting Notes database =="
MEET_DB=$($NTN v1/data_sources \
  parent[page_id]="$ROOT" \
  title[0][text][content]="Meeting Notes" \
  properties[Date][date]="{}" \
  properties[Topic][title]="{}" \
  properties[Attendees][multi_select]="{}" \
  properties[Action Items][rich_text]="{}" \
  properties[Notes][rich_text]="{}" \
  2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))") || MEET_DB=""
echo "Meeting Notes DB: $MEET_DB"

echo "== Creating Backlog database =="
BK_DB=$($NTN v1/data_sources \
  parent[page_id]="$ROOT" \
  title[0][text][content]="Backlog" \
  properties[Feature][title]="{}" \
  properties[Trigger][rich_text]="{}" \
  properties[Effort][select][options][0][name]="Small" \
  properties[Effort][select][options][1][name]="Medium" \
  properties[Effort][select][options][2][name]="Large" \
  properties[Status][select][options][0][name]="Proposed" \
  properties[Status][select][options][1][name]="Pulled Forward" \
  properties[Status][select][options][2][name]="Done" \
  2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))") || BK_DB=""
echo "Backlog DB: $BK_DB"

echo "== Creating Assitej SA Onboarding Plan page =="
$NTN v1/pages \
  parent[page_id]="$ROOT" \
  properties[title][0][text][content]="Assitej SA Onboarding Plan" \
  markdown="$(cat <<'EOF'
# Assitej SA Onboarding Plan

**Context:** Assitej SA (theatre for young people, CEO Yvette Hardie) was main NPO partner for the BASA-funded pilot. 100s of service providers (facilitators + partner orgs) nationally. Onboarding begins **Sept 2026, Cape Town first**. Yvette will spread the word.

**Goal:** First CT cohort live by Sept 1 2026.

## Pipeline (matches ILALI stages)
1. Listed — provider record exists (seed/import)
2. Applied — submitted via /providers/signup
3. Approved — admin approves in /admin/applications
4. Account Created — user account + temp password
5. Claimed — provider logged in + set password
6. Listing Live — profile complete, visible to parents

## Owners
- George — partner comms
- Yvette — Assitej comms
- Leroy — tech direction
- Ricky — execution
EOF
)" >/dev/null 2>&1 && echo "Assitej page: ok" || echo "Assitej page: FAILED"

echo "== Creating Launch Checklist page =="
$NTN v1/pages \
  parent[page_id]="$ROOT" \
  properties[title][0][text][content]="Launch Checklist" \
  markdown="$(cat <<'EOF'
# Launch Checklist

- [ ] Codebase audit complete (Ricky) — Aug 6
- [ ] Blockers fixed (temp password delivery / bulk import)
- [ ] Test suite green (81 unit + 10 E2E)
- [ ] Production deploy (main → ilali.vercel.app)
- [ ] Assitej comms ready (Yvette)
- [ ] First cohort import (CT providers)
- [ ] Onboarding day (Sept 1)
EOF
)" >/dev/null 2>&1 && echo "Checklist page: ok" || echo "Checklist page: FAILED"

echo ""
echo "=== DONE ==="
echo "Root:      $ROOT"
echo "Tasks DB:  $TASKS_DB"
echo "Providers: $PROV_DB"
echo "Risks DB:  $RISK_DB"
echo "Decisions: $DEC_DB"
echo "Meetings:  $MEET_DB"
echo "Backlog:   $BK_DB"
