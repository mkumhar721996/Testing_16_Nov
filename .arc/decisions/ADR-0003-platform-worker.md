---
id: ADR-0003
category: component
title: Platform Worker
status: superseded
superseded_by: ADR-0014
component_id: comp_platform_worker
responsibility: 'All background jobs: scheduled tasks, notification processing, data
  synchronization and cleanup, report generation.'
kind: worker
split_reason: Background work runs outside the request path
talks_to:
- component_id: comp_relational_database
  interaction: sync
  evidence: 'human: jobs do data synchronization, cleanup and report generation'
evidence: 'human: ''Background Jobs / Workers: scheduled tasks, notification processing,
  data synchronization and cleanup jobs, report generation'''
---

## Context

human: 'Background Jobs / Workers: scheduled tasks, notification processing, data synchronization and cleanup jobs, report generation'

## Decision

All background jobs: scheduled tasks, notification processing, data synchronization and cleanup, report generation.

Kept separate because Background work runs outside the request path.

## Talks to

- **Relational Database** (sync) — human: jobs do data synchronization, cleanup and report generation
