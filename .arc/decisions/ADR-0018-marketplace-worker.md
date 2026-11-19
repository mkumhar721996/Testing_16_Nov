---
id: ADR-0018
category: component
title: Marketplace Worker
status: accepted
superseded_by: null
component_id: comp_marketplace_worker
responsibility: 'Background jobs of the marketplace: email and in-app order notifications,
  automatic nearest-partner assignment, operational report generation.'
kind: worker
serves:
- TESTING-16-NOV-EPIC-009
- TESTING-16-NOV-EPIC-010
- TESTING-16-NOV-EPIC-011
split_reason: Background work outside the request path
talks_to:
- component_id: comp_marketplace_database
  interaction: sync
  evidence: Job table, same pattern as Platform Worker
rule: Marketplace background work runs in the Marketplace Worker, never inside API
  request handlers.
evidence: EPIC-009, EPIC-010, EPIC-011
---

## Context

EPIC-009, EPIC-010, EPIC-011

Serves: TESTING-16-NOV-EPIC-009, TESTING-16-NOV-EPIC-010, TESTING-16-NOV-EPIC-011.

## Decision

Background jobs of the marketplace: email and in-app order notifications, automatic nearest-partner assignment, operational report generation.

Kept separate because Background work outside the request path.

## Talks to

- **Marketplace Database** (sync) — Job table, same pattern as Platform Worker
