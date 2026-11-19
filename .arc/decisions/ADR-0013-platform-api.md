---
id: ADR-0013
category: component
title: Platform API
status: accepted
superseded_by: null
component_id: comp_platform_api
responsibility: 'REST API for the fundraising admin Web App: Entra ID sign-in, four-role
  and organization-scoped access control, organizations, Fundraising Consultant assignment,
  audit logging.'
kind: api_service
serves:
- TESTING-16-NOV-EPIC-017
- TESTING-16-NOV-EPIC-018
- TESTING-16-NOV-EPIC-019
- TESTING-16-NOV-EPIC-020
split_reason: Separate runtime serving the UI and other products' services
talks_to:
- component_id: comp_relational_database
  interaction: sync
  evidence: 'Accepted architecture: database stores users, roles, permissions, audit
    records'
- component_id: comp_platform_worker
  interaction: async
  evidence: components.yaml v1 notes pg-boss queue; EPIC-009, EPIC-010, EPIC-011
rule: Every non-public endpoint enforces role and organization checks on the server;
  the UI never decides access.
evidence: 'human: ''Fundraising admin app (Entra ID, organization roles)''; EPIC-018
  to EPIC-020'
---

## Context

human: 'Fundraising admin app (Entra ID, organization roles)'; EPIC-018 to EPIC-020

Serves: TESTING-16-NOV-EPIC-017, TESTING-16-NOV-EPIC-018, TESTING-16-NOV-EPIC-019, TESTING-16-NOV-EPIC-020.

## Decision

REST API for the fundraising admin Web App: Entra ID sign-in, four-role and organization-scoped access control, organizations, Fundraising Consultant assignment, audit logging.

Kept separate because Separate runtime serving the UI and other products' services.

## Talks to

- **Relational Database** (sync) — Accepted architecture: database stores users, roles, permissions, audit records
- **Platform Worker** (async) — components.yaml v1 notes pg-boss queue; EPIC-009, EPIC-010, EPIC-011
