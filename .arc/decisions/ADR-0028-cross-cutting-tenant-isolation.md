---
id: ADR-0028
category: cross_cutting
title: 'Cross-cutting: Tenant isolation'
status: accepted
superseded_by: null
component_id: null
rule: Every tenant-owned row carries an organization ID and every query is filtered
  by the caller's entitled organizations.
decision: Shared tables with a tenant/organization ID column, enforced in the API's
  access control layer.
evidence: recommended default, accepted by the human without review; EPIC-018, EPIC-019
---

## Context

recommended default, accepted by the human without review; EPIC-018, EPIC-019

## Decision

Shared tables with a tenant/organization ID column, enforced in the API's access control layer.
