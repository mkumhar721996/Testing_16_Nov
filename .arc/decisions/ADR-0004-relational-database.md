---
id: ADR-0004
category: component
title: Relational Database
status: accepted
superseded_by: null
component_id: comp_relational_database
responsibility: Stores users, roles, permissions, configurations, audit records and
  application data; runs on PostgreSQL (Amazon RDS, Multi-AZ). Also holds the worker's
  job table.
kind: managed_service
split_reason: Backing service the project uses but doesn't build
evidence: recommended default, accepted by the human without review
contested: true
alternatives_considered:
- 'Aurora PostgreSQL: higher cost, not needed at the assumed scale'
- 'Dedicated job queue (SQS): extra component with no cited driver'
consequences:
- Worker jobs are scheduled in-process and persisted in the database; revisit if job
  volume grows
---

## Context

recommended default, accepted by the human without review

## Decision

Stores users, roles, permissions, configurations, audit records and application data; runs on PostgreSQL (Amazon RDS, Multi-AZ). Also holds the worker's job table.

Kept separate because Backing service the project uses but doesn't build.

## Alternatives considered

- Aurora PostgreSQL: higher cost, not needed at the assumed scale
- Dedicated job queue (SQS): extra component with no cited driver

## Consequences

- Worker jobs are scheduled in-process and persisted in the database; revisit if job volume grows
