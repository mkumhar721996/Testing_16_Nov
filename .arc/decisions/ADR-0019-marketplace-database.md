---
id: ADR-0019
category: component
title: Marketplace Database
status: accepted
superseded_by: null
component_id: comp_marketplace_database
responsibility: 'System of record for the marketplace: accounts, roles, catalog, orders,
  payments references, ratings and the worker''s job table; runs on PostgreSQL.'
kind: managed_service
serves:
- TESTING-16-NOV-EPIC-003
- TESTING-16-NOV-EPIC-004
- TESTING-16-NOV-EPIC-006
- TESTING-16-NOV-EPIC-007
- TESTING-16-NOV-EPIC-008
- TESTING-16-NOV-EPIC-009
- TESTING-16-NOV-EPIC-010
- TESTING-16-NOV-EPIC-011
split_reason: Backing service, separate data ownership per system
rule: Marketplace data lives only in this database; only the Marketplace API and Worker
  access it.
evidence: EPIC-003 to EPIC-011; STORY-017, STORY-018
---

## Context

EPIC-003 to EPIC-011; STORY-017, STORY-018

Serves: TESTING-16-NOV-EPIC-003, TESTING-16-NOV-EPIC-004, TESTING-16-NOV-EPIC-006, TESTING-16-NOV-EPIC-007, TESTING-16-NOV-EPIC-008, TESTING-16-NOV-EPIC-009, TESTING-16-NOV-EPIC-010, TESTING-16-NOV-EPIC-011.

## Decision

System of record for the marketplace: accounts, roles, catalog, orders, payments references, ratings and the worker's job table; runs on PostgreSQL.

Kept separate because Backing service, separate data ownership per system.
