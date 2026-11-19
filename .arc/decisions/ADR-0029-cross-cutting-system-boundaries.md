---
id: ADR-0029
category: cross_cutting
title: 'Cross-cutting: System boundaries'
status: accepted
superseded_by: null
component_id: null
rule: Each of the three domains has its own components, database and integrations;
  none shares a database or API with another.
decision: The backlog holds three unrelated systems (food-delivery marketplace, investing
  dashboard, fundraising-organization admin app). All three are kept in this draft,
  each as its own set of components, data store and integrations.
evidence: 'human: ''Separate systems, split them''; ''Keep all three in this draft
  as separate component sets'''
---

## Context

human: 'Separate systems, split them'; 'Keep all three in this draft as separate component sets'

## Decision

The backlog holds three unrelated systems (food-delivery marketplace, investing dashboard, fundraising-organization admin app). All three are kept in this draft, each as its own set of components, data store and integrations.
