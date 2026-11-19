---
id: ADR-0017
category: component
title: Marketplace API
status: accepted
superseded_by: null
component_id: comp_marketplace_api
responsibility: 'REST API of the food-delivery marketplace: accounts and roles, partner
  approval, catalog, search, cart and checkout, payments, order lifecycle, delivery
  assignment requests, ratings, admin operations.'
kind: api_service
serves:
- TESTING-16-NOV-EPIC-003
- TESTING-16-NOV-EPIC-004
- TESTING-16-NOV-EPIC-005
- TESTING-16-NOV-EPIC-006
- TESTING-16-NOV-EPIC-007
- TESTING-16-NOV-EPIC-008
- TESTING-16-NOV-EPIC-009
- TESTING-16-NOV-EPIC-010
- TESTING-16-NOV-EPIC-011
split_reason: Separate system with its own data and access rules
talks_to:
- component_id: comp_marketplace_database
  interaction: sync
  evidence: unchanged
- component_id: comp_marketplace_worker
  interaction: async
  evidence: EPIC-009, EPIC-010 jobs queued by the API
rule: Every non-public endpoint enforces the caller's role and ownership on the server.
evidence: EPIC-003 to EPIC-011; STORY-014 (role enforcement)
---

## Context

EPIC-003 to EPIC-011; STORY-014 (role enforcement)

Serves: TESTING-16-NOV-EPIC-003, TESTING-16-NOV-EPIC-004, TESTING-16-NOV-EPIC-005, TESTING-16-NOV-EPIC-006, TESTING-16-NOV-EPIC-007, TESTING-16-NOV-EPIC-008, TESTING-16-NOV-EPIC-009, TESTING-16-NOV-EPIC-010, TESTING-16-NOV-EPIC-011.

## Decision

REST API of the food-delivery marketplace: accounts and roles, partner approval, catalog, search, cart and checkout, payments, order lifecycle, delivery assignment requests, ratings, admin operations.

Kept separate because Separate system with its own data and access rules.

## Talks to

- **Marketplace Database** (sync) — unchanged
- **Marketplace Worker** (async) — EPIC-009, EPIC-010 jobs queued by the API
