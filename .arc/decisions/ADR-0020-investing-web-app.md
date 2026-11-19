---
id: ADR-0020
category: component
title: Investing Web App
status: accepted
superseded_by: null
component_id: comp_investing_web_app
responsibility: 'Browser frontend of the investing dashboard: single Dashboard with
  index, SIP, watchlist and IPO sections each with own loading, empty and error states;
  stock search and buy sheet; SIP and IPO screens.'
kind: web_ui
serves:
- TESTING-16-NOV-EPIC-012
- TESTING-16-NOV-EPIC-013
- TESTING-16-NOV-EPIC-014
- TESTING-16-NOV-EPIC-015
- TESTING-16-NOV-EPIC-016
split_reason: Separate system with its own client runtime and users
talks_to:
- component_id: comp_investing_api
  interaction: sync
  evidence: EPIC-012 sections reload independently through the API
rule: Investing screens live in the Investing Web App and reach data only through
  the Investing API.
evidence: EPIC-012 to EPIC-016
---

## Context

EPIC-012 to EPIC-016

Serves: TESTING-16-NOV-EPIC-012, TESTING-16-NOV-EPIC-013, TESTING-16-NOV-EPIC-014, TESTING-16-NOV-EPIC-015, TESTING-16-NOV-EPIC-016.

## Decision

Browser frontend of the investing dashboard: single Dashboard with index, SIP, watchlist and IPO sections each with own loading, empty and error states; stock search and buy sheet; SIP and IPO screens.

Kept separate because Separate system with its own client runtime and users.

## Talks to

- **Investing API** (sync) — EPIC-012 sections reload independently through the API
