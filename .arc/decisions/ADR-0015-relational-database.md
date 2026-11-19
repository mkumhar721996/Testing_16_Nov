---
id: ADR-0015
category: component
title: Relational Database
status: accepted
superseded_by: null
component_id: comp_relational_database
responsibility: 'System of record for the fundraising admin app: users, roles, organizations,
  consultant assignments, audit records and the worker''s job table; runs on PostgreSQL
  (Amazon RDS, Multi-AZ).'
kind: managed_service
serves:
- TESTING-16-NOV-EPIC-018
- TESTING-16-NOV-EPIC-019
- TESTING-16-NOV-EPIC-020
split_reason: Backing service the project uses but doesn't build
rule: Fundraising data lives only in this database; only the Platform API and Platform
  Worker access it.
evidence: Accepted architecture; EPIC-018 to EPIC-020
contested: true
alternatives_considered:
- 'Aurora PostgreSQL: higher cost, not needed at the assumed scale'
- 'Dedicated job queue (SQS): extra component with no cited driver'
consequences:
- Worker jobs are scheduled in-process and persisted in the database; revisit if job
  volume grows
---

## Context

Accepted architecture; EPIC-018 to EPIC-020

Serves: TESTING-16-NOV-EPIC-018, TESTING-16-NOV-EPIC-019, TESTING-16-NOV-EPIC-020.

## Decision

System of record for the fundraising admin app: users, roles, organizations, consultant assignments, audit records and the worker's job table; runs on PostgreSQL (Amazon RDS, Multi-AZ).

Kept separate because Backing service the project uses but doesn't build.

## Alternatives considered

- Aurora PostgreSQL: higher cost, not needed at the assumed scale
- Dedicated job queue (SQS): extra component with no cited driver

## Consequences

- Worker jobs are scheduled in-process and persisted in the database; revisit if job volume grows
