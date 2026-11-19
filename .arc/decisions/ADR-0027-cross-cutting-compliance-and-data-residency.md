---
id: ADR-0027
category: cross_cutting
title: 'Cross-cutting: Compliance and data residency'
status: accepted
superseded_by: null
component_id: null
rule: Data stays in ap-south-1, is encrypted at rest and in transit, and administrative
  and access changes write audit records.
decision: No compliance regime stated; all data stays in AWS ap-south-1 (single region,
  Multi-AZ), encrypted at rest and in transit, with an audit log of administrative
  and access changes.
evidence: 'human: ''Single region (ap-south-1) with Multi-AZ'''
---

## Context

human: 'Single region (ap-south-1) with Multi-AZ'

## Decision

No compliance regime stated; all data stays in AWS ap-south-1 (single region, Multi-AZ), encrypted at rest and in transit, with an audit log of administrative and access changes.
