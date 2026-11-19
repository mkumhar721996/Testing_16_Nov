---
id: ADR-0022
category: component
title: Investing Database
status: accepted
superseded_by: null
component_id: comp_investing_database
responsibility: 'System of record for the investing dashboard: watchlists, buy orders,
  SIPs, IPO applications; runs on PostgreSQL.'
kind: managed_service
serves:
- TESTING-16-NOV-EPIC-014
- TESTING-16-NOV-EPIC-015
- TESTING-16-NOV-EPIC-016
split_reason: Backing service, separate data ownership per system
rule: Investing data lives only in this database; only the Investing API accesses
  it.
evidence: EPIC-014, EPIC-015, EPIC-016
---

## Context

EPIC-014, EPIC-015, EPIC-016

Serves: TESTING-16-NOV-EPIC-014, TESTING-16-NOV-EPIC-015, TESTING-16-NOV-EPIC-016.

## Decision

System of record for the investing dashboard: watchlists, buy orders, SIPs, IPO applications; runs on PostgreSQL.

Kept separate because Backing service, separate data ownership per system.
