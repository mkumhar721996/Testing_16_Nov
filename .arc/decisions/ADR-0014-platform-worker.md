---
id: ADR-0014
category: component
title: Platform Worker
status: accepted
superseded_by: null
component_id: comp_platform_worker
responsibility: 'Background jobs of the fundraising admin app: scheduled cleanup and
  data synchronization. Jobs are queued with pg-boss on the PostgreSQL job table.'
kind: worker
serves:
- TESTING-16-NOV-EPIC-019
split_reason: Background work runs outside the request path
talks_to:
- component_id: comp_relational_database
  interaction: sync
  evidence: Accepted architecture; pg-boss on the PostgreSQL job table (components.yaml
    v1)
rule: Background and scheduled work runs in the Platform Worker, never inside API
  request handlers.
evidence: Scan candidate 'worker'; components.yaml v1; no fundraising epic names a
  specific job yet
---

## Context

Scan candidate 'worker'; components.yaml v1; no fundraising epic names a specific job yet

Serves: TESTING-16-NOV-EPIC-019.

## Decision

Background jobs of the fundraising admin app: scheduled cleanup and data synchronization. Jobs are queued with pg-boss on the PostgreSQL job table.

Kept separate because Background work runs outside the request path.

## Talks to

- **Relational Database** (sync) — Accepted architecture; pg-boss on the PostgreSQL job table (components.yaml v1)
