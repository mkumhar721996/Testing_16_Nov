---
id: ADR-0012
category: component
title: Web App
status: accepted
superseded_by: null
component_id: comp_web_app
responsibility: 'Fundraising admin app frontend: app shell, organization list and
  detail side-panel, role-scoped views for WFC Admin, Fundraising Consultant, Org
  Admin and Org Staff.'
kind: web_ui
serves:
- TESTING-16-NOV-EPIC-017
- TESTING-16-NOV-EPIC-018
- TESTING-16-NOV-EPIC-019
- TESTING-16-NOV-EPIC-020
split_reason: Separate client runtime (browser)
talks_to:
- component_id: comp_platform_api
  interaction: sync
  evidence: 'Accepted architecture: REST APIs supporting the web application'
rule: Fundraising admin screens live in the Web App and reach data only through the
  Platform API.
evidence: 'human: ''Fundraising admin app (Entra ID, organization roles)''; EPIC-017
  to EPIC-020'
---

## Context

human: 'Fundraising admin app (Entra ID, organization roles)'; EPIC-017 to EPIC-020

Serves: TESTING-16-NOV-EPIC-017, TESTING-16-NOV-EPIC-018, TESTING-16-NOV-EPIC-019, TESTING-16-NOV-EPIC-020.

## Decision

Fundraising admin app frontend: app shell, organization list and detail side-panel, role-scoped views for WFC Admin, Fundraising Consultant, Org Admin and Org Staff.

Kept separate because Separate client runtime (browser).

## Talks to

- **Platform API** (sync) — Accepted architecture: REST APIs supporting the web application
